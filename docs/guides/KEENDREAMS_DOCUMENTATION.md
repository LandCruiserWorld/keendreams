# KeenDreams Cloud Brain - Complete Documentation

## 🧠 Overview

KeenDreams is a cloud-based memory persistence system for development projects, providing seamless storage and retrieval of development "dreams" (project snapshots, conversations, and context).

## 🏗️ Architecture

### Core Components
- **Cloudflare Worker**: Main API server (`keendreams-worker.js`)
- **KV Storage**: Three namespaces for different data types
- **Authentication**: Dual support (X-API-Key + Bearer tokens)
- **Caching**: Edge-optimized with auto-warming

### KV Namespaces
- `DREAMS`: Primary dream storage for development sessions
- `PROJECTS`: Project metadata and structure tracking
- `KEENDREAMS_KV`: Performance caching and optimization

## 🔌 API Endpoints

### Core Endpoints
- `GET /stats` - System statistics and storage info
- `GET /projects` - List all projects with metadata
- `GET /dreams` - Paginated dream list with cursor support
- `GET /analyze-dreams` - Formatted dreams for script consumption
- `POST /dream` - Save new dream to storage

### Authentication
Supports both authentication methods:
```bash
# X-API-Key (preferred for scripts)
curl -H "X-API-Key: YOUR_API_KEY" https://your-worker.workers.dev/dreams

# Bearer Token (for web apps)
curl -H "Authorization: Bearer YOUR_API_KEY" https://your-worker.workers.dev/dreams
```

## 🛠️ Configuration

### wrangler.toml
```toml
name = "keendreams"
main = "keendreams-worker.js"
compatibility_date = "2024-01-01"

# KV Namespaces - Replace with your own IDs
[[kv_namespaces]]
binding = "DREAMS"
id = "your_dreams_kv_namespace_id"

[[kv_namespaces]]
binding = "PROJECTS"
id = "your_projects_kv_namespace_id"

# Performance cache
[[kv_namespaces]]
binding = "KEENDREAMS_KV"
id = "your_cache_kv_namespace_id"

# Cron trigger for cache warming
[triggers]
crons = ["*/5 * * * *"]
```

## 🚀 Deployment

### Prerequisites
- Cloudflare account with Workers enabled
- Wrangler CLI installed and authenticated

### Deploy Command
```bash
./deploy-keendreams.sh
```

### Deployment Script Features
- Authentication verification
- KV namespace validation
- Retry logic with exponential backoff
- Endpoint testing post-deployment
- Error handling and rollback

## 📊 Performance Features

### Edge Optimization
- **KV Caching**: 5-minute TTL for stats and projects
- **Cache Warming**: Scheduled every 5 minutes via cron
- **Circuit Breaker**: Prevents cascade failures
- **Rate Limiting**: 60 requests/minute per IP

### Reliability
- **Graceful Error Handling**: Silent failures with fallbacks
- **Dual Authentication**: Backward compatibility
- **Auto-retry**: Built-in retry logic
- **Health Checks**: Continuous monitoring

## 🔧 Client Integration

### CLI Script Usage
```bash
# Set environment variables
export KEENDREAMS_URL="https://your-worker.workers.dev"
export KEENDREAMS_API_KEY="your_api_key_here"

# Use the claude-dream.sh script
./scripts/claude-dream.sh dreams        # List all dreams
./scripts/claude-dream.sh projects      # List projects
./scripts/claude-dream.sh capture       # Save current state
```

### Direct API Usage
```javascript
// Fetch dreams
const response = await fetch('https://your-worker.workers.dev/analyze-dreams', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
});
const dreams = await response.json();

// Save dream
const dreamData = {
  title: "Project Update",
  description: "Added new feature",
  context: { /* project context */ }
};

await fetch('https://your-worker.workers.dev/dream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here'
  },
  body: JSON.stringify(dreamData)
});
```

## 📈 Monitoring & Analytics

### Statistics Available
- **Storage Usage**: Current usage and remaining capacity
- **Dream Count**: Total dreams (177+), average size, categories
- **Project Count**: Active projects (17+), development hours
- **Performance**: Cache hit rates, response times

### Health Check
```bash
curl https://your-worker.workers.dev/health
```

## 🔒 Security

### Authentication Security
- **HTTPS Only**: All communications encrypted in transit
- **Rate Limited**: Protection against brute force attacks
- **No Logging**: API keys never stored in logs
- **Stateless**: No server-side session storage

### Data Protection
- **Edge Storage**: Cloudflare's global KV network
- **Automatic Backups**: Built into KV storage
- **Version Control**: Deployment history maintained

## 🐛 Troubleshooting

### Common Issues

#### "Dreams not found"
- **Cause**: Wrong KV namespace binding
- **Solution**: Verify `DREAMS` namespace ID in wrangler.toml

#### "Authentication failed"
- **Cause**: Incorrect API key or missing headers
- **Solution**: Check X-API-Key header format

#### "500 Overloaded"
- **Cause**: Cloudflare API limits exceeded
- **Solution**: Rate limiting and retry logic automatically handles this

#### "Cache not updating"
- **Cause**: Cron trigger not working
- **Solution**: Check Cloudflare Workers cron configuration

### Debug Steps
1. Check worker deployment status: `wrangler worker list`
2. Verify KV namespaces: `wrangler kv namespace list`
3. Test endpoints: Use the deploy script's built-in tests
4. Monitor logs: `wrangler tail keendreams`

## 📝 API Response Formats

### Dreams Response
```json
[
  {
    "content": "Dream entry",
    "title": "Project Update",
    "timestamp": "2025-09-14T12:57:22Z",
    "date": "2025-09-14T12:57:22Z"
  }
]
```

### Stats Response
```json
{
  "storage": {
    "used": { "bytes": 190956, "mb": 0.18, "gb": 0.0002 },
    "remaining": { "bytes": 1073550868, "mb": 1023.82, "gb": 0.9998 },
    "percentage": "0.018"
  },
  "dreams": {
    "total": 177,
    "avgSize": 983,
    "projects": 17,
    "totalDevelopmentHours": 160.58,
    "categories": { "github": 170, "claude": 7, "chatgpt": 0 }
  }
}
```

## ✅ Production Readiness Checklist

- [x] **Performance**: Edge caching, rate limiting, circuit breakers
- [x] **Reliability**: Graceful error handling, retry logic, health checks
- [x] **Security**: HTTPS, authentication, no credential logging
- [x] **Monitoring**: Statistics, health endpoints, logging
- [x] **Documentation**: Complete API docs, deployment guides
- [x] **Testing**: Automated endpoint testing in deployment
- [x] **Scalability**: KV storage, edge distribution, cron optimization

## 🔄 Version History

### v2.0 (Current)
- ✅ Connected to real DREAMS KV namespace (177+ dreams restored)
- ✅ Dual authentication (X-API-Key + Bearer)
- ✅ Clean endpoint structure (removed unused endpoints)
- ✅ Silent error handling (no debug noise)
- ✅ Production-ready reliability features

### v1.0 (Legacy)
- Mock data implementation
- Bearer-only authentication
- Debug logging and error noise
- Incomplete endpoint coverage

---

**KeenDreams**: Where digital consciousness meets persistent memory. 🧠✨