# 🧠 KeenDreams Semantic Search - Usage Guide

## Overview

Your KeenDreams cloud brain now has **AI-powered semantic search**! Search by meaning, not just keywords, using Cloudflare's BGE-Base-EN-v1.5 embedding model (768 dimensions).

---

## 🚀 Quick Start

### 1. Command Line Search

```bash
# Search for related work
/Users/terry/scripts/claude-keen-context.sh search "authentication bug" 5

# Find similar dreams
/Users/terry/scripts/claude-keen-context.sh similar "20250913_192325" 3
```

### 2. Direct API Calls

```bash
# Semantic search
curl "https://your-worker.workers.dev/api/memory/search?q=cloudflare+worker&limit=5" \
  -H "Authorization: Bearer ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa"

# Find similar dreams
curl "https://your-worker.workers.dev/api/memory/similar/DREAM_ID?limit=5" \
  -H "Authorization: Bearer ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa"

# Test encoding
curl -X POST "https://your-worker.workers.dev/api/memory/encode" \
  -H "Authorization: Bearer ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa" \
  -H "Content-Type: application/json" \
  -d '{"text":"Your text to embed"}'

# Reindex existing dreams
curl -X POST "https://your-worker.workers.dev/api/memory/reindex" \
  -H "Authorization: Bearer ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa"
```

### 3. Automatic Context Injection

The startup hook now automatically:
- Detects your current project context
- Performs semantic search for relevant dreams
- Injects results into CLAUDE.md

**How it works:**
1. Reads `package.json`, `README.md`, or git commits
2. Searches for related dreams (min similarity: 40%)
3. Shows top 5 most relevant sessions

---

## 📊 API Endpoints

### `GET /api/memory/search`

Search dreams by semantic similarity.

**Parameters:**
- `q` (required) - Search query
- `limit` (optional) - Number of results (default: 10)
- `minScore` (optional) - Minimum similarity (0-1, default: 0.5)
- `projectPath` (optional) - Filter by project path

**Example:**
```bash
curl "https://your-worker.workers.dev/api/memory/search?q=authentication+bug&limit=5&minScore=0.6" \
  -H "Authorization: Bearer $KEENDREAMS_API_KEY"
```

**Response:**
```json
{
  "query": "authentication bug",
  "results": [
    {
      "dream": { /* full dream data */ },
      "similarity": 0.89,
      "rank": 1
    }
  ],
  "count": 3,
  "searchTime": 45,
  "cached": false
}
```

---

### `GET /api/memory/similar/{dreamId}`

Find dreams similar to a specific dream.

**Parameters:**
- `dreamId` (required) - Dream ID in path
- `limit` (optional) - Number of results (default: 5)

**Example:**
```bash
curl "https://your-worker.workers.dev/api/memory/similar/20250913_192325?limit=3" \
  -H "Authorization: Bearer $KEENDREAMS_API_KEY"
```

**Response:**
```json
{
  "dreamId": "20250913_192325",
  "results": [
    {
      "dream": { /* full dream data */ },
      "similarity": 0.99,
      "rank": 1
    }
  ],
  "count": 3
}
```

---

### `POST /api/memory/reindex`

Backfill embeddings for existing dreams.

**Parameters:**
- `onlyMissing` (optional) - Only index dreams without embeddings (default: false)

**Example:**
```bash
curl -X POST "https://your-worker.workers.dev/api/memory/reindex?onlyMissing=true" \
  -H "Authorization: Bearer $KEENDREAMS_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "message": "Reindexed 9 dreams",
  "stats": {
    "processed": 9,
    "skipped": 0,
    "errors": 0,
    "total": 9
  }
}
```

---

### `POST /api/memory/encode`

Generate embedding for text (testing/debug).

**Body:**
```json
{
  "text": "Your text to embed"
}
```

**Response:**
```json
{
  "text": "Your text to embed...",
  "embedding": [0.123, -0.456, ...],
  "dimensions": 768,
  "model": "bge-base-en-v1.5"
}
```

---

## 🎯 Use Cases

### 1. Find Related Work
```bash
# "What else have I worked on like this?"
claude-keen-context.sh search "API endpoint development" 10
```

### 2. Discover Patterns
```bash
# Find all authentication-related work
claude-keen-context.sh search "user authentication" 20
```

### 3. Resume Similar Projects
```bash
# Find dreams similar to your last session
claude-keen-context.sh similar "$(ls -t ~/.keendreams/dreams/*.json | head -1 | xargs basename .json)"
```

### 4. Debug Issues
```bash
# Find when you fixed similar bugs
claude-keen-context.sh search "database connection timeout" 5
```

---

## 🧠 How Semantic Search Works

1. **Embedding Generation**: Converts dream text to 768-dimensional vector
2. **Text Combination**: Combines summary, tech stack, tasks, and decisions
3. **Similarity Matching**: Uses cosine similarity to find related dreams
4. **Caching**: Popular queries cached for 1 hour (3600s)

**What gets embedded:**
- Project summary
- Tech stack
- Completed tasks
- Next steps
- Key decisions
- Custom notes

**What doesn't:**
- Full conversation history
- File contents
- Git diffs

---

## 📈 Stats & Monitoring

### Check Vectorize Stats
```bash
curl "https://your-worker.workers.dev/stats" \
  -H "Authorization: Bearer $KEENDREAMS_API_KEY" | jq '.vectorize'
```

**Output:**
```json
{
  "dimensions": 768,
  "model": "bge-base-en-v1.5",
  "metric": "cosine",
  "indexed": 9,
  "storageDimensions": 6912,
  "freeThresholds": {
    "storedDimensions": "5M (free tier)",
    "queriedDimensions": "30M/month (free tier)"
  }
}
```

### Current Usage
- **Indexed Dreams**: 9
- **Storage Used**: 6,912 dimensions (0.14% of free tier)
- **Cost**: $0 forever

---

## 🔧 Troubleshooting

### No Results Found
- Lower `minScore` to 0.3 or 0.4
- Try broader search terms
- Check if dreams have embeddings: `dream.metadata.hasEmbedding`

### Slow Searches
- First search is slower (~500-1000ms)
- Subsequent searches cached (<50ms)
- Clear cache: wait 1 hour or restart worker

### Reindex Failures
```bash
# Check for errors
curl -X POST "https://your-worker.workers.dev/api/memory/reindex" \
  -H "Authorization: Bearer $KEENDREAMS_API_KEY" | jq '.stats.errors'
```

---

## 🎓 Examples

### Example 1: Resume Context
```bash
# You're working on a project and want to remember what you did last time
cd /Users/terry/my-project
claude-keen-context.sh search "$(basename $(pwd))" 5
```

### Example 2: Tech Stack Search
```bash
# Find all projects using React
claude-keen-context.sh search "react typescript hooks" 10
```

### Example 3: Problem Solving
```bash
# Remember how you fixed a similar issue
claude-keen-context.sh search "CORS error cloudflare workers" 3
```

### Example 4: Similar Sessions
```bash
# Find sessions related to your most productive day
claude-keen-context.sh similar "20250913_185730"
```

---

## 🚀 Advanced Usage

### Combine with jq for Formatting
```bash
# Get just project names and similarity scores
claude-keen-context.sh search "development" 5 | \
  jq -r '.results[] | "\(.dream.projectName) - \(.similarity * 100 | floor)%"'
```

### Filter by Minimum Score
```bash
# Only show highly relevant results (>70% similarity)
claude-keen-context.sh search "authentication" 20 0.7
```

### Project-Scoped Search
```bash
# Search within a specific project
curl "https://your-worker.workers.dev/api/memory/search?q=bug+fix&projectPath=/Users/terry/my-project" \
  -H "Authorization: Bearer $KEENDREAMS_API_KEY"
```

---

## 📝 Notes

- **Auto-Embedding**: New dreams automatically get embeddings on save
- **Version**: Dreams with embeddings have `version: "2.1"` and `hasEmbedding: true`
- **Model**: BGE-Base-EN-v1.5 (768 dimensions, cosine similarity)
- **Privacy**: All processing happens on Cloudflare's edge (no external APIs)
- **Cost**: Free forever (well within free tier limits)

---

**Generated**: 2025-11-04
**KeenDreams Version**: 2.1 (with semantic search)
**Vectorize Index**: keendreams-embeddings
