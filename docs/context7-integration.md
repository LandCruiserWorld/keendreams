# Context7 Integration for Your Projects

## Why Context7 Matters
Context7 provides up-to-date API documentation directly to Claude, preventing outdated API usage and ensuring accurate code generation. This is especially critical for rapidly evolving libraries.

## Available APIs for Your Tech Stack

### ✅ Core Technologies with Context7 Support

#### JavaScript Frameworks & Libraries
- **React** - `/websites/react_dev` (1752 snippets, Trust: 8.0) or `/reactjs/react.dev` (2127 snippets, Trust: 10)
- **React Router** - `/remix-run/react-router` (849 snippets, Trust: 7.5)
- **Next.js** - `/vercel/next.js` (3318 snippets, Trust: 10) or `/websites/nextjs` (5115 snippets)
- **TypeScript** - `/microsoft/typescript` (15930 snippets, Trust: 9.9)
- **Node.js** - `/nodejs/node` (8325 snippets, Trust: 9.1)

#### Cloudflare Workers & Ecosystem
- **Cloudflare Workers SDK** - `/cloudflare/workers-sdk` (391 snippets, Trust: 9.3)
- **Cloudflare Workers Docs** - `/websites/developers_cloudflare-workers` (2024 snippets)
- **Cloudflare Agents** - `/cloudflare/agents` (65 snippets, Trust: 9.3)
- **Cloudflare Workflows** - `/cloudflare/workflows-starter` (Trust: 9.3)
- **Workers MCP** - `/cloudflare/workers-mcp` (Trust: 9.3)
- **Wrangler Action** - `/cloudflare/wrangler-action` (Trust: 9.3)
- **Cloudflare R2** - `/websites/developers_cloudflare_r2` (619 snippets)
- **Cloudflare Pages** - `/websites/developers_cloudflare_pages` (740 snippets)

#### Real-Time Communication
- **WebRTC Samples** - `/webrtc/samples` (Trust: 9.3)
- **React Native WebRTC** - `/react-native-webrtc/react-native-webrtc` (56 snippets, Trust: 7.7)
- **Pion WebRTC (Go)** - `/pion/webrtc` (289 snippets, Trust: 9.2)
- **Flutter WebRTC** - `/flutter-webrtc/flutter-webrtc` (62 snippets, Trust: 9.2)

#### Styling & UI
- **Tailwind CSS** - `/websites/tailwindcss` (1545 snippets, Trust: 7.5) or `/tailwindlabs/tailwindcss.com` (1402 snippets, Trust: 10)
- **Tailwind CSS Typography** - `/tailwindlabs/tailwindcss-typography` (Trust: 8.0)
- **Tailwind CSS Animate** - `/jamiebuilds/tailwindcss-animate` (216 snippets, Trust: 8.7)
- **Material Tailwind** - `/creativetimofficial/material-tailwind` (1492 snippets, Trust: 9.1)

#### AI/Image Generation
- **Nano Banana AI Image Editor** - `/markfulton/nanobananaeditor` (Trust: 7.3)
  - AI-powered image generation using Google's Gemini 2.5 Flash

#### State Management
- **Nano Stores** - `/nanostores/nanostores` (35 snippets, Trust: 7.1)
- **Nano Stores Query** - `/nanostores/query` (13 snippets)
- **Nano Stores Persistent** - `/nanostores/persistent` (12 snippets)

#### Common Libraries
- **NanoID** - `/ai/nanoid` (31 snippets, Trust: 9.9)
- **Commander.js** - `/tj/commander.js` (144 snippets, Trust: 8.5)
- **Node.js Best Practices** - `/goldbergyoni/nodebestpractices` (260 snippets, Trust: 9.6)

## How to Use Context7 in Your Projects

### For Nano Banana Development
```bash
# When working with Nano Banana, fetch latest docs:
mcp__context7__get-library-docs --context7CompatibleLibraryID "/markfulton/nanobananaeditor"
```

### For Cloudflare Workers
```bash
# Get latest Workers SDK docs:
mcp__context7__get-library-docs --context7CompatibleLibraryID "/cloudflare/workers-sdk"
```

## Projects Needing Custom Documentation

These projects are not in Context7 and may need custom documentation approaches:

### Your Custom Projects
- **shush** - 175ms AI Avatar platform (WebRTC, Node.js)
- **aifi-repo** - AI project
- **Maryland-Register-App** - Government portal
- **story-health-lens** - Analysis tool
- **idea-evaluator** - Project evaluation tool
- **git-repo-accelerator** - Git workflow tool

### Recommended Approach for Custom Projects
1. **Create local API docs** in each project's `/docs/api.md`
2. **Use CLAUDE.md** files for project-specific context
3. **Consider creating llms.txt files** for better AI comprehension

## Quick Check Command

To check if a library is available in Context7:
```javascript
// In Claude, use:
mcp__context7__resolve-library-id { libraryName: "your-library-name" }
```

## Integration Strategy

1. **Always check Context7 first** for external libraries
2. **Use Context7 docs** when available to ensure API accuracy
3. **Create local docs** for custom projects not in Context7
4. **Update regularly** - Context7 is constantly adding new libraries

## Benefits
- ✅ Accurate, up-to-date API usage
- ✅ Reduces bugs from outdated documentation
- ✅ Faster development with correct code first time
- ✅ Especially valuable for rapidly changing APIs like Nano Banana

---
*Note: This list is current as of the last check. New libraries are added to Context7 regularly.*