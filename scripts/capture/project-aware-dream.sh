#!/bin/bash

# Project-Aware Dream Manager 🚀
# Handles context switching between different projects intelligently

PROJECT_PATH=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_PATH")

# Configuration
WORKER_URL="${KEENDREAMS_URL:-https://keendreams.workers.dev}"
API_KEY="${KEENDREAMS_API_KEY:?Error: KEENDREAMS_API_KEY environment variable required. Please set it with: export KEENDREAMS_API_KEY='your-api-key'}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Project context file
PROJECT_CONTEXT_FILE=".project_context.json"
GLOBAL_PROJECT_INDEX="$HOME/.claude_projects.json"

function detect_project_type() {
    echo -e "${BLUE}🔍 Analyzing project type...${NC}"
    
    local project_type="unknown"
    local tech_stack=()
    local framework=""
    
    # Node.js/JavaScript detection
    if [ -f "package.json" ]; then
        tech_stack+=("Node.js")
        if grep -q '"react"' package.json 2>/dev/null; then
            tech_stack+=("React")
            framework="React"
        fi
        if grep -q '"next"' package.json 2>/dev/null; then
            tech_stack+=("Next.js")
            framework="Next.js"
        fi
        if grep -q '"express"' package.json 2>/dev/null; then
            tech_stack+=("Express")
        fi
        if grep -q '"@cloudflare/workers"' package.json 2>/dev/null; then
            tech_stack+=("Cloudflare Workers")
        fi
        project_type="web"
    fi
    
    # Python detection
    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
        tech_stack+=("Python")
        project_type="python"
        
        # AI/ML detection
        if ls *.py 2>/dev/null | xargs grep -l "tensorflow\|torch\|sklearn\|numpy" >/dev/null 2>&1; then
            tech_stack+=("Machine Learning")
            project_type="ml"
        fi
        
        if [ -f "model.py" ] || [ -f "train.py" ]; then
            tech_stack+=("AI/ML")
            project_type="ai"
        fi
    fi
    
    # Go detection
    if [ -f "go.mod" ]; then
        tech_stack+=("Go")
        project_type="go"
    fi
    
    # Infrastructure detection
    if [ -f "Dockerfile" ]; then
        tech_stack+=("Docker")
    fi
    
    if [ -f "docker-compose.yml" ]; then
        tech_stack+=("Docker Compose")
    fi
    
    if [ -f "wrangler.toml" ]; then
        tech_stack+=("Cloudflare Workers")
        project_type="edge"
    fi
    
    if [ -f "vercel.json" ]; then
        tech_stack+=("Vercel")
    fi
    
    # Create project context
    local context='{
        "name": "'$PROJECT_NAME'",
        "path": "'$PROJECT_PATH'",
        "type": "'$project_type'",
        "framework": "'$framework'",
        "techStack": ['$(IFS=,; echo "${tech_stack[*]}" | sed 's/[^,]*/"&"/g')'],
        "detectedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }'
    
    echo "$context" > "$PROJECT_CONTEXT_FILE"
    echo -e "${GREEN}📋 Project: ${PROJECT_NAME} (${project_type}) - Stack: ${tech_stack[*]}${NC}"
}

function register_project_globally() {
    echo -e "${CYAN}🌍 Registering project globally...${NC}"
    
    # Ensure global index exists
    if [ ! -f "$GLOBAL_PROJECT_INDEX" ]; then
        echo '{"projects": {}}' > "$GLOBAL_PROJECT_INDEX"
    fi
    
    # Get git info if available
    local git_repo=""
    local git_branch=""
    if git remote get-url origin >/dev/null 2>&1; then
        git_repo=$(git remote get-url origin 2>/dev/null || echo "")
        git_branch=$(git branch --show-current 2>/dev/null || echo "main")
    fi
    
    # Update global index
    local project_entry='{
        "path": "'$PROJECT_PATH'",
        "type": "'$(cat $PROJECT_CONTEXT_FILE | jq -r '.type // "unknown"')'",
        "techStack": '$(cat $PROJECT_CONTEXT_FILE | jq '.techStack // []')',
        "gitRepo": "'$git_repo'",
        "branch": "'$git_branch'",
        "lastAccessed": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }'
    
    # Use jq to update the global index
    if command -v jq >/dev/null 2>&1; then
        local temp_file=$(mktemp)
        jq --arg name "$PROJECT_NAME" --argjson entry "$project_entry" '.projects[$name] = $entry' "$GLOBAL_PROJECT_INDEX" > "$temp_file" && mv "$temp_file" "$GLOBAL_PROJECT_INDEX"
    fi
    
    echo -e "${GREEN}✓ Project registered in global index${NC}"
}

function check_project_conflicts() {
    echo -e "${YELLOW}⚠️ Checking for potential conflicts...${NC}"
    
    if [ ! -f "$GLOBAL_PROJECT_INDEX" ]; then
        return 0
    fi
    
    local current_type=$(cat "$PROJECT_CONTEXT_FILE" | jq -r '.type // "unknown"')
    local current_stack=$(cat "$PROJECT_CONTEXT_FILE" | jq -r '.techStack[]?' | tr '\n' ' ')
    
    # Check for recent work on different project types
    if command -v jq >/dev/null 2>&1; then
        local recent_projects=$(jq -r '.projects | to_entries[] | select(.value.lastAccessed > "'$(date -d '1 hour ago' -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -v-1H -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)'") | .key + ":" + .value.type' "$GLOBAL_PROJECT_INDEX" 2>/dev/null)
        
        if [ -n "$recent_projects" ]; then
            echo -e "${CYAN}📊 Recent project activity:${NC}"
            echo "$recent_projects" | while IFS=':' read -r proj_name proj_type; do
                if [ "$proj_name" != "$PROJECT_NAME" ]; then
                    echo -e "${BLUE}  • $proj_name ($proj_type)${NC}"
                    
                    # Warn about stack differences
                    if [ "$proj_type" = "python" ] && echo "$current_stack" | grep -q "Node.js"; then
                        echo -e "${YELLOW}    ⚠️ Stack switch: Python → Node.js (pip vs npm)${NC}"
                    elif [ "$proj_type" = "web" ] && echo "$current_stack" | grep -q "Python"; then
                        echo -e "${YELLOW}    ⚠️ Stack switch: Node.js → Python (npm vs pip)${NC}"
                    fi
                fi
            done
        fi
    fi
}

function get_project_specific_commands() {
    local project_type=$(cat "$PROJECT_CONTEXT_FILE" | jq -r '.type // "unknown"')
    
    case "$project_type" in
        "web"|"edge")
            echo '["npm install", "npm run dev", "npm run build", "npm run deploy"]'
            ;;
        "python"|"ai"|"ml")
            echo '["pip install -r requirements.txt", "python -m venv env", "source env/bin/activate", "python main.py"]'
            ;;
        "go")
            echo '["go mod tidy", "go run main.go", "go build", "go test"]'
            ;;
        *)
            echo '["git status", "git add .", "git commit", "git push"]'
            ;;
    esac
}

function generate_project_wake_context() {
    echo -e "${PURPLE}🌟 Generating project-specific wake context...${NC}"
    
    local tech_stack=$(cat "$PROJECT_CONTEXT_FILE" | jq -r '.techStack[]?' | tr '\n' ',' | sed 's/,$//')
    local project_type=$(cat "$PROJECT_CONTEXT_FILE" | jq -r '.type // "unknown"')
    local framework=$(cat "$PROJECT_CONTEXT_FILE" | jq -r '.framework // ""')
    
    # Git context
    local git_branch=$(git branch --show-current 2>/dev/null || echo "main")
    local git_status=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    local last_commit=$(git log -1 --pretty=format:"%h - %s (%cr)" 2>/dev/null || echo "No commits")
    
    # Project-specific context
    local common_commands=$(get_project_specific_commands)
    
    cat > PROJECT_WAKE_CONTEXT.md <<EOF
# 🚀 Project Wake Context: ${PROJECT_NAME}

## Project Overview
- **Type**: ${project_type}
- **Tech Stack**: ${tech_stack}
- **Framework**: ${framework}
- **Path**: ${PROJECT_PATH}

## Git Status
- **Branch**: ${git_branch}
- **Uncommitted files**: ${git_status}
- **Last commit**: ${last_commit}

## Common Commands for This Project
EOF

    echo "$common_commands" | jq -r '.[]' | while read -r cmd; do
        echo "- \`$cmd\`" >> PROJECT_WAKE_CONTEXT.md
    done

    cat >> PROJECT_WAKE_CONTEXT.md <<EOF

## Project-Specific Notes
- This is a **${project_type}** project
- Primary language/framework: **${framework:-$tech_stack}**
- Remember to use the right package manager and commands

## Recent Activity Context
$([ "$git_status" -gt 0 ] && echo "⚠️ You have uncommitted changes - review before switching projects" || echo "✅ Working directory is clean")

---
*Generated at $(date)*
EOF

    echo -e "${GREEN}📝 Project wake context saved to PROJECT_WAKE_CONTEXT.md${NC}"
}

function project_aware_capture() {
    echo -e "${PURPLE}🚀 Project-Aware Dream Capture Starting...${NC}"
    
    # Detect and register project
    detect_project_type
    register_project_globally
    check_project_conflicts
    
    # Generate project context
    generate_project_wake_context
    
    # Enhanced capture with project context
    local dream_id="project_aware_$(date +%Y%m%d_%H%M%S)"
    local tech_stack=$(cat "$PROJECT_CONTEXT_FILE" | jq '.techStack')
    local project_type=$(cat "$PROJECT_CONTEXT_FILE" | jq -r '.type')
    
    # Call enhanced capture with project awareness
    KEENDREAMS_URL="$WORKER_URL" KEENDREAMS_API_KEY="$API_KEY" ./scripts/enhanced-claude-dream.sh capture
    
    # Add project-specific metadata to the dream
    if [ -f ".enhanced_dream_enhanced_"*".json" ]; then
        local latest_dream=$(ls -t .enhanced_dream_enhanced_*.json | head -1)
        if [ -n "$latest_dream" ] && command -v jq >/dev/null 2>&1; then
            # Add project metadata
            local temp_file=$(mktemp)
            jq --arg ptype "$project_type" --argjson stack "$tech_stack" '.metadata.projectType = $ptype | .metadata.projectTechStack = $stack | .metadata.projectAware = true' "$latest_dream" > "$temp_file" && mv "$temp_file" "$latest_dream"
        fi
    fi
    
    echo -e "${GREEN}🌟 Project-aware dream capture completed!${NC}"
    echo -e "${CYAN}📋 Project context saved for intelligent restoration${NC}"
}

function project_aware_restore() {
    echo -e "${PURPLE}🚀 Project-Aware Dream Restoration...${NC}"
    
    # Detect current project
    detect_project_type
    
    # Show project switch context if needed
    if [ -f "$GLOBAL_PROJECT_INDEX" ] && command -v jq >/dev/null 2>&1; then
        local last_project=$(jq -r '.projects | to_entries | sort_by(.value.lastAccessed) | reverse | .[0] | select(.key != "'$PROJECT_NAME'") | .key + " (" + .value.type + ")"' "$GLOBAL_PROJECT_INDEX" 2>/dev/null)
        
        if [ -n "$last_project" ]; then
            echo -e "${YELLOW}🔄 Context switch detected: Last worked on $last_project${NC}"
            check_project_conflicts
        fi
    fi
    
    # Update global index
    register_project_globally
    
    # Generate current project context
    generate_project_wake_context
    
    echo -e "${CYAN}📖 Project context loaded - you're now in ${PROJECT_NAME}${NC}"
    
    # Call enhanced restore
    KEENDREAMS_URL="$WORKER_URL" KEENDREAMS_API_KEY="$API_KEY" ./scripts/enhanced-claude-dream.sh restore
}

function list_projects() {
    echo -e "${PURPLE}🌍 Your Projects${NC}"
    
    if [ ! -f "$GLOBAL_PROJECT_INDEX" ]; then
        echo -e "${YELLOW}No projects registered yet${NC}"
        return
    fi
    
    if command -v jq >/dev/null 2>&1; then
        jq -r '.projects | to_entries[] | .key + " (" + .value.type + ") - " + .value.path' "$GLOBAL_PROJECT_INDEX" | while read -r line; do
            echo -e "${BLUE}📁 $line${NC}"
        done
    else
        echo -e "${YELLOW}Install jq for better project listing${NC}"
        cat "$GLOBAL_PROJECT_INDEX"
    fi
}

function show_help() {
    echo -e "${PURPLE}🚀 Project-Aware Dream Manager${NC}"
    echo ""
    echo "Commands:"
    echo "  capture   - Capture dream with full project context"
    echo "  restore   - Restore dream with project awareness"
    echo "  projects  - List all registered projects"
    echo "  detect    - Detect and analyze current project"
    echo "  help      - Show this help"
    echo ""
    echo "Features:"
    echo "  🔍 Automatic project type detection"
    echo "  ⚠️  Context switching warnings"
    echo "  🏗️  Tech stack awareness"
    echo "  📊 Cross-project intelligence"
    echo "  🌍 Global project registry"
    echo ""
    echo "Example:"
    echo "  cd ~/projects/aifi && ./scripts/project-aware-dream.sh capture"
    echo "  cd ~/projects/shush && ./scripts/project-aware-dream.sh restore"
}

# Main command router
case "$1" in
    "capture")
        project_aware_capture
        ;;
    "restore")
        project_aware_restore
        ;;
    "projects")
        list_projects
        ;;
    "detect")
        detect_project_type
        register_project_globally
        check_project_conflicts
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        show_help
        ;;
esac