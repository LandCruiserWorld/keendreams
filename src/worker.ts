// Landing page HTML embedded
const LANDING_HTML = `[LANDING_HTML_CONTENT]`; // Will be replaced during build

export interface Env {
  DREAMS: KVNamespace;
  PROJECTS: KVNamespace;
  ALLOWED_ORIGINS: string;
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
    tokenCount?: number;
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

      // Store dream
      if (path === '/dream' && request.method === 'POST') {
        const data: DreamData = await request.json();
        const dreamKey = `dream:${data.projectPath}:${data.id}`;
        const projectKey = `project:${data.projectPath}`;
        
        // Store dream
        await env.DREAMS.put(dreamKey, JSON.stringify(data), {
          expirationTtl: 60 * 60 * 24 * 30, // 30 days
        });
        
        // Update project latest
        await env.PROJECTS.put(projectKey, JSON.stringify({
          lastDream: data.id,
          lastUpdated: data.timestamp,
          projectName: data.projectName,
          techStack: data.context.techStack,
        }), {
          expirationTtl: 60 * 60 * 24 * 90, // 90 days
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          dreamId: data.id,
          message: 'Dream captured successfully' 
        }), { headers });
      }

      // Get latest dream for project
      if (path.startsWith('/dream/latest/') && request.method === 'GET') {
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

      // Get specific dream
      if (path.startsWith('/dream/') && request.method === 'GET') {
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

      // List all projects
      if (path === '/projects' && request.method === 'GET') {
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

      // Generate summary for Claude
      if (path.startsWith('/summary/') && request.method === 'GET') {
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

      return new Response(JSON.stringify({ 
        error: 'Route not found',
        available: [
          'GET /',
          'POST /dream',
          'GET /dream/{id}',
          'GET /dream/latest/{projectPath}',
          'GET /projects',
          'GET /summary/{projectPath}'
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