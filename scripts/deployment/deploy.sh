#!/bin/bash
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying KeenDreams with Anti-Overload Protection${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler not installed. Installing...${NC}"
    npm install -g wrangler
fi

# Login check
echo -e "${YELLOW}🔐 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Cloudflare. Please run: wrangler login${NC}"
    exit 1
fi

# Create KV namespace with error handling (updated syntax)
echo -e "${YELLOW}📦 Setting up KV namespace...${NC}"
KV_OUTPUT=$(wrangler kv namespace create "KEENDREAMS_KV" 2>&1) || true

# Extract namespace ID more reliably  
NAMESPACE_ID=""
if echo "$KV_OUTPUT" | grep -q "id ="; then
    NAMESPACE_ID=$(echo "$KV_OUTPUT" | grep "id =" | cut -d'"' -f2)
elif wrangler kv namespace list | grep -q "KEENDREAMS_KV"; then
    NAMESPACE_ID=$(wrangler kv namespace list | grep "KEENDREAMS_KV" | head -1 | sed 's/.*id: "\([^"]*\)".*/\1/')
fi

if [ -z "$NAMESPACE_ID" ]; then
    echo -e "${RED}❌ Could not get KV namespace ID. Please check manually.${NC}"
    wrangler kv namespace list
    exit 1
fi

echo -e "${GREEN}✅ KV Namespace ID: $NAMESPACE_ID${NC}"

# Backup original wrangler.toml
cp wrangler.toml wrangler.toml.backup

# Update wrangler.toml with the actual KV namespace ID
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/your_kv_namespace_id/$NAMESPACE_ID/g" wrangler.toml
    sed -i '' "s/your_preview_kv_id/$NAMESPACE_ID/g" wrangler.toml
else
    # Linux
    sed -i "s/your_kv_namespace_id/$NAMESPACE_ID/g" wrangler.toml
    sed -i "s/your_preview_kv_id/$NAMESPACE_ID/g" wrangler.toml
fi

# Set the API key as a secret (more secure than vars)
echo -e "${YELLOW}🔐 Setting API key as secret...${NC}"
if [ -z "$KEENDREAMS_API_KEY" ]; then
  echo "Error: KEENDREAMS_API_KEY environment variable not set"
  echo "Please set your API key: export KEENDREAMS_API_KEY='your-secure-key-here'"
  exit 1
fi
echo "$KEENDREAMS_API_KEY" | wrangler secret put KEENDREAMS_API_KEY || echo "Secret already set"

# Deploy with retry logic
echo -e "${YELLOW}☁️ Deploying worker with anti-overload protection...${NC}"
DEPLOY_ATTEMPTS=0
MAX_DEPLOY_ATTEMPTS=3

while [ $DEPLOY_ATTEMPTS -lt $MAX_DEPLOY_ATTEMPTS ]; do
    if wrangler deploy; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        break
    else
        DEPLOY_ATTEMPTS=$((DEPLOY_ATTEMPTS + 1))
        if [ $DEPLOY_ATTEMPTS -lt $MAX_DEPLOY_ATTEMPTS ]; then
            echo -e "${YELLOW}⏱️ Deployment failed, retrying in 10 seconds... (attempt $DEPLOY_ATTEMPTS/$MAX_DEPLOY_ATTEMPTS)${NC}"
            sleep 10
        else
            echo -e "${RED}❌ Deployment failed after $MAX_DEPLOY_ATTEMPTS attempts${NC}"
            # Restore backup
            mv wrangler.toml.backup wrangler.toml
            exit 1
        fi
    fi
done

# Wait for deployment to propagate
echo -e "${YELLOW}⏳ Waiting for deployment to propagate...${NC}"
sleep 15

# Test with retry logic and better error handling
echo -e "${YELLOW}✅ Testing endpoints with retry logic...${NC}"

test_endpoint() {
    local url=$1
    local auth=$2
    local description=$3
    local max_attempts=5
    local attempt=1
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if [ -n "$auth" ]; then
            response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $auth" "$url" 2>/dev/null) || response=""
        else
            response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null) || response=""
        fi
        
        http_code="${response: -3}"
        body="${response%???}"
        
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✅ Success (200) - $description${NC}"
            if command -v jq &> /dev/null && echo "$body" | jq . &> /dev/null; then
                echo "$body" | jq .
            else
                echo "$body"
            fi
            return 0
        elif [ "$http_code" = "500" ]; then
            echo -e "${YELLOW}⏱️ Got 500 error, retrying... (attempt $attempt/$max_attempts)${NC}"
            sleep $((attempt * 2))  # Exponential backoff
        else
            echo -e "${RED}❌ HTTP $http_code - $description${NC}"
            echo "$body"
            return 1
        fi
        
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Max attempts reached for $description${NC}"
    return 1
}

# Get worker URL from environment or use default
WORKER_URL="${KEENDREAMS_URL:-https://keendreams.workers.dev}"

# Test health endpoint (no auth)
test_endpoint "$WORKER_URL/health" "" "Health check"

# Test stats endpoint (with auth)
test_endpoint "$WORKER_URL/stats" "$KEENDREAMS_API_KEY" "Stats endpoint"

# Test cache headers
echo -e "${YELLOW}📊 Testing cache headers...${NC}"
curl -I -s -H "Authorization: Bearer $KEENDREAMS_API_KEY" \
  $WORKER_URL/stats | grep -E "X-Cache|Cache-Control|X-RateLimit" || echo "Headers not yet available"

# Clean up backup
rm -f wrangler.toml.backup

echo -e "${GREEN}✨ KeenDreams deployed successfully with anti-overload protection!${NC}"
echo -e "${GREEN}🌐 Visit: $WORKER_URL${NC}"
echo -e "${GREEN}📊 Features enabled:${NC}"
echo -e "  • ${YELLOW}Circuit breaker${NC} - Prevents overload errors"
echo -e "  • ${YELLOW}Rate limiting${NC} - 60 requests/minute per IP" 
echo -e "  • ${YELLOW}Retry logic${NC} - 3 attempts with exponential backoff"
echo -e "  • ${YELLOW}Fallback stats${NC} - Always works even during outages"
echo -e "  • ${YELLOW}KV caching${NC} - Lightning fast edge performance"

echo -e "${GREEN}🔐 Bearer Token Security:${NC}"
echo -e "  • ${YELLOW}Transmitted over HTTPS${NC} - Encrypted in transit"
echo -e "  • ${YELLOW}Rate limited${NC} - Brute force protection"
echo -e "  • ${YELLOW}No logging${NC} - Token not stored in logs"
echo -e "  • ${YELLOW}Stateless${NC} - No server-side session storage"