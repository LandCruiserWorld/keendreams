#!/usr/bin/env node
/**
 * Claude Web Conversation to Dreams Converter
 * Converts copied Claude.ai conversations to KeenDreams format
 */

const fs = require('fs');
const path = require('path');

function parseClaudeConversation(text) {
  // Split by common Claude conversation patterns
  const lines = text.split('\n').filter(line => line.trim());
  const messages = [];
  let currentMessage = null;
  
  for (const line of lines) {
    // Detect user vs assistant messages
    if (line.startsWith('You:') || line.startsWith('Human:') || line.match(/^\d+:\d+\s*(AM|PM)/)) {
      if (currentMessage) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: 'user',
        content: line.replace(/^(You:|Human:|\d+:\d+\s*(AM|PM)\s*)/, '').trim(),
        timestamp: new Date().toISOString()
      };
    } else if (line.startsWith('Claude:') || line.startsWith('Assistant:')) {
      if (currentMessage) {
        messages.push(currentMessage);
      }
      currentMessage = {
        role: 'assistant', 
        content: line.replace(/^(Claude:|Assistant:)/, '').trim(),
        timestamp: new Date().toISOString()
      };
    } else if (currentMessage) {
      // Continue current message
      currentMessage.content += '\n' + line;
    }
  }
  
  if (currentMessage) {
    messages.push(currentMessage);
  }
  
  return messages;
}

function extractProjectContext(messages) {
  const allText = messages.map(m => m.content).join(' ').toLowerCase();
  
  // Extract tech stack
  const techPatterns = [
    /react/gi, /vue/gi, /angular/gi, /node/gi, /python/gi, /javascript/gi,
    /typescript/gi, /java/gi, /rust/gi, /go/gi, /php/gi, /ruby/gi,
    /docker/gi, /kubernetes/gi, /aws/gi, /azure/gi, /gcp/gi,
    /next\.?js/gi, /express/gi, /django/gi, /flask/gi, /spring/gi
  ];
  
  const techStack = [];
  techPatterns.forEach(pattern => {
    const matches = allText.match(pattern);
    if (matches) {
      techStack.push(matches[0].toLowerCase());
    }
  });
  
  // Extract tasks and decisions
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);
  
  return {
    techStack: [...new Set(techStack)],
    currentTasks: extractTasks(userMessages),
    keyDecisions: extractDecisions(assistantMessages),
    nextSteps: extractNextSteps(assistantMessages)
  };
}

function extractTasks(userMessages) {
  const tasks = [];
  userMessages.forEach(msg => {
    const taskPatterns = [
      /i need to (.*?)[\.\?!]/gi,
      /help me (.*?)[\.\?!]/gi,
      /how do i (.*?)[\.\?!]/gi,
      /can you (.*?)[\.\?!]/gi
    ];
    
    taskPatterns.forEach(pattern => {
      const matches = [...msg.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].length > 5) {
          tasks.push(match[1].trim());
        }
      });
    });
  });
  
  return tasks.slice(0, 5); // Top 5 tasks
}

function extractDecisions(assistantMessages) {
  const decisions = [];
  assistantMessages.forEach(msg => {
    const decisionPatterns = [
      /you should (.*?)[\.\n]/gi,
      /i recommend (.*?)[\.\n]/gi,
      /the best approach is (.*?)[\.\n]/gi,
      /instead of.*?, (.*?)[\.\n]/gi
    ];
    
    decisionPatterns.forEach(pattern => {
      const matches = [...msg.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].length > 10) {
          decisions.push(match[1].trim());
        }
      });
    });
  });
  
  return decisions.slice(0, 5);
}

function extractNextSteps(assistantMessages) {
  const steps = [];
  assistantMessages.forEach(msg => {
    const stepPatterns = [
      /next,?\s+(.*?)[\.\n]/gi,
      /then,?\s+(.*?)[\.\n]/gi,
      /after that,?\s+(.*?)[\.\n]/gi,
      /first,?\s+(.*?)[\.\n]/gi,
      /finally,?\s+(.*?)[\.\n]/gi
    ];
    
    stepPatterns.forEach(pattern => {
      const matches = [...msg.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].length > 5) {
          steps.push(match[1].trim());
        }
      });
    });
  });
  
  return steps.slice(0, 5);
}

function convertToDream(conversationText, title = 'Claude Conversation') {
  const messages = parseClaudeConversation(conversationText);
  const context = extractProjectContext(messages);
  
  const dream = {
    id: `claude_web_${Date.now()}`,
    projectPath: '/claude-web-sessions',
    projectName: title,
    timestamp: new Date().toISOString(),
    context: {
      summary: `Claude web conversation: ${title}`,
      techStack: context.techStack,
      currentTasks: context.currentTasks,
      completedTasks: [],
      fileStructure: [],
      dependencies: {},
      customNotes: `Imported from Claude.ai web interface. ${messages.length} messages exchanged.`
    },
    conversation: {
      keyDecisions: context.keyDecisions,
      blockers: [],
      nextSteps: context.nextSteps
    },
    metadata: {
      source: 'claude',
      claudeVersion: 'claude-web',
      duration: Math.min(messages.length * 2, 120), // Estimate 2 min per message exchange
      durationHours: Math.min(messages.length * 2 / 60, 2),
      qualityScore: Math.min(50 + messages.length * 2, 100) // Quality based on message count
    }
  };
  
  return dream;
}

// Usage example
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🌙 Claude Web to Dreams Converter');
    console.log('Usage:');
    console.log('  node claude-web-to-dreams.js "conversation text" "Title"');
    console.log('  node claude-web-to-dreams.js conversation.txt "Title"');
    console.log('');
    console.log('Example:');
    console.log('  node claude-web-to-dreams.js "You: Help me with React\\nClaude: Sure! Here\'s how..." "React Help"');
    process.exit(1);
  }
  
  let conversationText = args[0];
  const title = args[1] || 'Claude Conversation';
  
  // If it's a file path, read the file
  if (fs.existsSync(conversationText)) {
    conversationText = fs.readFileSync(conversationText, 'utf8');
  }
  
  const dream = convertToDream(conversationText, title);
  
  // Save the dream
  const outputPath = path.join(__dirname, `claude-dream-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(dream, null, 2));
  
  console.log('✅ Converted Claude conversation to dream format');
  console.log(`💾 Saved to: ${outputPath}`);
  console.log(`📊 Found ${dream.context.techStack.length} technologies, ${dream.context.currentTasks.length} tasks`);
  
  // Upload to KeenDreams
  console.log('\\n🚀 To upload to KeenDreams, run:');
  console.log(`curl -X POST -H "Authorization: Bearer YOUR_API_KEY" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d @${outputPath} \\`);
  console.log(`  https://keendreams.terry-c67.workers.dev/dream`);
}

module.exports = { convertToDream, parseClaudeConversation };