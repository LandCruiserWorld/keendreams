# KeenDreams Development Guide

## 🔐 Working with Secrets Safely

This repo has multiple layers of protection to prevent you from accidentally committing your bearer token:

### 1. Local Development Setup

```bash
# Your secrets are stored in .env.local (already created for you)
# This file is in .gitignore and will NEVER be committed

cat .env.local
# BEARER_TOKEN=your_actual_bearer_token_here
# KEENDREAMS_URL=https://keendreams.your-subdomain.workers.dev
```

### 2. Wrangler Development

```bash
# For local Worker testing, use .dev.vars (also in .gitignore)
wrangler dev

# Your .dev.vars file contains:
# BEARER_TOKEN=your_actual_bearer_token_here
```

### 3. Pre-Commit Hook Protection

A git hook automatically scans every commit for secrets:

```bash
# This hook checks for:
✅ Your actual bearer token
✅ Any Bearer token patterns
✅ .env.local or .dev.vars files being committed

# If found, commit is BLOCKED with error message
```

### 4. Production Secrets (Cloudflare)

```bash
# Set production secrets via wrangler (NOT in code)
echo "your_actual_bearer_token_here" | wrangler secret put BEARER_TOKEN

# This stores the secret in Cloudflare's encrypted vault
# It's NEVER in your code or git history
```

## 🧪 Testing the Protection

Try to commit a secret (this should fail):

```bash
# Create a test file with a token
echo "BEARER_TOKEN=some_fake_token_for_testing" > test.txt
git add test.txt
git commit -m "test"

# Result: ❌ ERROR: Your bearer token was found in staged changes!
```

## 📁 What Gets Committed vs Protected

### ✅ Safe to Commit:
- `wrangler.toml` (only has placeholders: `your_dreams_kv_namespace_id`)
- `.env.example` (only has examples)
- Source code (no hardcoded secrets)
- README.md, documentation

### ❌ NEVER Committed (in .gitignore):
- `.env.local` - Your actual secrets
- `.dev.vars` - Wrangler dev secrets
- `.env` - Any environment file
- `wrangler.toml.backup` - May contain real IDs

## 🔄 Daily Workflow

```bash
# 1. Start working
cd keendreams
code .

# 2. Test locally with wrangler
wrangler dev
# Automatically loads secrets from .dev.vars

# 3. Make changes to code
# Edit src/worker.ts, README.md, etc.

# 4. Commit your changes
git add src/worker.ts
git commit -m "feat: add new feature"
# Hook automatically scans - blocks if secrets found

# 5. Push to GitHub
git push origin main
# Only safe code goes to GitHub
```

## 🚨 If You Accidentally Commit a Secret

**Don't panic!** Follow these steps:

1. **Immediately rotate the secret:**
   ```bash
   # Generate new token
   openssl rand -base64 32

   # Update Cloudflare Worker
   echo "NEW_TOKEN_HERE" | wrangler secret put BEARER_TOKEN

   # Update your local files
   # Edit .env.local and .dev.vars with new token
   ```

2. **Remove from git history:**
   ```bash
   # Use BFG Repo Cleaner or git filter-branch
   # See: SECURITY.md for detailed instructions
   ```

3. **Force push cleaned history:**
   ```bash
   git push origin --force --all
   ```

## 🎯 Best Practices

1. **Never hardcode secrets in code** - Always use environment variables
2. **Use the pre-commit hook** - It's your safety net
3. **Rotate secrets regularly** - Change tokens every 90 days
4. **Test locally with .dev.vars** - Don't use production secrets in code
5. **Check before pushing** - Run `git diff` to review what you're committing

## 🛠️ Troubleshooting

**Hook not running?**
```bash
# Make sure it's executable
chmod +x .git/hooks/pre-commit
```

**Want to bypass the hook? (NOT RECOMMENDED)**
```bash
git commit --no-verify
# Only use if you're 100% sure there are no secrets
```

**Lost your token?**
```bash
# Check your local files (these are safe, not in git)
cat .env.local
cat .dev.vars
```

---

Remember: **Secrets in .env.local and .dev.vars = Safe**
**Secrets in code or git commits = Leaked**
