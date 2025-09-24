/**
 * Enhanced Dream Capture System
 * Captures full context including conversations, code changes, and decisions
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class EnhancedDreamCapture {
    constructor(projectPath, apiKey, workerUrl) {
        this.projectPath = projectPath;
        this.apiKey = apiKey;
        this.workerUrl = workerUrl;
        this.sessionStart = this.getSessionStart();
        this.conversationLog = [];
        this.commandHistory = [];
        this.codeChanges = [];
        this.keyMoments = [];
    }

    getSessionStart() {
        const sessionFile = path.join(this.projectPath, '.dream_session_start');
        if (fs.existsSync(sessionFile)) {
            return parseInt(fs.readFileSync(sessionFile, 'utf8').trim());
        }
        return Date.now() / 1000;
    }

    // Capture full conversation with semantic markers
    addConversationTurn(role, content, metadata = {}) {
        const turn = {
            timestamp: new Date().toISOString(),
            role, // 'user' or 'assistant'
            content,
            metadata: {
                tokenCount: content.length,
                hasCode: /```/.test(content),
                hasCommands: /```bash|```shell/.test(content),
                importance: this.calculateImportance(content),
                ...metadata
            }
        };

        this.conversationLog.push(turn);

        // Auto-detect key moments
        if (this.isKeyMoment(content)) {
            this.addKeyMoment(content, 'breakthrough');
        }
    }

    // Track commands executed and their outputs
    async logCommand(command, description = '', captureOutput = true) {
        const startTime = Date.now();
        let output = '';
        let exitCode = 0;

        try {
            if (captureOutput) {
                const result = await execAsync(command, { cwd: this.projectPath });
                output = result.stdout + result.stderr;
            } else {
                // For commands we don't want to re-execute
                output = '[Command logged but output not captured]';
            }
        } catch (error) {
            output = error.message;
            exitCode = error.code || 1;
        }

        const commandEntry = {
            timestamp: new Date().toISOString(),
            command,
            description,
            output: output.slice(0, 5000), // Limit output size
            exitCode,
            duration: Date.now() - startTime,
            successful: exitCode === 0
        };

        this.commandHistory.push(commandEntry);
        return commandEntry;
    }

    // Track file modifications with git diffs
    async captureCodeChanges() {
        try {
            // Get modified files
            const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd: this.projectPath });
            const modifiedFiles = statusOutput.split('\n')
                .filter(line => line.trim())
                .map(line => ({
                    status: line.slice(0, 2).trim(),
                    file: line.slice(3).trim()
                }));

            // Get diffs for modified files
            for (const file of modifiedFiles) {
                if (file.status && file.file) {
                    try {
                        const { stdout: diff } = await execAsync(`git diff HEAD -- "${file.file}"`, { cwd: this.projectPath });
                        this.codeChanges.push({
                            file: file.file,
                            status: file.status,
                            diff: diff.slice(0, 10000), // Limit diff size
                            timestamp: new Date().toISOString(),
                            summary: this.summarizeDiff(diff)
                        });
                    } catch (error) {
                        // File might be new or binary
                        this.codeChanges.push({
                            file: file.file,
                            status: file.status,
                            diff: `[${error.message}]`,
                            timestamp: new Date().toISOString(),
                            summary: `${file.status} - ${file.file}`
                        });
                    }
                }
            }
        } catch (error) {
            console.log('Note: Git diff capture failed (not a git repo?)');
        }
    }

    // Add key moments with context
    addKeyMoment(content, type, metadata = {}) {
        this.keyMoments.push({
            timestamp: new Date().toISOString(),
            type, // 'breakthrough', 'solution', 'blocker', 'decision'
            content: content.slice(0, 500),
            conversationIndex: this.conversationLog.length - 1,
            metadata
        });
    }

    // Calculate importance score for conversation turns
    calculateImportance(content) {
        let score = 0;
        const lowerContent = content.toLowerCase();

        // High importance indicators
        if (lowerContent.includes('error') || lowerContent.includes('failed')) score += 3;
        if (lowerContent.includes('solution') || lowerContent.includes('fix')) score += 3;
        if (lowerContent.includes('deploy') || lowerContent.includes('build')) score += 2;
        if (/```/.test(content)) score += 2; // Has code
        if (content.length > 1000) score += 1; // Substantial content
        if (lowerContent.includes('important') || lowerContent.includes('critical')) score += 2;

        return Math.min(score, 5); // Cap at 5
    }

    // Detect if content represents a key moment
    isKeyMoment(content) {
        const lowerContent = content.toLowerCase();
        const keyPhrases = [
            'found the issue', 'that worked', 'perfect!', 'success',
            'deployed', 'fixed', 'working now', 'solved'
        ];
        return keyPhrases.some(phrase => lowerContent.includes(phrase));
    }

    // Summarize a git diff
    summarizeDiff(diff) {
        if (!diff) return 'No changes';
        
        const lines = diff.split('\n');
        const added = lines.filter(l => l.startsWith('+')).length;
        const removed = lines.filter(l => l.startsWith('-')).length;
        
        // Try to extract function/class names being modified
        const functions = lines
            .filter(l => l.match(/[+-].*function|[+-].*class|[+-].*const.*=/))
            .map(l => l.replace(/^[+-]\s*/, '').slice(0, 50))
            .slice(0, 3);

        let summary = `+${added} -${removed} lines`;
        if (functions.length > 0) {
            summary += `, modified: ${functions.join(', ')}`;
        }
        
        return summary;
    }

    // Extract semantic insights from the session
    extractSemanticInsights() {
        const insights = {
            mainGoal: this.extractMainGoal(),
            problemsSolved: this.extractProblemsSolved(),
            decisionsExplained: this.extractDecisions(),
            warningsAndCaveats: this.extractWarnings(),
            nextSteps: this.extractNextSteps()
        };

        return insights;
    }

    extractMainGoal() {
        // Look for goal-indicating phrases in early conversation
        const earlyTurns = this.conversationLog.slice(0, 5);
        for (const turn of earlyTurns) {
            if (turn.role === 'user' && turn.content.length > 20) {
                return turn.content.slice(0, 200) + '...';
            }
        }
        return 'Session goal not clearly identified';
    }

    extractProblemsSolved() {
        return this.keyMoments
            .filter(m => m.type === 'solution' || m.type === 'breakthrough')
            .map(m => m.content);
    }

    extractDecisions() {
        return this.conversationLog
            .filter(turn => turn.content.toLowerCase().includes('decision') || 
                           turn.content.toLowerCase().includes('chose') ||
                           turn.content.toLowerCase().includes('instead'))
            .map(turn => ({
                decision: turn.content.slice(0, 300),
                timestamp: turn.timestamp
            }));
    }

    extractWarnings() {
        return this.conversationLog
            .filter(turn => turn.content.toLowerCase().includes('warning') ||
                           turn.content.toLowerCase().includes('careful') ||
                           turn.content.toLowerCase().includes('don\'t'))
            .map(turn => turn.content.slice(0, 200));
    }

    extractNextSteps() {
        // Look in last few assistant messages for next steps
        const lastAssistantTurns = this.conversationLog
            .filter(turn => turn.role === 'assistant')
            .slice(-3);
            
        const nextSteps = [];
        for (const turn of lastAssistantTurns) {
            const lines = turn.content.split('\n');
            for (const line of lines) {
                if (line.includes('next') || line.includes('should') || line.includes('could')) {
                    nextSteps.push(line.trim());
                }
            }
        }
        return nextSteps.slice(0, 5);
    }

    // Generate the comprehensive dream data
    async generateEnhancedDream() {
        await this.captureCodeChanges();
        const insights = this.extractSemanticInsights();
        
        const sessionDuration = Date.now() / 1000 - this.sessionStart;
        const sessionHours = sessionDuration / 3600;

        // Create wake-up summary
        const wakeUpSummary = this.generateWakeUpSummary(insights);

        const enhancedDream = {
            // Basic dream structure (compatible with existing)
            id: `enhanced_${Date.now()}`,
            projectPath: this.projectPath,
            projectName: path.basename(this.projectPath),
            timestamp: new Date().toISOString(),
            
            // Enhanced context
            context: {
                summary: insights.mainGoal,
                techStack: await this.detectTechStack(),
                currentTasks: this.extractCurrentTasks(),
                completedTasks: this.extractCompletedTasks(),
                fileStructure: await this.getFileStructure(),
                dependencies: await this.getDependencies(),
                customNotes: wakeUpSummary
            },

            // Full conversation with semantic markers
            conversation: {
                fullHistory: this.conversationLog,
                keyMoments: this.keyMoments,
                keyDecisions: insights.decisionsExplained,
                blockers: this.extractBlockers(),
                nextSteps: insights.nextSteps,
                commandHistory: this.commandHistory,
                codeChanges: this.codeChanges
            },

            // Enhanced metadata
            metadata: {
                claudeVersion: 'claude-3-5-sonnet',
                duration: sessionDuration,
                durationHours: sessionHours,
                conversationTurns: this.conversationLog.length,
                commandsExecuted: this.commandHistory.length,
                filesModified: this.codeChanges.length,
                keyMomentsCount: this.keyMoments.length,
                importanceScore: this.calculateSessionImportance(),
                enhanced: true,
                version: '2.0'
            },

            // Wake-up data for instant context
            wakeUp: {
                quickSummary: wakeUpSummary,
                lastIntent: insights.mainGoal.slice(0, 100),
                mainAchievements: insights.problemsSolved.slice(0, 3),
                warningsAndCaveats: insights.warningsAndCaveats.slice(0, 3),
                workingCommands: this.commandHistory
                    .filter(cmd => cmd.successful)
                    .slice(-5)
                    .map(cmd => ({ command: cmd.command, description: cmd.description })),
                modifiedFiles: this.codeChanges.map(c => ({ file: c.file, summary: c.summary }))
            }
        };

        return enhancedDream;
    }

    generateWakeUpSummary(insights) {
        const problems = insights.problemsSolved.slice(0, 2);
        const warnings = insights.warningsAndCaveats.slice(0, 2);
        
        let summary = `## Session: ${insights.mainGoal.slice(0, 100)}\n\n`;
        
        if (problems.length > 0) {
            summary += `**Solved**: ${problems.join(', ')}\n`;
        }
        
        if (this.codeChanges.length > 0) {
            summary += `**Modified**: ${this.codeChanges.map(c => c.file).join(', ')}\n`;
        }
        
        if (warnings.length > 0) {
            summary += `**Remember**: ${warnings.join('; ')}\n`;
        }

        return summary;
    }

    calculateSessionImportance() {
        let score = 0;
        score += this.keyMoments.length * 2;
        score += this.codeChanges.length * 3;
        score += this.commandHistory.filter(c => c.successful).length;
        score += this.conversationLog.reduce((sum, turn) => sum + turn.metadata.importance, 0);
        return Math.min(score, 100);
    }

    async detectTechStack() {
        const techStack = [];
        
        // Check for common files/patterns
        const patterns = {
            'package.json': ['Node.js', 'npm'],
            'requirements.txt': ['Python'],
            'Cargo.toml': ['Rust'],
            'go.mod': ['Go'],
            'wrangler.toml': ['Cloudflare Workers'],
            '.git': ['Git']
        };

        for (const [file, tech] of Object.entries(patterns)) {
            if (fs.existsSync(path.join(this.projectPath, file))) {
                techStack.push(...tech);
            }
        }

        return [...new Set(techStack)]; // Remove duplicates
    }

    extractCurrentTasks() {
        // Extract from conversation or dream journal
        const tasks = [];
        
        // Look for TODO patterns in conversation
        for (const turn of this.conversationLog) {
            const todoMatches = turn.content.match(/- \[ \] .+/g);
            if (todoMatches) {
                tasks.push(...todoMatches);
            }
        }

        return tasks.slice(0, 10);
    }

    extractCompletedTasks() {
        const completed = [];
        
        for (const turn of this.conversationLog) {
            const completedMatches = turn.content.match(/- \[x\] .+/g);
            if (completedMatches) {
                completed.push(...completedMatches);
            }
        }

        return completed.slice(0, 10);
    }

    extractBlockers() {
        return this.conversationLog
            .filter(turn => turn.content.toLowerCase().includes('blocked') ||
                           turn.content.toLowerCase().includes('stuck') ||
                           turn.content.toLowerCase().includes('error'))
            .map(turn => turn.content.slice(0, 200))
            .slice(0, 5);
    }

    async getFileStructure() {
        try {
            const { stdout } = await execAsync('find . -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.md" \\) | grep -v node_modules | head -20', { cwd: this.projectPath });
            return stdout.trim().split('\n').filter(line => line.trim());
        } catch (error) {
            return [];
        }
    }

    async getDependencies() {
        const deps = {};
        
        // Node.js dependencies
        const packagePath = path.join(this.projectPath, 'package.json');
        if (fs.existsSync(packagePath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                if (pkg.dependencies) {
                    Object.assign(deps, pkg.dependencies);
                }
            } catch (error) {
                // Ignore parsing errors
            }
        }

        return deps;
    }
}

module.exports = { EnhancedDreamCapture };