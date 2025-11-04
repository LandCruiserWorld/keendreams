# KeenDreams API Documentation

## Overview

KeenDreams is a cloud-based development session tracking and semantic search API built on Cloudflare Workers. It provides persistent storage for development sessions ("dreams"), project context, and AI-powered semantic search capabilities using Cloudflare Vectorize with BGE-Base-EN-v1.5 embeddings (768 dimensions).

**Base URL**: `https://your-worker.YOUR-SUBDOMAIN.workers.dev`

**API Version**: 2.1

**Features**:
- Project and session tracking
- AI-powered semantic search
- Vector embeddings for dream content
- Similarity matching
- Cross-project pattern discovery
- Persistent development context

---

## Authentication

All API requests require a Bearer token in the `Authorization` header.

```http
Authorization: Bearer YOUR_API_KEY
```

**Example**:
```bash
curl "https://your-worker.workers.dev/health" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Endpoints

### Health & Status

#### `GET /health`

Check API health status.

**Parameters**: None

**Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T12:00:00.000Z"
}
```

**Example**:
```bash
curl "https://keendreams.terry-c67.workers.dev/health"
```

---

#### `GET /stats`

Get system statistics including vectorize metrics and storage usage.

**Parameters**: None

**Response**: `200 OK`
```json
{
  "totalDreams": 18,
  "totalProjects": 15,
  "storageUsed": "0.03MB",
  "developmentHours": 17.08,
  "vectorize": {
    "dimensions": 768,
    "model": "bge-base-en-v1.5",
    "metric": "cosine",
    "indexed": 18,
    "storageDimensions": 13824,
    "freeThresholds": {
      "storedDimensions": "5M (free tier)",
      "queriedDimensions": "30M/month (free tier)"
    }
  }
}
```

**Example**:
```bash
curl "https://keendreams.terry-c67.workers.dev/stats" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### Dream Management

#### `POST /dream`

Store a new development session (dream) with automatic embedding generation.

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_API_KEY`

**Request Body**:
```json
{
  "projectName": "my-api-project",
  "projectPath": "/Users/terry/my-api-project",
  "summary": "Implemented user authentication with JWT tokens",
  "techStack": ["Node.js", "Express", "PostgreSQL", "JWT"],
  "completedTasks": [
    "Created user registration endpoint",
    "Implemented JWT token generation",
    "Added password hashing with bcrypt"
  ],
  "nextSteps": [
    "Add refresh token mechanism",
    "Implement rate limiting"
  ],
  "keyDecisions": [
    "Chose JWT over sessions for scalability",
    "Used bcrypt with 12 salt rounds"
  ],
  "metadata": {
    "developmentHours": 3.5,
    "gitCommits": 7,
    "customNotes": "Need to add comprehensive tests"
  }
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "dreamId": "20251104_120000",
  "message": "Dream stored successfully",
  "hasEmbedding": true,
  "version": "2.1"
}
```

**Status Codes**:
- `201 Created` - Dream stored successfully
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid API key
- `500 Internal Server Error` - Server error

**Example**:
```bash
curl -X POST "https://keendreams.terry-c67.workers.dev/dream" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-api-project",
    "projectPath": "/Users/terry/my-api-project",
    "summary": "Implemented user authentication",
    "techStack": ["Node.js", "Express"],
    "completedTasks": ["Created auth endpoints"],
    "nextSteps": ["Add tests"]
  }'
```

---

### Project Management

#### `GET /projects`

List all projects with their dream counts and metadata.

**Parameters**: None

**Response**: `200 OK`
```json
{
  "projects": [
    {
      "name": "my-api-project",
      "path": "/Users/terry/my-api-project",
      "dreamCount": 5,
      "lastUpdated": "2025-11-04T10:30:00.000Z",
      "techStack": ["Node.js", "Express", "PostgreSQL"],
      "totalHours": 12.5
    }
  ],
  "totalProjects": 15,
  "totalDreams": 18
}
```

**Example**:
```bash
curl "https://keendreams.terry-c67.workers.dev/projects" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### Semantic Search

#### `GET /api/memory/search`

Search dreams by semantic similarity using natural language queries.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query (natural language) |
| `limit` | number | No | 10 | Number of results (1-100) |
| `minScore` | number | No | 0.5 | Minimum similarity score (0-1) |
| `projectPath` | string | No | - | Filter by specific project path |

**Response**: `200 OK`
```json
{
  "query": "authentication bug fix",
  "results": [
    {
      "dream": {
        "dreamId": "20251103_143000",
        "projectName": "my-api-project",
        "projectPath": "/Users/terry/my-api-project",
        "summary": "Fixed JWT token expiration issue",
        "techStack": ["Node.js", "Express", "JWT"],
        "completedTasks": ["Fixed token refresh logic"],
        "timestamp": "2025-11-03T14:30:00.000Z",
        "version": "2.1",
        "metadata": {
          "hasEmbedding": true
        }
      },
      "similarity": 0.89,
      "rank": 1
    },
    {
      "dream": {
        "dreamId": "20251101_092500",
        "projectName": "user-service",
        "summary": "Implemented OAuth2 authentication",
        "techStack": ["Node.js", "Passport"],
        "timestamp": "2025-11-01T09:25:00.000Z"
      },
      "similarity": 0.76,
      "rank": 2
    }
  ],
  "count": 2,
  "searchTime": 45,
  "cached": false
}
```

**Status Codes**:
- `200 OK` - Search successful
- `400 Bad Request` - Missing or invalid query parameter
- `401 Unauthorized` - Missing or invalid API key
- `500 Internal Server Error` - Search failed

**Example**:
```bash
# Basic search
curl "https://keendreams.terry-c67.workers.dev/api/memory/search?q=authentication+bug&limit=5" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Advanced search with filters
curl "https://keendreams.terry-c67.workers.dev/api/memory/search?q=react+hooks&limit=10&minScore=0.6&projectPath=/Users/terry/my-react-app" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

#### `GET /api/memory/similar/{dreamId}`

Find dreams similar to a specific dream by comparing embeddings.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dreamId` | string | Yes | Dream ID (format: YYYYMMDD_HHMMSS) |

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 5 | Number of similar dreams to return |

**Response**: `200 OK`
```json
{
  "dreamId": "20251103_143000",
  "results": [
    {
      "dream": {
        "dreamId": "20251102_101500",
        "projectName": "my-api-project",
        "summary": "Enhanced authentication middleware",
        "techStack": ["Node.js", "Express"],
        "timestamp": "2025-11-02T10:15:00.000Z"
      },
      "similarity": 0.94,
      "rank": 1
    },
    {
      "dream": {
        "dreamId": "20251030_163000",
        "projectName": "auth-service",
        "summary": "Implemented role-based access control",
        "techStack": ["Node.js", "Express", "PostgreSQL"],
        "timestamp": "2025-10-30T16:30:00.000Z"
      },
      "similarity": 0.82,
      "rank": 2
    }
  ],
  "count": 2
}
```

**Status Codes**:
- `200 OK` - Similar dreams found
- `404 Not Found` - Dream ID not found or has no embedding
- `401 Unauthorized` - Missing or invalid API key
- `500 Internal Server Error` - Search failed

**Example**:
```bash
curl "https://keendreams.terry-c67.workers.dev/api/memory/similar/20251103_143000?limit=3" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### Embedding Management

#### `POST /api/memory/encode`

Generate embedding vector for text (testing/debugging).

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_API_KEY`

**Request Body**:
```json
{
  "text": "Your text to embed"
}
```

**Response**: `200 OK`
```json
{
  "text": "Your text to embed",
  "embedding": [0.123, -0.456, 0.789, ...],
  "dimensions": 768,
  "model": "bge-base-en-v1.5"
}
```

**Status Codes**:
- `200 OK` - Embedding generated successfully
- `400 Bad Request` - Missing or empty text
- `401 Unauthorized` - Missing or invalid API key
- `500 Internal Server Error` - Encoding failed

**Example**:
```bash
curl -X POST "https://keendreams.terry-c67.workers.dev/api/memory/encode" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Implemented user authentication with JWT tokens"}'
```

---

#### `POST /api/memory/reindex`

Backfill embeddings for existing dreams that don't have them.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `onlyMissing` | boolean | No | false | Only process dreams without embeddings |

**Response**: `200 OK`
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

**Status Codes**:
- `200 OK` - Reindexing completed
- `401 Unauthorized` - Missing or invalid API key
- `500 Internal Server Error` - Reindexing failed

**Example**:
```bash
# Reindex all dreams
curl -X POST "https://keendreams.terry-c67.workers.dev/api/memory/reindex" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Only index dreams without embeddings
curl -X POST "https://keendreams.terry-c67.workers.dev/api/memory/reindex?onlyMissing=true" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Rate Limits

KeenDreams runs on Cloudflare's free tier with the following limits:

**Cloudflare Workers**:
- 100,000 requests/day
- 10ms CPU time per request

**Cloudflare Vectorize** (Free Tier):
- **Stored Dimensions**: 5,000,000 dimensions total
- **Queried Dimensions**: 30,000,000 dimensions/month
- **Current Usage**: ~13,824 dimensions (0.28% of limit)

**Response Caching**:
- Popular search queries cached for 1 hour (3600s)
- First search: ~500-1000ms
- Cached searches: <50ms

**Best Practices**:
- Use `minScore` parameter to reduce result set size
- Cache frequently used queries client-side
- Batch similar searches when possible
- Use `limit` parameter to control response size

---

## Common Use Cases

### 1. Resume Context for a Project

Find all previous work related to your current project:

```bash
curl "https://keendreams.terry-c67.workers.dev/api/memory/search?q=my-api-project&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### 2. Find Similar Bugs/Solutions

Search for how you solved similar problems:

```bash
curl "https://keendreams.terry-c67.workers.dev/api/memory/search?q=database+connection+timeout&minScore=0.6" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### 3. Tech Stack Discovery

Find all projects using specific technologies:

```bash
curl "https://keendreams.terry-c67.workers.dev/api/memory/search?q=react+typescript+hooks&limit=20" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### 4. Pattern Recognition

Discover recurring patterns in your development:

```bash
# Find all authentication-related work
curl "https://keendreams.terry-c67.workers.dev/api/memory/search?q=user+authentication+authorization&limit=15" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### 5. Session Continuity

Find sessions related to your last work:

```bash
# Get similar sessions to a specific dream
curl "https://keendreams.terry-c67.workers.dev/api/memory/similar/20251103_143000?limit=5" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## How Semantic Search Works

### Embedding Generation

1. **Text Combination**: Combines dream fields into searchable text:
   - Project summary
   - Tech stack
   - Completed tasks
   - Next steps
   - Key decisions
   - Custom notes

2. **Vectorization**: Converts text to 768-dimensional vector using BGE-Base-EN-v1.5

3. **Storage**: Vector stored in Cloudflare Vectorize index

### Similarity Matching

1. **Query Embedding**: User query converted to same 768-dimensional space
2. **Cosine Similarity**: Vectors compared using cosine similarity metric
3. **Ranking**: Results sorted by similarity score (0-1)
4. **Filtering**: Results filtered by `minScore` threshold

### What Gets Embedded

✅ **Included**:
- Project name and summary
- Tech stack
- Completed tasks and next steps
- Key decisions and notes
- Project metadata

❌ **Excluded**:
- Full conversation history
- Complete file contents
- Large git diffs
- Binary data

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional context (optional)"
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_REQUEST` | Missing or invalid parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 404 | `NOT_FOUND` | Dream or resource not found |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Temporary service disruption |

**Example Error Response**:
```json
{
  "error": "Invalid API key",
  "code": "UNAUTHORIZED",
  "details": "Authorization header must contain a valid Bearer token"
}
```

---

## Data Models

### Dream Object

```typescript
interface Dream {
  dreamId: string;                    // Format: YYYYMMDD_HHMMSS
  projectName: string;                // Project name
  projectPath: string;                // Absolute path to project
  summary: string;                    // Session summary
  techStack: string[];                // Technologies used
  completedTasks: string[];           // Tasks completed
  nextSteps: string[];                // Planned next steps
  keyDecisions: string[];             // Important decisions made
  timestamp: string;                  // ISO 8601 timestamp
  version: string;                    // Dream schema version (2.1)
  metadata: {
    developmentHours?: number;        // Hours spent
    gitCommits?: number;              // Number of commits
    hasEmbedding: boolean;            // Has vector embedding
    customNotes?: string;             // Additional notes
  }
}
```

### Search Result

```typescript
interface SearchResult {
  query: string;                      // Original search query
  results: Array<{
    dream: Dream;                     // Full dream object
    similarity: number;               // Similarity score (0-1)
    rank: number;                     // Result ranking
  }>;
  count: number;                      // Number of results
  searchTime: number;                 // Search time in ms
  cached: boolean;                    // Result from cache
}
```

---

## Integration Examples

### JavaScript/Node.js

```javascript
const KEENDREAMS_API_KEY = process.env.KEENDREAMS_API_KEY;
const BASE_URL = 'https://keendreams.terry-c67.workers.dev';

async function searchDreams(query, limit = 10) {
  const response = await fetch(
    `${BASE_URL}/api/memory/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${KEENDREAMS_API_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return await response.json();
}

async function storeDream(dream) {
  const response = await fetch(`${BASE_URL}/dream`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEENDREAMS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dream)
  });

  return await response.json();
}

// Usage
const results = await searchDreams('authentication bug', 5);
console.log(`Found ${results.count} related dreams`);
```

---

### Python

```python
import os
import requests

KEENDREAMS_API_KEY = os.getenv('KEENDREAMS_API_KEY')
BASE_URL = 'https://keendreams.terry-c67.workers.dev'

def search_dreams(query, limit=10, min_score=0.5):
    headers = {'Authorization': f'Bearer {KEENDREAMS_API_KEY}'}
    params = {'q': query, 'limit': limit, 'minScore': min_score}

    response = requests.get(
        f'{BASE_URL}/api/memory/search',
        headers=headers,
        params=params
    )
    response.raise_for_status()
    return response.json()

def store_dream(dream_data):
    headers = {
        'Authorization': f'Bearer {KEENDREAMS_API_KEY}',
        'Content-Type': 'application/json'
    }

    response = requests.post(
        f'{BASE_URL}/dream',
        headers=headers,
        json=dream_data
    )
    return response.json()

# Usage
results = search_dreams('react hooks', limit=5, min_score=0.6)
print(f"Found {results['count']} dreams")
```

---

### cURL Scripts

```bash
#!/bin/bash

KEENDREAMS_API_KEY="YOUR_API_KEY"
BASE_URL="https://keendreams.terry-c67.workers.dev"

# Search function
search_dreams() {
  local query=$1
  local limit=${2:-10}

  curl -s "${BASE_URL}/api/memory/search?q=${query}&limit=${limit}" \
    -H "Authorization: Bearer ${KEENDREAMS_API_KEY}" | jq '.'
}

# Store dream function
store_dream() {
  local dream_file=$1

  curl -s -X POST "${BASE_URL}/dream" \
    -H "Authorization: Bearer ${KEENDREAMS_API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"${dream_file}" | jq '.'
}

# Usage
search_dreams "authentication" 5
```

---

## Troubleshooting

### No Search Results

**Problem**: Search returns empty results

**Solutions**:
1. Lower `minScore` to 0.3 or 0.4
2. Use broader, more general search terms
3. Check if dreams have embeddings: `dream.metadata.hasEmbedding`
4. Run reindex: `POST /api/memory/reindex`

---

### Slow Search Performance

**Problem**: First search is slow (~500-1000ms)

**Expected Behavior**:
- First search: 500-1000ms (cold start)
- Subsequent searches: <50ms (cached)

**Solutions**:
- Searches are automatically cached for 1 hour
- Implement client-side caching for frequent queries
- Use `limit` parameter to reduce result processing

---

### Missing Embeddings

**Problem**: Dreams don't have embeddings

**Solution**:
```bash
# Reindex all dreams
curl -X POST "https://keendreams.terry-c67.workers.dev/api/memory/reindex" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Check stats
curl "https://keendreams.terry-c67.workers.dev/stats" \
  -H "Authorization: Bearer YOUR_API_KEY" | jq '.vectorize.indexed'
```

---

### Authentication Errors

**Problem**: 401 Unauthorized responses

**Solutions**:
1. Verify API key is correct
2. Check `Authorization` header format: `Bearer YOUR_API_KEY`
3. Ensure no extra spaces in header value
4. Verify key hasn't expired or been revoked

---

## Changelog

### Version 2.1 (Current)
- ✅ Added semantic search with Vectorize
- ✅ Automatic embedding generation on dream storage
- ✅ Similar dreams endpoint
- ✅ Reindexing capability
- ✅ Search result caching (1 hour)
- ✅ Enhanced stats endpoint with vectorize metrics

### Version 2.0
- Basic dream storage
- Project tracking
- Stats endpoint

---

## Support & Resources

**API Base URL**: `https://keendreams.terry-c67.workers.dev`

**Documentation**: This document

**Model**: Cloudflare BGE-Base-EN-v1.5 (768 dimensions, cosine similarity)

**Storage**: Cloudflare KV + Vectorize

**Cost**: Free forever (within Cloudflare free tier limits)

---

**Last Updated**: 2025-11-04
**API Version**: 2.1
**Documentation Version**: 1.0
