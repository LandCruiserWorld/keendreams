#!/bin/bash

# Claude Dream Manager 🌙
# Captures and restores your project "dreams" across Claude sessions

PROJECT_PATH=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_PATH")
DREAM_ID=$(date +%Y%m%d_%H%M%S)
DREAM_DATE=$(date +"%Y-%m-%d")
CLAUDE_MD="CLAUDE.md"
DREAM_MD="dream_${DREAM_DATE}.md"
WORKER_URL="${KEENDREAMS_URL:-https://keendreams.workers.dev}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m'

function capture_dream() {
    echo -e "${PURPLE}🌙 Capturing your Claude dream...${NC}"
    
    # Get git info
    LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s" 2>/dev/null || echo "No git history")
    BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
    
    # Get file structure
    FILE_STRUCTURE=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.md" \) 2>/dev/null | grep -v node_modules | head -20)
    
    # Get dependencies
    DEPENDENCIES=""
    if [ -f "package.json" ]; then
        DEPENDENCIES=$(cat package.json | grep -A 20 '"dependencies"')
    elif [ -f "requirements.txt" ]; then
        DEPENDENCIES=$(cat requirements.txt | head -20)
    fi
    
    # Read current dream.md if exists
    CURRENT_TASKS=""
    COMPLETED_TASKS=""
    KEY_DECISIONS=""
    BLOCKERS=""
    NEXT_STEPS=""
    
    if [ -f "$DREAM_MD" ]; then
        echo -e "${GREEN}✓ Found today's dream journal${NC}"
        CURRENT_TASKS=$(grep -A 10 "## Current Tasks" "$DREAM_MD" 2>/dev/null | tail -n +2 || echo "")
        COMPLETED_TASKS=$(grep -A 10 "## Completed Tasks" "$DREAM_MD" 2>/dev/null | tail -n +2 || echo "")
    fi
    
    # Create dream data JSON
    cat > /tmp/claude_dream.json <<EOF
{
  "id": "${DREAM_ID}",
  "projectPath": "${PROJECT_PATH}",
  "projectName": "${PROJECT_NAME}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "context": {
    "summary": "$(head -n 20 ${CLAUDE_MD} 2>/dev/null | tr '\n' ' ' | sed 's/"/\\"/g' || echo 'No CLAUDE.md found')",
    "techStack": $(detect_tech_stack),
    "currentTasks": $(echo "$CURRENT_TASKS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "completedTasks": $(echo "$COMPLETED_TASKS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "fileStructure": $(echo "$FILE_STRUCTURE" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "dependencies": {},
    "lastCommit": "${LAST_COMMIT}",
    "customNotes": "$(tail -n 50 ${DREAM_MD} 2>/dev/null | grep -A 5 "## Notes" | tail -n +2 | tr '\n' ' ' | sed 's/"/\\"/g' || echo '')"
  },
  "conversation": {
    "keyDecisions": $(echo "$KEY_DECISIONS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "blockers": $(echo "$BLOCKERS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "nextSteps": $(echo "$NEXT_STEPS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]')
  },
  "metadata": {
    "claudeVersion": "claude-3-opus",
    "duration": 0
  }
}
EOF
    
    # Upload to Cloudflare
    echo -e "${BLUE}☁️  Uploading dream to the cloud...${NC}"
    response=$(curl -s -X POST "${WORKER_URL}/dream" \
        -H "Content-Type: application/json" \
        -d @/tmp/claude_dream.json)
    
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✨ Dream saved to cloud!${NC}"
        echo -e "${PURPLE}Dream ID: ${DREAM_ID}${NC}"
    else
        echo -e "${YELLOW}⚠ Cloud save failed, saving locally${NC}"
        cp /tmp/claude_dream.json ".claude_dream_${DREAM_ID}.json"
    fi
    
    # Generate next dream prompt
    generate_next_dream
}

function restore_dream() {
    echo -e "${PURPLE}🌙 Restoring your Claude dream...${NC}"
    
    # Try to get from Cloudflare first
    response=$(curl -s "${WORKER_URL}/dream/latest/$(echo $PROJECT_PATH | sed 's/\//%2F/g')" 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$response" | grep -q "projectName"; then
        echo -e "${GREEN}✨ Found your dream in the cloud${NC}"
        echo "$response" > /tmp/last_dream.json
        
        # Generate summary for Claude
        summary=$(curl -s "${WORKER_URL}/summary/$(echo $PROJECT_PATH | sed 's/\//%2F/g')")
        echo "$summary" > DREAM_RESTORED.md
        echo -e "${GREEN}✨ Dream restored to DREAM_RESTORED.md${NC}"
    else
        echo -e "${YELLOW}⚠ No cloud dream found, checking local dreams${NC}"
        latest_dream=$(ls -t .claude_dream_*.json 2>/dev/null | head -1)
        if [ -n "$latest_dream" ]; then
            echo -e "${GREEN}✓ Found local dream: $latest_dream${NC}"
            cat "$latest_dream" > /tmp/last_dream.json
        else
            echo -e "${YELLOW}No previous dreams found${NC}"
            return 1
        fi
    fi
    
    # Display summary
    echo -e "\n${PURPLE}🌙 Dream Summary:${NC}"
    cat DREAM_RESTORED.md 2>/dev/null || cat /tmp/last_dream.json | jq -r '.context.summary'
}

function generate_next_dream() {
    cat > NEXT_DREAM.md <<EOF
# 🌙 Claude Continuation Dream for $(date -d tomorrow +%Y-%m-%d)

Please load the dream context from DREAM_RESTORED.md and continue where we left off.

## Priority Tasks
$(grep -A 5 "## Next Steps" ${DREAM_MD} 2>/dev/null || echo "1. Review previous dream")

## Dream Context
- Project: ${PROJECT_NAME}
- Path: ${PROJECT_PATH} 
- Last dream: ${DREAM_DATE}

## Wake Command
\`\`\`bash
dream restore
\`\`\`

Then review DREAM_RESTORED.md to recall our journey.
EOF
    
    echo -e "${PURPLE}🌙 Next dream prompt saved to NEXT_DREAM.md${NC}"
}

function detect_tech_stack() {
    stack=()
    [ -f "package.json" ] && stack+=("Node.js")
    [ -f "tsconfig.json" ] && stack+=("TypeScript")
    [ -f "requirements.txt" ] && stack+=("Python")
    [ -f "Cargo.toml" ] && stack+=("Rust")
    [ -f "go.mod" ] && stack+=("Go")
    [ -d ".git" ] && stack+=("Git")
    [ -f "docker-compose.yml" ] && stack+=("Docker")
    
    printf '%s\n' "${stack[@]}" | jq -R . | jq -s .
}

function auto_update_dream() {
    echo -e "${PURPLE}🌙 Updating dream journal...${NC}"
    
    if [ ! -f "$DREAM_MD" ]; then
        cat > "$DREAM_MD" <<EOF
# 🌙 Dream Journal - ${DREAM_DATE}

## Project: ${PROJECT_NAME}
**Branch:** $(git branch --show-current 2>/dev/null || echo "main")
**Dream began:** $(date +"%I:%M %p")

## Current Tasks
- [ ] Review CLAUDE.md for architecture
- [ ] Continue from previous dream

## Completed Tasks

## Key Decisions

## Blockers

## Next Steps

## Dream Notes

---
*Recorded by Claude Dream Manager*
EOF
    fi
    
    # Append timestamp
    echo -e "\n### Dream update: $(date +"%I:%M %p")" >> "$DREAM_MD"
}

# Main command handler
case "${1:-help}" in
    capture|save)
        capture_dream
        ;;
    restore|wake)
        restore_dream
        ;;
    update|journal)
        auto_update_dream
        ;;
    next|prompt)
        generate_next_dream
        ;;
    init|begin)
        echo -e "${PURPLE}🌙 Initializing Claude dream management...${NC}"
        touch "$CLAUDE_MD"
        auto_update_dream
        echo -e "${GREEN}✨ Dream journal initialized! Edit CLAUDE.md with your vision${NC}"
        ;;
    *)
        echo -e "${PURPLE}🌙 Claude Dream Manager${NC}"
        echo "Usage: dream [command]"
        echo ""
        echo "Commands:"
        echo "  init     - Begin dream tracking"
        echo "  capture  - Save current dream to cloud"
        echo "  restore  - Restore latest dream from cloud"
        echo "  update   - Update dream journal"
        echo "  next     - Generate next dream prompt"
        ;;
esac