// Landing page HTML embedded
const LANDING_HTML = `[LANDING_HTML_CONTENT]`; // Will be replaced during build

// Brain image embedded
const BRAIN_IMAGE_BASE64 = `[BRAIN_IMAGE_BASE64]`; // Will be replaced during build

export interface Env {
  DREAMS: KVNamespace;
  PROJECTS: KVNamespace;
  ALLOWED_ORIGINS: string;
  API_SECRET: string;
}

interface DreamData {
  id: string;
  projectPath: string;
  projectName: string;
  timestamp: string;
  context: {
    summary: string;
    techStack: string[];
    currentTasks: string[];
    completedTasks: string[];
    fileStructure: string[];
    dependencies: Record<string, string>;
    apiEndpoints?: string[];
    envVars?: string[];
    lastCommit?: string;
    customNotes?: string;
  };
  conversation: {
    keyDecisions: string[];
    blockers: string[];
    nextSteps: string[];
  };
  metadata: {
    claudeVersion: string;
    duration: number;
    durationHours?: number;
    tokenCount?: number;
    qualityScore?: number;
    size?: number;
    version?: string;
    isGitGenerated?: boolean;
    commitHash?: string;
    taskType?: string;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      // Serve brain image FIRST (before any other routes)
      if (path === '/assets/brain-image.jpg' && request.method === 'GET') {
        try {
          const imageBase64 = BRAIN_IMAGE_BASE64;
          if (!imageBase64 || imageBase64 === '[BRAIN_IMAGE_BASE64]') {
            return new Response('Image not embedded', { status: 500 });
          }
          const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
          
          return new Response(imageBuffer, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            },
          });
        } catch (error) {
          return new Response(`Image error: ${error}`, { status: 500 });
        }
      }

      // Serve mysterious landing page at root
      if (path === '/' && request.method === 'GET') {
        // Read landing.html content (in production, this would be bundled)
        const landingHtml = LANDING_HTML;
        return new Response(landingHtml, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600',
            'X-Robots-Tag': 'noindex, nofollow', // Don't index this page
          },
        });
      }

      // Store dream with smart deduplication and validation (REQUIRES AUTH)
      if (path === '/dream' && request.method === 'POST') {
        // Require authentication for dream uploads
        if (!isAuthorized(request, env)) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized - API key required' 
          }), { status: 401, headers });
        }
        const data: DreamData = await request.json();
        
        // Smart validation
        const validation = await validateDreamData(data);
        if (!validation.isValid) {
          return new Response(JSON.stringify({ 
            error: 'Invalid dream data',
            issues: validation.issues
          }), { status: 400, headers });
        }

        const dreamKey = `dream:${data.projectPath}:${data.id}`;
        const projectKey = `project:${data.projectPath}`;
        
        // Check for duplicates by commit hash (for git-generated dreams)
        if (data.metadata.commitHash) {
          const duplicateKey = await findDuplicateByCommitHash(env.DREAMS, data.metadata.commitHash, data.projectPath);
          if (duplicateKey) {
            return new Response(JSON.stringify({ 
              success: false, 
              message: 'Dream already exists for this commit',
              existingDreamId: duplicateKey.split(':').pop()
            }), { headers });
          }
        }

        // Storage quota check
        const storageCheck = await checkStorageQuota(env);
        if (!storageCheck.hasSpace) {
          return new Response(JSON.stringify({ 
            error: 'Storage quota exceeded',
            used: storageCheck.usage,
            limit: storageCheck.limit
          }), { status: 507, headers });
        }

        // Enhanced dream data with quality metrics
        const enhancedData = {
          ...data,
          metadata: {
            ...data.metadata,
            qualityScore: calculateDreamQuality(data),
            size: JSON.stringify(data).length,
            version: '2.0'
          }
        };
        
        // Store dream with forever TTL until 1GB limit
        await env.DREAMS.put(dreamKey, JSON.stringify(enhancedData));
        
        // Update project latest with enhanced tracking
        const projectData = {
          lastDream: enhancedData.id,
          lastUpdated: enhancedData.timestamp,
          projectName: enhancedData.projectName,
          techStack: enhancedData.context.techStack,
          dreamCount: await countProjectDreams(env.DREAMS, data.projectPath) + 1,
          totalDevHours: (enhancedData.metadata.durationHours || 0)
        };
        
        await env.PROJECTS.put(projectKey, JSON.stringify(projectData));
        
        return new Response(JSON.stringify({ 
          success: true, 
          dreamId: enhancedData.id,
          message: 'Dream captured successfully',
          qualityScore: enhancedData.metadata.qualityScore,
          storageUsed: storageCheck.usage
        }), { headers });
      }

      // Get latest dream for project (REQUIRES AUTH)
      if (path.startsWith('/dream/latest/') && request.method === 'GET') {
        if (!isAuthorized(request, env)) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized - API key required to access dream content' 
          }), { status: 401, headers });
        }
        const projectPath = decodeURIComponent(path.replace('/dream/latest/', ''));
        const projectKey = `project:${projectPath}`;
        
        const projectData = await env.PROJECTS.get(projectKey);
        if (!projectData) {
          return new Response(JSON.stringify({ 
            error: 'No dreams found for this project' 
          }), { status: 404, headers });
        }
        
        const project = JSON.parse(projectData);
        const dreamKey = `dream:${projectPath}:${project.lastDream}`;
        const dreamData = await env.DREAMS.get(dreamKey);
        
        if (!dreamData) {
          return new Response(JSON.stringify({ 
            error: 'Dream data not found' 
          }), { status: 404, headers });
        }
        
        return new Response(dreamData, { headers });
      }


      // Get specific dream (REQUIRES AUTH)
      if (path.startsWith('/dream/') && request.method === 'GET') {
        if (!isAuthorized(request, env)) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized - API key required to access dream content' 
          }), { status: 401, headers });
        }
        const dreamId = path.replace('/dream/', '');
        const dreams = await env.DREAMS.list({ prefix: `dream:` });
        
        for (const key of dreams.keys) {
          if (key.name.endsWith(dreamId)) {
            const data = await env.DREAMS.get(key.name);
            if (data) {
              return new Response(data, { headers });
            }
          }
        }
        
        return new Response(JSON.stringify({ 
          error: 'Dream not found' 
        }), { status: 404, headers });
      }

      // List all projects (REQUIRES AUTH)
      if (path === '/projects' && request.method === 'GET') {
        if (!isAuthorized(request, env)) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized - API key required to access project information' 
          }), { status: 401, headers });
        }
        const projects = await env.PROJECTS.list({ prefix: 'project:' });
        const projectList = [];
        
        for (const key of projects.keys) {
          const data = await env.PROJECTS.get(key.name);
          if (data) {
            const project = JSON.parse(data);
            projectList.push({
              path: key.name.replace('project:', ''),
              ...project
            });
          }
        }
        
        return new Response(JSON.stringify(projectList), { headers });
      }

      // Generate summary for Claude (REQUIRES AUTH)
      if (path.startsWith('/summary/') && request.method === 'GET') {
        if (!isAuthorized(request, env)) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized - API key required to access dream summaries' 
          }), { status: 401, headers });
        }
        const projectPath = decodeURIComponent(path.replace('/summary/', ''));
        const projectKey = `project:${projectPath}`;
        
        const projectData = await env.PROJECTS.get(projectKey);
        if (!projectData) {
          return new Response(JSON.stringify({ 
            error: 'Project not found' 
          }), { status: 404, headers });
        }
        
        const project = JSON.parse(projectData);
        const dreamKey = `dream:${projectPath}:${project.lastDream}`;
        const dreamData = await env.DREAMS.get(dreamKey);
        
        if (!dreamData) {
          return new Response(JSON.stringify({ 
            error: 'Dream data not found' 
          }), { status: 404, headers });
        }
        
        const dream: DreamData = JSON.parse(dreamData);
        
        // Generate Claude-friendly summary
        const summary = `# 🌙 Dream Context Restoration
        
## Project: ${dream.projectName}
**Path:** ${dream.projectPath}
**Last Dream:** ${dream.timestamp}

## Summary
${dream.context.summary}

## Tech Stack
${dream.context.techStack.map(tech => `- ${tech}`).join('\n')}

## Current Tasks
${dream.context.currentTasks.map(task => `- [ ] ${task}`).join('\n')}

## Completed Tasks
${dream.context.completedTasks.map(task => `- [x] ${task}`).join('\n')}

## Key Decisions
${dream.conversation.keyDecisions.map(decision => `- ${decision}`).join('\n')}

## Known Blockers
${dream.conversation.blockers.map(blocker => `- ⚠️ ${blocker}`).join('\n')}

## Next Steps
${dream.conversation.nextSteps.map(step => `1. ${step}`).join('\n')}

## File Structure
\`\`\`
${dream.context.fileStructure.join('\n')}
\`\`\`

${dream.context.customNotes ? `## Additional Notes\n${dream.context.customNotes}` : ''}
`;
        
        return new Response(summary, { 
          headers: { ...headers, 'Content-Type': 'text/markdown' } 
        });
      }

      // Get storage stats
      if (path === '/stats' && request.method === 'GET') {
        try {
          // Use the comprehensive calculateStorageStats function that includes categories
          const stats = await calculateStorageStats(env);
          return new Response(JSON.stringify(stats), { headers });
          
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Failed to calculate storage stats'
          }), { status: 500, headers });
        }
      }

      // Health monitoring endpoint
      if (path === '/health' && request.method === 'GET') {
        const health = await performHealthCheck(env);
        return new Response(JSON.stringify(health), { 
          status: health.status === 'healthy' ? 200 : 503,
          headers 
        });
      }

      // Cleanup old/low-quality dreams (REQUIRES AUTH)
      if (path === '/cleanup' && request.method === 'POST') {
        if (!isAuthorized(request, env)) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized - API key required for cleanup operations' 
          }), { status: 401, headers });
        }
        const cleanup = await performCleanup(env);
        return new Response(JSON.stringify(cleanup), { headers });
      }

      // Deduplicate dreams (REQUIRES AUTH)
      if (path === '/deduplicate' && request.method === 'POST') {
        if (!isAuthorized(request, env)) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized - API key required for deduplication operations' 
          }), { status: 401, headers });
        }
        const dedup = await performDeduplication(env);
        return new Response(JSON.stringify(dedup), { headers });
      }

      // Analyze dream sources (REQUIRES AUTH)
      if (path === '/analyze-dreams' && request.method === 'GET') {
        if (!isAuthorized(request, env)) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized - API key required for analysis operations' 
          }), { status: 401, headers });
        }
        const analysis = await analyzeDreamSources(env);
        return new Response(JSON.stringify(analysis), { headers });
      }

      // Update dashboard stats (REQUIRES AUTH)
      if (path === '/admin/update-stats' && request.method === 'POST') {
        if (!isAuthorized(request, env)) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized - API key required for admin operations' 
          }), { status: 401, headers });
        }
        
        try {
          const requestData = await request.json();
          const source = requestData.source || 'unknown';
          
          // Get fresh stats
          const stats = await calculateStorageStats(env);
          
          // Log the stats update
          console.log(`Stats updated from ${source}:`, {
            totalDreams: stats.dreams.total,
            timestamp: new Date().toISOString()
          });
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Dashboard stats refreshed',
            stats: stats,
            source: source,
            timestamp: new Date().toISOString()
          }), { headers });
          
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Failed to update stats',
            message: error.message
          }), { status: 500, headers });
        }
      }

      // Claude Portfolio API endpoints
      if (path === '/claude/portfolio' && request.method === 'GET') {
        try {
          const portfolio = await generatePortfolioOverview(env);
          return new Response(JSON.stringify(portfolio), { headers });
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Failed to generate portfolio overview'
          }), { status: 500, headers });
        }
      }

      // Search across all dreams for Claude
      if (path === '/claude/search' && request.method === 'GET') {
        const query = url.searchParams.get('q');
        const projectFilter = url.searchParams.get('project');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        if (!query) {
          return new Response(JSON.stringify({
            error: 'Query parameter "q" is required'
          }), { status: 400, headers });
        }

        try {
          const results = await searchPortfolio(env, query, { projectFilter, limit });
          return new Response(JSON.stringify(results), { headers });
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Search failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          }), { status: 500, headers });
        }
      }

      // Get specific project details for Claude
      if (path.startsWith('/claude/project/') && request.method === 'GET') {
        const projectName = decodeURIComponent(path.split('/claude/project/')[1]);
        
        try {
          const project = await getProjectForClaude(env, projectName);
          if (!project) {
            return new Response(JSON.stringify({
              error: 'Project not found'
            }), { status: 404, headers });
          }
          
          return new Response(JSON.stringify(project), { headers });
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Failed to fetch project details'
          }), { status: 500, headers });
        }
      }

      // Get Terry's preferences for Claude
      if (path === '/claude/preferences' && request.method === 'GET') {
        try {
          const preferences = await getTerryPreferences(env);
          return new Response(JSON.stringify(preferences), { headers });
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Failed to extract preferences'
          }), { status: 500, headers });
        }
      }

      // Get project locations and deployment status
      if (path === '/claude/locations' && request.method === 'GET') {
        try {
          const locations = await getProjectLocations(env);
          return new Response(JSON.stringify(locations), { headers });
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'Failed to get project locations'
          }), { status: 500, headers });
        }
      }

      return new Response(JSON.stringify({ 
        error: 'Route not found',
        available: [
          'GET /',
          'POST /dream',
          'GET /dream/{id}',
          'GET /dream/latest/{projectPath}',
          'GET /projects',
          'GET /stats',
          'GET /summary/{projectPath}',
          'GET /health',
          'POST /cleanup',
          'POST /deduplicate',
          'GET /analyze-dreams',
          'GET /assets/brain-image.jpg',
          'GET /claude/portfolio',
          'GET /claude/search?q=query',
          'GET /claude/project/{name}',
          'GET /claude/preferences',
          'GET /claude/locations'
        ]
      }), { status: 404, headers });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500, headers });
    }
  },
};

// Authentication Function
function isAuthorized(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');
  const urlApiKey = new URL(request.url).searchParams.get('key');
  
  // Check Authorization header (Bearer token)
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    return token === env.API_SECRET;
  }
  
  // Check URL parameter (for convenience)
  if (urlApiKey) {
    return urlApiKey === env.API_SECRET;
  }
  
  return false;
}

// Smart Management Functions

async function validateDreamData(data: DreamData): Promise<{isValid: boolean, issues: string[]}> {
  const issues: string[] = [];

  if (!data.id || data.id.length < 5) issues.push('Invalid dream ID');
  if (!data.projectPath) issues.push('Missing project path');
  if (!data.projectName) issues.push('Missing project name');
  if (!data.timestamp) issues.push('Missing timestamp');
  if (!data.context?.summary) issues.push('Missing context summary');
  
  // Check for minimum quality content
  if (data.context?.summary && data.context.summary.length < 20) {
    issues.push('Context summary too brief');
  }
  
  // Validate metadata
  if (data.metadata?.duration && data.metadata.duration < 0) {
    issues.push('Invalid duration');
  }

  return { isValid: issues.length === 0, issues };
}

async function findDuplicateByCommitHash(dreams: KVNamespace, commitHash: string, projectPath: string): Promise<string | null> {
  const dreams_list = await dreams.list({ prefix: `dream:${projectPath}:` });
  
  for (const key of dreams_list.keys) {
    const dreamData = await dreams.get(key.name);
    if (dreamData) {
      const dream = JSON.parse(dreamData);
      if (dream.metadata?.commitHash === commitHash) {
        return key.name;
      }
    }
  }
  
  return null;
}

async function checkStorageQuota(env: Env): Promise<{hasSpace: boolean, usage: string, limit: string}> {
  const stats = await calculateStorageStats(env);
  const usedGB = stats.storage.used.gb;
  const limitGB = 1.0;
  const hasSpace = usedGB < (limitGB * 0.95); // 95% threshold
  
  return {
    hasSpace,
    usage: `${usedGB.toFixed(3)} GB`,
    limit: `${limitGB} GB`
  };
}

function calculateDreamQuality(data: DreamData): number {
  let score = 0;
  const maxScore = 100;

  // Context completeness (40 points)
  if (data.context?.summary && data.context.summary.length > 50) score += 15;
  if (data.context?.techStack && data.context.techStack.length > 0) score += 10;
  if (data.context?.currentTasks && data.context.currentTasks.length > 0) score += 8;
  if (data.context?.fileStructure && data.context.fileStructure.length > 0) score += 7;

  // Conversation depth (30 points)
  if (data.conversation?.keyDecisions && data.conversation.keyDecisions.length > 0) score += 15;
  if (data.conversation?.nextSteps && data.conversation.nextSteps.length > 0) score += 10;
  if (data.conversation?.blockers && data.conversation.blockers.length >= 0) score += 5;

  // Metadata richness (30 points)
  if (data.metadata?.duration && data.metadata.duration > 0) score += 10;
  if (data.metadata?.claudeVersion) score += 5;
  if (data.metadata?.commitHash) score += 10; // Git-generated dreams are valuable
  if (data.context?.customNotes && data.context.customNotes.length > 10) score += 5;

  return Math.min(score, maxScore);
}

async function countProjectDreams(dreams: KVNamespace, projectPath: string): Promise<number> {
  const dreamsList = await dreams.list({ prefix: `dream:${projectPath}:` });
  return dreamsList.keys.length;
}

async function performHealthCheck(env: Env) {
  try {
    const stats = await calculateStorageStats(env);
    const issues: string[] = [];
    
    // Check storage health
    if (stats.storage.used.gb > 0.9) issues.push('Storage nearly full');
    if (stats.dreams.total > 1000) issues.push('High dream count may impact performance');
    
    // Check for orphaned projects
    const projects = await env.PROJECTS.list();
    const dreams = await env.DREAMS.list();
    
    if (projects.keys.length > dreams.keys.length / 5) {
      issues.push('Possible orphaned project records');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      storage: stats.storage,
      dreams: stats.dreams,
      issues,
      uptime: 'Cloudflare Workers',
      version: '2.0'
    };
    
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    };
  }
}

async function performCleanup(env: Env) {
  let cleaned = 0;
  const issues: string[] = [];
  
  try {
    // Clean up low-quality dreams (score < 20)
    const dreams = await env.DREAMS.list();
    
    for (const key of dreams.keys) {
      const dreamData = await env.DREAMS.get(key.name);
      if (dreamData) {
        const dream = JSON.parse(dreamData);
        const quality = dream.metadata?.qualityScore || calculateDreamQuality(dream);
        
        if (quality < 20) {
          await env.DREAMS.delete(key.name);
          cleaned++;
        }
      }
    }
    
    return {
      success: true,
      cleaned,
      message: `Cleaned ${cleaned} low-quality dreams`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
      cleaned
    };
  }
}

async function performDeduplication(env: Env) {
  let removed = 0;
  const seen = new Map<string, string>();
  
  try {
    const dreams = await env.DREAMS.list();
    
    for (const key of dreams.keys) {
      const dreamData = await env.DREAMS.get(key.name);
      if (dreamData) {
        const dream = JSON.parse(dreamData);
        const commitHash = dream.metadata?.commitHash;
        
        if (commitHash) {
          const seenKey = `${dream.projectPath}:${commitHash}`;
          if (seen.has(seenKey)) {
            // Remove duplicate
            await env.DREAMS.delete(key.name);
            removed++;
          } else {
            seen.set(seenKey, key.name);
          }
        }
      }
    }
    
    return {
      success: true,
      removed,
      message: `Removed ${removed} duplicate dreams`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deduplication failed',
      removed
    };
  }
}

async function calculateStorageStats(env: Env) {
  const [dreamsList, projectsList] = await Promise.all([
    env.DREAMS.list(),
    env.PROJECTS.list()
  ]);
  
  let totalBytes = 0;
  let totalDevelopmentHours = 0;
  const sampleSize = Math.min(5, dreamsList.keys.length);
  let sampleBytes = 0;
  
  // Category counters
  let githubDreams = 0;
  let claudeDreams = 0;
  let chatgptDreams = 0;
  
  // Calculate total development time and categorize dreams
  for (const key of dreamsList.keys) {
    const dreamData = await env.DREAMS.get(key.name);
    if (dreamData) {
      const dream = JSON.parse(dreamData);
      if (dream.metadata && dream.metadata.durationHours) {
        totalDevelopmentHours += parseFloat(dream.metadata.durationHours);
      }
      
      // Categorize by source
      if (dream.metadata?.commitHash) {
        githubDreams++;
      } else if (dream.metadata?.claudeVersion) {
        claudeDreams++;
      } else if (dream.metadata?.source === 'chatgpt') {
        chatgptDreams++;
      } else if (dream.context?.customNotes?.toLowerCase().includes('claude')) {
        claudeDreams++;
      } else {
        claudeDreams++; // Default to Claude if uncertain
      }
    }
  }
  
  // Sample for size calculation
  for (let i = 0; i < sampleSize; i++) {
    const dreamData = await env.DREAMS.get(dreamsList.keys[i].name);
    if (dreamData) {
      sampleBytes += new Blob([dreamData]).size;
    }
  }
  
  const avgDreamSize = sampleSize > 0 ? sampleBytes / sampleSize : 5000;
  totalBytes = dreamsList.keys.length * avgDreamSize + projectsList.keys.length * 1000;
  
  const totalMB = totalBytes / (1024 * 1024);
  const totalGB = totalMB / 1024;
  const remainingGB = 1 - totalGB;
  const usagePercent = (totalGB * 100).toFixed(3);
  
  const avgDreamsPerDay = 3;
  const remainingBytes = (1024 * 1024 * 1024) - totalBytes;
  const daysRemaining = remainingBytes / (avgDreamsPerDay * avgDreamSize);
  const yearsRemaining = Math.floor(daysRemaining / 365);
  
  return {
    storage: {
      used: {
        bytes: Math.round(totalBytes),
        mb: Math.round(totalMB * 100) / 100,
        gb: Math.round(totalGB * 10000) / 10000
      },
      remaining: {
        bytes: Math.round(remainingBytes),
        mb: Math.round((remainingGB * 1024) * 100) / 100,
        gb: Math.round(remainingGB * 10000) / 10000
      },
      percentage: usagePercent
    },
    dreams: {
      total: dreamsList.keys.length,
      avgSize: Math.round(avgDreamSize),
      projects: projectsList.keys.length,
      totalDevelopmentHours: Math.round(totalDevelopmentHours * 100) / 100,
      categories: {
        github: githubDreams,
        claude: claudeDreams,
        chatgpt: chatgptDreams
      }
    },
    estimates: {
      yearsRemaining: yearsRemaining,
      daysRemaining: Math.floor(daysRemaining)
    }
  };
}

async function analyzeDreamSources(env: Env) {
  const dreamsList = await env.DREAMS.list();
  const analysis = {
    total: dreamsList.keys.length,
    categories: {
      github: 0,
      claude: 0,
      chatgpt: 0,
      unknown: 0
    },
    details: [],
    sampleDreams: {
      github: [],
      claude: [],
      unknown: []
    }
  };
  
  // Analyze each dream
  for (const key of dreamsList.keys) {
    const dreamData = await env.DREAMS.get(key.name);
    if (dreamData) {
      const dream = JSON.parse(dreamData);
      let category = 'unknown';
      let reason = '';
      
      // Categorization logic - more precise
      if (dream.metadata?.commitHash) {
        category = 'github';
        reason = 'Has commitHash metadata (git seeded)';
      } else if (dream.metadata?.source === 'chatgpt') {
        category = 'chatgpt';
        reason = 'Explicit ChatGPT source';
      } else if (dream.metadata?.claudeVersion) {
        category = 'claude';
        reason = 'Has claudeVersion metadata (Claude session)';
      } else if (dream.context?.lastCommit) {
        category = 'github';
        reason = 'Has lastCommit field (git context)';
      } else if (dream.context?.summary?.includes('Working on') || 
                 dream.context?.summary?.includes('Implementing')) {
        category = 'claude';
        reason = 'Session-style summary (likely Claude)';
      } else {
        category = 'unknown';
        reason = 'No clear indicators';
      }
      
      analysis.categories[category]++;
      
      const dreamDetail = {
        id: dream.id,
        projectPath: dream.projectPath,
        timestamp: dream.timestamp,
        category,
        reason,
        metadata: {
          hasCommitHash: !!dream.metadata?.commitHash,
          hasClaudeVersion: !!dream.metadata?.claudeVersion,
          source: dream.metadata?.source || 'undefined',
          hasLastCommit: !!dream.context?.lastCommit
        },
        summary: dream.context?.summary?.substring(0, 100) || 'No summary'
      };
      
      analysis.details.push(dreamDetail);
      
      // Store samples for review (up to 3 per category)
      if (analysis.sampleDreams[category] && analysis.sampleDreams[category].length < 3) {
        analysis.sampleDreams[category].push(dreamDetail);
      }
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    analysis
  };
}

// Claude-Specific API Functions

async function generatePortfolioOverview(env: Env) {
  const [dreamsList, projectsList] = await Promise.all([
    env.DREAMS.list(),
    env.PROJECTS.list()
  ]);

  // Get project data
  const projects = [];
  const projectTechMap = new Map();
  const projectActivityMap = new Map();

  // Analyze dreams to build project profiles
  for (const key of dreamsList.keys) {
    const dreamData = await env.DREAMS.get(key.name);
    if (dreamData) {
      const dream = JSON.parse(dreamData);
      const projectName = dream.projectName;
      
      if (!projectActivityMap.has(projectName)) {
        projectActivityMap.set(projectName, {
          lastActivity: dream.timestamp,
          dreamCount: 0,
          totalHours: 0,
          techStack: new Set(),
          recentSummary: dream.context?.summary || '',
          type: dream.metadata?.projectType || 'unknown'
        });
      }
      
      const project = projectActivityMap.get(projectName);
      project.dreamCount++;
      project.totalHours += dream.metadata?.durationHours || 0;
      
      if (dream.context?.techStack) {
        dream.context.techStack.forEach(tech => project.techStack.add(tech));
      }
      
      // Keep most recent activity
      if (dream.timestamp > project.lastActivity) {
        project.lastActivity = dream.timestamp;
        project.recentSummary = dream.context?.summary || '';
      }
    }
  }

  // Convert to array and sort by activity
  const projectsArray = Array.from(projectActivityMap.entries()).map(([name, data]) => ({
    name,
    type: data.type,
    dreamCount: data.dreamCount,
    totalHours: Math.round(data.totalHours * 10) / 10,
    techStack: Array.from(data.techStack),
    lastActivity: data.lastActivity,
    recentSummary: data.recentSummary,
    isActive: isRecentActivity(data.lastActivity)
  })).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

  // Extract tech preferences
  const techFrequency = new Map();
  projectsArray.forEach(project => {
    project.techStack.forEach(tech => {
      techFrequency.set(tech, (techFrequency.get(tech) || 0) + 1);
    });
  });

  const topTech = Array.from(techFrequency.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tech, count]) => ({ tech, projectCount: count }));

  return {
    totalProjects: projectsArray.length,
    totalDreams: dreamsList.keys.length,
    activeProjects: projectsArray.filter(p => p.isActive).length,
    totalDevelopmentHours: projectsArray.reduce((sum, p) => sum + p.totalHours, 0),
    
    preferredTechnologies: topTech,
    
    projects: projectsArray.slice(0, 15), // Limit for performance
    
    activeProjects: projectsArray.filter(p => p.isActive).slice(0, 5),
    
    projectsByType: groupProjectsByType(projectsArray),
    
    insights: {
      mostActiveProject: projectsArray[0]?.name || 'None',
      averageSessionHours: projectsArray.reduce((sum, p) => sum + p.totalHours, 0) / Math.max(projectsArray.length, 1),
      technologyFocus: topTech.slice(0, 3).map(t => t.tech),
      recentTrend: detectRecentTrend(projectsArray)
    },

    claudeContext: {
      quickOverview: `Portfolio of ${projectsArray.length} projects. Most active: ${projectsArray[0]?.name || 'Unknown'} (${projectsArray[0]?.type || 'unknown'} project)`,
      techStack: `Primary technologies: ${topTech.slice(0, 3).map(t => t.tech).join(', ')}`,
      supportedTools: 'Cloudflare Workers, Node.js, Git workflows',
      workingStyle: 'Multi-project development with focus on modern web technologies'
    }
  };
}

async function searchPortfolio(env: Env, query: string, options: { projectFilter?: string | null, limit?: number } = {}) {
  const dreamsList = await env.DREAMS.list();
  const results = [];
  const queryWords = query.toLowerCase().split(' ');
  
  for (const key of dreamsList.keys) {
    const dreamData = await env.DREAMS.get(key.name);
    if (dreamData) {
      const dream = JSON.parse(dreamData);
      
      // Apply project filter if specified
      if (options.projectFilter && dream.projectName !== options.projectFilter) {
        continue;
      }
      
      let score = 0;
      let matchedContent = '';
      
      // Search in different content areas
      const searchableContent = [
        { content: dream.context?.summary || '', weight: 3, type: 'summary' },
        { content: dream.context?.customNotes || '', weight: 2, type: 'notes' },
        { content: (dream.conversation?.keyDecisions || []).join(' '), weight: 2, type: 'decisions' },
        { content: (dream.conversation?.keyMoments?.map(m => m.content) || []).join(' '), weight: 2, type: 'moments' },
        { content: (dream.context?.currentTasks || []).join(' '), weight: 1, type: 'tasks' }
      ];
      
      for (const { content, weight, type } of searchableContent) {
        const lowerContent = content.toLowerCase();
        for (const word of queryWords) {
          const matches = (lowerContent.match(new RegExp(word, 'g')) || []).length;
          if (matches > 0) {
            score += matches * weight;
            if (!matchedContent && content.length > 20) {
              matchedContent = extractSnippet(content, word);
            }
          }
        }
      }
      
      if (score > 0) {
        results.push({
          dreamId: dream.id,
          projectName: dream.projectName,
          timestamp: dream.timestamp,
          score,
          type: 'conversation',
          snippet: matchedContent || dream.context?.summary?.slice(0, 150) || 'No summary available',
          metadata: {
            duration: dream.metadata?.durationHours || 0,
            techStack: dream.context?.techStack || [],
            hasCode: !!(dream.conversation?.codeChanges?.length > 0),
            keyMomentsCount: dream.conversation?.keyMoments?.length || 0
          }
        });
      }
    }
  }
  
  const sortedResults = results
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit || 10);
  
  return {
    query,
    totalResults: results.length,
    results: sortedResults
  };
}

async function getProjectForClaude(env: Env, projectName: string) {
  const dreamsList = await env.DREAMS.list();
  const projectDreams = [];
  
  for (const key of dreamsList.keys) {
    const dreamData = await env.DREAMS.get(key.name);
    if (dreamData) {
      const dream = JSON.parse(dreamData);
      if (dream.projectName === projectName) {
        projectDreams.push(dream);
      }
    }
  }
  
  if (projectDreams.length === 0) {
    return null;
  }
  
  // Sort by timestamp
  projectDreams.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const latestDream = projectDreams[0];
  const totalHours = projectDreams.reduce((sum, d) => sum + (d.metadata?.durationHours || 0), 0);
  
  // Extract project patterns
  const allTech = new Set();
  const allCommands = [];
  const allFiles = new Set();
  const keyMoments = [];
  
  projectDreams.forEach(dream => {
    if (dream.context?.techStack) {
      dream.context.techStack.forEach(tech => allTech.add(tech));
    }
    
    if (dream.conversation?.commandHistory) {
      dream.conversation.commandHistory.forEach(cmd => {
        if (cmd.successful) allCommands.push(cmd.command);
      });
    }
    
    if (dream.conversation?.codeChanges) {
      dream.conversation.codeChanges.forEach(change => allFiles.add(change.file));
    }
    
    if (dream.conversation?.keyMoments) {
      keyMoments.push(...dream.conversation.keyMoments.slice(0, 2));
    }
  });
  
  return {
    name: projectName,
    type: latestDream.metadata?.projectType || 'unknown',
    techStack: Array.from(allTech),
    totalDreams: projectDreams.length,
    totalDevelopmentHours: Math.round(totalHours * 10) / 10,
    
    currentContext: {
      lastSession: latestDream.timestamp,
      currentFocus: latestDream.context?.summary || '',
      activeTasks: latestDream.context?.currentTasks || [],
      knownIssues: latestDream.conversation?.blockers || [],
      gitStatus: {
        lastCommit: latestDream.context?.lastCommit || '',
        branch: 'main' // Default, could be enhanced
      }
    },
    
    patterns: {
      commonCommands: getMostFrequent(allCommands, 5),
      frequentFiles: Array.from(allFiles).slice(0, 10),
      keyAchievements: keyMoments.slice(0, 5)
    },
    
    claudeContext: {
      quickStart: `This is ${projectName}, a ${latestDream.metadata?.projectType || 'development'} project using ${Array.from(allTech).join(', ')}`,
      recentWork: latestDream.context?.summary?.slice(0, 200) || 'No recent summary available',
      typicalWorkflow: generateTypicalWorkflow(allCommands),
      importantNotes: extractImportantNotes(projectDreams)
    }
  };
}

async function getTerryPreferences(env: Env) {
  const dreamsList = await env.DREAMS.list();
  const allDreams = [];
  
  for (const key of dreamsList.keys.slice(0, 100)) { // Limit for performance
    const dreamData = await env.DREAMS.get(key.name);
    if (dreamData) {
      allDreams.push(JSON.parse(dreamData));
    }
  }
  
  // Extract technology preferences
  const techFreq = new Map();
  const commandFreq = new Map();
  const projectTypes = new Map();
  
  allDreams.forEach(dream => {
    // Tech stack analysis
    if (dream.context?.techStack) {
      dream.context.techStack.forEach(tech => {
        techFreq.set(tech, (techFreq.get(tech) || 0) + 1);
      });
    }
    
    // Command patterns
    if (dream.conversation?.commandHistory) {
      dream.conversation.commandHistory.forEach(cmd => {
        if (cmd.successful) {
          const baseCmd = cmd.command.split(' ')[0];
          commandFreq.set(baseCmd, (commandFreq.get(baseCmd) || 0) + 1);
        }
      });
    }
    
    // Project type preferences
    if (dream.metadata?.projectType) {
      projectTypes.set(dream.metadata.projectType, (projectTypes.get(dream.metadata.projectType) || 0) + 1);
    }
  });
  
  return {
    technologyPreferences: {
      cloudProvider: 'Cloudflare', // Explicitly mentioned
      preferredStack: Array.from(techFreq.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([tech, count]) => ({ technology: tech, usage: count })),
      avoidedTech: [], // Could be enhanced with negative sentiment analysis
    },
    
    workingPatterns: {
      preferredCommands: Array.from(commandFreq.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([cmd, count]) => ({ command: cmd, frequency: count })),
      projectTypes: Array.from(projectTypes.entries())
        .sort(([,a], [,b]) => b - a)
        .map(([type, count]) => ({ type, projectCount: count })),
      averageSessionLength: allDreams.reduce((sum, d) => sum + (d.metadata?.durationHours || 0), 0) / allDreams.length
    },
    
    claudeGuidelines: {
      supportedTools: ['Cloudflare Workers', 'Node.js', 'Git', 'npm', 'TypeScript'],
      preferredApproach: 'Direct implementation with minimal explanation unless requested',
      codeStyle: 'Clean, production-ready code with proper error handling',
      deploymentStyle: 'Cloudflare-first deployment pipeline',
      workflowPreference: 'Build -> Deploy -> Test cycle'
    }
  };
}

// Helper functions

function isRecentActivity(timestamp: string): boolean {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return new Date(timestamp) > oneWeekAgo;
}

function groupProjectsByType(projects: any[]): Record<string, any[]> {
  const grouped = {};
  projects.forEach(project => {
    const type = project.type || 'unknown';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(project);
  });
  return grouped;
}

function detectRecentTrend(projects: any[]): string {
  const recentProjects = projects.filter(p => isRecentActivity(p.lastActivity));
  if (recentProjects.length === 0) return 'No recent activity';
  
  const techCounts = new Map();
  recentProjects.forEach(p => {
    p.techStack.forEach(tech => {
      techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
    });
  });
  
  const topTech = Array.from(techCounts.entries()).sort(([,a], [,b]) => b - a)[0];
  return topTech ? `Recent focus on ${topTech[0]}` : 'Mixed technology work';
}

function extractSnippet(content: string, queryWord: string): string {
  const sentences = content.split(/[.!?]+/);
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(queryWord.toLowerCase())) {
      return sentence.trim().slice(0, 150) + (sentence.length > 150 ? '...' : '');
    }
  }
  return content.slice(0, 150) + (content.length > 150 ? '...' : '');
}

function getMostFrequent<T>(items: T[], limit: number): Array<{ item: T, count: number }> {
  const counts = new Map();
  items.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
  return Array.from(counts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([item, count]) => ({ item, count }));
}

function generateTypicalWorkflow(commands: string[]): string {
  const workflows = [
    { pattern: ['npm run build', 'npm run deploy'], name: 'Build & Deploy' },
    { pattern: ['git add', 'git commit', 'git push'], name: 'Git Workflow' },
    { pattern: ['npm install'], name: 'Dependency Installation' }
  ];
  
  for (const { pattern, name } of workflows) {
    if (pattern.every(cmd => commands.some(c => c.includes(cmd)))) {
      return name;
    }
  }
  
  return 'Custom workflow';
}

function extractImportantNotes(dreams: any[]): string[] {
  const notes = [];
  dreams.forEach(dream => {
    if (dream.conversation?.blockers?.length > 0) {
      notes.push(...dream.conversation.blockers.slice(0, 1));
    }
    if (dream.context?.customNotes && dream.context.customNotes.toLowerCase().includes('important')) {
      notes.push(dream.context.customNotes.slice(0, 100));
    }
  });
  return notes.slice(0, 3);
}

async function getProjectLocations(env: Env) {
  const dreamsList = await env.DREAMS.list();
  const projectLocations = new Map();

  // Analyze each project from dreams
  for (const key of dreamsList.keys) {
    const dreamData = await env.DREAMS.get(key.name);
    if (dreamData) {
      const dream = JSON.parse(dreamData);
      const projectName = dream.projectName;
      
      if (!projectLocations.has(projectName)) {
        projectLocations.set(projectName, {
          name: projectName,
          location: analyzeProjectLocation(dream),
          deploymentStatus: analyzeDeploymentStatus(dream),
          urls: extractProjectUrls(dream),
          repository: analyzeRepositoryInfo(dream),
          lastAnalyzed: dream.timestamp
        });
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalProjects: projectLocations.size,
    summary: generateLocationSummary(Array.from(projectLocations.values())),
    projects: Array.from(projectLocations.values())
  };
}

function analyzeProjectLocation(dream: any) {
  const location = {
    type: 'unknown',
    isLocal: false,
    hasRemoteRepo: false,
    confidence: 'medium'
  };

  // Check if it's git-generated (likely has remote repo)
  if (dream.metadata?.isGitGenerated || dream.metadata?.commitHash) {
    location.hasRemoteRepo = true;
    location.type = 'git-tracked';
    location.confidence = 'high';
  } else if (dream.context?.lastCommit) {
    location.hasRemoteRepo = true;
    location.type = 'git-tracked';
    location.confidence = 'medium';
  } else {
    location.isLocal = true;
    location.type = 'local-project';
    location.confidence = 'medium';
  }

  return location;
}

function analyzeDeploymentStatus(dream: any) {
  const deployment = {
    status: 'unknown',
    platforms: [],
    confidence: 'low',
    evidence: []
  };

  const dreamContent = [
    dream.context?.summary || '',
    dream.context?.customNotes || '',
    dream.context?.lastCommit || ''
  ].join(' ').toLowerCase();

  // Look for deployment indicators
  const deploymentPatterns = [
    { pattern: /cloudflare|workers\.dev|edge computing/i, platform: 'cloudflare-workers' },
    { pattern: /vercel|vercel\.app/i, platform: 'vercel' },
    { pattern: /netlify|netlify\.app/i, platform: 'netlify' },
    { pattern: /heroku|herokuapp\.com/i, platform: 'heroku' },
    { pattern: /deploy|deployment|production/i, platform: 'generic-deployment' }
  ];

  for (const { pattern, platform } of deploymentPatterns) {
    if (pattern.test(dreamContent)) {
      deployment.platforms.push(platform);
      deployment.evidence.push(`Found ${platform} indicators in dream content`);
    }
  }

  if (deployment.platforms.length > 0) {
    deployment.status = 'likely-deployed';
    deployment.confidence = 'medium';
  } else if (dreamContent.includes('local') || dreamContent.includes('localhost')) {
    deployment.status = 'local-development';
    deployment.confidence = 'medium';
  } else {
    deployment.status = 'unknown';
  }

  return deployment;
}

function extractProjectUrls(dream: any) {
  const urls = {
    development: null,
    production: null,
    repository: null
  };

  const searchText = [
    dream.context?.summary || '',
    dream.context?.customNotes || '',
    dream.context?.lastCommit || ''
  ].join(' ');

  // URL patterns
  const urlPatterns = [
    { pattern: /https:\/\/[^.\s]+\.workers\.dev/gi, type: 'production' },
    { pattern: /https:\/\/[^.\s]+\.vercel\.app/gi, type: 'production' },
    { pattern: /https:\/\/[^.\s]+\.netlify\.app/gi, type: 'production' },
    { pattern: /https:\/\/github\.com\/[^\s]+/gi, type: 'repository' },
    { pattern: /localhost:\d+/gi, type: 'development' }
  ];

  for (const { pattern, type } of urlPatterns) {
    const matches = searchText.match(pattern);
    if (matches && matches.length > 0 && !urls[type]) {
      urls[type] = matches[0];
    }
  }

  return urls;
}

function analyzeRepositoryInfo(dream: any) {
  const repo = {
    hasRepo: false,
    platform: null,
    isPublic: null,
    lastCommit: dream.context?.lastCommit || null
  };

  if (dream.metadata?.isGitGenerated || dream.metadata?.commitHash) {
    repo.hasRepo = true;
    
    const searchText = [
      dream.context?.summary || '',
      dream.context?.customNotes || ''
    ].join(' ');

    if (searchText.includes('github')) repo.platform = 'github';
    else if (searchText.includes('gitlab')) repo.platform = 'gitlab';
    else if (searchText.includes('bitbucket')) repo.platform = 'bitbucket';
  }

  return repo;
}

function generateLocationSummary(projects: any[]) {
  const summary = {
    localOnly: 0,
    hasRemoteRepo: 0,
    likelyDeployed: 0,
    platformCounts: {}
  };

  projects.forEach(project => {
    if (project.location.isLocal) summary.localOnly++;
    if (project.location.hasRemoteRepo) summary.hasRemoteRepo++;
    if (project.deploymentStatus.status === 'likely-deployed') summary.likelyDeployed++;
    
    project.deploymentStatus.platforms.forEach(platform => {
      summary.platformCounts[platform] = (summary.platformCounts[platform] || 0) + 1;
    });
  });

  return summary;
}