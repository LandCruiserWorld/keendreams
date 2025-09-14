# 🚀 Deploy KeenDreams to Cloudflare

## Step 1: Create KV Namespaces
```bash
cd ~/claude-memory
npx wrangler kv:namespace create DREAMS
npx wrangler kv:namespace create PROJECTS
```

Copy the output IDs!

## Step 2: Update wrangler.toml
Replace these lines in `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "DREAMS"
id = "your_kv_namespace_id"          # ← Replace with DREAMS ID from Step 1
preview_id = "your_preview_kv_namespace_id"

[[kv_namespaces]]
binding = "PROJECTS"
id = "your_projects_kv_id"           # ← Replace with PROJECTS ID from Step 1
preview_id = "your_projects_preview_id"
```

## Step 3: Deploy!
```bash
npm run deploy
```

## Step 4: Test
Your dreams will be live at:
**https://keendreams.[your-subdomain].workers.dev**

## Step 5: Install Commands
```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

## 🎯 First Test
```bash
# In any project
dream init
dream capture
dream restore
```

---
That's it! Your dreams are now immortal in the cloud! 🌙