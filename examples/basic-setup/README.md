# Basic KeenDreams Setup Example

This example shows the **simplest possible setup** for KeenDreams.

## 📋 Prerequisites

- Cloudflare account (free tier works!)
- Wrangler CLI installed: `npm install -g wrangler`
- 5 minutes of your time

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/LandCruiserWorld/keendreams.git
cd keendreams
npm install
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This opens your browser to authenticate with Cloudflare.

### 3. Create KV Namespaces

```bash
# Create the three required namespaces
wrangler kv:namespace create "DREAMS"
wrangler kv:namespace create "PROJECTS"
wrangler kv:namespace create "KEENDREAMS_KV"
```

**Copy the IDs from the output!** You'll need them next.

### 4. Create Vectorize Index (for semantic search)

```bash
wrangler vectorize create keendreams-embeddings \
  --dimensions=768 \
  --metric=cosine
```

### 5. Configure wrangler.toml

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml` and replace the placeholder IDs with your actual IDs from steps 3 and 4.

### 6. Generate an API Key

```bash
# Generate a secure random key
openssl rand -hex 32
```

Copy this key - you'll use it for authentication.

### 7. Set the API Key as a Secret

```bash
wrangler secret put KEENDREAMS_API_KEY
```

Paste your API key when prompted.

### 8. Deploy!

```bash
wrangler deploy
```

## ✅ Verify Deployment

```bash
# Test the health endpoint (no auth required)
curl https://your-worker.workers.dev/health

# Test the stats endpoint (requires auth)
curl https://your-worker.workers.dev/stats \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 🎉 Success!

Your KeenDreams worker is now live on Cloudflare's global edge network!

## 📚 Next Steps

- Read the [API Documentation](../../docs/api/API.md)
- Learn about [Semantic Search](../../docs/guides/SEMANTIC_SEARCH.md)
- Explore [Advanced Configuration](../../docs/guides/DEPLOYMENT.md)

## 💰 Cost Estimate

With typical usage (< 1,000 dreams, < 10,000 searches/month):

- **Cloudflare Workers**: $0/month (free tier)
- **KV Storage**: $0/month (free tier)
- **Vectorize**: $0/month (free tier)
- **Total**: **$0/month** 🎉

## 🆘 Troubleshooting

### "Namespace not found"
Make sure you updated `wrangler.toml` with your actual namespace IDs from step 3.

### "Unauthorized"
Check that you set the API key secret in step 7: `wrangler secret put KEENDREAMS_API_KEY`

### "Module not found"
Run `npm install` in the project directory.

### Still stuck?
Open an [issue on GitHub](https://github.com/LandCruiserWorld/keendreams/issues)!
