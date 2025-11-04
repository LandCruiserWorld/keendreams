# KeenDreams Template Guide

**Production-ready Cloudflare Workers semantic search starter. Fork it and make it yours!**

## What You Get Out of the Box

This project provides a complete, production-ready semantic search system built on Cloudflare's edge infrastructure:

### Core Infrastructure
- **Cloudflare Workers**: Serverless edge computing for global low-latency
- **Vectorize**: Native vector database for semantic search
- **KV Storage**: Fast key-value storage for metadata and raw content
- **AI Embeddings**: OpenAI's text-embedding-3-small (1536 dimensions)
- **Deployment Automation**: Wrangler-based CI/CD ready setup

### Pre-built Features
- Semantic search with cosine similarity
- Automatic embedding generation
- Metadata filtering and enrichment
- Cross-session context tracking
- RESTful API endpoints
- Error handling and validation
- CORS support

### Development Tools
- TypeScript with full type safety
- Local development environment
- Testing utilities
- Deployment scripts
- Environment management

---

## How to Adapt This for Your Project

### 1. Fork and Setup

```bash
# Fork the repository
git clone https://github.com/yourusername/keendreams-fork my-semantic-search
cd my-semantic-search

# Install dependencies
npm install

# Copy environment template
cp .dev.vars.example .dev.vars

# Add your OpenAI API key
echo "OPENAI_API_KEY=sk-your-key-here" >> .dev.vars
```

### 2. Customize the Data Model

The core data structure is in `src/types.ts`. Modify it for your use case:

```typescript
// Original: Dream entries
export interface DreamEntry {
  id: string;
  content: string;
  timestamp: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

// Example: Article knowledge base
export interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  tags: string[];
  category: string;
  metadata?: Record<string, any>;
}

// Example: Customer support tickets
export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  customerId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
```

### 3. Update API Endpoints

Modify `src/index.ts` to match your domain:

```typescript
// Original: Dream endpoints
router.post('/api/dreams', handleStoreDream);
router.get('/api/dreams/search', handleSearchDreams);
router.get('/api/dreams/:id', handleGetDream);

// Example: Article endpoints
router.post('/api/articles', handleStoreArticle);
router.get('/api/articles/search', handleSearchArticles);
router.get('/api/articles/:id', handleGetArticle);
router.get('/api/articles/category/:category', handleGetByCategory);
```

### 4. Customize Search Logic

Update the embedding generation to match your content structure:

```typescript
// Original: Search dream content
async function generateEmbedding(content: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content,
  });
  return response.data[0].embedding;
}

// Example: Search article with title boost
async function generateArticleEmbedding(article: Article): Promise<number[]> {
  // Combine title (weighted 2x) with content
  const searchableContent = `${article.title} ${article.title} ${article.content}`;

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: searchableContent,
  });
  return response.data[0].embedding;
}

// Example: Multi-field support ticket search
async function generateTicketEmbedding(ticket: SupportTicket): Promise<number[]> {
  const searchableContent = [
    ticket.subject,
    ticket.description,
    ticket.tags.join(' '),
    ticket.priority,
  ].join(' ');

  return generateEmbedding(searchableContent);
}
```

### 5. Deploy to Your Cloudflare Account

```bash
# Login to Cloudflare
npx wrangler login

# Create Vectorize index
npx wrangler vectorize create my-vectors --dimensions=1536 --metric=cosine

# Create KV namespace
npx wrangler kv:namespace create "MY_DATA"

# Update wrangler.toml with your account details
# Then deploy
npx wrangler deploy
```

---

## Common Adaptations

### 1. Knowledge Base / Documentation Search

**Use Case**: Internal wiki, documentation site, help center

**Modifications**:
```typescript
interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  author: string;
  viewCount: number;
  helpfulCount: number;
}

// Enhanced search with category filtering
async function searchKnowledge(
  query: string,
  category?: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const queryVector = await generateEmbedding(query);

  const results = await env.VECTORIZE.query(queryVector, {
    topK: limit,
    filter: category ? { category } : undefined,
  });

  return results.matches.map(match => ({
    ...match,
    article: await env.KV.get(`article:${match.id}`, 'json'),
  }));
}
```

**API Endpoints**:
- `POST /api/articles` - Add new article
- `GET /api/articles/search?q=query&category=setup` - Semantic search
- `GET /api/articles/:id` - Get specific article
- `PUT /api/articles/:id/helpful` - Mark as helpful

### 2. Personal Note-Taking / Second Brain

**Use Case**: Personal knowledge management, Obsidian alternative

**Modifications**:
```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  linkedNotes: string[]; // IDs of related notes
  createdAt: string;
  updatedAt: string;
  folder: string;
}

// Bidirectional linking
async function linkNotes(noteId: string, linkedNoteIds: string[]) {
  const note = await env.KV.get(`note:${noteId}`, 'json');
  note.linkedNotes = [...new Set([...note.linkedNotes, ...linkedNoteIds])];

  await env.KV.put(`note:${noteId}`, JSON.stringify(note));

  // Update backlinks
  for (const linkedId of linkedNoteIds) {
    const linkedNote = await env.KV.get(`note:${linkedId}`, 'json');
    if (!linkedNote.linkedNotes.includes(noteId)) {
      linkedNote.linkedNotes.push(noteId);
      await env.KV.put(`note:${linkedId}`, JSON.stringify(linkedNote));
    }
  }
}

// Find similar notes automatically
async function findSimilarNotes(noteId: string, limit: number = 5) {
  const note = await env.KV.get(`note:${noteId}`, 'json');
  const embedding = await generateEmbedding(note.content);

  const results = await env.VECTORIZE.query(embedding, {
    topK: limit + 1, // +1 to exclude self
    filter: { id: { $ne: noteId } },
  });

  return results.matches.slice(0, limit);
}
```

### 3. Customer Support Ticket Search

**Use Case**: Help desk, customer service platform

**Modifications**:
```typescript
interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  customerId: string;
  customerEmail: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'pending' | 'resolved' | 'closed';
  assignedTo?: string;
  category: string;
  tags: string[];
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

// Search with priority and status filters
async function searchTickets(
  query: string,
  filters: {
    priority?: string[];
    status?: string[];
    assignedTo?: string;
  } = {}
): Promise<SupportTicket[]> {
  const queryVector = await generateEmbedding(query);

  const vectorFilter: any = {};
  if (filters.priority?.length) {
    vectorFilter.priority = { $in: filters.priority };
  }
  if (filters.status?.length) {
    vectorFilter.status = { $in: filters.status };
  }
  if (filters.assignedTo) {
    vectorFilter.assignedTo = filters.assignedTo;
  }

  const results = await env.VECTORIZE.query(queryVector, {
    topK: 20,
    filter: Object.keys(vectorFilter).length > 0 ? vectorFilter : undefined,
  });

  return Promise.all(
    results.matches.map(m =>
      env.KV.get(`ticket:${m.id}`, 'json')
    )
  );
}

// Find duplicate tickets
async function findDuplicateTickets(ticket: SupportTicket, threshold: number = 0.85) {
  const embedding = await generateEmbedding(
    `${ticket.subject} ${ticket.description}`
  );

  const results = await env.VECTORIZE.query(embedding, {
    topK: 10,
    filter: {
      id: { $ne: ticket.id },
      status: { $in: ['open', 'assigned', 'pending'] }
    },
  });

  return results.matches.filter(m => m.score >= threshold);
}
```

### 4. Code Search / Snippet Library

**Use Case**: Code examples, snippet management, internal code search

**Modifications**:
```typescript
interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  framework?: string;
  author: string;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
}

// Language-specific embedding
async function generateCodeEmbedding(snippet: CodeSnippet): Promise<number[]> {
  // Combine natural language description with code structure
  const searchableContent = `
    ${snippet.title}
    ${snippet.description}
    Language: ${snippet.language}
    ${snippet.framework ? `Framework: ${snippet.framework}` : ''}
    Tags: ${snippet.tags.join(', ')}
    Code structure: ${extractCodeStructure(snippet.code)}
  `.trim();

  return generateEmbedding(searchableContent);
}

// Extract meaningful code structure
function extractCodeStructure(code: string): string {
  // Extract function names, class names, imports
  const functionNames = code.match(/function\s+(\w+)/g) || [];
  const classNames = code.match(/class\s+(\w+)/g) || [];
  const imports = code.match(/import\s+.*from\s+['"](.+)['"]/g) || [];

  return [...functionNames, ...classNames, ...imports].join(' ');
}

// Search by language and framework
async function searchCode(
  query: string,
  language?: string,
  framework?: string
) {
  const queryVector = await generateEmbedding(query);

  const filter: any = {};
  if (language) filter.language = language;
  if (framework) filter.framework = framework;

  const results = await env.VECTORIZE.query(queryVector, {
    topK: 15,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });

  return results.matches;
}
```

---

## Code Walkthrough

### Worker Entry Point (`src/index.ts`)

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Parse request
    const url = new URL(request.url);
    const path = url.pathname;

    // 2. Route to handler
    if (path === '/api/store' && request.method === 'POST') {
      return handleStore(request, env);
    }

    if (path === '/api/search' && request.method === 'GET') {
      return handleSearch(request, env);
    }

    // 3. Return 404
    return new Response('Not Found', { status: 404 });
  }
};
```

**Customization Points**:
- Add authentication middleware
- Implement rate limiting
- Add request validation
- Custom error handling
- Logging and monitoring

### Embedding Generation (`src/embeddings.ts`)

```typescript
async function generateEmbedding(
  text: string,
  env: Env
): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // 1536 dimensions
    input: text.substring(0, 8191), // Token limit
  });

  return response.data[0].embedding;
}
```

**Customization Points**:
- Switch to `text-embedding-3-large` (3072 dimensions)
- Use different providers (Cohere, Voyage AI)
- Implement chunking for long content
- Add caching for repeated embeddings
- Batch processing for multiple items

### Vector Storage (`src/vectorize.ts`)

```typescript
async function storeVector(
  id: string,
  vector: number[],
  metadata: Record<string, any>,
  env: Env
): Promise<void> {
  await env.VECTORIZE.upsert([
    {
      id,
      values: vector,
      metadata,
    }
  ]);
}

async function searchVectors(
  queryVector: number[],
  options: {
    topK?: number;
    filter?: Record<string, any>;
  },
  env: Env
): Promise<VectorizeMatch[]> {
  const results = await env.VECTORIZE.query(queryVector, {
    topK: options.topK || 10,
    filter: options.filter,
    returnMetadata: true,
  });

  return results.matches;
}
```

**Customization Points**:
- Add namespace support
- Implement soft deletes
- Add versioning
- Batch upserts for performance
- Custom scoring functions

### Search Implementation (`src/search.ts`)

```typescript
async function semanticSearch(
  query: string,
  options: SearchOptions,
  env: Env
): Promise<SearchResult[]> {
  // 1. Generate query embedding
  const queryVector = await generateEmbedding(query, env);

  // 2. Search vector database
  const vectorMatches = await searchVectors(queryVector, {
    topK: options.limit || 10,
    filter: options.filter,
  }, env);

  // 3. Fetch full content from KV
  const results = await Promise.all(
    vectorMatches.map(async (match) => {
      const content = await env.KV.get(`item:${match.id}`, 'json');
      return {
        id: match.id,
        score: match.score,
        content,
        metadata: match.metadata,
      };
    })
  );

  // 4. Post-process and rank
  return results
    .filter(r => r.score >= (options.threshold || 0.7))
    .sort((a, b) => b.score - a.score);
}
```

**Customization Points**:
- Hybrid search (semantic + keyword)
- Reranking with cross-encoders
- Query expansion
- Result clustering
- Personalized ranking

### KV Data Structure

```typescript
// Primary storage pattern
await env.KV.put(`item:${id}`, JSON.stringify(item));

// Index patterns
await env.KV.put(`index:user:${userId}`, JSON.stringify(itemIds));
await env.KV.put(`index:category:${category}`, JSON.stringify(itemIds));
await env.KV.put(`index:date:${date}`, JSON.stringify(itemIds));

// Metadata
await env.KV.put(`meta:stats`, JSON.stringify({ totalItems, lastUpdated }));

// Cache
await env.KV.put(`cache:search:${queryHash}`, JSON.stringify(results), {
  expirationTtl: 3600, // 1 hour
});
```

**Customization Points**:
- Add expiration policies
- Implement versioning
- Create composite indexes
- Add compression
- Implement sharding

---

## Customization Points

### 1. Change Embedding Model

```typescript
// OpenAI text-embedding-3-large (better quality, higher cost)
const response = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: text,
  dimensions: 3072, // Update Vectorize index
});

// Cohere embed-english-v3.0
import { CohereClient } from 'cohere-ai';
const cohere = new CohereClient({ token: env.COHERE_API_KEY });

const response = await cohere.embed({
  texts: [text],
  model: 'embed-english-v3.0',
  inputType: 'search_document',
});

// Voyage AI voyage-large-2
const response = await fetch('https://api.voyageai.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.VOYAGE_API_KEY}`,
  },
  body: JSON.stringify({
    input: text,
    model: 'voyage-large-2',
  }),
});
```

### 2. Adjust Similarity Thresholds

```typescript
// Strict matching (high precision, lower recall)
const THRESHOLD = 0.85;

// Balanced
const THRESHOLD = 0.75;

// Loose matching (lower precision, higher recall)
const THRESHOLD = 0.65;

// Dynamic threshold based on query length
function getThreshold(query: string): number {
  const words = query.split(' ').length;
  if (words <= 3) return 0.8; // Short queries need higher similarity
  if (words <= 7) return 0.75;
  return 0.7; // Longer queries can be more lenient
}
```

### 3. Add Custom Metadata

```typescript
interface CustomMetadata {
  // Time-based
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;

  // User-based
  userId: string;
  teamId?: string;
  permissions: string[];

  // Content-based
  language: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  topics: string[];

  // Analytics
  viewCount: number;
  searchCount: number;
  lastAccessed: string;

  // Custom fields
  [key: string]: any;
}

// Filter by metadata
const results = await env.VECTORIZE.query(queryVector, {
  topK: 10,
  filter: {
    userId: currentUserId,
    language: 'en',
    expiresAt: { $gt: new Date().toISOString() },
  },
});
```

### 4. Implement Different Search Algorithms

```typescript
// Hybrid search (semantic + keyword)
async function hybridSearch(
  query: string,
  env: Env
): Promise<SearchResult[]> {
  // 1. Semantic search
  const semanticResults = await semanticSearch(query, env);

  // 2. Keyword search via KV
  const keywords = query.toLowerCase().split(' ');
  const keywordResults = await keywordSearch(keywords, env);

  // 3. Merge and rerank
  return mergeResults(semanticResults, keywordResults, {
    semanticWeight: 0.7,
    keywordWeight: 0.3,
  });
}

// Multi-vector search (title + content separate)
async function multiVectorSearch(
  query: string,
  env: Env
): Promise<SearchResult[]> {
  const queryVector = await generateEmbedding(query, env);

  // Search title vectors
  const titleResults = await env.TITLE_VECTORIZE.query(queryVector, {
    topK: 20,
  });

  // Search content vectors
  const contentResults = await env.CONTENT_VECTORIZE.query(queryVector, {
    topK: 20,
  });

  // Combine with title boost
  return mergeResults(titleResults, contentResults, {
    titleWeight: 1.5,
    contentWeight: 1.0,
  });
}

// Clustering-based retrieval
async function clusterSearch(
  query: string,
  env: Env
): Promise<SearchResult[]> {
  // 1. Find nearest cluster
  const queryVector = await generateEmbedding(query, env);
  const clusterResults = await env.CLUSTER_VECTORIZE.query(queryVector, {
    topK: 3, // Top 3 clusters
  });

  // 2. Search within clusters
  const results = [];
  for (const cluster of clusterResults.matches) {
    const clusterItems = await env.VECTORIZE.query(queryVector, {
      topK: 10,
      filter: { clusterId: cluster.id },
    });
    results.push(...clusterItems.matches);
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}
```

### 5. Extend API Endpoints

```typescript
// Analytics endpoint
router.get('/api/analytics', async (request, env) => {
  const stats = await env.KV.get('stats', 'json');
  return json({
    totalItems: stats.totalItems,
    searchesThisWeek: stats.searchesThisWeek,
    topQueries: stats.topQueries,
    averageResponseTime: stats.avgResponseTime,
  });
});

// Batch operations
router.post('/api/batch/store', async (request, env) => {
  const { items } = await request.json();

  const embeddings = await Promise.all(
    items.map(item => generateEmbedding(item.content, env))
  );

  await env.VECTORIZE.upsert(
    items.map((item, i) => ({
      id: item.id,
      values: embeddings[i],
      metadata: item.metadata,
    }))
  );

  return json({ success: true, count: items.length });
});

// Recommendation endpoint
router.get('/api/recommend/:itemId', async (request, env) => {
  const { itemId } = request.params;
  const item = await env.KV.get(`item:${itemId}`, 'json');

  const embedding = await generateEmbedding(item.content, env);
  const similar = await env.VECTORIZE.query(embedding, {
    topK: 6,
    filter: { id: { $ne: itemId } },
  });

  return json({
    recommendations: similar.matches.slice(0, 5),
  });
});

// Export endpoint
router.get('/api/export', async (request, env) => {
  const { format = 'json' } = request.query;

  const allItems = await getAllItems(env);

  if (format === 'csv') {
    return new Response(convertToCSV(allItems), {
      headers: { 'Content-Type': 'text/csv' },
    });
  }

  return json(allItems);
});
```

---

## Example Projects

### Example 1: Recipe Search Engine

**Scenario**: Semantic search for cooking recipes

```typescript
interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cuisine: string;
  dietaryTags: string[]; // vegetarian, gluten-free, etc.
  prepTime: number; // minutes
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Enhanced embedding with ingredient focus
async function generateRecipeEmbedding(recipe: Recipe): Promise<number[]> {
  const searchableContent = `
    ${recipe.title}
    ${recipe.description}
    Cuisine: ${recipe.cuisine}
    Main ingredients: ${recipe.ingredients.slice(0, 5).join(', ')}
    Dietary: ${recipe.dietaryTags.join(', ')}
    Difficulty: ${recipe.difficulty}
  `.trim();

  return generateEmbedding(searchableContent);
}

// Natural language recipe search
router.get('/api/recipes/search', async (request, env) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q'); // "quick vegetarian pasta under 30 minutes"
  const maxTime = url.searchParams.get('maxTime');
  const dietary = url.searchParams.getAll('dietary');

  const queryVector = await generateEmbedding(query, env);

  const filter: any = {};
  if (maxTime) {
    filter.totalTime = { $lte: parseInt(maxTime) };
  }
  if (dietary.length > 0) {
    filter.dietaryTags = { $all: dietary };
  }

  const results = await env.VECTORIZE.query(queryVector, {
    topK: 20,
    filter,
  });

  const recipes = await Promise.all(
    results.matches.map(m => env.KV.get(`recipe:${m.id}`, 'json'))
  );

  return json({ recipes, total: recipes.length });
});
```

### Example 2: Legal Document Search

**Scenario**: Find relevant case law and precedents

```typescript
interface LegalDocument {
  id: string;
  caseNumber: string;
  title: string;
  summary: string;
  fullText: string;
  court: string;
  jurisdiction: string;
  dateDecided: string;
  judge: string;
  parties: { plaintiff: string; defendant: string };
  citations: string[];
  legalTopics: string[];
  outcome: string;
}

// Chunk long documents
async function storeLegalDocument(doc: LegalDocument, env: Env) {
  // 1. Store full document in KV
  await env.KV.put(`doc:${doc.id}`, JSON.stringify(doc));

  // 2. Chunk full text (8000 char chunks with 200 char overlap)
  const chunks = chunkText(doc.fullText, 8000, 200);

  // 3. Generate embeddings for each chunk
  const chunkEmbeddings = await Promise.all(
    chunks.map(chunk => generateEmbedding(chunk, env))
  );

  // 4. Store chunk vectors
  await env.VECTORIZE.upsert(
    chunks.map((chunk, i) => ({
      id: `${doc.id}:chunk:${i}`,
      values: chunkEmbeddings[i],
      metadata: {
        documentId: doc.id,
        chunkIndex: i,
        court: doc.court,
        jurisdiction: doc.jurisdiction,
        dateDecided: doc.dateDecided,
        legalTopics: doc.legalTopics,
      },
    }))
  );

  // 5. Store summary vector (for quick relevance)
  const summaryEmbedding = await generateEmbedding(
    `${doc.title}\n${doc.summary}`, env
  );

  await env.VECTORIZE.upsert([{
    id: `${doc.id}:summary`,
    values: summaryEmbedding,
    metadata: {
      documentId: doc.id,
      type: 'summary',
      court: doc.court,
      jurisdiction: doc.jurisdiction,
    },
  }]);
}

// Search with jurisdiction filtering
router.get('/api/legal/search', async (request, env) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const jurisdiction = url.searchParams.get('jurisdiction');
  const court = url.searchParams.get('court');
  const fromDate = url.searchParams.get('from');

  const queryVector = await generateEmbedding(query, env);

  const filter: any = {};
  if (jurisdiction) filter.jurisdiction = jurisdiction;
  if (court) filter.court = court;
  if (fromDate) filter.dateDecided = { $gte: fromDate };

  // Search chunks first
  const chunkResults = await env.VECTORIZE.query(queryVector, {
    topK: 50,
    filter: { ...filter, type: { $ne: 'summary' } },
  });

  // Group by document and get top documents
  const docScores = new Map<string, number>();
  for (const match of chunkResults.matches) {
    const docId = match.metadata.documentId;
    const currentScore = docScores.get(docId) || 0;
    docScores.set(docId, Math.max(currentScore, match.score));
  }

  const topDocs = Array.from(docScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const documents = await Promise.all(
    topDocs.map(([docId, score]) =>
      env.KV.get(`doc:${docId}`, 'json').then(doc => ({ ...doc, score }))
    )
  );

  return json({ documents, total: documents.length });
});
```

### Example 3: E-commerce Product Search

**Scenario**: Conversational product discovery

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  currency: string;
  attributes: Record<string, string>; // color, size, material, etc.
  tags: string[];
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

// Multi-modal embedding (text + attributes)
async function generateProductEmbedding(product: Product): Promise<number[]> {
  const attributeText = Object.entries(product.attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  const searchableContent = `
    ${product.name}
    ${product.description}
    Brand: ${product.brand}
    Category: ${product.category} - ${product.subcategory}
    ${attributeText}
    ${product.tags.join(', ')}
    Price range: ${getPriceRange(product.price)}
  `.trim();

  return generateEmbedding(searchableContent);
}

// Conversational search with filters
router.get('/api/products/search', async (request, env) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q'); // "comfortable running shoes for wide feet under $100"
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  const inStockOnly = url.searchParams.get('inStock') === 'true';

  const queryVector = await generateEmbedding(query, env);

  const filter: any = {};
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }
  if (inStockOnly) {
    filter.inStock = true;
  }

  const results = await env.VECTORIZE.query(queryVector, {
    topK: 30,
    filter,
  });

  const products = await Promise.all(
    results.matches.map(m => env.KV.get(`product:${m.id}`, 'json'))
  );

  // Personalized reranking (if user history available)
  const userId = request.headers.get('X-User-ID');
  if (userId) {
    const userPreferences = await env.KV.get(`user:${userId}:prefs`, 'json');
    return json({
      products: rerankByPreferences(products, userPreferences),
    });
  }

  return json({ products, total: products.length });
});

// Similar products
router.get('/api/products/:id/similar', async (request, env) => {
  const { id } = request.params;
  const product = await env.KV.get(`product:${id}`, 'json');

  const embedding = await generateProductEmbedding(product, env);

  const similar = await env.VECTORIZE.query(embedding, {
    topK: 11,
    filter: {
      id: { $ne: id },
      category: product.category, // Same category
      inStock: true,
    },
  });

  const products = await Promise.all(
    similar.matches.slice(0, 10).map(m =>
      env.KV.get(`product:${m.id}`, 'json')
    )
  );

  return json({ similar: products });
});
```

### Example 4: Job Matching Platform

**Scenario**: Match candidates with job postings

```typescript
interface JobPosting {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  remote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  requiredSkills: string[];
  preferredSkills: string[];
  benefits: string[];
  postedAt: string;
}

interface Candidate {
  id: string;
  name: string;
  bio: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    years: number;
    description: string;
  }>;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
  }>;
  preferredLocations: string[];
  remoteOnly: boolean;
  salaryExpectation: number;
}

// Two-way matching
async function storeJobPosting(job: JobPosting, env: Env) {
  // Store job
  await env.KV.put(`job:${job.id}`, JSON.stringify(job));

  // Generate embedding
  const jobText = `
    ${job.title}
    ${job.description}
    Required skills: ${job.requiredSkills.join(', ')}
    Experience level: ${job.experienceLevel}
    Location: ${job.location}${job.remote ? ' (Remote available)' : ''}
  `.trim();

  const embedding = await generateEmbedding(jobText, env);

  await env.JOB_VECTORIZE.upsert([{
    id: job.id,
    values: embedding,
    metadata: {
      company: job.company,
      location: job.location,
      remote: job.remote,
      experienceLevel: job.experienceLevel,
      requiredSkills: job.requiredSkills,
    },
  }]);
}

async function storeCandidate(candidate: Candidate, env: Env) {
  // Store candidate
  await env.KV.put(`candidate:${candidate.id}`, JSON.stringify(candidate));

  // Generate embedding from full profile
  const candidateText = `
    ${candidate.bio}
    Skills: ${candidate.skills.join(', ')}
    ${candidate.experience.map(exp =>
      `${exp.title} at ${exp.company}: ${exp.description}`
    ).join('\n')}
    ${candidate.education.map(edu =>
      `${edu.degree} in ${edu.field} from ${edu.institution}`
    ).join('\n')}
  `.trim();

  const embedding = await generateEmbedding(candidateText, env);

  await env.CANDIDATE_VECTORIZE.upsert([{
    id: candidate.id,
    values: embedding,
    metadata: {
      skills: candidate.skills,
      preferredLocations: candidate.preferredLocations,
      remoteOnly: candidate.remoteOnly,
      salaryExpectation: candidate.salaryExpectation,
    },
  }]);
}

// Find jobs for candidate
router.get('/api/candidates/:id/matches', async (request, env) => {
  const { id } = request.params;
  const candidate = await env.KV.get(`candidate:${id}`, 'json');

  // Get candidate embedding
  const candidateVector = await env.CANDIDATE_VECTORIZE.fetch(id);

  // Search jobs
  const filter: any = {};
  if (candidate.remoteOnly) {
    filter.remote = true;
  } else if (candidate.preferredLocations.length > 0) {
    filter.location = { $in: candidate.preferredLocations };
  }

  const jobMatches = await env.JOB_VECTORIZE.query(candidateVector.values, {
    topK: 20,
    filter,
  });

  // Score based on skill overlap
  const jobs = await Promise.all(
    jobMatches.matches.map(async (match) => {
      const job = await env.KV.get(`job:${match.id}`, 'json');
      const skillOverlap = calculateSkillOverlap(
        candidate.skills,
        job.requiredSkills
      );

      return {
        ...job,
        matchScore: match.score * 0.7 + skillOverlap * 0.3,
        matchReasons: generateMatchReasons(candidate, job),
      };
    })
  );

  return json({
    matches: jobs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10),
  });
});

// Find candidates for job
router.get('/api/jobs/:id/candidates', async (request, env) => {
  const { id } = request.params;
  const job = await env.KV.get(`job:${id}`, 'json');

  const jobVector = await env.JOB_VECTORIZE.fetch(id);

  const candidateMatches = await env.CANDIDATE_VECTORIZE.query(
    jobVector.values,
    { topK: 50 }
  );

  const candidates = await Promise.all(
    candidateMatches.matches.map(async (match) => {
      const candidate = await env.KV.get(`candidate:${match.id}`, 'json');
      const skillMatch = calculateSkillOverlap(
        candidate.skills,
        job.requiredSkills
      );

      return {
        id: candidate.id,
        name: candidate.name,
        skills: candidate.skills,
        matchScore: match.score * 0.6 + skillMatch * 0.4,
        missingSkills: job.requiredSkills.filter(
          s => !candidate.skills.includes(s)
        ),
      };
    })
  );

  return json({
    candidates: candidates
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20),
  });
});
```

---

## Best Practices

### 1. Security Considerations

```typescript
// Authentication
async function authenticate(request: Request, env: Env): Promise<User | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const userId = await verifyJWT(token, env.JWT_SECRET);

  return env.KV.get(`user:${userId}`, 'json');
}

// Rate limiting
async function checkRateLimit(
  userId: string,
  action: string,
  env: Env
): Promise<boolean> {
  const key = `ratelimit:${userId}:${action}`;
  const count = await env.KV.get(key);

  if (!count) {
    await env.KV.put(key, '1', { expirationTtl: 60 }); // 1 minute
    return true;
  }

  const currentCount = parseInt(count);
  if (currentCount >= 10) { // 10 requests per minute
    return false;
  }

  await env.KV.put(key, String(currentCount + 1), { expirationTtl: 60 });
  return true;
}

// Input validation
function validateSearchQuery(query: string): void {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  if (query.length > 1000) {
    throw new Error('Query too long (max 1000 characters)');
  }

  // Prevent injection
  if (query.includes('\x00') || query.includes('\u0000')) {
    throw new Error('Invalid characters in query');
  }
}

// Data sanitization
function sanitizeOutput(data: any): any {
  // Remove sensitive fields
  const { password, apiKey, privateData, ...safe } = data;
  return safe;
}
```

### 2. Performance Optimization

```typescript
// Batch embeddings
async function batchGenerateEmbeddings(
  texts: string[],
  env: Env
): Promise<number[][]> {
  const BATCH_SIZE = 100; // OpenAI allows up to 2048
  const batches = chunk(texts, BATCH_SIZE);

  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });

    allEmbeddings.push(...response.data.map(d => d.embedding));
  }

  return allEmbeddings;
}

// Caching frequent queries
async function cachedSearch(
  query: string,
  env: Env
): Promise<SearchResult[]> {
  const cacheKey = `cache:search:${hashString(query)}`;

  // Check cache
  const cached = await env.KV.get(cacheKey, 'json');
  if (cached) {
    return cached;
  }

  // Perform search
  const results = await semanticSearch(query, env);

  // Cache for 1 hour
  await env.KV.put(cacheKey, JSON.stringify(results), {
    expirationTtl: 3600,
  });

  return results;
}

// Lazy loading
async function getItemWithLazyContent(
  id: string,
  env: Env
): Promise<Item> {
  // Get metadata first
  const metadata = await env.KV.get(`meta:${id}`, 'json');

  // Return with content getter
  return {
    ...metadata,
    getFullContent: async () => {
      return env.KV.get(`content:${id}`, 'text');
    },
  };
}

// Connection pooling for external APIs
class OpenAIPool {
  private clients: OpenAI[] = [];
  private currentIndex = 0;

  constructor(apiKeys: string[], poolSize: number = 3) {
    for (let i = 0; i < poolSize; i++) {
      this.clients.push(new OpenAI({
        apiKey: apiKeys[i % apiKeys.length],
      }));
    }
  }

  getClient(): OpenAI {
    const client = this.clients[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.clients.length;
    return client;
  }
}
```

### 3. Data Modeling Tips

```typescript
// Hierarchical data
interface Document {
  id: string;
  parentId?: string; // For nested documents
  type: 'folder' | 'document' | 'section';
  path: string[]; // ['docs', 'api', 'authentication']
  content: string;
}

// Store with path indexing
async function storeHierarchicalDoc(doc: Document, env: Env) {
  // Store document
  await env.KV.put(`doc:${doc.id}`, JSON.stringify(doc));

  // Index by path
  for (let i = 0; i < doc.path.length; i++) {
    const pathKey = doc.path.slice(0, i + 1).join('/');
    const existing = await env.KV.get(`path:${pathKey}`, 'json') || [];
    existing.push(doc.id);
    await env.KV.put(`path:${pathKey}`, JSON.stringify(existing));
  }

  // Store vector with path metadata
  const embedding = await generateEmbedding(doc.content, env);
  await env.VECTORIZE.upsert([{
    id: doc.id,
    values: embedding,
    metadata: {
      path: doc.path,
      type: doc.type,
      depth: doc.path.length,
    },
  }]);
}

// Temporal data
interface TemporalItem {
  id: string;
  content: string;
  validFrom: string;
  validTo?: string; // undefined = current version
  version: number;
}

// Store versions
async function storeVersion(item: TemporalItem, env: Env) {
  // Invalidate previous version
  const current = await env.KV.get(`current:${item.id}`, 'json');
  if (current) {
    current.validTo = new Date().toISOString();
    await env.KV.put(`version:${item.id}:${current.version}`, JSON.stringify(current));
  }

  // Store new version
  await env.KV.put(`current:${item.id}`, JSON.stringify(item));
  await env.KV.put(`version:${item.id}:${item.version}`, JSON.stringify(item));

  // Update vector (only for current version)
  const embedding = await generateEmbedding(item.content, env);
  await env.VECTORIZE.upsert([{
    id: item.id,
    values: embedding,
    metadata: {
      version: item.version,
      validFrom: item.validFrom,
    },
  }]);
}

// Multi-tenant data
interface TenantData {
  tenantId: string;
  itemId: string;
  content: string;
}

// Isolate by tenant
async function storeTenantData(data: TenantData, env: Env) {
  const id = `${data.tenantId}:${data.itemId}`;

  await env.KV.put(`item:${id}`, JSON.stringify(data));

  const embedding = await generateEmbedding(data.content, env);
  await env.VECTORIZE.upsert([{
    id,
    values: embedding,
    metadata: {
      tenantId: data.tenantId,
      itemId: data.itemId,
    },
  }]);
}

// Search within tenant
async function searchTenant(
  tenantId: string,
  query: string,
  env: Env
) {
  const queryVector = await generateEmbedding(query, env);

  return env.VECTORIZE.query(queryVector, {
    topK: 10,
    filter: { tenantId },
  });
}
```

### 4. Testing Strategies

```typescript
// Unit tests for embeddings
import { describe, it, expect, beforeAll } from 'vitest';

describe('Embedding Generation', () => {
  it('should generate consistent embeddings', async () => {
    const text = 'test content';
    const embedding1 = await generateEmbedding(text, env);
    const embedding2 = await generateEmbedding(text, env);

    expect(embedding1).toHaveLength(1536);
    expect(cosineSimilarity(embedding1, embedding2)).toBeGreaterThan(0.99);
  });

  it('should handle empty input', async () => {
    await expect(generateEmbedding('', env)).rejects.toThrow();
  });

  it('should truncate long text', async () => {
    const longText = 'word '.repeat(10000);
    const embedding = await generateEmbedding(longText, env);
    expect(embedding).toHaveLength(1536);
  });
});

// Integration tests
describe('Semantic Search', () => {
  beforeAll(async () => {
    // Seed test data
    await storeItem({ id: '1', content: 'JavaScript tutorial' }, env);
    await storeItem({ id: '2', content: 'Python guide' }, env);
  });

  it('should find relevant results', async () => {
    const results = await semanticSearch('JS learning', env);
    expect(results[0].id).toBe('1');
  });

  it('should respect filters', async () => {
    const results = await semanticSearch('programming', {
      filter: { language: 'Python' },
    }, env);
    expect(results.every(r => r.metadata.language === 'Python')).toBe(true);
  });
});

// Load testing
async function loadTest() {
  const queries = generateRandomQueries(1000);
  const start = Date.now();

  await Promise.all(queries.map(q => semanticSearch(q, env)));

  const duration = Date.now() - start;
  const qps = queries.length / (duration / 1000);

  console.log(`QPS: ${qps.toFixed(2)}`);
  console.log(`Avg latency: ${(duration / queries.length).toFixed(2)}ms`);
}

// A/B testing embeddings
async function compareEmbeddingModels() {
  const testQueries = loadTestQueries();
  const groundTruth = loadGroundTruth();

  // Test model A
  const resultsA = await testWithModel('text-embedding-3-small', testQueries);
  const metricsA = calculateMetrics(resultsA, groundTruth);

  // Test model B
  const resultsB = await testWithModel('text-embedding-3-large', testQueries);
  const metricsB = calculateMetrics(resultsB, groundTruth);

  console.log('Model A:', metricsA);
  console.log('Model B:', metricsB);
}
```

---

## Getting Started Checklist

- [ ] Fork this repository
- [ ] Install dependencies: `npm install`
- [ ] Set up `.dev.vars` with your API keys
- [ ] Customize data types in `src/types.ts`
- [ ] Update API endpoints in `src/index.ts`
- [ ] Modify embedding generation for your content
- [ ] Create Cloudflare resources (Vectorize + KV)
- [ ] Update `wrangler.toml` with your account
- [ ] Test locally: `npx wrangler dev`
- [ ] Deploy: `npx wrangler deploy`
- [ ] Set production secrets: `npx wrangler secret put OPENAI_API_KEY`

---

## Additional Resources

### Documentation
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Vectorize Docs](https://developers.cloudflare.com/vectorize/)
- [Workers KV](https://developers.cloudflare.com/kv/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

### Example Repositories
- [KeenDreams Original](https://github.com/yourusername/keendreams)
- [Recipe Search Fork](https://github.com/example/recipe-search)
- [Legal Search Fork](https://github.com/example/legal-search)

### Community
- [Discord](#) - Get help and share your adaptations
- [GitHub Discussions](#) - Feature requests and ideas

---

**Ready to build?** Fork this repo and start adapting it for your semantic search use case. The infrastructure is production-ready—just customize the data model and search logic for your domain!

**Questions?** Open an issue or join the Discord community.

**Built something cool?** Share it! We'd love to see what you create with this template.
