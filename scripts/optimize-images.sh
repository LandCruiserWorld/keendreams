#!/bin/bash

# KeenDreams Image Optimization Script
# Optimizes downloaded images for web delivery
# Author: Image & Asset Research Team
# Date: November 4, 2025

set -e

echo "🎨 KeenDreams Image Optimizer"
echo "=============================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check for required tools
check_tools() {
    echo -e "${BLUE}🔧 Checking required tools...${NC}"

    local missing_tools=()

    if ! command -v pngquant &> /dev/null; then
        missing_tools+=("pngquant")
    fi

    if ! command -v cwebp &> /dev/null; then
        missing_tools+=("webp")
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Missing optimization tools:${NC}"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        echo "Install with:"
        echo "  macOS: brew install pngquant webp"
        echo "  Ubuntu: sudo apt install pngquant webp"
        echo ""
        echo -e "${YELLOW}Continuing with available tools...${NC}"
        echo ""
        return 1
    fi

    echo -e "${GREEN}✓ All tools available${NC}"
    echo ""
    return 0
}

# Get directory sizes
get_size() {
    du -sh "$1" 2>/dev/null | cut -f1 || echo "0B"
}

# Optimize PNG files
optimize_pngs() {
    echo -e "${BLUE}📦 Optimizing PNG files...${NC}"

    local png_count=0
    local optimized_count=0

    while IFS= read -r -d '' file; do
        ((png_count++))
        local original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)

        echo "  Processing: $(basename "$file")"

        if pngquant --quality=65-80 --ext .png --force "$file" 2>/dev/null; then
            local new_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            local saved=$((original_size - new_size))
            local percent=$((saved * 100 / original_size))

            echo -e "    ${GREEN}✓ Saved: $percent% ($saved bytes)${NC}"
            ((optimized_count++))
        else
            echo -e "    ${YELLOW}⚠ Skipped (already optimized or error)${NC}"
        fi
    done < <(find assets/images -name "*.png" -type f -print0)

    echo ""
    echo "  Processed: $png_count PNG files"
    echo "  Optimized: $optimized_count files"
    echo ""
}

# Convert to WebP
convert_to_webp() {
    echo -e "${BLUE}🌐 Converting to WebP format...${NC}"

    local webp_count=0

    while IFS= read -r -d '' file; do
        local webp_file="${file%.*}.webp"

        if [ ! -f "$webp_file" ]; then
            echo "  Converting: $(basename "$file")"

            if cwebp -q 80 "$file" -o "$webp_file" 2>/dev/null; then
                local original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
                local webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
                local saved=$((original_size - webp_size))
                local percent=$((saved * 100 / original_size))

                echo -e "    ${GREEN}✓ Created: $(basename "$webp_file") (${percent}% smaller)${NC}"
                ((webp_count++))
            else
                echo -e "    ${YELLOW}⚠ Conversion failed${NC}"
            fi
        fi
    done < <(find assets/images -name "*.png" -o -name "*.jpg" -type f -print0)

    echo ""
    echo "  Created: $webp_count WebP files"
    echo ""
}

# Generate responsive versions
generate_responsive() {
    echo -e "${BLUE}📱 Generating responsive versions...${NC}"
    echo -e "${YELLOW}⚠️  Requires ImageMagick (convert command)${NC}"

    if ! command -v convert &> /dev/null; then
        echo "  Skipping (ImageMagick not installed)"
        echo "  Install: brew install imagemagick"
        echo ""
        return
    fi

    local responsive_count=0

    # Generate mobile versions (800px wide)
    while IFS= read -r -d '' file; do
        local dir=$(dirname "$file")
        local filename=$(basename "$file")
        local mobile_file="${dir}/mobile-${filename}"

        if [ ! -f "$mobile_file" ]; then
            echo "  Creating mobile version: $(basename "$file")"

            if convert "$file" -resize 800x "$mobile_file" 2>/dev/null; then
                echo -e "    ${GREEN}✓ Created: mobile-$(basename "$file")${NC}"
                ((responsive_count++))
            fi
        fi
    done < <(find assets/images -name "*.png" -o -name "*.jpg" | grep -v "^mobile-" | head -5)

    echo ""
    echo "  Created: $responsive_count mobile versions"
    echo ""
}

# Create image manifest
create_manifest() {
    echo -e "${BLUE}📝 Creating image manifest...${NC}"

    cat > assets/images/MANIFEST.md << 'EOF'
# Image Manifest

This file provides quick reference information about all images in this directory.

## Image Inventory

EOF

    # Add hero images
    echo "### Hero Images" >> assets/images/MANIFEST.md
    echo "" >> assets/images/MANIFEST.md
    find assets/images/hero -type f -name "*.png" -o -name "*.svg" | while read file; do
        local size=$(du -h "$file" | cut -f1)
        echo "- \`$(basename "$file")\` - $size" >> assets/images/MANIFEST.md
    done
    echo "" >> assets/images/MANIFEST.md

    # Add architecture diagrams
    echo "### Architecture Diagrams" >> assets/images/MANIFEST.md
    echo "" >> assets/images/MANIFEST.md
    find assets/images/architecture -type f 2>/dev/null | while read file; do
        local size=$(du -h "$file" | cut -f1)
        echo "- \`$(basename "$file")\` - $size" >> assets/images/MANIFEST.md
    done
    echo "" >> assets/images/MANIFEST.md

    # Add performance charts
    echo "### Performance Charts" >> assets/images/MANIFEST.md
    echo "" >> assets/images/MANIFEST.md
    find assets/images/performance -type f 2>/dev/null | while read file; do
        local size=$(du -h "$file" | cut -f1)
        echo "- \`$(basename "$file")\` - $size" >> assets/images/MANIFEST.md
    done
    echo "" >> assets/images/MANIFEST.md

    # Add infrastructure maps
    echo "### Infrastructure Maps" >> assets/images/MANIFEST.md
    echo "" >> assets/images/MANIFEST.md
    find assets/images/infrastructure -type f 2>/dev/null | while read file; do
        local size=$(du -h "$file" | cut -f1)
        echo "- \`$(basename "$file")\` - $size" >> assets/images/MANIFEST.md
    done
    echo "" >> assets/images/MANIFEST.md

    # Add summary
    cat >> assets/images/MANIFEST.md << 'EOF'

## Usage Guidelines

### In Markdown
```markdown
![Alt text](./assets/images/hero/global-network-map.png)
```

### With WebP Fallback
```html
<picture>
  <source srcset="./assets/images/hero/global-network-map.webp" type="image/webp">
  <img src="./assets/images/hero/global-network-map.png" alt="Alt text">
</picture>
```

### Responsive
```html
<picture>
  <source media="(max-width: 768px)" srcset="./assets/images/hero/mobile-global-network-map.png">
  <img src="./assets/images/hero/global-network-map.png" alt="Alt text">
</picture>
```

---

*Generated: $(date)*
*Last optimized: $(date)*
EOF

    echo -e "${GREEN}✓ Created MANIFEST.md${NC}"
    echo ""
}

# Main execution
main() {
    local before_size=$(get_size "assets/images")

    echo "Starting optimization..."
    echo "Original size: $before_size"
    echo ""

    # Check if assets directory exists
    if [ ! -d "assets/images" ]; then
        echo -e "${RED}❌ Error: assets/images directory not found${NC}"
        echo "Run ./scripts/download-assets.sh first"
        exit 1
    fi

    # Check tools
    local has_tools
    check_tools && has_tools=true || has_tools=false

    # Run optimizations
    if [ "$has_tools" = true ]; then
        if command -v pngquant &> /dev/null; then
            optimize_pngs
        fi

        if command -v cwebp &> /dev/null; then
            convert_to_webp
        fi

        generate_responsive
    else
        echo -e "${YELLOW}⚠️  Optimization tools not available${NC}"
        echo "Skipping optimization steps"
        echo ""
    fi

    # Always create manifest
    create_manifest

    # Summary
    local after_size=$(get_size "assets/images")

    echo "======================================"
    echo -e "${GREEN}🎉 Optimization Complete!${NC}"
    echo "======================================"
    echo ""
    echo "📊 Statistics:"
    echo "  Before: $before_size"
    echo "  After:  $after_size"
    echo ""

    # Count files
    local png_count=$(find assets/images -name "*.png" | wc -l | tr -d ' ')
    local webp_count=$(find assets/images -name "*.webp" 2>/dev/null | wc -l | tr -d ' ')
    local svg_count=$(find assets/images -name "*.svg" 2>/dev/null | wc -l | tr -d ' ')

    echo "📁 File inventory:"
    echo "  PNG files:  $png_count"
    echo "  WebP files: $webp_count"
    echo "  SVG files:  $svg_count"
    echo ""

    echo "✅ Next Steps:"
    echo "  1. Review MANIFEST.md for file inventory"
    echo "  2. Test images in README.md"
    echo "  3. Check mobile responsiveness"
    echo "  4. Commit optimized images to git"
    echo ""

    echo -e "${GREEN}🚀 Images ready for production!${NC}"
    echo ""
}

# Run main function
main "$@"
