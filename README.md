# 🌙 KeenDreams - Claude's Memory System

Never lose your project context again. KeenDreams captures your work as "dreams" that Claude can restore in future sessions.

## 🚀 What This Solves

Every new Claude session = amnesia. You explain everything again. Token waste. Time waste.

**KeenDreams** = Claude remembers everything. Your architecture, decisions, progress, blockers - all preserved as dreams in the cloud.

## ⚡ Quick Setup (5 minutes)

```bash
# 1. Clone and enter
git clone [your-repo] keendreams
cd keendreams

# 2. Install
npm install
chmod +x scripts/install.sh
./scripts/install.sh

# 3. Create Cloudflare KV stores
wrangler kv:namespace create DREAMS
wrangler kv:namespace create PROJECTS

# 4. Update wrangler.toml with the IDs from step 3

# 5. Deploy to Cloudflare (free)
wrangler deploy

# 6. You're done! 
# Your URL: https://keendreams.[your-subdomain].workers.dev
```

## 🌙 Daily Workflow

### Morning - Wake Up
```bash
cd ~/my-project
wake                    # Claude instantly knows everything
cat DREAM_RESTORED.md   # See what Claude remembers
```

### During Work
```bash
dj    # Update dream journal (alias for 'dream journal')
```

### Evening - Sleep
```bash
goodnight    # Saves everything to cloud
# Outputs: "Sweet dreams! 🌙"
```

## 📁 What Gets Saved

```
Your Project/
├── CLAUDE.md             # Your architecture (permanent) - YOU WRITE THIS
├── dream_2024-01-15.md   # Today's journal (auto-created)
├── DREAM_RESTORED.md     # Claude's memory (auto-generated)
└── NEXT_DREAM.md         # Tomorrow's continuation (auto-generated)
```

**Cloud Storage:**
- Dreams: 30-day retention
- Projects: 90-day retention  
- Your Cloudflare account only

## 🎯 Commands

| Command | Alias | What it does |
|---------|-------|--------------|
| `dream init` | - | Start tracking in new project |
| `dream capture` | `ds` | Save current work |
| `dream restore` | `dr` | Load previous work |
| `dream journal` | `dj` | Update today's notes |
| `goodnight` | - | Save & say goodnight |
| `wake` | - | Restore & say good morning |

## 💡 Example Dream

When you run `wake`, Claude sees this:

```markdown
# Dream Context Restoration

## Project: my-api
**Last Dream:** 2024-01-15T18:30:00Z

## Summary
Building REST API with Node.js, Express, PostgreSQL...

## Current Tasks
- [ ] Implement user authentication
- [ ] Add rate limiting

## Completed Tasks  
- [x] Database schema
- [x] Basic CRUD endpoints

## Key Decisions
- JWT for auth (not sessions)
- PostgreSQL for transactions

## Known Blockers
- ⚠️ Need AWS credentials

## Next Steps
1. Complete auth middleware
2. Write integration tests
```

## 🔒 Privacy & Security

- **Your data only** - Stored in YOUR Cloudflare account
- **No third parties** - Direct connection only
- **Auto-expiry** - Dreams expire after 30 days
- **Free tier friendly** - Works within Cloudflare's free limits

## 📊 Token Savings

**Before KeenDreams:** ~2000 tokens explaining context each session
**After KeenDreams:** ~200 tokens with `wake` command
**Savings:** 90% reduction! 

## 🎨 Why "Dreams"?

- Sessions are forgettable
- Dreams are memorable
- Claude "dreams" about your project between sessions
- You "wake" Claude with context intact
- It just sounds cooler 🌙

## 🐛 Troubleshooting

**Dreams not saving?**
```bash
echo $KEENDREAMS_URL  # Should show your worker URL
wrangler tail         # Check worker logs
```

**Can't restore?**
```bash
dream restore         # Try manual restore
ls -la .claude_dream* # Check for local dreams
```

## 🚀 Advanced Features

### Share Dreams with Team
```bash
# Your teammate can restore your exact context
curl https://keendreams.workers.dev/dream/latest/project-name
```

### Dream History
```bash
# See all dreams for a project
curl https://keendreams.workers.dev/projects
```

### Custom Domains
```toml
# In wrangler.toml
routes = ["dreams.yourdomain.com/*"]
```

## 💭 Philosophy

Every Claude session should feel like a continuation, not a restart. Your ideas flow into dreams, dreams persist in the cloud, and Claude wakes with perfect memory.

No more "50 First Dates" with Claude. Just continuous, flowing development.

---

Built with 🌙 by developers tired of re-explaining everything

**Remember:** Before closing your terminal, always say `goodnight` to save your dreams!