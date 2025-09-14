#!/usr/bin/env node
/**
 * Enhanced Goodnight Hook with Git Integration
 * Prompts user to save progress to GitHub after capturing session
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkGitStatus(workingDir) {
  return new Promise((resolve) => {
    const gitStatus = spawn('git', ['status', '--porcelain'], { 
      cwd: workingDir,
      stdio: 'pipe'
    });
    
    let statusOutput = '';
    gitStatus.stdout.on('data', (data) => {
      statusOutput += data.toString();
    });
    
    gitStatus.on('close', (code) => {
      const hasChanges = statusOutput.trim().length > 0;
      const isGitRepo = code === 0;
      resolve({ isGitRepo, hasChanges, statusOutput });
    });
  });
}

async function updateKeenDreamsStats() {
  console.log('\n📊 Updating KeenDreams site stats...');
  
  try {
    const { spawn } = require('child_process');
    
    // Try to get current stats from KeenDreams API
    const statsResponse = await new Promise((resolve, reject) => {
      const curl = spawn('curl', [
        '-X', 'GET',
        '-H', 'Authorization: Bearer ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa',
        '-H', 'Content-Type: application/json',
        'https://keendreams.terry-c67.workers.dev/stats'
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
        '-H', 'Authorization: Bearer ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa',
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify({
          action: 'update_stats',
          source: 'goodnight_hook',
          timestamp: new Date().toISOString()
        }),
        'https://keendreams.terry-c67.workers.dev/admin/update-stats'
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
      console.log('✅ KeenDreams stats updated successfully!');
    } else {
      console.log('⚠️  Stats update request sent (response may be cached)');
    }
    
  } catch (error) {
    console.log('⚠️  Could not update KeenDreams stats:', error.message);
  }
}

async function commitAndPush(workingDir, projectName) {
  console.log(`\n🔄 Committing progress for ${projectName}...`);
  
  // Add all changes
  await new Promise((resolve) => {
    const gitAdd = spawn('git', ['add', '.'], { 
      cwd: workingDir,
      stdio: 'inherit'
    });
    gitAdd.on('close', resolve);
  });
  
  // Create commit with timestamp
  const timestamp = new Date().toLocaleString();
  const commitMessage = `🌙 Goodnight commit - Session saved ${timestamp}

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>`;
  
  await new Promise((resolve) => {
    const gitCommit = spawn('git', ['commit', '-m', commitMessage], {
      cwd: workingDir,
      stdio: 'inherit'
    });
    gitCommit.on('close', resolve);
  });
  
  // Check if we have a remote
  const hasRemote = await new Promise((resolve) => {
    const gitRemote = spawn('git', ['remote', '-v'], {
      cwd: workingDir,
      stdio: 'pipe'
    });
    
    let remoteOutput = '';
    gitRemote.stdout.on('data', (data) => {
      remoteOutput += data.toString();
    });
    
    gitRemote.on('close', () => {
      resolve(remoteOutput.trim().length > 0);
    });
  });
  
  if (hasRemote) {
    console.log('📤 Pushing to remote repository...');
    await new Promise((resolve) => {
      const gitPush = spawn('git', ['push'], {
        cwd: workingDir,
        stdio: 'inherit'
      });
      gitPush.on('close', resolve);
    });
    console.log('✅ Progress pushed to GitHub!');
    
    // Update KeenDreams stats after successful push (major update indicator)
    await updateKeenDreamsStats();
    
  } else {
    console.log('📝 Changes committed locally (no remote configured)');
  }
}

async function createNewGitHubRepo(workingDir, projectName) {
  console.log(`\n🚀 Creating new GitHub repository for ${projectName}...`);
  
  try {
    // Check if gh CLI is available
    const ghCheck = await new Promise((resolve) => {
      const gh = spawn('gh', ['--version'], { stdio: 'pipe' });
      gh.on('close', (code) => resolve(code === 0));
    });
    
    if (!ghCheck) {
      console.log('❌ GitHub CLI (gh) not found. Please install: brew install gh');
      return false;
    }
    
    // Initialize git if not already a repo
    if (!fs.existsSync(path.join(workingDir, '.git'))) {
      console.log('📁 Initializing git repository...');
      await new Promise((resolve) => {
        const gitInit = spawn('git', ['init'], { cwd: workingDir, stdio: 'inherit' });
        gitInit.on('close', resolve);
      });
    }
    
    // Add all files
    console.log('📝 Adding all files...');
    await new Promise((resolve) => {
      const gitAdd = spawn('git', ['add', '.'], { cwd: workingDir, stdio: 'inherit' });
      gitAdd.on('close', resolve);
    });
    
    // Create initial commit
    const timestamp = new Date().toLocaleString();
    const commitMessage = `🌙 Initial commit - Session snapshot ${timestamp}

Created during goodnight workflow
Contains complete project state from coding session

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>`;
    
    console.log('💾 Creating initial commit...');
    await new Promise((resolve) => {
      const gitCommit = spawn('git', ['commit', '-m', commitMessage], {
        cwd: workingDir,
        stdio: 'inherit'
      });
      gitCommit.on('close', resolve);
    });
    
    // Create GitHub repository and push
    console.log('🌐 Creating GitHub repository...');
    const createResult = await new Promise((resolve) => {
      const gh = spawn('gh', ['repo', 'create', projectName, '--public', '--push', '--source', '.'], {
        cwd: workingDir,
        stdio: 'inherit'
      });
      gh.on('close', (code) => resolve(code === 0));
    });
    
    if (createResult) {
      console.log(`✅ Repository created: https://github.com/$(gh api user --jq .login)/${projectName}`);
      
      // Update KeenDreams stats after successful repo creation
      await updateKeenDreamsStats();
      
      return true;
    } else {
      console.log('❌ Failed to create GitHub repository');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error creating repository:', error.message);
    return false;
  }
}

async function promptForGitSave() {
  try {
    // Read session info
    const sessionInfoPath = path.join(__dirname, '..', 'last-session-info.json');
    if (!fs.existsSync(sessionInfoPath)) {
      console.log('🤔 No session info found, skipping git prompt');
      return;
    }
    
    const sessionInfo = JSON.parse(fs.readFileSync(sessionInfoPath, 'utf8'));
    const { workingDirectory, projectName, hasGitRepo } = sessionInfo;
    
    // Check if there are files to commit
    const fileCount = fs.readdirSync(workingDirectory).filter(f => !f.startsWith('.')).length;
    if (fileCount === 0) {
      console.log(`📁 ${projectName} appears to be empty, skipping git prompt`);
      return;
    }
    
    console.log(`\n📁 Working on: ${projectName}`);
    console.log(`📊 Directory contains: ${fileCount} files/folders`);
    
    if (hasGitRepo) {
      // Existing repo - check for changes and offer to commit/push
      const { hasChanges, statusOutput } = await checkGitStatus(workingDirectory);
      
      if (hasChanges) {
        console.log(`📝 Git status:`);
        console.log(statusOutput);
        
        const saveProgress = await question(`\n💾 Save progress to GitHub for "${projectName}"? (y/N): `);
        
        if (saveProgress.toLowerCase().startsWith('y')) {
          await commitAndPush(workingDirectory, projectName);
        }
      } else {
        console.log(`✨ No changes to commit in ${projectName}`);
      }
    } else {
      // Not a git repo - offer to create new GitHub repo
      const createRepo = await question(`\n🌟 Create new GitHub repository for "${projectName}"? (y/N): `);
      
      if (createRepo.toLowerCase().startsWith('y')) {
        await createNewGitHubRepo(workingDirectory, projectName);
      } else {
        console.log('🚫 Skipping repository creation');
      }
    }
    
  } catch (error) {
    console.error('❌ Error in git prompt:', error.message);
  } finally {
    rl.close();
  }
}

// Main execution
if (require.main === module) {
  console.log('\n🤖 Checking if you want to save progress to GitHub...');
  promptForGitSave().then(() => {
    console.log('😴 All done! Sweet dreams! 🌙');
  });
}

module.exports = { promptForGitSave, commitAndPush, checkGitStatus };