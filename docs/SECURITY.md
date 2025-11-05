# Security Policy

## Data Isolation & Privacy

### Complete User Data Isolation ✅

**KeenDreams uses a fully distributed architecture** - when users deploy via the "Deploy to Cloudflare" button or manually, they create an **isolated instance in their own Cloudflare account**.

**What this means:**
- ✅ Each user deploys to **their own** Cloudflare account
- ✅ Each user's data is stored in **their own** KV namespaces
- ✅ Each user's vectors are in **their own** Vectorize index
- ✅ Each user sets **their own** API key secrets
- ✅ The original developer has **ZERO access** to user data

**This is NOT a SaaS model** - it's distributed infrastructure where each user controls their own deployment.

### Architecture Comparison

**❌ Centralized SaaS (Data Accessible to Developer):**
```
User 1 → Developer's Server → Developer's Database (Developer can see all data)
User 2 → Developer's Server → Developer's Database (Developer can see all data)
User 3 → Developer's Server → Developer's Database (Developer can see all data)
```

**✅ KeenDreams Distributed Model (Complete Isolation):**
```
User 1 → User 1's Cloudflare → User 1's KV/Vectorize (Isolated)
User 2 → User 2's Cloudflare → User 2's KV/Vectorize (Isolated)
User 3 → User 3's Cloudflare → User 3's KV/Vectorize (Isolated)
```

### Verification

Users can verify complete isolation by:

1. **Auditing the source code** - The worker code is open source and contains:
   - ✅ No hardcoded external API endpoints
   - ✅ No telemetry or analytics calls
   - ✅ No data exfiltration
   - ✅ No "phone home" features

2. **Checking their Cloudflare dashboard** - All resources are in THEIR account:
   - KV namespaces with unique IDs (only they can access)
   - Vectorize index with unique ID (only they can access)
   - Worker deployment at their unique URL
   - API keys stored as secrets (only they can access)

3. **Reviewing network traffic** - The worker only:
   - Responds to incoming API requests
   - Queries its own KV and Vectorize resources
   - Makes no outbound API calls to external services

### Data Access Rights

| Entity | Can Access User Data? |
|--------|----------------------|
| **The User** | ✅ YES - Full control via their Cloudflare dashboard |
| **Cloudflare** | ⚠️ Technical access only (infrastructure provider) |
| **Original Developer (Repository Owner)** | ❌ NO - Zero access to user deployments |
| **Other Users** | ❌ NO - Each deployment is isolated |
| **Public Internet** | ❌ NO - Protected by Bearer token authentication |

## Security Best Practices

### For Users Deploying KeenDreams

1. **Generate Strong API Keys**
   ```bash
   # Use a cryptographically secure random key
   openssl rand -hex 32
   ```

2. **Never Commit Secrets**
   - Use `wrangler secret put` for API keys
   - Never commit `.env` or `.dev.vars` files
   - Keep `wrangler.toml` with placeholder IDs only

3. **Use Custom Domains (Optional)**
   - Add your own domain for professional URLs
   - Cloudflare provides free SSL certificates

4. **Monitor Usage**
   - Check Cloudflare dashboard for usage metrics
   - Set up alerts for unusual activity
   - Review worker logs regularly

5. **Regular Updates**
   - Pull latest security patches from the repository
   - Review CHANGELOG.md for security updates
   - Test updates in development before production

### For Repository Maintainers

1. **Placeholder IDs Only**
   - Commit `wrangler.toml` with placeholder values
   - Never commit real KV namespace IDs
   - Never commit real Vectorize index IDs

2. **Environment Variables**
   - All secrets via environment variables or Cloudflare secrets
   - Provide `.env.example` template
   - Document required environment variables

3. **Code Audits**
   - No hardcoded credentials
   - No external API calls without user consent
   - No telemetry or analytics without disclosure
   - Open source allows community audits

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow responsible disclosure:

### Do NOT:
- ❌ Open a public GitHub issue
- ❌ Post on social media or forums
- ❌ Exploit the vulnerability

### Instead:

1. **Email the maintainer** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

2. **Allow reasonable time** for a patch:
   - Critical vulnerabilities: 48 hours
   - High severity: 7 days
   - Medium/Low severity: 30 days

3. **Coordinate disclosure**:
   - We'll work with you on a patch
   - Credit will be given (unless you prefer anonymity)
   - Public disclosure after patch is deployed

### What to Expect

- **Initial Response**: Within 24 hours
- **Validation**: Within 72 hours
- **Fix Timeline**: Based on severity
- **Public Disclosure**: After patch is released

### Security Credits

We appreciate security researchers who help keep KeenDreams secure. Valid security reports may receive:
- Public acknowledgment in CHANGELOG
- Credit in security advisory
- GitHub security researcher badge

## Security Features

### Built-In Security

1. **Authentication**
   - Bearer token authentication on all endpoints
   - API keys stored as Cloudflare Worker secrets
   - No authentication = 401/403 response

2. **HTTPS Everywhere**
   - All traffic encrypted via Cloudflare SSL
   - No plain HTTP accepted
   - Free SSL certificates included

3. **DDoS Protection**
   - Cloudflare's edge network provides built-in DDoS protection
   - Rate limiting configurable via Cloudflare dashboard
   - Automatic threat mitigation

4. **Input Validation**
   - All API inputs validated
   - Query parameter sanitization
   - JSON schema validation

5. **No SQL Injection**
   - Uses KV (key-value) storage, not SQL
   - No query string concatenation
   - Parameterized queries for Vectorize

### Cloudflare Security

By deploying on Cloudflare Workers, you inherit:

- **WAF (Web Application Firewall)** - Free tier includes basic WAF
- **Bot Detection** - Automatic bot mitigation
- **SSL/TLS** - Free certificates with automatic renewal
- **Edge Caching** - Reduces attack surface
- **Global Anycast Network** - Natural DDoS resilience

## Privacy Policy

### What Data Is Stored

Users choose what to store in their own KeenDreams instance:
- Development session metadata (projects, timestamps)
- Code context and file information
- Search queries and results
- Custom project data

### Where Data Is Stored

- **User's Cloudflare KV**: Metadata and structured data
- **User's Cloudflare Vectorize**: Vector embeddings for semantic search
- **User's Cloudflare Account**: All data remains in user's infrastructure

### Data Retention

- Users control retention via their Cloudflare dashboard
- No automatic deletion (user-controlled)
- Export capabilities via API
- Complete data ownership

### Third-Party Access

- **NO third parties** have access to user data
- **NO analytics services** send data externally
- **NO telemetry** reports back to developers
- **NO external API calls** by default

## Compliance

### GDPR Compliance

As a self-hosted solution:
- Users are their own data controllers
- No cross-border data transfers (unless user chooses)
- Right to access: User has full API access
- Right to deletion: User controls their KV/Vectorize
- Data portability: Export via API

### Security Standards

- **Open Source**: Full code transparency
- **Encryption**: HTTPS/TLS 1.3 enforced
- **Authentication**: Bearer token required
- **Isolation**: Per-user infrastructure
- **Auditability**: All code publicly reviewable

## Security Checklist for Public Release

Before making your KeenDreams instance public:

- [ ] Replace all placeholder IDs in local `wrangler.toml`
- [ ] Set strong API key via `wrangler secret put`
- [ ] Verify no hardcoded credentials in code
- [ ] Enable Cloudflare security features
- [ ] Test authentication on all endpoints
- [ ] Review worker logs for suspicious activity
- [ ] Set up monitoring and alerts
- [ ] Document custom configuration
- [ ] Test backup and restore procedures
- [ ] Review this security policy

## Questions?

For security-related questions that are not vulnerabilities:
- Open a GitHub Discussion
- Tag with `security` label
- Community members can help

---

**Last Updated**: 2025-11-04
**Security Model**: Distributed, User-Controlled Infrastructure
**Data Access**: Zero access by repository maintainers
