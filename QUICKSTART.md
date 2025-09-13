# 🚀 KeenDreams Quick Setup

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Create KV Namespaces
```bash
# Run these commands and save the IDs:
npx wrangler kv:namespace create DREAMS
npx wrangler kv:namespace create PROJECTS
```

## Step 3: Update wrangler.toml
Replace the placeholder IDs with your actual IDs from Step 2:
- `your_kv_namespace_id` → Your DREAMS namespace ID
- `your_projects_kv_id` → Your PROJECTS namespace ID

## Step 4: Deploy to Cloudflare
```bash
npx wrangler deploy
```

Your worker will be available at:
`https://keendreams.[your-subdomain].workers.dev`

## Step 5: Install Dream Commands
```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

## Step 6: Test It!
```bash
# In any project:
dream init              # Start dream tracking
echo "Test" > test.txt  # Make a change
dream capture           # Save your dream
dream restore           # Restore it
```

## 🎯 Daily Commands
- `wake` - Start your day, restore context
- `dj` - Update dream journal during work  
- `goodnight` - Save everything before leaving

## 🌙 Your URL
Once deployed, your dreams live at:
**https://keendreams.[your-cloudflare-subdomain].workers.dev**

---
That's it! Your dreams are now persistent. 🌙