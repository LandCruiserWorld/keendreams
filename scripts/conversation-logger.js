#!/usr/bin/env node

/**
 * Conversation Logger for Claude Code
 * Automatically tracks conversation turns for enhanced dream capture
 */

const fs = require('fs');
const path = require('path');

class ConversationLogger {
    constructor(projectPath = process.cwd()) {
        this.projectPath = projectPath;
        this.logFile = path.join(projectPath, '.conversation_log.json');
        this.conversations = this.loadExistingLog();
        this.currentSession = this.getCurrentSessionId();
    }

    loadExistingLog() {
        if (fs.existsSync(this.logFile)) {
            try {
                return JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
            } catch (error) {
                console.warn('Warning: Could not parse conversation log, starting fresh');
                return [];
            }
        }
        return [];
    }

    getCurrentSessionId() {
        const sessionFile = path.join(this.projectPath, '.dream_session_start');
        if (fs.existsSync(sessionFile)) {
            return fs.readFileSync(sessionFile, 'utf8').trim();
        }
        return Date.now().toString();
    }

    logTurn(role, content, metadata = {}) {
        const turn = {
            sessionId: this.currentSession,
            timestamp: new Date().toISOString(),
            role: role, // 'user' or 'assistant'
            content: content,
            metadata: {
                length: content.length,
                hasCode: /```/.test(content),
                hasCommands: /```(?:bash|shell|sh)/.test(content),
                hasFiles: /\.(js|ts|py|md|json|html|css)/.test(content),
                importance: this.calculateImportance(content),
                ...metadata
            }
        };

        this.conversations.push(turn);
        this.saveLog();
        
        // Auto-detect key moments
        if (this.isKeyMoment(content, role)) {
            this.flagKeyMoment(this.conversations.length - 1, content);
        }

        return turn;
    }

    calculateImportance(content) {
        let score = 0;
        const lower = content.toLowerCase();

        // High importance indicators
        if (lower.includes('error') || lower.includes('failed')) score += 3;
        if (lower.includes('solution') || lower.includes('fix') || lower.includes('solved')) score += 3;
        if (lower.includes('perfect') || lower.includes('excellent') || lower.includes('working')) score += 2;
        if (lower.includes('deploy') || lower.includes('build')) score += 2;
        if (/```[\s\S]*```/.test(content)) score += 2; // Has code blocks
        if (content.length > 1000) score += 1; // Substantial content
        if (lower.includes('important') || lower.includes('critical')) score += 2;
        
        return Math.min(score, 5);
    }

    isKeyMoment(content, role) {
        const lower = content.toLowerCase();
        const keyPhrases = [
            'found the issue', 'that worked', 'perfect!', 'excellent!',
            'successfully', 'deployed', 'fixed', 'working now', 'solved',
            'great!', 'exactly', 'brilliant'
        ];
        
        // Key moments are usually assistant responses with positive indicators
        return role === 'assistant' && keyPhrases.some(phrase => lower.includes(phrase));
    }

    flagKeyMoment(index, content) {
        const turn = this.conversations[index];
        if (turn) {
            turn.metadata.keyMoment = true;
            turn.metadata.keyMomentType = this.categorizeKeyMoment(content);
            this.saveLog();
        }
    }

    categorizeKeyMoment(content) {
        const lower = content.toLowerCase();
        if (lower.includes('deploy') || lower.includes('build')) return 'deployment';
        if (lower.includes('fix') || lower.includes('solved')) return 'solution';
        if (lower.includes('perfect') || lower.includes('working')) return 'success';
        if (lower.includes('found') || lower.includes('discovered')) return 'breakthrough';
        return 'milestone';
    }

    saveLog() {
        try {
            // Keep only last 100 turns to prevent huge files
            const recentConversations = this.conversations.slice(-100);
            fs.writeFileSync(this.logFile, JSON.stringify(recentConversations, null, 2));
        } catch (error) {
            console.error('Error saving conversation log:', error.message);
        }
    }

    getSessionSummary() {
        const sessionTurns = this.conversations.filter(turn => turn.sessionId === this.currentSession);
        const keyMoments = sessionTurns.filter(turn => turn.metadata.keyMoment);
        
        return {
            totalTurns: sessionTurns.length,
            userTurns: sessionTurns.filter(t => t.role === 'user').length,
            assistantTurns: sessionTurns.filter(t => t.role === 'assistant').length,
            keyMoments: keyMoments.length,
            averageImportance: sessionTurns.reduce((sum, turn) => sum + turn.metadata.importance, 0) / sessionTurns.length || 0,
            hasCode: sessionTurns.some(turn => turn.metadata.hasCode),
            hasCommands: sessionTurns.some(turn => turn.metadata.hasCommands),
            duration: this.getSessionDuration()
        };
    }

    getSessionDuration() {
        const sessionTurns = this.conversations.filter(turn => turn.sessionId === this.currentSession);
        if (sessionTurns.length < 2) return 0;
        
        const start = new Date(sessionTurns[0].timestamp);
        const end = new Date(sessionTurns[sessionTurns.length - 1].timestamp);
        return (end - start) / 1000; // seconds
    }

    exportForDream() {
        const sessionTurns = this.conversations.filter(turn => turn.sessionId === this.currentSession);
        const keyMoments = sessionTurns.filter(turn => turn.metadata.keyMoment);
        
        return {
            fullHistory: sessionTurns,
            keyMoments: keyMoments.map(turn => ({
                timestamp: turn.timestamp,
                type: turn.metadata.keyMomentType,
                content: turn.content.slice(0, 300),
                conversationIndex: sessionTurns.indexOf(turn)
            })),
            summary: this.getSessionSummary(),
            insights: this.extractInsights(sessionTurns)
        };
    }

    extractInsights(turns) {
        const userTurns = turns.filter(t => t.role === 'user');
        const assistantTurns = turns.filter(t => t.role === 'assistant');
        
        // Extract main goal from first user message
        const mainGoal = userTurns.length > 0 ? userTurns[0].content.slice(0, 200) : 'Session goal unclear';
        
        // Extract problems mentioned
        const problems = turns
            .filter(t => t.content.toLowerCase().includes('error') || t.content.toLowerCase().includes('problem'))
            .map(t => t.content.slice(0, 150))
            .slice(0, 3);
            
        // Extract solutions
        const solutions = turns
            .filter(t => t.metadata.keyMoment && t.metadata.keyMomentType === 'solution')
            .map(t => t.content.slice(0, 150));
            
        return {
            mainGoal,
            problems,
            solutions,
            codeGenerated: turns.some(t => t.metadata.hasCode),
            commandsUsed: turns.some(t => t.metadata.hasCommands)
        };
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const logger = new ConversationLogger();
    
    switch (command) {
        case 'user':
            if (args[1]) {
                const turn = logger.logTurn('user', args.slice(1).join(' '));
                console.log(`✓ User turn logged (importance: ${turn.metadata.importance})`);
            }
            break;
            
        case 'assistant':
            if (args[1]) {
                const turn = logger.logTurn('assistant', args.slice(1).join(' '));
                console.log(`✓ Assistant turn logged (importance: ${turn.metadata.importance})`);
                if (turn.metadata.keyMoment) {
                    console.log(`🌟 Key moment detected: ${turn.metadata.keyMomentType}`);
                }
            }
            break;
            
        case 'summary':
            const summary = logger.getSessionSummary();
            console.log('\nSession Summary:');
            console.log(`📊 Total turns: ${summary.totalTurns}`);
            console.log(`🗣️ User: ${summary.userTurns}, Assistant: ${summary.assistantTurns}`);
            console.log(`🌟 Key moments: ${summary.keyMoments}`);
            console.log(`📈 Avg importance: ${summary.averageImportance.toFixed(1)}`);
            console.log(`⏰ Duration: ${Math.round(summary.duration / 60)} minutes`);
            if (summary.hasCode) console.log('💻 Contains code');
            if (summary.hasCommands) console.log('⚡ Contains commands');
            break;
            
        case 'export':
            const exported = logger.exportForDream();
            console.log(JSON.stringify(exported, null, 2));
            break;
            
        case 'clear':
            logger.conversations = [];
            logger.saveLog();
            console.log('✓ Conversation log cleared');
            break;
            
        default:
            console.log('Conversation Logger for Enhanced Dreams');
            console.log('\nUsage:');
            console.log('  node conversation-logger.js user "message"     - Log user message');
            console.log('  node conversation-logger.js assistant "msg"    - Log assistant message');
            console.log('  node conversation-logger.js summary            - Show session summary');
            console.log('  node conversation-logger.js export             - Export for dream capture');
            console.log('  node conversation-logger.js clear              - Clear log');
            break;
    }
}

module.exports = { ConversationLogger };