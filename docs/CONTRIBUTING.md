# Contributing to KeenDreams

Thank you for your interest in contributing to KeenDreams! This project showcases the power of Cloudflare's edge platform for semantic search and development context management.

## 🎯 Ways to Contribute

- 🐛 **Bug Reports** - Found a bug? Open an issue with details
- ✨ **Feature Requests** - Have an idea? Suggest improvements
- 📖 **Documentation** - Help improve our guides and examples
- 💻 **Code Contributions** - Submit PRs for fixes or features
- 🎨 **Use Case Examples** - Share how you've adapted KeenDreams
- 🧪 **Testing** - Help test new features and edge cases

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js 16+** installed
2. **Cloudflare Account** (free tier works great!)
3. **Wrangler CLI** installed: `npm install -g wrangler`
4. **Git** for version control

### Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/keendreams.git
cd keendreams
npm install
```

### Local Development

```bash
# Login to Cloudflare
wrangler login

# Create KV namespaces for testing
wrangler kv:namespace create "DREAMS"
wrangler kv:namespace create "PROJECTS"
wrangler kv:namespace create "KEENDREAMS_KV"

# Create Vectorize index
wrangler vectorize create keendreams-test --dimensions=768 --metric=cosine

# Update wrangler.toml with your test namespace IDs

# Set API key as secret
wrangler secret put KEENDREAMS_API_KEY
# Enter your test API key when prompted

# Start local development server
wrangler dev
```

Your local worker will be available at `http://localhost:8787`

---

## 📝 Development Guidelines

### Code Style

- **TypeScript/JavaScript**: Follow existing code style
- **Formatting**: Use Prettier (included in package.json)
- **Linting**: Run `npm run lint` before committing
- **Comments**: Add helpful comments for complex logic

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add semantic similarity threshold parameter
fix: resolve embedding generation timeout
docs: update Cloudflare deployment guide
chore: update dependencies
```

**Format**: `<type>: <description>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Testing

Before submitting a PR:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Manual testing
npm run dev

# Test critical endpoints
curl http://localhost:8787/health
curl http://localhost:8787/stats -H "Authorization: Bearer YOUR_TEST_KEY"
```

---

## 🔐 Security

**NEVER commit secrets or API keys!**

- Use `.env` for local development (already in `.gitignore`)
- Use `wrangler secret put` for production secrets
- Review changes before committing: `git diff`
- Check for secrets: `git log --all --full-history --source -- wrangler.toml`

If you accidentally commit a secret:
1. Rotate the key immediately
2. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
3. Force push: `git push --force`

---

## 📥 Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Your Changes

- Keep changes focused and atomic
- Add tests if applicable
- Update documentation
- Follow existing code patterns

### 3. Test Thoroughly

```bash
npm run typecheck
npm run lint
wrangler dev  # Manual testing
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

Go to the [original repository](https://github.com/LandCruiserWorld/keendreams) and click **"New Pull Request"**

**PR Title**: Clear, concise description
**PR Description**: Include:
- What changes were made
- Why the changes are needed
- How to test the changes
- Screenshots/examples if applicable

---

## 🏗️ Project Structure

```
keendreams/
├── keendreams-worker.js      # Main Cloudflare Worker
├── wrangler.toml.example     # Worker configuration template
├── .env.example              # Environment variables template
├── docs/                     # Documentation
│   ├── API.md               # API reference
│   ├── CLOUDFLARE_DEPLOYMENT.md
│   ├── TEMPLATE_GUIDE.md
│   ├── SEMANTIC_SEARCH.md
│   └── ARCHITECTURE.md
├── scripts/                  # Utility scripts
│   ├── claude-dream.sh      # Dream capture script
│   └── ...
├── src/                      # Source files
│   ├── claude-portfolio-api.js
│   └── ...
└── tests/                    # Test files (if added)
```

---

## 🎨 Adding New Features

### Semantic Search Improvements

If adding new search capabilities:
1. Extend the `/api/memory/search` endpoint
2. Update `docs/SEMANTIC_SEARCH.md`
3. Add examples to `docs/API.md`
4. Test with various query types

### New API Endpoints

1. Add route handler in `keendreams-worker.js`
2. Implement authentication check
3. Add CORS headers
4. Document in `docs/API.md`
5. Update available routes list

### Documentation

- Keep examples current
- Use placeholder values (never real credentials)
- Test all code examples
- Update README.md if adding major features

---

## 🐛 Bug Reports

**Before Opening an Issue:**
- Search existing issues
- Check if it's already fixed in latest version
- Verify it's reproducible

**Issue Template:**
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Cloudflare Workers version:
- Wrangler version: `wrangler --version`
- Node.js version: `node --version`

## Additional Context
Logs, screenshots, etc.
```

---

## ✨ Feature Requests

**Issue Template:**
```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How might this work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Examples, mockups, etc.
```

---

## 📖 Documentation Contributions

Documentation improvements are always welcome!

**Areas to Contribute:**
- Fix typos and grammar
- Add more examples
- Improve clarity
- Add diagrams/visuals
- Create video tutorials
- Write blog posts

---

## 🌍 Community

- **Discussions**: [GitHub Discussions](https://github.com/LandCruiserWorld/keendreams/discussions)
- **Issues**: [GitHub Issues](https://github.com/LandCruiserWorld/keendreams/issues)
- **Cloudflare Discord**: [Cloudflare Developers](https://discord.gg/cloudflaredev)

---

## 📜 License

By contributing to KeenDreams, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Every contribution helps make KeenDreams better. Whether it's a bug report, feature request, documentation improvement, or code contribution - thank you for being part of the project!

**Questions?** Open a discussion or issue. We're here to help!

---

**Built with ❤️ using Cloudflare Workers**

[Back to README](./README.md) • [View Documentation](./docs) • [Deploy Now](https://deploy.workers.cloudflare.com/?url=https://github.com/LandCruiserWorld/keendreams)
