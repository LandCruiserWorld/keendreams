#!/usr/bin/env node
/**
 * Quick Claude.ai to Dreams Converter
 * Takes the JSON output from the browser extractor and converts to Dreams format
 */

const fs = require('fs');

// Function to convert Claude export to Dream format
function convertClaudeExportToDream(exportData, title = null) {
  if (!exportData.messages || exportData.messages.length === 0) {
    throw new Error('No messages found in export data');
  }
  
  console.log(`Converting ${exportData.messages.length} messages to dream format...`);
  
  // Extract project context from messages
  const allContent = exportData.messages.map(m => m.content).join(' ');
  
  // Simple tech stack detection
  const techPatterns = {
    'JavaScript': /javascript|js\b|node/gi,
    'Python': /python|django|flask|fastapi/gi,
    'React': /react|jsx|next\.?js/gi,
    'TypeScript': /typescript|ts\b/gi,
    'Docker': /docker|container/gi,
    'AWS': /aws|amazon\s+web\s+services/gi,
    'API': /api|endpoint|rest/gi,
    'Database': /database|sql|mongodb|postgres/gi
  };
  
  const detectedTech = [];
  Object.entries(techPatterns).forEach(([tech, pattern]) => {
    if (pattern.test(allContent)) {
      detectedTech.push(tech);
    }
  });
  
  // Extract tasks from user-like content (shorter messages often user questions)
  const userMessages = exportData.messages.filter(m => m.length < 500);
  const assistantMessages = exportData.messages.filter(m => m.length >= 500);
  
  // Extract key decisions and next steps from longer (assistant) messages
  const keyDecisions = assistantMessages.map(msg => {
    const sentences = msg.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.find(s => s.includes('should') || s.includes('recommend') || s.includes('approach'));
  }).filter(Boolean).slice(0, 3);
  
  const nextSteps = assistantMessages.map(msg => {
    const sentences = msg.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.find(s => s.includes('next') || s.includes('then') || s.includes('after'));
  }).filter(Boolean).slice(0, 3);
  
  const dream = {
    id: `claude_web_${Date.now()}`,
    projectPath: '/claude-web-sessions',
    projectName: title || `Claude Conversation ${new Date().toLocaleDateString()}`,
    timestamp: exportData.timestamp || new Date().toISOString(),
    context: {
      summary: `Claude.ai conversation with ${exportData.messageCount} messages. Topics: ${detectedTech.join(', ') || 'General discussion'}`,
      techStack: detectedTech,
      currentTasks: userMessages.slice(0, 3).map(m => m.content.substring(0, 100) + '...'),
      completedTasks: [],
      fileStructure: [],
      dependencies: {},
      customNotes: `Imported from Claude.ai web interface. URL: ${exportData.url || 'N/A'}`
    },
    conversation: {
      keyDecisions: keyDecisions.map(d => d?.substring(0, 200) + '...').filter(Boolean),
      blockers: [],
      nextSteps: nextSteps.map(s => s?.substring(0, 200) + '...').filter(Boolean)
    },
    metadata: {
      source: 'claude',
      claudeVersion: 'claude-web',
      duration: Math.min(exportData.messageCount * 3, 180), // 3 min per message, max 3 hours
      durationHours: Math.min(exportData.messageCount * 3 / 60, 3),
      qualityScore: Math.min(60 + exportData.messageCount * 3, 100),
      messageCount: exportData.messageCount,
      totalCharacters: exportData.messages.reduce((sum, m) => sum + m.length, 0)
    }
  };
  
  return dream;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🌙 Quick Claude.ai to Dreams Converter');
    console.log('');
    console.log('Usage:');
    console.log('  node quick-claude-converter.js export-data.json "Conversation Title"');
    console.log('  node quick-claude-converter.js \'{"messages":[...]}\' "Title"');
    console.log('');
    console.log('The JSON should be the output from the browser extractor.');
    process.exit(1);
  }
  
  let exportData;
  const title = args[1];
  
  try {
    // Try to parse as JSON string first
    exportData = JSON.parse(args[0]);
  } catch (e) {
    // Try to read as file
    if (fs.existsSync(args[0])) {
      exportData = JSON.parse(fs.readFileSync(args[0], 'utf8'));
    } else {
      console.error('❌ Could not parse JSON or find file:', args[0]);
      process.exit(1);
    }
  }
  
  try {
    const dream = convertClaudeExportToDream(exportData, title);
    
    // Save the dream
    const filename = `claude-dream-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(dream, null, 2));
    
    console.log('✅ Successfully converted to dream format!');
    console.log(`💾 Saved as: ${filename}`);
    console.log(`📊 Stats: ${dream.metadata.messageCount} messages, ${dream.context.techStack.length} technologies detected`);
    console.log(`🏷️  Title: ${dream.projectName}`);
    
    console.log('\n🚀 To upload to KeenDreams:');
    console.log(`curl -X POST -H "Authorization: Bearer ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d @${filename} \\`);
    console.log(`  https://keendreams.terry-c67.workers.dev/dream`);
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

module.exports = { convertClaudeExportToDream };