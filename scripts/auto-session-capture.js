#!/usr/bin/env node
/**
 * Automatic Claude Session Capture
 * Captures current conversation and saves as a dream when triggered
 */

const fs = require('fs');
const path = require('path');
const { convertClaudeExportToDream } = require('./quick-claude-converter');

// Get conversation context from environment or arguments
function captureCurrentSession(trigger = 'goodnight') {
  console.log(`🌙 Auto-capturing Claude session (trigger: "${trigger}")`);
  
  // Try to extract session info from Claude Code context
  const sessionData = {
    id: `claude_session_${Date.now()}`,
    title: `Claude Code Session - ${new Date().toLocaleDateString()}`,
    url: 'claude-code://session',
    timestamp: new Date().toISOString(),
    messages: [],
    messageCount: 0,
    totalCharacters: 0,
    trigger: trigger,
    source: 'claude-code-auto-capture'
  };
  
  // Try to read recent bash history for context
  const homeDir = process.env.HOME;
  const bashHistory = path.join(homeDir, '.bash_history');
  const zshHistory = path.join(homeDir, '.zsh_history');
  
  let recentCommands = [];
  try {
    if (fs.existsSync(zshHistory)) {
      const history = fs.readFileSync(zshHistory, 'utf8');
      recentCommands = history.split('\n')
        .filter(line => line.trim())
        .slice(-20) // Last 20 commands
        .map(line => line.replace(/^: \d+:\d+;/, '')); // Clean zsh timestamp format
    } else if (fs.existsSync(bashHistory)) {
      const history = fs.readFileSync(bashHistory, 'utf8');
      recentCommands = history.split('\n')
        .filter(line => line.trim())
        .slice(-20);
    }
  } catch (error) {
    console.log('📝 Could not read command history');
  }
  
  // Create context from recent activity
  if (recentCommands.length > 0) {
    const contextMessage = {
      id: 'session_context',
      content: `Recent commands executed:\n${recentCommands.join('\n')}`,
      timestamp: new Date().toISOString(),
      length: recentCommands.join('\n').length
    };
    
    sessionData.messages.push(contextMessage);
    sessionData.messageCount = 1;
    sessionData.totalCharacters = contextMessage.length;
  }
  
  // Add trigger message
  const triggerMessage = {
    id: 'session_end',
    content: `User said "${trigger}" - Auto-capturing session as dream`,
    timestamp: new Date().toISOString(),
    length: 50
  };
  
  sessionData.messages.push(triggerMessage);
  sessionData.messageCount++;
  sessionData.totalCharacters += triggerMessage.length;
  
  // Convert to dream format
  const dream = convertClaudeExportToDream(sessionData, sessionData.title);
  
  // Enhanced dream with session-specific metadata
  dream.context.customNotes = `Auto-captured Claude Code session. Trigger: "${trigger}". Working directory: ${process.cwd()}`;
  dream.metadata.source = 'claude-code-session';
  dream.metadata.autoCapture = true;
  dream.metadata.captureTime = new Date().toISOString();
  
  // Save dream file
  const dreamPath = path.join(__dirname, '..', `claude-dream-${dream.id.replace('claude_web_', '')}.json`);
  fs.writeFileSync(dreamPath, JSON.stringify(dream, null, 2));
  
  console.log(`✅ Session captured as dream: ${path.basename(dreamPath)}`);
  console.log(`📊 Context: ${dream.metadata.messageCount} items, ${dream.metadata.totalCharacters} chars`);
  
  // Store session info for potential git commit
  const sessionInfo = {
    dreamPath,
    workingDirectory: process.cwd(),
    timestamp: new Date().toISOString(),
    hasGitRepo: fs.existsSync(path.join(process.cwd(), '.git')),
    projectName: path.basename(process.cwd())
  };
  
  // Save session info for the goodnight prompt
  const sessionInfoPath = path.join(__dirname, '..', 'last-session-info.json');
  fs.writeFileSync(sessionInfoPath, JSON.stringify(sessionInfo, null, 2));
  
  return { dreamPath, dream, sessionInfo };
}

// Update KeenDreams stats function
async function updateKeenDreamsStats() {
  console.log('📊 Updating KeenDreams dashboard stats...');
  
  try {
    const { spawn } = require('child_process');
    
    // Try to get current stats from KeenDreams API
    const statsResponse = await new Promise((resolve, reject) => {
      const apiKey = process.env.KEENDREAMS_API_KEY;
      const workerUrl = process.env.KEENDREAMS_URL || 'https://keendreams.workers.dev';

      if (!apiKey) {
        console.error('❌ KEENDREAMS_API_KEY environment variable not set');
        process.exit(1);
      }

      const curl = spawn('curl', [
        '-X', 'GET',
        '-H', `Authorization: Bearer ${apiKey}`,
        '-H', 'Content-Type: application/json',
        `${workerUrl}/stats`
      ]);
      
      let response = '';
      curl.stdout.on('data', (data) => {
        response += data.toString();
      });
      
      curl.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(response));
          } catch (e) {
            resolve({ totalDreams: 'unknown', updated: false });
          }
        } else {
          resolve({ totalDreams: 'unknown', updated: false });
        }
      });
      
      curl.on('error', () => {
        resolve({ totalDreams: 'unknown', updated: false });
      });
    });
    
    console.log(`📈 Current stats: ${statsResponse.totalDreams || 'Unknown'} total dreams`);
    
    // Trigger stats update/rebuild on KeenDreams site
    const updateResponse = await new Promise((resolve) => {
      const curl = spawn('curl', [
        '-X', 'POST',
        '-H', 'Authorization: Bearer YOUR_API_KEY',
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify({
          action: 'update_stats',
          source: 'dream_capture',
          timestamp: new Date().toISOString()
        }),
        'https://keendreams.workers.dev/admin/update-stats'
      ]);
      
      let response = '';
      curl.stdout.on('data', (data) => {
        response += data.toString();
      });
      
      curl.on('close', (code) => {
        resolve({ success: code === 0, response });
      });
      
      curl.on('error', () => {
        resolve({ success: false, response: 'network error' });
      });
    });
    
    if (updateResponse.success) {
      console.log('✅ KeenDreams dashboard stats updated successfully!');
    } else {
      console.log('⚠️  Stats update request sent (response may be cached)');
    }
    
  } catch (error) {
    console.log('⚠️  Could not update KeenDreams stats:', error.message);
  }
}

// Auto-upload function
async function uploadDream(dreamPath, apiKey = null) {
  const apiToken = apiKey || process.env.KEENDREAMS_API_KEY;

  if (!apiToken) {
    console.error('❌ KEENDREAMS_API_KEY environment variable required');
    console.error('Set it with: export KEENDREAMS_API_KEY="your-api-key"');
    return false;
  }
  
  if (!fs.existsSync(dreamPath)) {
    console.error(`❌ Dream file not found: ${dreamPath}`);
    return false;
  }
  
  console.log(`🚀 Auto-uploading dream: ${path.basename(dreamPath)}`);
  
  try {
    const { spawn } = require('child_process');
    
    const curl = spawn('curl', [
      '-X', 'POST',
      '-H', `Authorization: Bearer ${apiToken}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${dreamPath}`,
      'https://keendreams.workers.dev/dream'
    ]);
    
    let response = '';
    curl.stdout.on('data', (data) => {
      response += data.toString();
    });
    
    curl.on('close', async (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(response);
          if (result.success) {
            console.log(`✅ Dream uploaded successfully: ${result.dreamId}`);
            console.log(`📊 Quality score: ${result.qualityScore}`);
            
            // Update dashboard stats after successful upload
            await updateKeenDreamsStats();
            
            return true;
          }
        } catch (e) {
          console.log(`✅ Dream uploaded (response: ${response.substring(0, 100)}...)`);
          
          // Update stats even if we can't parse the response
          await updateKeenDreamsStats();
          
          return true;
        }
      } else {
        console.error(`❌ Upload failed with code: ${code}`);
        return false;
      }
    });
    
  } catch (error) {
    console.error(`❌ Upload error: ${error.message}`);
    return false;
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const trigger = args[0] || 'goodnight';
  const autoUpload = args.includes('--upload') || args.includes('-u');
  
  console.log('🌙 Claude Session Auto-Capture');
  console.log(`Trigger word: "${trigger}"`);
  console.log(`Auto-upload: ${autoUpload ? 'Yes' : 'No'}`);
  console.log('');
  
  const { dreamPath, dream } = captureCurrentSession(trigger);
  
  if (autoUpload) {
    setTimeout(() => {
      uploadDream(dreamPath);
    }, 1000);
  } else {
    console.log('\n🚀 To upload manually:');
    console.log(`curl -X POST -H "Authorization: Bearer YOUR_API_KEY" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d @"${dreamPath}" \\`);
    console.log(`  https://keendreams.workers.dev/dream`);
  }
}

module.exports = { captureCurrentSession, uploadDream };