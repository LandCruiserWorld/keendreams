/**
 * Claude Portfolio API
 * Provides Claude with instant access to Terry's project portfolio and conversation history
 */

const fs = require('fs');
const path = require('path');

class ClaudePortfolioAPI {
    constructor(workerUrl, apiKey) {
        this.workerUrl = workerUrl;
        this.apiKey = apiKey;
        this.cache = new Map();
    }

    // Get high-level overview of all projects for Claude
    async getPortfolioOverview() {
        const projects = await this.fetchAllProjects();
        
        const overview = {
            totalProjects: projects.length,
            totalDreams: projects.reduce((sum, p) => sum + p.dreamCount, 0),
            preferredTech: this.extractTechPreferences(projects),
            activeProjects: projects.filter(p => p.recentActivity).slice(0, 5),
            projectsByType: this.groupProjectsByType(projects),
            summary: this.generatePortfolioSummary(projects)
        };

        return overview;
    }

    // Get detailed project information when Claude needs to dig deeper
    async getProjectDetails(projectName) {
        const project = await this.fetchProjectByName(projectName);
        if (!project) return null;

        const details = {
            ...project,
            recentConversations: await this.getRecentConversations(projectName, 5),
            keyInsights: await this.extractProjectInsights(projectName),
            commonPatterns: await this.getProjectPatterns(projectName),
            relatedProjects: await this.findRelatedProjects(projectName),
            claudeContext: this.generateClaudeContext(project)
        };

        return details;
    }

    // Search across all conversations and insights
    async searchPortfolio(query, options = {}) {
        const { 
            projectFilter = null, 
            timeframe = null,
            includeConversations = true,
            includeCode = true,
            limit = 10 
        } = options;

        const results = await this.performSemanticSearch(query, {
            projectFilter,
            timeframe,
            includeConversations,
            includeCode,
            limit
        });

        return {
            query,
            totalResults: results.length,
            results: results.map(r => ({
                relevance: r.score,
                project: r.projectName,
                type: r.type, // 'conversation', 'code', 'insight', 'decision'
                snippet: r.snippet,
                timestamp: r.timestamp,
                dreamId: r.dreamId
            }))
        };
    }

    // Get conversation context for Claude
    async getConversationContext(dreamId) {
        const dream = await this.fetchDreamById(dreamId);
        if (!dream) return null;

        return {
            project: dream.projectName,
            summary: dream.context.summary,
            keyMoments: dream.conversation?.keyMoments || [],
            decisions: dream.conversation?.keyDecisions || [],
            codeChanges: dream.conversation?.codeChanges?.map(c => ({
                file: c.file,
                summary: c.summary || `Modified ${c.file}`
            })) || [],
            outcome: this.extractConversationOutcome(dream),
            claudeSummary: this.generateClaudeSummary(dream)
        };
    }

    // Generate what Claude should know about Terry's preferences
    async getTerryPreferences() {
        const projects = await this.fetchAllProjects();
        const conversations = await this.fetchRecentConversations(50);
        
        return {
            preferredTechnologies: {
                cloudProvider: 'Cloudflare', // Explicitly mentioned
                strongPreferences: this.extractStrongPreferences(projects, conversations),
                emergingInterests: this.detectEmergingTech(projects),
                avoidedTech: this.detectAvoidedTech(projects, conversations)
            },
            
            workingStyles: {
                projectApproach: this.analyzeProjectApproach(conversations),
                commonWorkflows: this.extractCommonWorkflows(conversations),
                typicalSessions: this.analyzeTypicalSessions(conversations),
                problemSolvingStyle: this.analyzeProblemSolving(conversations)
            },
            
            contextualPreferences: {
                codeStyle: this.extractCodeStylePreferences(conversations),
                architecturePatterns: this.extractArchitecturePreferences(projects),
                deploymentPreferences: this.extractDeploymentPreferences(projects),
                toolingPreferences: this.extractToolingPreferences(conversations)
            }
        };
    }

    // Internal methods for data fetching and analysis

    async fetchAllProjects() {
        try {
            const response = await fetch(`${this.workerUrl}/projects`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            if (!response.ok) throw new Error('Failed to fetch projects');
            
            const data = await response.json();
            return data.projects || [];
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    }

    async fetchProjectByName(projectName) {
        try {
            const response = await fetch(`${this.workerUrl}/project/${encodeURIComponent(projectName)}`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            if (!response.ok) return null;
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching project ${projectName}:`, error);
            return null;
        }
    }

    extractTechPreferences(projects) {
        const techCounts = {};
        
        projects.forEach(project => {
            if (project.techStack) {
                project.techStack.forEach(tech => {
                    techCounts[tech] = (techCounts[tech] || 0) + 1;
                });
            }
        });

        // Sort by frequency
        return Object.entries(techCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([tech, count]) => ({ tech, projects: count }));
    }

    groupProjectsByType(projects) {
        const types = {};
        
        projects.forEach(project => {
            const type = project.type || 'unknown';
            if (!types[type]) types[type] = [];
            types[type].push({
                name: project.name,
                techStack: project.techStack,
                lastActivity: project.lastActivity
            });
        });

        return types;
    }

    generatePortfolioSummary(projects) {
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.recentActivity).length;
        const topTech = this.extractTechPreferences(projects).slice(0, 3);
        
        return {
            overview: `Portfolio of ${totalProjects} projects, ${activeProjects} currently active`,
            topTechnologies: topTech.map(t => t.tech),
            focusAreas: this.identifyFocusAreas(projects),
            recentTrends: this.identifyRecentTrends(projects)
        };
    }

    generateClaudeContext(project) {
        return {
            quickStart: `This is ${project.name}, a ${project.type} project using ${project.techStack?.join(', ')}`,
            keyCommands: this.getProjectCommands(project),
            commonFiles: this.getProjectFiles(project),
            typicalTasks: this.getProjectTasks(project),
            gotchas: this.getProjectGotchas(project)
        };
    }

    generateClaudeSummary(dream) {
        const summary = [];
        
        // Main goal
        if (dream.context?.summary) {
            summary.push(`Goal: ${dream.context.summary.slice(0, 100)}`);
        }
        
        // Key achievements
        if (dream.conversation?.keyMoments?.length > 0) {
            const achievements = dream.conversation.keyMoments
                .filter(m => m.type === 'solution' || m.type === 'success')
                .slice(0, 2);
            if (achievements.length > 0) {
                summary.push(`Achieved: ${achievements.map(a => a.content.slice(0, 50)).join(', ')}`);
            }
        }
        
        // Code changes
        if (dream.conversation?.codeChanges?.length > 0) {
            const files = dream.conversation.codeChanges.map(c => path.basename(c.file)).slice(0, 3);
            summary.push(`Modified: ${files.join(', ')}`);
        }
        
        return summary.join(' | ');
    }

    async performSemanticSearch(query, options) {
        // This would implement semantic search across all dreams
        // For now, implementing keyword-based search
        const dreams = await this.fetchAllDreams(options);
        const results = [];
        
        const queryWords = query.toLowerCase().split(' ');
        
        dreams.forEach(dream => {
            let score = 0;
            const searchableText = [
                dream.context?.summary || '',
                dream.context?.customNotes || '',
                ...(dream.conversation?.keyMoments?.map(m => m.content) || []),
                ...(dream.conversation?.keyDecisions?.map(d => d.decision || d) || [])
            ].join(' ').toLowerCase();
            
            // Calculate relevance score
            queryWords.forEach(word => {
                const matches = (searchableText.match(new RegExp(word, 'g')) || []).length;
                score += matches;
            });
            
            if (score > 0) {
                // Find best snippet
                const snippet = this.extractSnippet(searchableText, queryWords);
                results.push({
                    score,
                    projectName: dream.projectName,
                    type: 'conversation',
                    snippet,
                    timestamp: dream.timestamp,
                    dreamId: dream.id
                });
            }
        });
        
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, options.limit || 10);
    }

    extractSnippet(text, queryWords) {
        // Find the best snippet containing query words
        const sentences = text.split(/[.!?]+/);
        let bestSentence = '';
        let maxMatches = 0;
        
        sentences.forEach(sentence => {
            const matches = queryWords.reduce((count, word) => {
                return count + (sentence.toLowerCase().includes(word) ? 1 : 0);
            }, 0);
            
            if (matches > maxMatches) {
                maxMatches = matches;
                bestSentence = sentence.trim();
            }
        });
        
        return bestSentence.slice(0, 200) + (bestSentence.length > 200 ? '...' : '');
    }

    // Helper methods for preference analysis
    extractStrongPreferences(projects, conversations) {
        const preferences = [];
        
        // Cloudflare preference (explicitly mentioned)
        preferences.push({
            category: 'Cloud Provider',
            preference: 'Cloudflare',
            confidence: 'high',
            evidence: 'Explicitly mentioned as supported technology'
        });
        
        // Analyze tech stack frequencies
        const techFreq = {};
        projects.forEach(p => {
            if (p.techStack) {
                p.techStack.forEach(tech => {
                    techFreq[tech] = (techFreq[tech] || 0) + 1;
                });
            }
        });
        
        // High-frequency technologies
        Object.entries(techFreq)
            .filter(([tech, count]) => count >= 3) // Used in 3+ projects
            .forEach(([tech, count]) => {
                preferences.push({
                    category: 'Technology',
                    preference: tech,
                    confidence: count >= 5 ? 'high' : 'medium',
                    evidence: `Used in ${count} projects`
                });
            });
        
        return preferences;
    }

    // Generate API endpoints for the worker
    getEndpointsForWorker() {
        return [
            'GET /claude/portfolio - Portfolio overview for Claude',
            'GET /claude/project/:name - Detailed project info',
            'GET /claude/search?q=query - Search across all dreams',
            'GET /claude/conversation/:dreamId - Conversation context',
            'GET /claude/preferences - Terry\'s working preferences',
            'GET /claude/projects/active - Currently active projects',
            'GET /claude/insights/:projectName - Project-specific insights'
        ];
    }
}

// CLI interface for testing
if (require.main === module) {
    const api = new ClaudePortfolioAPI(
        process.env.KEENDREAMS_URL || 'https://keendreams.workers.dev',
        process.env.KEENDREAMS_API_KEY
    );
    
    const command = process.argv[2];
    
    switch (command) {
        case 'overview':
            api.getPortfolioOverview().then(overview => {
                console.log('## Portfolio Overview');
                console.log(`Total Projects: ${overview.totalProjects}`);
                console.log(`Total Dreams: ${overview.totalDreams}`);
                console.log('\n### Preferred Technologies:');
                overview.preferredTech.slice(0, 5).forEach(tech => {
                    console.log(`- ${tech.tech} (${tech.projects} projects)`);
                });
                console.log('\n### Active Projects:');
                overview.activeProjects.forEach(project => {
                    console.log(`- ${project.name} (${project.techStack?.join(', ') || 'Unknown stack'})`);
                });
            });
            break;
            
        case 'search':
            const query = process.argv[3];
            if (query) {
                api.searchPortfolio(query).then(results => {
                    console.log(`## Search Results for "${query}"`);
                    console.log(`Found ${results.totalResults} results\n`);
                    results.results.slice(0, 5).forEach(result => {
                        console.log(`### ${result.project} (Score: ${result.relevance})`);
                        console.log(result.snippet);
                        console.log(`*${result.type} - ${result.timestamp}*\n`);
                    });
                });
            } else {
                console.log('Usage: node claude-portfolio-api.js search "your query"');
            }
            break;
            
        default:
            console.log('Claude Portfolio API');
            console.log('\nCommands:');
            console.log('  overview  - Show portfolio overview');
            console.log('  search "query"  - Search across all projects');
            break;
    }
}

module.exports = { ClaudePortfolioAPI };