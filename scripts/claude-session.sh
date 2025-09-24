#!/bin/bash

# Claude Session Manager
# Automatically captures and restores project context

PROJECT_PATH=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_PATH")
SESSION_ID=$(date +%Y%m%d_%H%M%S)
SESSION_DATE=$(date +"%Y-%m-%d")
CLAUDE_MD="CLAUDE.md"
SESSION_MD="session_${SESSION_DATE}.md"
WORKER_URL="${CLAUDE_MEMORY_URL:-https://claude-memory.your-domain.workers.dev}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

function capture_session() {
    echo -e "${BLUE}📸 Capturing Claude session...${NC}"
    
    # Get git info
    LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s" 2>/dev/null || echo "No git history")
    BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
    
    # Get file structure
    FILE_STRUCTURE=$(find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.md" 2>/dev/null | head -20)
    
    # Get dependencies
    DEPENDENCIES=""
    if [ -f "package.json" ]; then
        DEPENDENCIES=$(cat package.json | grep -A 20 '"dependencies"')
    elif [ -f "requirements.txt" ]; then
        DEPENDENCIES=$(cat requirements.txt | head -20)
    fi
    
    # Read current session.md if exists
    CURRENT_TASKS=""
    COMPLETED_TASKS=""
    KEY_DECISIONS=""
    BLOCKERS=""
    NEXT_STEPS=""
    
    if [ -f "$SESSION_MD" ]; then
        echo -e "${GREEN}✓ Found existing session file${NC}"
        # Parse session.md for context (simplified - you might want to use jq or python for complex parsing)
        CURRENT_TASKS=$(grep -A 10 "## Current Tasks" "$SESSION_MD" 2>/dev/null | tail -n +2 || echo "")
        COMPLETED_TASKS=$(grep -A 10 "## Completed Tasks" "$SESSION_MD" 2>/dev/null | tail -n +2 || echo "")
    fi
    
    # Create session data JSON
    cat > /tmp/claude_session.json <<EOF
{
  "id": "${SESSION_ID}",
  "projectPath": "${PROJECT_PATH}",
  "projectName": "${PROJECT_NAME}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "context": {
    "summary": "$(head -n 20 ${CLAUDE_MD} 2>/dev/null | tr '\n' ' ' || echo 'No CLAUDE.md found')",
    "techStack": $(detect_tech_stack),
    "currentTasks": $(echo "$CURRENT_TASKS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "completedTasks": $(echo "$COMPLETED_TASKS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "fileStructure": $(echo "$FILE_STRUCTURE" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "dependencies": {},
    "lastCommit": "${LAST_COMMIT}",
    "customNotes": "$(tail -n 50 ${SESSION_MD} 2>/dev/null | grep -A 5 "## Notes" | tail -n +2 | tr '\n' ' ' || echo '')"
  },
  "conversation": {
    "keyDecisions": $(echo "$KEY_DECISIONS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "blockers": $(echo "$BLOCKERS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]'),
    "nextSteps": $(echo "$NEXT_STEPS" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]')
  },
  "metadata": {
    "claudeVersion": "claude-3",
    "duration": 0
  }
}
EOF
    
    # Upload to Cloudflare
    echo -e "${BLUE}☁️  Uploading to Cloudflare...${NC}"
    response=$(curl -s -X POST "${WORKER_URL}/session" \
        -H "Content-Type: application/json" \
        -d @/tmp/claude_session.json)
    
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✓ Session saved to cloud!${NC}"
        echo -e "${GREEN}Session ID: ${SESSION_ID}${NC}"
    else
        echo -e "${YELLOW}⚠ Cloud save failed, saving locally${NC}"
        cp /tmp/claude_session.json ".claude_session_${SESSION_ID}.json"
    fi
    
    # Generate next day prompt
    generate_next_prompt
}

function restore_session() {
    echo -e "${BLUE}🔄 Restoring Claude session...${NC}"
    
    # Try to get from Cloudflare first
    response=$(curl -s "${WORKER_URL}/session/latest/${PROJECT_PATH}" 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$response" | grep -q "projectName"; then
        echo -e "${GREEN}✓ Found cloud session${NC}"
        echo "$response" > /tmp/last_session.json
        
        # Generate summary for Claude
        summary=$(curl -s "${WORKER_URL}/summary/${PROJECT_PATH}")
        echo "$summary" > RESTORED_CONTEXT.md
        echo -e "${GREEN}✓ Context restored to RESTORED_CONTEXT.md${NC}"
    else
        echo -e "${YELLOW}⚠ No cloud session found, checking local${NC}"
        latest_session=$(ls -t .claude_session_*.json 2>/dev/null | head -1)
        if [ -n "$latest_session" ]; then
            echo -e "${GREEN}✓ Found local session: $latest_session${NC}"
            cat "$latest_session" > /tmp/last_session.json
        else
            echo -e "${YELLOW}No previous session found${NC}"
            return 1
        fi
    fi
    
    # Display summary
    echo -e "\n${BLUE}📋 Session Summary:${NC}"
    cat RESTORED_CONTEXT.md 2>/dev/null || cat /tmp/last_session.json | jq -r '.context.summary'
}

function generate_next_prompt() {
    cat > NEXT_SESSION_PROMPT.md <<EOF
# Claude Continuation Prompt for $(date -d tomorrow +%Y-%m-%d)

Please load the context from RESTORED_CONTEXT.md and continue where we left off.

## Priority Tasks
$(grep -A 5 "## Next Steps" ${SESSION_MD} 2>/dev/null || echo "1. Review previous session")

## Context Reminder
- Project: ${PROJECT_NAME}
- Path: ${PROJECT_PATH}
- Last session: ${SESSION_DATE}

## Start Command
\`\`\`bash
claude-session restore
\`\`\`

Then review the RESTORED_CONTEXT.md file to understand the current state.
EOF
    
    echo -e "${GREEN}✓ Next session prompt saved to NEXT_SESSION_PROMPT.md${NC}"
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

function auto_update_session() {
    echo -e "${BLUE}🔄 Auto-updating session.md...${NC}"
    
    if [ ! -f "$SESSION_MD" ]; then
        cat > "$SESSION_MD" <<EOF
# Working Session - ${SESSION_DATE}

## Project: ${PROJECT_NAME}
**Branch:** $(git branch --show-current 2>/dev/null || echo "main")
**Started:** $(date +"%I:%M %p")

## Current Tasks
- [ ] Review CLAUDE.md for architecture
- [ ] Continue from previous session

## Completed Tasks

## Key Decisions

## Blockers

## Next Steps

## Notes

---
*Auto-generated by claude-session manager*
EOF
    fi
    
    # Append timestamp
    echo -e "\n### Update: $(date +"%I:%M %p")" >> "$SESSION_MD"
}

# Main command handler
case "${1:-help}" in
    capture|save)
        capture_session
        ;;
    restore|load)
        restore_session
        ;;
    update)
        auto_update_session
        ;;
    prompt)
        generate_next_prompt
        ;;
    init)
        echo -e "${BLUE}Initializing Claude session management...${NC}"
        touch "$CLAUDE_MD"
        auto_update_session
        echo -e "${GREEN}✓ Initialized! Edit CLAUDE.md with your architecture${NC}"
        ;;
    *)
        echo "Claude Session Manager"
        echo "Usage: claude-session [command]"
        echo ""
        echo "Commands:"
        echo "  init     - Initialize session management"
        echo "  capture  - Save current session to cloud"
        echo "  restore  - Restore latest session from cloud"
        echo "  update   - Update session.md file"
        echo "  prompt   - Generate next day prompt"
        ;;
esac