# 🌙 Enhanced Goodnight Workflow with Git Integration

## What Happens When You Say "Goodnight"

### 1. **Dream Capture** (Automatic)
- ✅ Current Claude session gets captured as a dream
- ✅ Automatically uploads to KeenDreams
- ✅ Session context preserved permanently

### 2. **Git Integration** (Interactive)
- 🤖 Checks if you're in a git repository
- 📊 Shows current git status (modified files)
- 💬 Asks: "Save progress to GitHub for '[project-name]'? (y/N)"
- 🚀 If yes: commits and pushes automatically

## Example Workflow

```bash
You: "goodnight"

🌙 Goodnight hook triggered - capturing session...
🌙 Auto-capturing Claude session (trigger: "goodnight")
✅ Session captured as dream: claude-dream-1234567890.json
📊 Context: 3 items, 450 chars
🚀 Auto-uploading dream: claude-dream-1234567890.json
✅ Dream uploaded successfully: claude_web_1234567890
✅ Session captured and uploaded as dream

🤖 Checking if you want to save progress to GitHub...

📊 Git status for claude-memory:
 M scripts/goodnight-hook.sh
 M scripts/auto-session-capture.js
?? docs/goodnight-git-workflow.md

💾 Save progress to GitHub for "claude-memory"? (y/N): y

🔄 Committing progress for claude-memory...
📤 Pushing to remote repository...
✅ Progress pushed to GitHub!

📊 Updating KeenDreams site stats...
📈 Current stats: 173 total dreams
✅ KeenDreams stats updated successfully!
😴 All done! Sweet dreams! 🌙
```

## Smart Features

### **Automatic Project Detection**
- Uses current directory name as project name
- No need to specify project manually

### **Git Status Awareness**  
- Only prompts if there are actual changes
- Shows exactly what files will be committed
- Skips prompt if no git repo or no changes

### **Professional Commits**
- Timestamped commit messages
- Includes Claude Code attribution
- Follows your existing commit patterns

### **Remote Handling**
- Automatically pushes if remote is configured
- Falls back to local commit if no remote
- Handles authentication seamlessly

## Manual Usage

```bash
# Test the full workflow
scripts/test-goodnight.sh

# Just the git prompt (after session capture)
node scripts/goodnight-with-git.js

# View last session info
cat last-session-info.json
```

## Configuration

The system automatically:
- ✅ Detects git repositories
- ✅ Gets project name from directory
- ✅ Checks for uncommitted changes
- ✅ Handles remote push/local commit
- ✅ Provides clear feedback

No configuration needed - it just works! 🚀

## Benefits

1. **Never lose work** - Every session becomes a permanent dream
2. **Consistent commits** - Professional git history maintained
3. **Zero friction** - One word ("goodnight") handles everything
4. **Smart prompting** - Only asks when relevant
5. **Full automation** - Dream capture + git workflow combined

Perfect for ending coding sessions with confidence that all progress is safely stored! 🌙