#!/usr/bin/env node
/**
 * Install Goodnight Hook for Claude Code
 * Sets up automatic session capture when user says "goodnight"
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function installGoodnightHook() {
  console.log('🌙 Installing Goodnight Hook for Claude Code');
  
  const homeDir = os.homedir();
  const claudeConfigDir = path.join(homeDir, '.config', 'claude');
  const hookScript = path.join(__dirname, 'goodnight-hook.sh');
  
  // Create Claude config directory if it doesn't exist
  if (!fs.existsSync(claudeConfigDir)) {
    fs.mkdirSync(claudeConfigDir, { recursive: true });
    console.log(`📁 Created Claude config directory: ${claudeConfigDir}`);
  }
  
  // Create hooks directory
  const hooksDir = path.join(claudeConfigDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
    console.log(`📁 Created hooks directory: ${hooksDir}`);
  }
  
  // Copy goodnight hook
  const hookDestination = path.join(hooksDir, 'goodnight-hook.sh');
  fs.copyFileSync(hookScript, hookDestination);
  fs.chmodSync(hookDestination, '755');
  console.log(`✅ Installed goodnight hook: ${hookDestination}`);
  
  // Create hook configuration
  const hookConfig = {
    name: 'goodnight-session-capture',
    description: 'Auto-capture Claude sessions as dreams when user says goodnight',
    trigger: {
      type: 'user-message',
      patterns: ['goodnight', 'good night', 'gn', 'sleep', 'bye'],
      caseSensitive: false
    },
    action: {
      type: 'script',
      script: hookDestination,
      async: true
    },
    enabled: true,
    created: new Date().toISOString()
  };
  
  const configPath = path.join(hooksDir, 'goodnight-config.json');
  fs.writeFileSync(configPath, JSON.stringify(hookConfig, null, 2));
  console.log(`📝 Created hook config: ${configPath}`);
  
  // Create a simple trigger script for manual testing
  const testScript = `#!/bin/bash
# Manual trigger for goodnight hook
echo "🧪 Testing goodnight hook..."
"${hookDestination}"
`;
  
  const testPath = path.join(__dirname, 'test-goodnight.sh');
  fs.writeFileSync(testPath, testScript);
  fs.chmodSync(testPath, '755');
  console.log(`🧪 Created test script: ${testPath}`);
  
  // Create shell alias for easy access
  const aliasCommand = `alias goodnight='${hookDestination}'`;
  console.log(`\n💡 Optional: Add this alias to your shell profile (~/.bashrc or ~/.zshrc):`);
  console.log(`   ${aliasCommand}`);
  
  console.log('\n✅ Goodnight hook installation complete!');
  console.log('\n🌙 How it works:');
  console.log('   - When you say "goodnight" to Claude Code');
  console.log('   - Your session gets auto-captured as a dream'); 
  console.log('   - Dream gets uploaded to KeenDreams automatically');
  console.log('   - No manual work required!');
  
  console.log('\n🧪 Test it now:');
  console.log(`   ${testPath}`);
  
  return {
    hookPath: hookDestination,
    configPath: configPath,
    testPath: testPath
  };
}

// Manual trigger function
function triggerGoodnight() {
  console.log('🌙 Manually triggering goodnight hook...');
  
  const { spawn } = require('child_process');
  const hookScript = path.join(__dirname, 'goodnight-hook.sh');
  
  const child = spawn('bash', [hookScript], {
    stdio: 'inherit'
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Goodnight hook completed successfully');
    } else {
      console.error(`❌ Hook failed with code: ${code}`);
    }
  });
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--trigger') || args.includes('-t')) {
    triggerGoodnight();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🌙 Goodnight Hook Installer');
    console.log('');
    console.log('Usage:');
    console.log('  node install-goodnight-hook.js          # Install the hook');
    console.log('  node install-goodnight-hook.js --trigger # Test the hook');
    console.log('');
  } else {
    installGoodnightHook();
  }
}

module.exports = { installGoodnightHook, triggerGoodnight };