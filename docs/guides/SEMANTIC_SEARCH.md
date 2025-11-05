# Semantic Search Guide

> 📝 **Documentation Coming Soon**
>
> This guide will explain how to use KeenDreams' AI-powered semantic search capabilities.

## What This Guide Will Cover

- How semantic search works
- Best practices for search queries
- Understanding similarity scores
- Optimizing embeddings
- Advanced search techniques
- Fine-tuning search results

## In the Meantime

Try out the search API with natural language queries! The system uses BGE-Base-EN-v1.5 embeddings and cosine similarity to find relevant results.

Example:
```bash
curl "https://your-worker.workers.dev/api/dreams/search?q=authentication%20implementation" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For questions, visit our [Discussions](https://github.com/LandCruiserWorld/keendreams/discussions).
