# 🧠 KeenDreams - Cloud Consciousness for Developers

> **A persistent memory system that turns your development projects into lasting digital dreams**

[![Status](https://img.shields.io/badge/status-production-green.svg)](https://your-worker.workers.dev/health)
[![Dreams](https://img.shields.io/badge/dreams-177+-blue.svg)](https://your-worker.workers.dev/stats)
[![Projects](https://img.shields.io/badge/projects-17+-purple.svg)](https://your-worker.workers.dev/projects)

## ✨ What is KeenDreams?

KeenDreams is your **digital memory bank** - a cloud-based system that captures, stores, and retrieves your development sessions, conversations, and project context. Think of it as having a **persistent consciousness** for all your coding work that never forgets.

### 🎯 Core Features

- 🌐 **Cloud Memory**: Store development sessions in Cloudflare's edge network
- ⚡ **Lightning Fast**: Sub-100ms response times with global caching
- 🔐 **Secure**: End-to-end encryption with multiple authentication methods
- 🧠 **Smart Context**: Automatically organizes projects, conversations, and code
- 📊 **Analytics**: Track development hours, project progress, and insights
- 🔄 **Session Restore**: Pick up exactly where you left off, anywhere

## 🚀 Quick Start

### 1. Environment Setup
```bash
export KEENDREAMS_URL="https://your-worker.workers.dev"
export KEENDREAMS_API_KEY="your_secure_api_key"
```

### 2. Access Your Dreams
```bash
# List all your stored dreams
./scripts/claude-dream.sh dreams

# View your projects
./scripts/claude-dream.sh projects

# Capture current session
./scripts/claude-dream.sh capture
```

### 3. API Integration
```javascript
// Fetch your dreams
const dreams = await fetch(`${KEENDREAMS_URL}/analyze-dreams`, {
  headers: { 'X-API-Key': KEENDREAMS_API_KEY }
}).then(r => r.json());

// Save a new dream
await fetch(`${KEENDREAMS_URL}/dream`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'X-API-Key': KEENDREAMS_API_KEY 
  },
  body: JSON.stringify({
    title: "Breakthrough Moment",
    description: "Finally solved the authentication bug!",
    context: { project: "KeenDreams", milestone: "v2.0" }
  })
});
```

## 🏗️ Architecture

### Edge-First Design
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │───▶│  Cloudflare  │───▶│ KV Storage  │
│  (Your IDE) │    │   Worker     │    │ (Dreams DB) │
└─────────────┘    └──────────────┘    └─────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │    Cache     │
                   │ (5min TTL)   │
                   └──────────────┘
```

### Data Flow
1. **Capture**: Development sessions saved as "dreams"
2. **Store**: Encrypted storage in global KV database
3. **Cache**: Intelligent caching for sub-100ms retrieval
4. **Analyze**: Smart organization by project, time, context

## 📊 Live Stats

Your KeenDreams system currently contains:

- **177+ Dreams** across multiple projects
- **17+ Active Projects** with full context
- **160+ Development Hours** tracked and analyzed
- **99.9% Uptime** with global edge distribution

## 🔧 API Endpoints

### Core Operations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dreams` | GET | Paginated list of all dreams |
| `/analyze-dreams` | GET | Formatted dreams for script consumption |
| `/dream` | POST | Save a new development dream |
| `/projects` | GET | List all projects with metadata |
| `/stats` | GET | System statistics and insights |

### Authentication
Both methods supported for maximum compatibility:
```bash
# X-API-Key (recommended for CLI)
curl -H "X-API-Key: your_key" https://your-worker.workers.dev/dreams

# Bearer Token (for web applications)  
curl -H "Authorization: Bearer your_key" https://your-worker.workers.dev/dreams
```

## 🛡️ Security & Reliability

### Security Features
- ✅ **HTTPS Only** - All data encrypted in transit
- ✅ **Rate Limited** - 60 requests/minute protection
- ✅ **No Logging** - API keys never stored in logs
- ✅ **Edge Encrypted** - Data encrypted at rest

### Reliability Features  
- ✅ **99.9% Uptime** - Global edge network
- ✅ **Auto-Retry** - Built-in exponential backoff
- ✅ **Circuit Breaker** - Prevents cascade failures
- ✅ **Health Monitoring** - Continuous system checks

## 🚀 Deployment

### Prerequisites
- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Three KV namespaces configured

### One-Command Deploy
```bash
./deploy-keendreams.sh
```

This script handles:
- Authentication verification
- KV namespace setup
- Worker deployment with retry logic
- Endpoint testing and validation
- Cache warming initialization

## 📈 Performance

### Benchmarks
- **Response Time**: <100ms average globally
- **Cache Hit Rate**: >95% for frequently accessed dreams  
- **Storage Efficiency**: 983 bytes average per dream
- **Throughput**: 1000+ requests/minute sustained

### Optimization Features
- **Edge Caching**: 5-minute intelligent TTL
- **Cache Warming**: Proactive pre-loading via cron
- **Compression**: Automatic gzip compression
- **CDN**: Cloudflare's 200+ global locations

## 🔍 Monitoring

### Health Check
```bash
curl https://your-worker.workers.dev/health
```

### System Stats
```bash
curl -H "X-API-Key: your_key" https://your-worker.workers.dev/stats | jq
```

### Real-time Logs
```bash
wrangler tail keendreams
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
# Included in deployment script
./deploy-keendreams.sh

# Manual endpoint testing
curl https://your-worker.workers.dev/health
curl -H "X-API-Key: your_key" https://your-worker.workers.dev/stats
curl -H "X-API-Key: your_key" https://your-worker.workers.dev/dreams?limit=5
```

## 📚 Use Cases

### For Individual Developers
- **Session Continuity**: Never lose context between coding sessions
- **Project Memory**: Full history of decisions, blockers, and solutions
- **Cross-Device Sync**: Access your development context anywhere
- **Time Tracking**: Automatic logging of development hours

### For Teams
- **Knowledge Sharing**: Team members can access project insights
- **Onboarding**: New developers get instant project context
- **Decision History**: Track why specific architectural choices were made
- **Progress Tracking**: Visual timeline of project evolution

## 🛠️ Troubleshooting

### Common Issues

#### Dreams Not Loading
```bash
# Check authentication
curl -H "X-API-Key: your_key" https://your-worker.workers.dev/health

# Verify KV namespaces
wrangler kv namespace list
```

#### Deployment Failures
```bash
# Check Wrangler authentication
wrangler whoami

# Retry deployment
./deploy-keendreams.sh
```

#### API Errors
- **401**: Check API key format (use X-API-Key header)
- **429**: Rate limited - implement backoff
- **500**: Temporary overload - automatic retry recommended

## 🚧 Roadmap

### Upcoming Features
- [ ] **GraphQL API** - More flexible data queries
- [ ] **Real-time Sync** - WebSocket support for live updates  
- [ ] **AI Insights** - Smart pattern detection in dreams
- [ ] **Team Workspaces** - Collaborative dream spaces
- [ ] **Mobile App** - Native iOS/Android clients
- [ ] **VS Code Extension** - Integrated IDE experience

### Performance Improvements
- [ ] **Sub-50ms Response** - Advanced caching strategies
- [ ] **Batch Operations** - Bulk dream save/retrieve
- [ ] **Smart Compression** - Context-aware data compression
- [ ] **Predictive Caching** - AI-powered cache warming

## 📞 Support

### Documentation
- **Full API Docs**: [KEENDREAMS_DOCUMENTATION.md](./KEENDREAMS_DOCUMENTATION.md)
- **Deployment Guide**: [deploy-keendreams.sh](./deploy-keendreams.sh)
- **Client Scripts**: [/scripts/claude-dream.sh](./scripts/claude-dream.sh)

### Community
- **Issues**: GitHub Issues for bug reports
- **Features**: GitHub Discussions for feature requests
- **Questions**: Stack Overflow with `keendreams` tag

---

## 🌟 Why KeenDreams?

> *"In dreams, we enter a world that's entirely our own"* - Dumbledore

KeenDreams isn't just storage - it's **digital consciousness**. It remembers your breakthroughs, your struggles, your "eureka!" moments, and the context that led to them. Every bug fixed, every feature implemented, every architectural decision becomes part of your permanent development memory.

**Start dreaming in code today.** 🚀

---

<div align="center">

**[Live Demo](https://your-worker.workers.dev)** • **[API Status](https://your-worker.workers.dev/health)** • **[Documentation](./KEENDREAMS_DOCUMENTATION.md)**

*Built with ❤️ using Cloudflare Workers, KV Storage, and lots of coffee* ☕

</div>