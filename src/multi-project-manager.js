/**
 * Multi-Project Dream Manager
 * Handles context isolation and cross-project intelligence
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class MultiProjectManager {
    constructor(workerUrl, apiKey) {
        this.workerUrl = workerUrl;
        this.apiKey = apiKey;
        this.projectsCache = new Map();
        this.relationships = new Map();
    }

    // Detect current project context
    async detectCurrentProject() {
        const cwd = process.cwd();
        const projectName = path.basename(cwd);
        
        const context = {
            path: cwd,
            name: projectName,
            techStack: await this.detectTechStack(cwd),
            gitInfo: await this.getGitInfo(cwd),
            recentActivity: await this.getRecentActivity(cwd),
            relatedProjects: await this.findRelatedProjects(projectName, cwd)
        };
        
        // Cache for quick access
        this.projectsCache.set(cwd, context);
        return context;
    }

    async detectTechStack(projectPath) {
        const stack = [];
        const detectors = {
            // Frontend/Node.js
            'package.json': async () => {
                try {
                    const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
                    stack.push('Node.js');
                    
                    // Specific framework detection
                    if (pkg.dependencies?.react || pkg.devDependencies?.react) stack.push('React');
                    if (pkg.dependencies?.next || pkg.devDependencies?.next) stack.push('Next.js');
                    if (pkg.dependencies?.vue || pkg.devDependencies?.vue) stack.push('Vue.js');
                    if (pkg.dependencies?.express) stack.push('Express');
                    if (pkg.dependencies?.['@cloudflare/workers']) stack.push('Cloudflare Workers');
                    if (pkg.scripts?.vercel) stack.push('Vercel');
                    
                    return pkg;
                } catch (e) { return null; }
            },
            
            // Python
            'requirements.txt': () => { stack.push('Python'); },
            'pyproject.toml': () => { stack.push('Python', 'Poetry'); },
            'Pipfile': () => { stack.push('Python', 'Pipenv'); },
            'environment.yml': () => { stack.push('Python', 'Conda'); },
            
            // AI/ML specific
            'model.py': () => stack.push('Machine Learning'),
            'train.py': () => stack.push('ML Training'),
            'inference.py': () => stack.push('ML Inference'),
            
            // Go
            'go.mod': () => { stack.push('Go'); },
            
            // Rust
            'Cargo.toml': () => { stack.push('Rust'); },
            
            // Infrastructure
            'Dockerfile': () => { stack.push('Docker'); },
            'docker-compose.yml': () => { stack.push('Docker Compose'); },
            'kubernetes.yml': () => { stack.push('Kubernetes'); },
            'terraform': () => { stack.push('Terraform'); },
            'wrangler.toml': () => { stack.push('Cloudflare Workers'); },
            'vercel.json': () => { stack.push('Vercel'); },
            'netlify.toml': () => { stack.push('Netlify'); }
        };

        // Check for files and directories
        for (const [file, detector] of Object.entries(detectors)) {
            const filePath = path.join(projectPath, file);
            if (fs.existsSync(filePath)) {
                await detector();
            }
        }

        // Additional context from directory structure
        try {
            const files = fs.readdirSync(projectPath);
            if (files.some(f => f.endsWith('.tsx') || f.endsWith('.jsx'))) stack.push('TypeScript/JSX');
            if (files.some(f => f.endsWith('.py'))) stack.push('Python');
            if (files.some(f => f.endsWith('.rs'))) stack.push('Rust');
            if (files.some(f => f.endsWith('.go'))) stack.push('Go');
            if (files.includes('src') && files.includes('public')) stack.push('Web Frontend');
            if (files.includes('api') || files.includes('routes')) stack.push('Backend API');
        } catch (e) {
            // Ignore filesystem errors
        }

        return [...new Set(stack)]; // Remove duplicates
    }

    async getGitInfo(projectPath) {
        try {
            const [repoUrl, branch, lastCommit, remoteOrigin] = await Promise.all([
                execAsync('git config --get remote.origin.url', { cwd: projectPath })
                    .then(r => r.stdout.trim()).catch(() => ''),
                execAsync('git branch --show-current', { cwd: projectPath })
                    .then(r => r.stdout.trim()).catch(() => 'main'),
                execAsync('git log -1 --pretty=format:"%h - %s (%cr)"', { cwd: projectPath })
                    .then(r => r.stdout.trim()).catch(() => ''),
                execAsync('git remote get-url origin', { cwd: projectPath })
                    .then(r => r.stdout.trim()).catch(() => '')
            ]);

            return {
                repoUrl: repoUrl || remoteOrigin,
                branch,
                lastCommit,
                isGitRepo: !!repoUrl || !!remoteOrigin
            };
        } catch (error) {
            return { isGitRepo: false };
        }
    }

    async getRecentActivity(projectPath) {
        try {
            // Get recent commits
            const { stdout } = await execAsync('git log --oneline -10', { cwd: projectPath });
            const commits = stdout.trim().split('\n').slice(0, 5);
            
            // Check for recent file modifications
            const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd: projectPath });
            const modifiedFiles = statusOutput.split('\n').filter(line => line.trim()).length;

            return {
                recentCommits: commits,
                hasUncommittedChanges: modifiedFiles > 0,
                modifiedFileCount: modifiedFiles
            };
        } catch (error) {
            return { recentCommits: [], hasUncommittedChanges: false };
        }
    }

    async findRelatedProjects(currentProject, currentPath) {
        // Look for related projects in parent directories or common locations
        const related = [];
        
        try {
            // Check parent directory for sibling projects
            const parentDir = path.dirname(currentPath);
            const siblings = fs.readdirSync(parentDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
                .filter(name => name !== currentProject && !name.startsWith('.'));

            for (const sibling of siblings.slice(0, 10)) {
                const siblingPath = path.join(parentDir, sibling);
                if (fs.existsSync(path.join(siblingPath, '.git'))) {
                    const gitInfo = await this.getGitInfo(siblingPath);
                    related.push({
                        name: sibling,
                        path: siblingPath,
                        relationship: 'sibling',
                        gitRepo: gitInfo.repoUrl
                    });
                }
            }

            // Look for common patterns that indicate related projects
            const patterns = [
                { pattern: /(.+)[-_](frontend|backend|api|web|app)$/i, type: 'component' },
                { pattern: /(.+)[-_](client|server)$/i, type: 'architecture' },
                { pattern: /(.+)[-_]v?\d+$/i, type: 'version' }
            ];

            for (const { pattern, type } of patterns) {
                const match = currentProject.match(pattern);
                if (match) {
                    const baseName = match[1];
                    // Look for other projects with same base name
                    const relatedByName = related.filter(p => p.name.includes(baseName));
                    relatedByName.forEach(p => p.relationship = type);
                }
            }

        } catch (error) {
            // Ignore filesystem errors
        }

        return related;
    }

    // Generate project-specific wake-up context
    async generateProjectWakeup(projectContext, dreams) {
        const projectDreams = dreams.filter(d => d.projectPath === projectContext.path);
        const recentDreams = projectDreams.slice(-5);
        
        // Analyze project-specific patterns
        const patterns = this.analyzeProjectPatterns(projectDreams, projectContext);
        
        const wakeup = {
            projectOverview: {
                name: projectContext.name,
                techStack: projectContext.techStack,
                currentBranch: projectContext.gitInfo.branch,
                lastCommit: projectContext.gitInfo.lastCommit,
                hasUncommittedWork: projectContext.recentActivity.hasUncommittedChanges
            },
            
            recentContext: {
                lastSession: recentDreams.length > 0 ? recentDreams[recentDreams.length - 1] : null,
                keyMilestones: this.extractKeyMilestones(recentDreams),
                currentFocus: this.detectCurrentFocus(recentDreams),
                knownIssues: this.extractKnownIssues(recentDreams)
            },
            
            projectSpecificContext: {
                commonCommands: patterns.commonCommands,
                frequentFiles: patterns.frequentFiles,
                typicalWorkflow: patterns.typicalWorkflow,
                warningsAndNotes: patterns.projectWarnings
            },
            
            crossProjectContext: {
                relatedProjects: projectContext.relatedProjects,
                sharedPatterns: this.findSharedPatterns(projectContext, dreams),
                conflictWarnings: this.detectPotentialConflicts(projectContext, dreams)
            }
        };

        return wakeup;
    }

    analyzeProjectPatterns(dreams, projectContext) {
        const commands = [];
        const files = [];
        const workflows = [];
        const warnings = [];

        dreams.forEach(dream => {
            // Extract commands
            if (dream.conversation?.commandHistory) {
                dream.conversation.commandHistory.forEach(cmd => {
                    if (cmd.successful) commands.push(cmd.command);
                });
            }
            
            // Extract files
            if (dream.conversation?.codeChanges) {
                dream.conversation.codeChanges.forEach(change => {
                    files.push(change.file);
                });
            }
            
            // Extract warnings
            if (dream.context?.customNotes) {
                if (dream.context.customNotes.toLowerCase().includes('warning') ||
                    dream.context.customNotes.toLowerCase().includes('careful') ||
                    dream.context.customNotes.toLowerCase().includes('don\'t')) {
                    warnings.push(dream.context.customNotes.slice(0, 200));
                }
            }
        });

        return {
            commonCommands: this.getTopItems(commands, 5),
            frequentFiles: this.getTopItems(files, 10),
            typicalWorkflow: this.identifyWorkflow(commands),
            projectWarnings: [...new Set(warnings)]
        };
    }

    getTopItems(items, limit) {
        const counts = {};
        items.forEach(item => counts[item] = (counts[item] || 0) + 1);
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([item, count]) => ({ item, count }));
    }

    identifyWorkflow(commands) {
        const workflows = [];
        
        // Common development workflows
        const patterns = [
            {
                name: 'Deploy Workflow',
                pattern: ['npm run build', 'npm run deploy'],
                variations: ['build', 'deploy', 'wrangler deploy']
            },
            {
                name: 'Git Workflow', 
                pattern: ['git add', 'git commit', 'git push'],
                variations: ['git', 'add', 'commit', 'push']
            },
            {
                name: 'Test Workflow',
                pattern: ['npm test', 'npm run test'],
                variations: ['test', 'jest', 'vitest']
            }
        ];

        patterns.forEach(({ name, variations }) => {
            const hasWorkflow = variations.some(variant => 
                commands.some(cmd => cmd.includes(variant))
            );
            if (hasWorkflow) workflows.push(name);
        });

        return workflows;
    }

    extractKeyMilestones(dreams) {
        return dreams
            .filter(d => d.conversation?.keyMoments?.length > 0)
            .flatMap(d => d.conversation.keyMoments)
            .slice(-5);
    }

    detectCurrentFocus(dreams) {
        if (dreams.length === 0) return 'No recent activity';
        
        const lastDream = dreams[dreams.length - 1];
        const summary = lastDream.context?.summary || '';
        const tasks = lastDream.context?.currentTasks || [];
        
        if (tasks.length > 0) {
            return tasks.slice(0, 2).join('; ');
        }
        
        return summary.slice(0, 100) + '...';
    }

    extractKnownIssues(dreams) {
        const issues = [];
        
        dreams.forEach(dream => {
            if (dream.conversation?.blockers) {
                issues.push(...dream.conversation.blockers);
            }
        });
        
        return [...new Set(issues)].slice(-3);
    }

    findSharedPatterns(currentProject, allDreams) {
        // Find patterns that appear across multiple projects
        const otherProjects = [...new Set(allDreams.map(d => d.projectName))]
            .filter(name => name !== currentProject.name);
            
        const sharedPatterns = [];
        
        // Look for shared tech stack elements
        otherProjects.forEach(projectName => {
            const projectDreams = allDreams.filter(d => d.projectName === projectName);
            if (projectDreams.length > 0) {
                const otherTechStack = projectDreams[0].context?.techStack || [];
                const shared = currentProject.techStack.filter(tech => 
                    otherTechStack.includes(tech)
                );
                
                if (shared.length > 0) {
                    sharedPatterns.push({
                        project: projectName,
                        sharedTech: shared,
                        type: 'technology'
                    });
                }
            }
        });
        
        return sharedPatterns;
    }

    detectPotentialConflicts(currentProject, allDreams) {
        const warnings = [];
        
        // Check for similar file names across projects
        const currentFiles = new Set();
        allDreams
            .filter(d => d.projectPath === currentProject.path)
            .forEach(d => {
                if (d.conversation?.codeChanges) {
                    d.conversation.codeChanges.forEach(c => currentFiles.add(path.basename(c.file)));
                }
            });
            
        allDreams
            .filter(d => d.projectPath !== currentProject.path)
            .forEach(d => {
                if (d.conversation?.codeChanges) {
                    d.conversation.codeChanges.forEach(c => {
                        const filename = path.basename(c.file);
                        if (currentFiles.has(filename)) {
                            warnings.push({
                                type: 'filename_collision',
                                message: `File '${filename}' exists in both ${currentProject.name} and ${d.projectName}`,
                                severity: 'medium'
                            });
                        }
                    });
                }
            });
            
        return warnings;
    }

    // Smart project switching
    async handleProjectSwitch(fromProject, toProject) {
        console.log(`🔄 Switching context: ${fromProject.name} → ${toProject.name}`);
        
        // Capture current state before switching
        const contextTransition = {
            timestamp: new Date().toISOString(),
            from: {
                project: fromProject.name,
                path: fromProject.path,
                lastFocus: await this.getCurrentFocus(fromProject.path)
            },
            to: {
                project: toProject.name,
                path: toProject.path,
                techStack: toProject.techStack
            },
            contextualWarnings: this.generateSwitchWarnings(fromProject, toProject)
        };
        
        return contextualWarnings;
    }

    generateSwitchWarnings(fromProject, toProject) {
        const warnings = [];
        
        // Technology stack differences
        const fromTech = new Set(fromProject.techStack);
        const toTech = new Set(toProject.techStack);
        
        if (fromTech.has('Python') && toTech.has('Node.js')) {
            warnings.push('⚠️ Switching from Python to Node.js - different package managers (pip vs npm)');
        }
        
        if (fromTech.has('React') && !toTech.has('React')) {
            warnings.push('⚠️ Switching away from React - different component patterns expected');
        }
        
        // Command differences
        const commandMappings = {
            'npm run dev': { Python: 'python manage.py runserver', Go: 'go run main.go' },
            'pip install': { Node: 'npm install', Go: 'go mod tidy' },
            'python -m': { Node: 'npx', Go: 'go run' }
        };
        
        return warnings;
    }

    async getCurrentFocus(projectPath) {
        // Quick scan of what user was likely working on
        try {
            const { stdout } = await execAsync('git status --porcelain', { cwd: projectPath });
            if (stdout.trim()) {
                return `Uncommitted changes in ${stdout.split('\n').length} files`;
            }
            
            const { stdout: commitMsg } = await execAsync('git log -1 --pretty=format:"%s"', { cwd: projectPath });
            return `Last worked on: ${commitMsg}`;
        } catch (error) {
            return 'Unable to determine recent focus';
        }
    }
}

module.exports = { MultiProjectManager };