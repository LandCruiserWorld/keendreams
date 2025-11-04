#!/usr/bin/env node
/**
 * Claude Desktop Conversation Extractor
 * Extracts conversations from Claude Desktop's LevelDB storage
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths to Claude Desktop data
const CLAUDE_DATA_PATHS = {
  localStorage: path.join(os.homedir(), 'Library/Application Support/Claude/Local Storage/leveldb'),
  sessionStorage: path.join(os.homedir(), 'Library/Application Support/Claude/Session Storage'),
  config: path.join(os.homedir(), 'Library/Application Support/Claude/config.json'),
  preferences: path.join(os.homedir(), 'Library/Application Support/Claude/Preferences')
};

async function readLevelDBManually(dbPath) {
  console.log(`🔍 Examining LevelDB at: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    console.log(`❌ Path does not exist: ${dbPath}`);
    return [];
  }
  
  const files = fs.readdirSync(dbPath);
  console.log('📁 LevelDB files:', files);
  
  const conversations = [];
  
  // Read .ldb and .log files for conversation data
  for (const file of files) {
    if (file.endsWith('.ldb') || file.endsWith('.log')) {
      try {
        const filePath = path.join(dbPath, file);
        const buffer = fs.readFileSync(filePath);
        const content = buffer.toString('utf8');
        
        // Look for JSON-like patterns that might be conversations
        const jsonMatches = content.match(/\{[^}]*"(conversation|message|chat|content)\"[^}]*\}/gi);
        
        if (jsonMatches) {
          console.log(`📝 Found ${jsonMatches.length} potential conversation fragments in ${file}`);
          
          jsonMatches.forEach((match, index) => {
            try {
              const parsed = JSON.parse(match);
              if (parsed.content || parsed.message || parsed.text) {
                conversations.push({
                  source: file,
                  index: index,
                  data: parsed
                });
              }
            } catch (e) {
              // Not valid JSON, skip
            }
          });
        }
        
        // Also look for conversation IDs or titles
        const conversationMatches = content.match(/conversation[_-]?id[\":\s]*([a-zA-Z0-9-]+)/gi);
        if (conversationMatches) {
          console.log(`🆔 Found conversation IDs in ${file}:`, conversationMatches.slice(0, 5));
        }
        
      } catch (error) {
        console.log(`⚠️  Could not read ${file}:`, error.message);
      }
    }
  }
  
  return conversations;
}

async function checkClaudeConfig() {
  console.log('🔧 Checking Claude configuration...');
  
  try {
    if (fs.existsSync(CLAUDE_DATA_PATHS.config)) {
      const config = JSON.parse(fs.readFileSync(CLAUDE_DATA_PATHS.config, 'utf8'));
      console.log('⚙️  Claude config:', JSON.stringify(config, null, 2));
    }
    
    if (fs.existsSync(CLAUDE_DATA_PATHS.preferences)) {
      const prefs = fs.readFileSync(CLAUDE_DATA_PATHS.preferences, 'utf8');
      console.log('📋 Claude preferences:', prefs);
    }
  } catch (error) {
    console.log('⚠️  Could not read config:', error.message);
  }
}

async function extractConversations() {
  console.log('🌙 Claude Desktop Conversation Extractor');
  console.log('=' .repeat(50));
  
  await checkClaudeConfig();
  
  // Check both Local Storage and Session Storage
  const localStorageData = await readLevelDBManually(CLAUDE_DATA_PATHS.localStorage);
  const sessionStorageData = await readLevelDBManually(CLAUDE_DATA_PATHS.sessionStorage);
  
  const allConversations = [...localStorageData, ...sessionStorageData];
  
  console.log('\\n📊 Extraction Summary:');
  console.log(`Found ${allConversations.length} conversation fragments`);
  
  if (allConversations.length > 0) {
    // Save raw extraction data
    const outputPath = path.join(__dirname, 'claude-conversations-raw.json');
    fs.writeFileSync(outputPath, JSON.stringify(allConversations, null, 2));
    console.log(`💾 Raw data saved to: ${outputPath}`);
    
    // Show sample data
    console.log('\\n📝 Sample conversation data:');
    allConversations.slice(0, 3).forEach((conv, i) => {
      console.log(`${i + 1}. Source: ${conv.source}`);
      console.log(`   Data: ${JSON.stringify(conv.data).substring(0, 200)}...`);
    });
  }
  
  return allConversations;
}

// Alternative approach: Check if Claude Desktop exports conversations
async function checkForExportOptions() {
  console.log('\\n🔍 Checking for Claude Desktop export options...');
  
  // Look for any export functionality or data files
  const claudeAppPath = '/Applications/Claude.app';
  if (fs.existsSync(claudeAppPath)) {
    console.log('✅ Claude Desktop app found');
    
    // Check for any data export capabilities
    const possibleExportPaths = [
      path.join(os.homedir(), 'Documents/Claude Exports'),
      path.join(os.homedir(), 'Downloads/Claude Exports'),
      path.join(os.homedir(), 'Desktop/Claude Exports')
    ];
    
    possibleExportPaths.forEach(exportPath => {
      if (fs.existsSync(exportPath)) {
        console.log(`📁 Found export directory: ${exportPath}`);
        const files = fs.readdirSync(exportPath);
        console.log(`   Files: ${files.join(', ')}`);
      }
    });
  }
}

// Run the extraction
if (require.main === module) {
  extractConversations()
    .then(() => checkForExportOptions())
    .then(() => {
      console.log('\\n🎯 Next Steps:');
      console.log('1. Review the extracted data in claude-conversations-raw.json');
      console.log('2. If conversations found, run the conversion script');
      console.log('3. Consider checking Claude Desktop for built-in export features');
    })
    .catch(error => {
      console.error('❌ Extraction failed:', error);
    });
}

module.exports = { extractConversations, CLAUDE_DATA_PATHS };