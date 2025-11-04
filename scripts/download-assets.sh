#!/bin/bash

# KeenDreams Visual Assets Download Script
# Downloads all priority images for README implementation
# Author: Image & Asset Research Team
# Date: November 4, 2025

set -e  # Exit on error

echo "🎨 KeenDreams Visual Assets Downloader"
echo "======================================"
echo ""

# Color codes for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create directory structure
echo -e "${BLUE}📁 Creating directory structure...${NC}"
mkdir -p assets/images/{hero,architecture,performance,infrastructure,deployment,brand}
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Track download statistics
TOTAL_DOWNLOADS=0
SUCCESSFUL_DOWNLOADS=0
FAILED_DOWNLOADS=0

# Function to download with retry and progress
download_image() {
    local url=$1
    local output=$2
    local description=$3

    echo -e "${BLUE}📥 Downloading: ${description}${NC}"

    if curl -L --progress-bar --max-time 30 -o "$output" "$url" 2>&1 | grep -v "^[[:space:]]*$"; then
        local size=$(du -h "$output" | cut -f1)
        echo -e "${GREEN}✓ Success: ${output} (${size})${NC}"
        ((SUCCESSFUL_DOWNLOADS++))
        return 0
    else
        echo -e "${YELLOW}✗ Failed: ${description}${NC}"
        ((FAILED_DOWNLOADS++))
        return 1
    fi
    echo ""
}

echo "🌟 PHASE 1: PRIORITY ASSETS (Must-Have)"
echo "========================================"
echo ""

# Hero Images (Priority: HIGH)
echo -e "${BLUE}=== Hero Images ===${NC}"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/dzlvafdwdttg/4TrmSfUqwNi5D8Aacs4QER/82602aaf6971340f597e558827459fa7/Cloudflare_Network_275__Cities_in_100__Countries.png" \
    "assets/images/hero/global-network-map.png" \
    "Global Network Map (330 cities)"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/6vNUUbJMhQo7TzovlT6YNN/a5a9bc8b8fee3417b20ad37fdc6b27c1/BLOG-2432-Hero.png" \
    "assets/images/hero/connectivity-cloud-banner.png" \
    "Connectivity Cloud Hero Banner"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/38RRu7BaumWFemL23JcFLW/fd1e4aced5095b1e04384984c88e48be/BLOG-2432-2.png" \
    "assets/images/hero/data-center-distribution.png" \
    "Data Center Distribution Map"

echo ""

# Architecture Diagrams (Priority: HIGH)
echo -e "${BLUE}=== Architecture Diagrams ===${NC}"

((TOTAL_DOWNLOADS++))
download_image \
    "https://developers.cloudflare.com/_astro/fullstack-app-base.BiQNPV9W_ZMmbOU.svg" \
    "assets/images/architecture/fullstack-application.svg" \
    "Fullstack Application Architecture (SVG)"

((TOTAL_DOWNLOADS++))
download_image \
    "https://developers.cloudflare.com/_astro/developer-platform.CqJ8bTq2_Z2hL90R.svg" \
    "assets/images/architecture/developer-platform.svg" \
    "Developer Platform Overview (SVG)"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/3pcw5pO2eeGJ1RriESJFSB/651fe26718f981eb741ad2ffb2f288c9/BLOG-2518_3.png" \
    "assets/images/architecture/kv-architecture-flow.png" \
    "Workers KV Architecture Flow"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/7mCpF8NRgSg70p8VNTFXu8/4cabdae18285575891f49a5cd34c9ab8/BLOG-2518_4.png" \
    "assets/images/architecture/kv-operation-trace.png" \
    "Simplified KV Operation Trace"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/1791aSxXPH1lgOIr3RQrLz/1685f6a57d627194e76cb657cd22ddd8/BLOG-2518_5.png" \
    "assets/images/architecture/tiered-cache.png" \
    "Tiered Cache Architecture"

echo ""

# Performance Charts (Priority: HIGH)
echo -e "${BLUE}=== Performance Charts ===${NC}"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/67VzWOTRpMd9Dbc6ZM7M4M/cefb1d856344d9c963d4adfbe1b32fba/BLOG-2518_2.png" \
    "assets/images/performance/kv-read-latency.png" \
    "Workers KV Read Latency (Sub-5ms)"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/1UmcRB0Afk8mHig2DrThsh/d913cd33a28c1c2b093379238a90551c/BLOG-2518_7.png" \
    "assets/images/performance/worker-wall-time.png" \
    "KV Worker Wall Time"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/1Gz2IxlcNuDDRp3MhC4m40/ee364b710cec4332a5c307a784f34fa4/BLOG-2518_8.png" \
    "assets/images/performance/cache-vs-backend.png" \
    "Tiered Cache vs Storage Backends"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/1A8CdaGq8P2hF3DtIs9dQI/a10fdf3af9de917fb0036d38eace9905/BLOG-2518_10.png" \
    "assets/images/performance/backbone-latency.png" \
    "Backbone Latency Comparison"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/1o0H8BNLf5ca8BBx38Q5Ee/5b22f7c0ad1c5c49a67bc5149763e81d/BLOG-2432-6.png" \
    "assets/images/performance/round-trip-time.png" \
    "Round-Trip Time Comparison"

echo ""

# Infrastructure (Priority: HIGH)
echo -e "${BLUE}=== Infrastructure Maps ===${NC}"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/1Fk6k5NOgfOM3qpK0z3wb0/2fe9631dbe6b2dfc6b3c3cd0156f293e/Screenshot_2024-08-28_at_3.21.50_PM.png" \
    "assets/images/infrastructure/backbone-topology.png" \
    "Backbone Network Topology"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/4WCNB78y1jHHsid46pBZOo/e950ced1e510cb8caeea0961c43ea8a0/BLOG-2432-5.png" \
    "assets/images/infrastructure/regional-expansion.png" \
    "Regional Infrastructure Expansion"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/4ZEEZJERWQ2UB1sdTjWUtM/f90b11507ab24edbf84e9b4cfb9b1155/BLOG-2432-7.png" \
    "assets/images/infrastructure/traffic-routing.png" \
    "Traffic Routing Visualization"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/66CGBePnLzuLRuTErvf8Cr/813b4b60a95935491e967214851e5a04/BLOG-2432-9.png" \
    "assets/images/infrastructure/network-resilience.png" \
    "Network Resilience During Outages"

echo ""
echo "🌟 PHASE 2: SUPPORTING ASSETS (Nice-to-Have)"
echo "============================================"
echo ""

# Deployment (Priority: MEDIUM)
echo -e "${BLUE}=== Deployment Visuals ===${NC}"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/4UY6OssNZTWy2vG4e7OFTb/adbb75e32c720f439e55181db1486c14/cloudflare-pages-goes-full-stack.png" \
    "assets/images/deployment/pages-fullstack.png" \
    "Cloudflare Pages Full Stack"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/6AIqWYs5VMYZhxNRAGoLvY/3b3c1572fba8a42b73f4712091d1c7a7/image2-15.png" \
    "assets/images/deployment/bindings-config.png" \
    "Bindings Configuration"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/zkvhlag99gkb/5TghCmJGOGyp3tdbWO6xmV/9cb9456f183c182837b9b0fd19d6b692/image3-21.png" \
    "assets/images/deployment/getting-started.png" \
    "Getting Started Guide"

echo ""

# Brand Assets (Priority: LOW)
echo -e "${BLUE}=== Brand Assets ===${NC}"

((TOTAL_DOWNLOADS++))
download_image \
    "https://cf-assets.www.cloudflare.com/dzlvafdwdttg/5hEMO0prBW3wDvchZU0iBZ/8e05bb4c55f8906e58d09dbc861c0f22/CF_logo_horizontal_singlecolor_wht.svg" \
    "assets/images/brand/cloudflare-logo-white.svg" \
    "Cloudflare Logo (White, SVG)"

# Note: Logo package is a ZIP file, handling separately
echo -e "${BLUE}📦 Note: Full logo package available at:${NC}"
echo "https://cf-assets.www.cloudflare.com/dzlvafdwdttg/2Twekn3xyYyd94qDYAl0ed/9ab649caa40958f195166e0d9f5d9a04/Logos.zip"
echo ""

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Download Complete!${NC}"
echo "======================================"
echo ""
echo "📊 Statistics:"
echo "  Total attempted: ${TOTAL_DOWNLOADS}"
echo -e "  ${GREEN}Successful: ${SUCCESSFUL_DOWNLOADS}${NC}"
if [ $FAILED_DOWNLOADS -gt 0 ]; then
    echo -e "  ${YELLOW}Failed: ${FAILED_DOWNLOADS}${NC}"
fi
echo ""

# Calculate total size
TOTAL_SIZE=$(du -sh assets/images/ | cut -f1)
echo "💾 Total downloaded: ${TOTAL_SIZE}"
echo ""

# List downloaded files
echo "📁 Downloaded files:"
find assets/images -type f -exec ls -lh {} \; | awk '{print "  " $9 " (" $5 ")"}'
echo ""

# Next steps
echo "✅ Next Steps:"
echo "  1. Review images: cd assets/images && open ."
echo "  2. Optimize PNGs: ./scripts/optimize-images.sh"
echo "  3. Update README: Use paths from quick-image-reference.md"
echo "  4. Test responsiveness: Open README.md in browser"
echo ""

echo "📚 Documentation:"
echo "  - Image catalog: docs/image-research-report.md"
echo "  - Quick reference: docs/quick-image-reference.md"
echo "  - Visual guide: docs/visual-storytelling-guide.md"
echo ""

echo -e "${GREEN}🚀 Ready to enhance your README!${NC}"
echo ""

# Create attribution file
cat > assets/images/ATTRIBUTION.md << 'EOF'
# Image Attribution

All images in this directory are sourced from Cloudflare's official press materials and blog posts.

## Attribution Requirements

When using these images in the KeenDreams README or other documentation:

### Minimum Attribution
```markdown
*Image source: [Cloudflare](https://www.cloudflare.com)*
```

### Footer Attribution
```markdown
Built on [Cloudflare's Developer Platform](https://developers.cloudflare.com)
```

## Image Sources

- **Hero Images**: Cloudflare Blog (backbone2024)
- **Architecture Diagrams**: Cloudflare Developer Documentation
- **Performance Charts**: Cloudflare Blog (faster-workers-kv)
- **Infrastructure Maps**: Cloudflare Network Blog Posts
- **Brand Assets**: Cloudflare Press Kit

## Licensing

These images are used for educational and promotional purposes under fair use principles. All images remain the property of Cloudflare, Inc.

For commercial use beyond this project, contact:
- **Email**: press@cloudflare.com
- **Phone**: +1 650-741-3104

## Official Resources

- Press Kit: https://www.cloudflare.com/press-kit/
- Developer Docs: https://developers.cloudflare.com
- Blog: https://blog.cloudflare.com

---

*Downloaded: November 4, 2025*
*Script: download-assets.sh*
EOF

echo -e "${GREEN}✓ Created ATTRIBUTION.md${NC}"
echo ""
