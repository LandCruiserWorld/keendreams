# 🔒 KeenDreams Security Audit Report

**Audit Date:** 2025-11-04
**Auditor:** Security Specialist (Automated Scan)
**Scope:** All files in `/tmp/keendreams-update/`
**Status:** 🔴 **CRITICAL SECRETS FOUND - IMMEDIATE ACTION REQUIRED**

---

## 🚨 Executive Summary

This security audit identified **CRITICAL SECURITY VULNERABILITIES** across multiple files in the KeenDreams repository. The following sensitive information is currently exposed and must be removed before any public deployment:

- **API Keys** (hardcoded in 3+ locations)
- **Cloudflare KV Namespace IDs** (exposed in 8+ files)
- **Private Worker URLs** (deployment-specific domains)
- **Email addresses** (developer contact info)

**Risk Level:** 🔴 **CRITICAL**
**Action Required:** Immediate remediation before git push/public deployment

---

## 🔍 Critical Findings

### 1. HARDCODED API KEY - 🔴 CRITICAL

**Secret Value:** `ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa`

**Locations Found:**

#### `deploy-keendreams.sh`
- **Line 61:** API key hardcoded in deployment script
  ```bash
  echo "ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa" | wrangler secret put KEENDREAMS_API_KEY
  ```
- **Line 140:** API key used in curl test command
  ```bash
  test_endpoint "https://your-worker.workers.dev/stats" "ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa"
  ```
- **Line 144:** API key in Authorization header
  ```bash
  curl -I -s -H "Authorization: Bearer ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa"
  ```

#### `scripts/claude-dream.sh`
- **Line 13:** API key as default value in variable
  ```bash
  API_KEY="${KEENDREAMS_API_KEY:-ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa}"
  ```

**Impact:** Full unauthorized access to KeenDreams API, ability to read/write all dreams, modify project data

**Recommendation:**
```bash
# Replace all instances with environment variable reference
API_KEY="${KEENDREAMS_API_KEY:?Error: KEENDREAMS_API_KEY not set}"

# Users should set in their environment:
export KEENDREAMS_API_KEY="your-secure-key-here"
```

---

### 2. CLOUDFLARE KV NAMESPACE IDs - 🟠 HIGH RISK

**Exposed Namespace IDs:**
- `DREAMS`: `0b88fd8ff6914b48a4305d15bc0287ab`
- `PROJECTS`: `394b7ec87e7e4838b3f2a085e16730f0`
- `KEENDREAMS_KV`: `e40a223122d84df490d67e2631c1067b`

**Locations Found:**

#### `wrangler.toml` (Lines 13, 17, 22)
```toml
[[kv_namespaces]]
binding = "DREAMS"
id = "0b88fd8ff6914b48a4305d15bc0287ab"

[[kv_namespaces]]
binding = "PROJECTS"
id = "394b7ec87e7e4838b3f2a085e16730f0"

[[kv_namespaces]]
binding = "KEENDREAMS_KV"
id = "e40a223122d84df490d67e2631c1067b"
```

#### `KEENDREAMS_DOCUMENTATION.md` (Lines 16-18, 50, 54, 59)
- Documentation contains actual production KV namespace IDs

#### `KEENDREAMS_SUMMARY.md` (Line 14)
- Summary document exposes namespace ID

**Impact:** While KV namespaces are somewhat protected by Cloudflare account access, exposing IDs could enable targeted attacks if combined with other credentials.

**Recommendation:**
```toml
# wrangler.toml - Use placeholder values
[[kv_namespaces]]
binding = "DREAMS"
id = "your_dreams_kv_namespace_id_here"

[[kv_namespaces]]
binding = "PROJECTS"
id = "your_projects_kv_namespace_id_here"

[[kv_namespaces]]
binding = "KEENDREAMS_KV"
id = "your_cache_kv_namespace_id_here"
```

Add to `.gitignore`:
```
wrangler.toml
.dev.vars
```

Create `wrangler.toml.example` with placeholders for documentation.

---

### 3. PRIVATE WORKER URLs - 🟡 MEDIUM RISK

**Exposed URLs:**
- `https://your-worker.workers.dev`
- `terryrichards.dev/*`

**Locations Found:**

#### Multiple Files (20+ instances):
- `deploy-keendreams.sh` (Lines 137, 140, 145, 151)
- `wrangler.toml` (Line 7)
- `src/claude-portfolio-api.js` (Line 360)
- `src/project-location-tracker.js` (Line 363)
- `scripts/batch-claude-processor.js` (Lines 106, 141)
- `scripts/claude-web-to-dreams.js` (Line 223)
- `scripts/quick-claude-converter.js` (Line 134)
- `docs/batch-extraction-guide.md` (Line 195)
- `docs/claude-import-strategy.md` (Lines 149, 174, 187)
- `KEENDREAMS_DOCUMENTATION.md` (Multiple lines)

**Impact:** Exposes deployment-specific URLs that could be targeted. While not as critical as API keys, these should be parameterized.

**Recommendation:**
```bash
# Environment variable approach
export KEENDREAMS_URL="https://your-worker.workers.dev"

# In code/scripts, use:
WORKER_URL="${KEENDREAMS_URL:-https://keendreams.workers.dev}"
```

Replace all hardcoded URLs with placeholder examples:
```
https://keendreams.YOUR-SUBDOMAIN.workers.dev
https://your-custom-domain.com
```

---

### 4. EMAIL ADDRESSES - 🟢 LOW RISK

**Found Addresses:**
- `noreply@anthropic.com` (Claude Co-Authored-By header)

**Locations:**
- `scripts/goodnight-with-git.js` (Lines 137, 222)

**Impact:** Minimal - this is a public Anthropic email used for attribution

**Recommendation:** No action required (public service email)

---

### 5. AUTHENTICATION PATTERNS - ℹ️ INFORMATIONAL

**Findings:**
Multiple files contain authentication code patterns (Bearer tokens, API key headers) which are **SECURE** as implemented, but should be reviewed:

- `keendreams-worker.js`: Proper Bearer/X-API-Key validation ✅
- `src/claude-portfolio-api.js`: Correct Authorization header usage ✅
- `src/enhanced-dream-capture.js`: Constructor accepts API key parameter ✅
- `src/multi-project-manager.js`: Constructor accepts API key parameter ✅

**Status:** No security issues found in authentication logic implementation

---

## 📋 Complete File Inventory

### Files Requiring Immediate Changes:

| Priority | File | Lines | Issue | Action |
|----------|------|-------|-------|--------|
| 🔴 CRITICAL | `deploy-keendreams.sh` | 61, 140, 144 | Hardcoded API key | Remove/replace with env var |
| 🔴 CRITICAL | `scripts/claude-dream.sh` | 13 | Hardcoded API key fallback | Remove default value |
| 🟠 HIGH | `wrangler.toml` | 13, 17, 22 | Production KV IDs | Replace with placeholders |
| 🟠 HIGH | `KEENDREAMS_DOCUMENTATION.md` | 16-18, 50, 54, 59 | KV namespace IDs | Replace with examples |
| 🟠 HIGH | `KEENDREAMS_SUMMARY.md` | 14 | KV namespace ID | Remove or redact |
| 🟡 MEDIUM | Multiple files | Various | Worker URLs | Parameterize |

### Files with URL References Only (Lower Priority):

- `src/claude-portfolio-api.js`
- `src/project-location-tracker.js`
- `scripts/batch-claude-processor.js`
- `scripts/claude-web-to-dreams.js`
- `scripts/quick-claude-converter.js`
- `docs/*.md` files

---

## 🛠️ Remediation Strategy

### Phase 1: Immediate Critical Fixes (Before Any Commit)

1. **Remove Hardcoded API Key**
   ```bash
   # deploy-keendreams.sh - Line 61
   # REPLACE:
   echo "ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa" | wrangler secret put KEENDREAMS_API_KEY

   # WITH:
   if [ -z "$KEENDREAMS_API_KEY" ]; then
     echo "Error: KEENDREAMS_API_KEY environment variable not set"
     echo "Please set your API key: export KEENDREAMS_API_KEY='your-key-here'"
     exit 1
   fi
   echo "$KEENDREAMS_API_KEY" | wrangler secret put KEENDREAMS_API_KEY
   ```

   ```bash
   # deploy-keendreams.sh - Lines 140, 144
   # REPLACE hardcoded key in test commands:
   test_endpoint "..." "$KEENDREAMS_API_KEY" "..."
   curl -H "Authorization: Bearer $KEENDREAMS_API_KEY" ...
   ```

   ```bash
   # scripts/claude-dream.sh - Line 13
   # REPLACE:
   API_KEY="${KEENDREAMS_API_KEY:-ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa}"

   # WITH:
   API_KEY="${KEENDREAMS_API_KEY:?Error: KEENDREAMS_API_KEY environment variable required}"
   ```

2. **Replace Production KV Namespace IDs**
   ```toml
   # wrangler.toml - Replace actual IDs
   [[kv_namespaces]]
   binding = "DREAMS"
   id = "your_dreams_kv_namespace_id_here"

   [[kv_namespaces]]
   binding = "PROJECTS"
   id = "your_projects_kv_namespace_id_here"

   [[kv_namespaces]]
   binding = "KEENDREAMS_KV"
   id = "your_cache_kv_namespace_id_here"
   ```

   Create `wrangler.toml.example` with the above placeholders.

   Add to `.gitignore`:
   ```
   wrangler.toml
   .dev.vars
   .wrangler/
   ```

3. **Update Documentation Files**
   - `KEENDREAMS_DOCUMENTATION.md`: Replace all KV IDs with `your_kv_namespace_id_here`
   - `KEENDREAMS_SUMMARY.md`: Remove or redact KV ID references

### Phase 2: Environment Configuration (Setup)

Create `.env.example`:
```bash
# KeenDreams Configuration Template
# Copy this to .env and fill in your values

# API Key (generate a secure random string)
KEENDREAMS_API_KEY=your_secure_api_key_here

# Worker URL (after deployment)
KEENDREAMS_URL=https://your-worker.workers.dev

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

Add to `.gitignore`:
```
.env
.env.local
.dev.vars
wrangler.toml
```

### Phase 3: URL Parameterization (Optional Improvement)

Update scripts to use environment variables:
```bash
# scripts/claude-dream.sh
WORKER_URL="${KEENDREAMS_URL:-https://keendreams.workers.dev}"

# deploy-keendreams.sh
WORKER_URL="${KEENDREAMS_URL:?Error: KEENDREAMS_URL not set}"
test_endpoint "$WORKER_URL/health" "" "Health check"
```

Update documentation with examples:
```markdown
# Instead of: https://your-worker.workers.dev
# Use: https://your-worker.YOUR-SUBDOMAIN.workers.dev
```

---

## ✅ Verification Checklist

Before committing or deploying, verify:

- [ ] No hardcoded API keys remain in any files
- [ ] No production KV namespace IDs in committed files
- [ ] All sensitive configs use environment variables
- [ ] `.gitignore` includes `.env`, `wrangler.toml`, `.dev.vars`
- [ ] `wrangler.toml.example` created with placeholders
- [ ] `.env.example` created with configuration template
- [ ] Documentation updated with placeholder examples
- [ ] No private worker URLs in committed files
- [ ] All scripts require env vars rather than defaults

### Verification Commands:

```bash
# Search for the exposed API key
grep -r "ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa" /tmp/keendreams-update/
# Should return: No matches found

# Search for KV namespace IDs
grep -r "0b88fd8ff6914b48a4305d15bc0287ab" /tmp/keendreams-update/
grep -r "394b7ec87e7e4838b3f2a085e16730f0" /tmp/keendreams-update/
grep -r "e40a223122d84df490d67e2631c1067b" /tmp/keendreams-update/
# Should return: No matches found (except in .example files)

# Search for private worker URL
grep -r "terry-c67.workers.dev" /tmp/keendreams-update/
# Should return: No matches found (except in .example files)

# Verify .gitignore includes secrets
cat /tmp/keendreams-update/.gitignore | grep -E "(\.env|wrangler\.toml|\.dev\.vars)"
# Should show all three patterns
```

---

## 📚 Additional Security Recommendations

### 1. Rotate Compromised Credentials

Once secrets are removed from the codebase, **IMMEDIATELY** rotate:
- Generate new API key for `KEENDREAMS_API_KEY`
- Consider rotating Cloudflare API tokens if exposed
- Update `wrangler secret put` with new key

### 2. Git History Cleanup (If Already Committed)

If these secrets were committed to git history:
```bash
# Use BFG Repo-Cleaner or git-filter-repo
# WARNING: This rewrites git history!

# Install BFG
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Remove secrets from history
bfg --replace-text secrets.txt keendreams-repo/
cd keendreams-repo
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### 3. Enable GitHub Secret Scanning

If pushing to GitHub:
- Enable "Secret scanning" in repository settings
- Review and resolve any alerts
- Set up branch protection rules

### 4. Implement Secret Management

For production deployments:
- Use Cloudflare's secret management (`wrangler secret put`)
- Never commit secrets to version control
- Use environment-specific configurations
- Implement secret rotation policies

### 5. Security Monitoring

- Set up alerts for unauthorized API access
- Monitor Cloudflare Workers logs for suspicious activity
- Implement rate limiting (already present in code ✅)
- Regular security audits of dependencies

---

## 🎯 Quick Fix Script

Save this as `fix-secrets.sh` and run to perform automated replacements:

```bash
#!/bin/bash
# Quick secret removal script

echo "🔒 Removing hardcoded secrets from KeenDreams..."

# Backup original files
cp deploy-keendreams.sh deploy-keendreams.sh.backup
cp scripts/claude-dream.sh scripts/claude-dream.sh.backup
cp wrangler.toml wrangler.toml.backup

# Replace API key in deploy-keendreams.sh
sed -i.bak 's/ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa/$KEENDREAMS_API_KEY/g' deploy-keendreams.sh

# Replace API key in claude-dream.sh
sed -i.bak 's/:-ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa/:?Error: KEENDREAMS_API_KEY required}/g' scripts/claude-dream.sh

# Replace KV IDs in wrangler.toml
sed -i.bak 's/0b88fd8ff6914b48a4305d15bc0287ab/your_dreams_kv_namespace_id/g' wrangler.toml
sed -i.bak 's/394b7ec87e7e4838b3f2a085e16730f0/your_projects_kv_namespace_id/g' wrangler.toml
sed -i.bak 's/e40a223122d84df490d67e2631c1067b/your_cache_kv_namespace_id/g' wrangler.toml

# Replace worker URLs
find . -type f \( -name "*.sh" -o -name "*.js" -o -name "*.md" \) -exec sed -i.bak 's/keendreams\.terry-c67\.workers\.dev/${KEENDREAMS_URL:-keendreams.workers.dev}/g' {} +

echo "✅ Secrets removed! Review changes and delete .backup files when satisfied."
echo "⚠️  Remember to set environment variables before running scripts!"
```

---

## 📞 Contact & Support

**Report Security Issues:** If you discover additional security vulnerabilities, please report them immediately to the project maintainer.

**Audit Completed By:** Automated Security Scanner
**Next Audit Due:** Before each major release

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Files Scanned | 45+ |
| Files with Critical Issues | 2 |
| Files with High Risk Issues | 3 |
| Files with Medium Risk Issues | 15+ |
| Critical Secrets Found | 1 (API key) |
| Namespace IDs Exposed | 3 |
| Private URLs Found | 1 domain |
| Recommended Actions | 12 |

**Status:** 🔴 **CRITICAL - DO NOT DEPLOY WITHOUT REMEDIATION**

---

*This audit report should be reviewed by the development team before any code is committed to version control or deployed to production.*
