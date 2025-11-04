# Cloudflare Deployment Guide for KeenDreams

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Account Setup](#account-setup)
3. [Installation & Configuration](#installation--configuration)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Cost Breakdown](#cost-breakdown)

---

## Prerequisites

### Required Tools & Accounts

**Before you begin, ensure you have:**

1. **Cloudflare Account** (Free tier is perfect!)
   - Sign up at [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
   - No credit card required for free tier

2. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should show v18.0.0 or higher
   ```

3. **npm** (comes with Node.js)
   ```bash
   npm --version  # Should show 8.0.0 or higher
   ```

4. **Git** (for cloning the repository)
   ```bash
   git --version
   ```

5. **Terminal/Command Line** access with basic bash knowledge

---

## Account Setup

### Step 1: Create Cloudflare Account

1. Visit [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Enter your email and create a password
3. Verify your email address
4. You're ready to go! (No billing info needed for free tier)

### Step 2: Navigate to Workers Dashboard

1. Log into [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Click on **"Workers & Pages"** in the left sidebar
3. You'll see your Workers dashboard (empty for now)

---

## Installation & Configuration

### Step 1: Install Wrangler CLI

Wrangler is Cloudflare's command-line tool for managing Workers.

```bash
npm install -g wrangler
```

**Verify installation:**
```bash
wrangler --version
```

You should see something like: `wrangler 3.x.x`

### Step 2: Login to Cloudflare via Wrangler

```bash
wrangler login
```

**What happens:**
1. Your browser will open automatically
2. You'll be asked to authorize Wrangler
3. Click "Allow" to grant access
4. You'll see "Successfully logged in!" in your terminal

### Step 3: Clone KeenDreams Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/keendreams.git
cd keendreams

# Install dependencies
npm install
```

---

## Deployment Steps

### Step 1: Create KV Namespaces

KV (Key-Value) storage is where KeenDreams stores your dreams and projects.

**Create the three required namespaces:**

```bash
# Create DREAMS namespace (stores all your development sessions)
wrangler kv:namespace create DREAMS

# Create PROJECTS namespace (stores project metadata)
wrangler kv:namespace create PROJECTS

# Create KEENDREAMS_KV namespace (caching layer)
wrangler kv:namespace create KEENDREAMS_KV
```

**Expected output for each command:**
```bash
🌀 Creating namespace with title "keendreams-DREAMS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "DREAMS", id = "abc123def456..." }
```

**IMPORTANT:** Copy these IDs! You'll need them in the next step.

### Step 2: Update wrangler.toml Configuration

Open `wrangler.toml` in your editor and replace the placeholder IDs with your actual namespace IDs from Step 1:

```toml
name = "keendreams"
main = "keendreams-worker.js"
compatibility_date = "2024-01-01"

# KV Namespaces - Replace with YOUR namespace IDs
[[kv_namespaces]]
binding = "DREAMS"
id = "YOUR_DREAMS_NAMESPACE_ID"        # ← Replace this

[[kv_namespaces]]
binding = "PROJECTS"
id = "YOUR_PROJECTS_NAMESPACE_ID"      # ← Replace this

[[kv_namespaces]]
binding = "KEENDREAMS_KV"
id = "YOUR_CACHE_NAMESPACE_ID"         # ← Replace this

# Cron trigger for cache warming (every 5 minutes)
[triggers]
crons = ["*/5 * * * *"]

# Performance settings
[build]
command = ""
watch_paths = ["keendreams-worker.js"]
```

**Example with real IDs:**
```toml
[[kv_namespaces]]
binding = "DREAMS"
id = "your_dreams_kv_namespace_id"  # Replace with actual ID from wrangler output

[[kv_namespaces]]
binding = "PROJECTS"
id = "your_projects_kv_namespace_id"  # Replace with actual ID from wrangler output

[[kv_namespaces]]
binding = "KEENDREAMS_KV"
id = "e40a223122d84df490d67e2631c1067b"
```

### Step 3: Create Vectorize Index

Vectorize powers the semantic search feature using AI embeddings.

```bash
wrangler vectorize create keendreams-index --dimensions=768 --metric=cosine
```

**Expected output:**
```bash
✨ Successfully created index 'keendreams-index'
📋 Index details:
   Dimensions: 768
   Metric: cosine
```

**Add to wrangler.toml:**
```toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "keendreams-index"
```

### Step 4: Set API Secret

Generate a secure API key for authentication:

```bash
# Generate a random API key
API_KEY=$(openssl rand -hex 32)
echo "Your API Key: $API_KEY"

# Save it to Wrangler secrets
echo $API_KEY | wrangler secret put API_SECRET
```

**IMPORTANT:** Save this API key somewhere safe! You'll need it to make API requests.

**Alternative: Use a custom API key**
```bash
# Set your own API key
wrangler secret put API_SECRET
# Then paste your desired API key when prompted
```

### Step 5: Deploy Your Worker

Now for the magic moment:

```bash
wrangler deploy
```

**Expected output:**
```bash
⛅️ wrangler 3.x.x
------------------
Total Upload: 45.67 KiB / gzip: 12.34 KiB
Uploaded keendreams (2.34 sec)
Published keendreams (0.56 sec)
  https://keendreams.YOUR-SUBDOMAIN.workers.dev
Current Deployment ID: abc-123-def-456
```

**Success!** Your KeenDreams API is now live at:
`https://keendreams.YOUR-SUBDOMAIN.workers.dev`

---

## Post-Deployment Configuration

### Step 1: Test Your Deployment

**Test the health endpoint:**
```bash
curl https://keendreams.YOUR-SUBDOMAIN.workers.dev/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T12:00:00.000Z"
}
```

**Test authenticated endpoint:**
```bash
curl "https://keendreams.YOUR-SUBDOMAIN.workers.dev/stats" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected response:**
```json
{
  "totalDreams": 0,
  "totalProjects": 0,
  "storageUsed": "0.00MB",
  "developmentHours": 0,
  "vectorize": {
    "dimensions": 768,
    "model": "bge-base-en-v1.5",
    "metric": "cosine",
    "indexed": 0
  }
}
```

### Step 2: Store Your First Dream

Create a test dream to verify everything works:

```bash
curl -X POST "https://keendreams.YOUR-SUBDOMAIN.workers.dev/dream" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "test-project",
    "projectPath": "/Users/you/test-project",
    "summary": "Testing KeenDreams deployment",
    "techStack": ["Cloudflare Workers", "Node.js"],
    "completedTasks": ["Deployed to Cloudflare", "Configured KV storage"],
    "nextSteps": ["Start using KeenDreams in real projects"]
  }'
```

**Expected response:**
```json
{
  "success": true,
  "dreamId": "20251104_120000",
  "message": "Dream stored successfully",
  "hasEmbedding": true,
  "version": "2.1"
}
```

### Step 3: Test Semantic Search

```bash
curl "https://keendreams.YOUR-SUBDOMAIN.workers.dev/api/memory/search?q=deployment&limit=5" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected response:**
```json
{
  "query": "deployment",
  "results": [
    {
      "dream": {
        "dreamId": "20251104_120000",
        "projectName": "test-project",
        "summary": "Testing KeenDreams deployment",
        "similarity": 0.89
      }
    }
  ],
  "count": 1,
  "searchTime": 45,
  "cached": false
}
```

### Step 4: Set Up Custom Domain (Optional)

If you want to use your own domain like `keendreams.yourdomain.com`:

1. **Add your domain to Cloudflare:**
   - Go to Cloudflare Dashboard
   - Click "Add a Site"
   - Enter your domain name
   - Update your nameservers

2. **Add custom route in wrangler.toml:**
   ```toml
   routes = [
     "keendreams.yourdomain.com/*"
   ]
   ```

3. **Redeploy:**
   ```bash
   wrangler deploy
   ```

4. **Create DNS record:**
   - Go to DNS settings for your domain
   - Add a CNAME record:
     - Name: `keendreams`
     - Target: `keendreams.YOUR-SUBDOMAIN.workers.dev`
     - Proxy: Enabled (orange cloud)

---

## Monitoring & Maintenance

### View Real-Time Logs

Watch your Worker's activity in real-time:

```bash
wrangler tail
```

**What you'll see:**
- Every request to your Worker
- Response status codes
- Error messages
- Performance metrics

**Example output:**
```bash
GET https://keendreams.YOUR-SUBDOMAIN.workers.dev/stats - Ok @ 11/4/2025, 12:34:56 PM
  Status: 200
  Duration: 45ms
```

**Filter specific events:**
```bash
# Only show errors
wrangler tail --status error

# Only show specific endpoint
wrangler tail --search "/api/memory/search"
```

### Monitor in Cloudflare Dashboard

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages**
3. Click your **keendreams** worker
4. You'll see:
   - **Requests** graph (last 24 hours)
   - **Errors** count
   - **CPU time** usage
   - **Success rate** percentage

### Check KV Storage Usage

```bash
# List all namespaces
wrangler kv:namespace list

# Check keys in a namespace
wrangler kv:key list --namespace-id=YOUR_DREAMS_NAMESPACE_ID

# Get a specific dream
wrangler kv:key get "dream:20251104_120000" --namespace-id=YOUR_DREAMS_NAMESPACE_ID
```

### Set Up Alerts (Optional)

1. In Cloudflare Dashboard, go to **Notifications**
2. Click **Add**
3. Select **Workers** alerts
4. Configure thresholds:
   - Error rate > 5%
   - CPU time > 80%
   - Request spike > 1000 req/min

---

## Troubleshooting

### Issue: "Error: You need to be logged in to perform this action"

**Solution:**
```bash
wrangler logout
wrangler login
```

### Issue: "Error: No namespace with id X found"

**Cause:** Wrong namespace ID in wrangler.toml

**Solution:**
1. List your namespaces:
   ```bash
   wrangler kv:namespace list
   ```
2. Copy the correct ID
3. Update `wrangler.toml`
4. Redeploy: `wrangler deploy`

### Issue: "Error 1101: Worker threw exception"

**Diagnosis:**
```bash
wrangler tail
```

**Common causes:**
- Missing environment variable
- Syntax error in worker code
- Missing KV binding

**Solution:**
1. Check logs for specific error
2. Verify all KV namespaces are bound
3. Ensure API_SECRET is set:
   ```bash
   wrangler secret list
   ```

### Issue: Semantic search returns no results

**Diagnosis:**
```bash
curl "https://keendreams.YOUR-SUBDOMAIN.workers.dev/stats" \
  -H "Authorization: Bearer YOUR_API_KEY" | jq '.vectorize.indexed'
```

**If indexed = 0:**
```bash
# Reindex all dreams
curl -X POST "https://keendreams.YOUR-SUBDOMAIN.workers.dev/api/memory/reindex" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Issue: "Error: API rate limit exceeded"

**Cause:** Too many requests in short time

**Solution:**
- Wait 1 minute and retry
- Implement caching in your client
- Use batch operations when possible

### Issue: Slow first request (cold start)

**This is normal!**
- First request: ~500-1000ms (worker warming up)
- Subsequent requests: <50ms

**To minimize:**
- Enable cron triggers (already configured)
- Use cache headers
- Keep worker warm with periodic health checks

### Issue: "Module not found" error

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Redeploy
wrangler deploy
```

### Getting Help

**Check deployment logs:**
```bash
wrangler tail --status error
```

**Validate configuration:**
```bash
wrangler deploy --dry-run
```

**View worker details:**
```bash
wrangler deployments list
```

**Cloudflare Support:**
- Community: [https://community.cloudflare.com](https://community.cloudflare.com)
- Docs: [https://developers.cloudflare.com/workers](https://developers.cloudflare.com/workers)
- Discord: [https://discord.gg/cloudflaredev](https://discord.gg/cloudflaredev)

---

## Cost Breakdown

### Cloudflare Free Tier Limits

**Workers:**
- ✅ **100,000 requests/day** (FREE)
- ✅ **10ms CPU time per request** (FREE)
- ✅ **Unlimited deployments** (FREE)

**KV Storage:**
- ✅ **1 GB storage** (FREE)
- ✅ **100,000 reads/day** (FREE)
- ✅ **1,000 writes/day** (FREE)
- ✅ **1,000 deletes/day** (FREE)

**Vectorize (AI Embeddings):**
- ✅ **5,000,000 stored dimensions** (FREE)
- ✅ **30,000,000 queried dimensions/month** (FREE)

### Typical Usage Examples

**Small Solo Developer:**
- 10 projects
- 50 dreams/month
- 100 searches/month

**Storage:**
- Dreams: ~50 KB × 50 = 2.5 MB
- Embeddings: 768 dims × 50 = 38,400 dimensions (0.77% of limit)
- **Cost: $0/month**

**Medium Team:**
- 50 projects
- 500 dreams/month
- 1,000 searches/month

**Storage:**
- Dreams: ~50 KB × 500 = 25 MB
- Embeddings: 768 dims × 500 = 384,000 dimensions (7.68% of limit)
- **Cost: $0/month**

**Large Organization:**
- 200 projects
- 2,000 dreams/month
- 10,000 searches/month

**Storage:**
- Dreams: ~50 KB × 2,000 = 100 MB
- Embeddings: 768 dims × 2,000 = 1,536,000 dimensions (30.7% of limit)
- **Cost: $0/month** (still within free tier!)

### When You'd Need Paid Plan

**Workers Paid ($5/month):**
- Only if you exceed:
  - 100,000 requests/day (~3M/month)
  - 10ms CPU time consistently

**KV Paid:**
- Only if you exceed:
  - 1 GB storage
  - 100,000 reads/day
  - 1,000 writes/day

**Vectorize Paid:**
- Only if you exceed:
  - 5,000,000 stored dimensions (~6,500 dreams)
  - 30,000,000 queried dimensions/month (~40,000 searches)

### Cost Projection

**For 99% of users:**
- **First year:** $0
- **Second year:** $0
- **Ongoing:** $0

**For heavy enterprise use (10,000+ dreams):**
- Workers: $0 (free tier sufficient)
- KV: $0 (free tier sufficient)
- Vectorize: $5/month (if exceeding 5M dimensions)

### Actual Costs vs. Alternatives

**KeenDreams on Cloudflare (Free):**
- Storage: FREE
- Compute: FREE
- AI Embeddings: FREE
- **Total: $0/month**

**AWS Equivalent:**
- Lambda: ~$15/month
- DynamoDB: ~$25/month
- SageMaker embeddings: ~$50/month
- **Total: ~$90/month**

**Azure Equivalent:**
- Functions: ~$20/month
- Cosmos DB: ~$30/month
- Cognitive Services: ~$40/month
- **Total: ~$90/month**

**Google Cloud Equivalent:**
- Cloud Functions: ~$18/month
- Firestore: ~$28/month
- Vertex AI: ~$45/month
- **Total: ~$91/month**

### Savings Summary

By using Cloudflare's free tier:
- **Monthly savings:** ~$90
- **Annual savings:** ~$1,080
- **5-year savings:** ~$5,400

**And you get:**
- Global edge network (300+ cities)
- Sub-50ms response times worldwide
- Automatic scaling
- DDoS protection
- 99.99% uptime SLA

---

## Next Steps

Now that you're deployed:

1. **Install CLI tools** - See [QUICKSTART.md](../QUICKSTART.md)
2. **Configure Git integration** - See [goodnight-git-workflow.md](./goodnight-git-workflow.md)
3. **Start capturing dreams** - Just code normally!
4. **Explore semantic search** - Find past solutions instantly
5. **Share with team** - Deploy for your whole organization

---

## Summary

**What you've accomplished:**
- ✅ Deployed KeenDreams to Cloudflare Workers
- ✅ Configured KV storage for dreams and projects
- ✅ Set up Vectorize for AI-powered semantic search
- ✅ Secured your API with authentication
- ✅ Tested all endpoints
- ✅ Set up monitoring and logging
- ✅ All on Cloudflare's **FREE tier**

**Your KeenDreams cloud brain is now immortal!** 🧠☁️

Every development session, every brilliant insight, every hard-won solution - all preserved, searchable, and instantly accessible across all your projects, forever.

---

**Questions?** Check the [troubleshooting](#troubleshooting) section or open an issue on GitHub.

**Ready to start?** Run your first capture:
```bash
dream capture
```

Welcome to persistent memory. Welcome to KeenDreams. 🚀
