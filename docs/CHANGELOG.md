# Changelog

All notable changes to KeenDreams will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-11-04

### Added
- 🧠 **Semantic Search** powered by Cloudflare Vectorize (BGE-Base-EN-v1.5, 768 dimensions)
- 📚 Comprehensive API documentation with examples
- 🚀 Complete Cloudflare deployment guide
- 🎨 Template adaptation guide with 4 detailed examples
- 🏗️ Architecture documentation (474 lines)
- 🔐 Security audit and best practices guide
- 🤝 Contributing guidelines
- 📦 Environment configuration templates (.env.example, wrangler.toml.example)

### Changed
- 🔒 **Security**: Removed ALL hardcoded API keys and secrets
- 🔒 **Security**: Updated authentication to use Cloudflare Worker secrets
- 📁 Reorganized repository structure (docs/, scripts/, src/)
- 📝 Complete README rewrite with Cloudflare showcase
- ⚙️ All scripts now require environment variables

### Security
- Removed 20+ instances of hardcoded credentials
- Added wrangler.toml to .gitignore
- Implemented proper secret management with Cloudflare Workers
- Added comprehensive security audit documentation

### Documentation
- Created professional documentation suite (5,000+ lines)
- Organized docs into categories: guides/, api/, architecture/
- Added inline examples for all API endpoints
- Created template adaptation examples

## [2.0.0] - 2025-09-14

### Added
- Initial public release
- Cloudflare Workers integration
- KV storage for dreams and projects
- Basic API endpoints
- Command-line capture scripts

### Features
- Dream capture and restoration
- Project context management
- Stats and analytics
- Multi-project tracking

## [1.0.0] - 2025-08-01

### Added
- Initial private implementation
- Basic dream capture functionality
- Local storage only

---

## Versioning

- **Major version** (X.0.0): Breaking API changes
- **Minor version** (0.X.0): New features, backward compatible
- **Patch version** (0.0.X): Bug fixes, backward compatible

## Links

- [Repository](https://github.com/LandCruiserWorld/keendreams)
- [Issues](https://github.com/LandCruiserWorld/keendreams/issues)
- [Pull Requests](https://github.com/LandCruiserWorld/keendreams/pulls)
