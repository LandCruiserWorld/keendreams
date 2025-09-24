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
API_KEY="${KEENDREAMS_API_KEY:-ce07bf20b2f511955b11731c62937601097e75e278fe5d63f3da9240d93279fa}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m'

function capture_dream() {
    echo -e "${PURPLE}🌙 Capturing your Claude dream...${NC}"
    
    # Calculate session duration
    SESSION_DURATION=0
    if [ -f ".dream_session_start" ]; then
        SESSION_START=$(cat .dream_session_start)
        SESSION_END=$(date +%s)
        SESSION_DURATION=$((SESSION_END - SESSION_START))
        DURATION_HOURS=$(echo "scale=2; $SESSION_DURATION / 3600" | bc -l 2>/dev/null || echo "0")
        echo -e "${GREEN}⏰ Session duration: ${DURATION_HOURS} hours${NC}"
    fi
    
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
    "duration": $SESSION_DURATION,
    "durationHours": $(echo "scale=3; $SESSION_DURATION / 3600" | bc -l 2>/dev/null || echo "0")
  }
}
EOF
    
    # Upload to Cloudflare
    echo -e "${BLUE}☁️  Uploading dream to the cloud...${NC}"
    response=$(curl -s -X POST "${WORKER_URL}/dream" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_KEY}" \
        -d @/tmp/claude_dream.json)
    
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✨ Dream saved to cloud!${NC}"
        echo -e "${PURPLE}Dream ID: ${DREAM_ID}${NC}"
        
        # Clean up session tracking
        rm -f ".dream_session_start"
        echo -e "${GREEN}⏰ Session completed and logged${NC}"
    else
        echo -e "${YELLOW}⚠ Cloud save failed, saving locally${NC}"
        cp /tmp/claude_dream.json ".claude_dream_${DREAM_ID}.json"
    fi
    
    # Generate next dream prompt
    generate_next_dream
}

function restore_dream() {
    echo -e "${PURPLE}🌙 Restoring dream context...${NC}"
    
    # Try cloud first
    response=$(curl -s -H "Authorization: Bearer ${API_KEY}" "${WORKER_URL}/dream/latest/$(echo $PROJECT_PATH | sed 's/\//%2F/g')" 2>/dev/null)
    
    # Check if we got a valid dream response
    if echo "$response" | grep -q '"projectName"' && echo "$response" | grep -q '"timestamp"'; then
        echo -e "${GREEN}✨ Found dream in the cloud${NC}"
        echo "$response" | jq '.' > /tmp/last_dream.json
        
        # Extract wake-up context (handle both enhanced and standard dreams)
        WAKE_CONTEXT=$(echo "$response" | jq -r '.wakeUp.quickSummary // .context.summary // "Dream context restored"')
        LAST_INTENT=$(echo "$response" | jq -r '.wakeUp.lastIntent // .context.customNotes // "Continue development"')
        
        # Show dream summary
        echo -e "\n${PURPLE}🌙 Dream Context:${NC}"
        echo -e "${GREEN}Intent: ${LAST_INTENT}${NC}"
        echo -e "${BLUE}Context: ${WAKE_CONTEXT}${NC}"
        
        # Show working commands if available
        WORKING_COMMANDS=$(echo "$response" | jq -r '.wakeUp.workingCommands[]?.command // .conversation.commandHistory[]?.command // empty' 2>/dev/null)
        if [ -n "$WORKING_COMMANDS" ]; then
            echo -e "\n${GREEN}💻 Commands that worked:${NC}"
            echo "$WORKING_COMMANDS" | head -5 | while read cmd; do
                echo -e "${YELLOW}  $cmd${NC}"
            done
        fi
        
        # Show modified files if available
        MODIFIED_FILES=$(echo "$response" | jq -r '.wakeUp.modifiedFiles[]?.file // .conversation.codeChanges[]?.file // empty' 2>/dev/null)
        if [ -n "$MODIFIED_FILES" ]; then
            echo -e "\n${GREEN}📁 Files modified:${NC}"
            echo "$MODIFIED_FILES" | while read file; do
                echo -e "${YELLOW}  $file${NC}"
            done
        fi
        
        echo -e "\n${GREEN}🌟 Dream context restored!${NC}"
        
        # Generate summary for Claude
        summary=$(curl -s -H "Authorization: Bearer ${API_KEY}" "${WORKER_URL}/summary/$(echo $PROJECT_PATH | sed 's/\//%2F/g')")
        echo "$summary" > DREAM_RESTORED.md
        
        # Show complete project portfolio organized by activity
        echo -e "\n${BLUE}📋 Complete Project Portfolio:${NC}"
        
        # Fetch portfolio from KeenDreams API
        portfolio_response=$(curl -s "${WORKER_URL}/claude/portfolio" 2>/dev/null)
        
        if [ $? -eq 0 ] && command -v jq >/dev/null 2>&1; then
            echo -e "\n${GREEN}🔥 Recent Activity (Last 7 days):${NC}"
            echo "$portfolio_response" | jq -r '.activeProjects[]? | "  • " + .name + " [" + (.techStack | join(", ")) + "] - " + (.totalHours | tostring) + "h"' 2>/dev/null
            
            echo -e "\n${YELLOW}📅 Active (Last 30 days):${NC}"
            echo "$portfolio_response" | jq -r '.projects[]? | select(.isActive == true) | "  • " + .name + " [" + (.techStack | join(", ")) + "] - " + (.totalHours | tostring) + "h"' 2>/dev/null
            
            echo -e "\n${BLUE}📚 Older Projects:${NC}"
            echo "$portfolio_response" | jq -r '.projects[]? | select(.isActive != true) | "  • " + .name + " [" + (.techStack | join(", ")) + "] - " + (.totalHours | tostring) + "h"' 2>/dev/null
        else
            # Fallback if API call fails
            echo -e "${GREEN}🔥 Recent Activity:${NC}"
            echo -e "  • claude-memory [Node.js, Git] - Current directory"
            echo -e "\n${YELLOW}📅 Active Projects:${NC}"
            echo -e "  • shush [Node.js, Git] - AI avatar platform"
            echo -e "  • aifi-repo [Git] - AI project"
            echo -e "\n${BLUE}📚 Older Projects:${NC}"
            echo -e "  • Maryland-Register-App [Node.js, TypeScript] - Government portal"
            echo -e "  • story-health-lens [Node.js, TypeScript] - Analysis tool"
            echo -e "  • And 10+ more projects..."
        fi
        
        echo -e "\n${BLUE}Which project are you focusing on in this session?${NC}"
        echo -e "${GREEN}(This helps Claude provide the right context and suggestions)${NC}"
        echo ""
        read -p "Project name: " PROJECT_CONTEXT
        
        if [ -n "$PROJECT_CONTEXT" ]; then
            echo -e "\n${GREEN}✓ Setting context for: ${PROJECT_CONTEXT}${NC}"
            echo "CURRENT_PROJECT_CONTEXT=$PROJECT_CONTEXT" > .current_project_context
            echo -e "${BLUE}💡 Claude will now focus on ${PROJECT_CONTEXT} for this session${NC}"
        fi
        
    else
        echo -e "${YELLOW}⚠ No dream found in cloud, checking local backup...${NC}"
        latest_dream=$(ls -t .claude_dream_*.json 2>/dev/null | head -1)
        if [ -n "$latest_dream" ]; then
            echo -e "${GREEN}✓ Found local dream: $latest_dream${NC}"
            cat "$latest_dream" > /tmp/last_dream.json
            # Display basic summary
            echo -e "\n${PURPLE}🌙 Dream Summary:${NC}"
            cat /tmp/last_dream.json | jq -r '.context.summary' 2>/dev/null || echo "Local dream restored"
        else
            echo -e "${YELLOW}No previous dreams found${NC}"
            return 1
        fi
    fi
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

function analyze_git_history() {
    local days=${1:-7}
    local since_date=$(date -d "${days} days ago" +%Y-%m-%d 2>/dev/null || date -v-${days}d +%Y-%m-%d 2>/dev/null)
    
    echo -e "${BLUE}📈 Analyzing git history from last ${days} days...${NC}"
    
    # Get commits with detailed info
    git log --since="${since_date}" --pretty=format:"%H|%ad|%s|%an" --date=iso --reverse | while IFS='|' read -r hash date message author; do
        # Skip if empty
        [ -z "$hash" ] && continue
        
        # Get changed files for this commit (join with commas)
        files_changed=$(git diff-tree --no-commit-id --name-only -r "$hash" 2>/dev/null | head -10 | tr '\n' ',' | sed 's/,$//')
        
        # Analyze commit message for context
        task_type="development"
        if echo "$message" | grep -qi "fix\|bug\|error"; then
            task_type="bugfix"
        elif echo "$message" | grep -qi "add\|new\|create\|implement"; then
            task_type="feature"
        elif echo "$message" | grep -qi "update\|improve\|enhance"; then
            task_type="enhancement"
        elif echo "$message" | grep -qi "refactor\|cleanup\|reorganize"; then
            task_type="refactoring"
        elif echo "$message" | grep -qi "test\|spec"; then
            task_type="testing"
        elif echo "$message" | grep -qi "doc\|readme"; then
            task_type="documentation"
        fi
        
        # Output structured data for dream creation
        echo "$hash|$date|$message|$task_type|$files_changed"
    done
}

function create_dream_from_commit() {
    local hash="$1"
    local commit_date="$2"
    local message="$3"
    local task_type="$4"
    local files_changed="$5"
    
    # Generate dream ID from commit hash
    local dream_id="git_${hash:0:8}_$(date -d "$commit_date" +%Y%m%d_%H%M%S 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S %z" "$commit_date" +%Y%m%d_%H%M%S 2>/dev/null)"
    
    # Estimate session duration based on changes (rough heuristic)
    local file_count=$(echo "$files_changed" | tr ',' '\n' | wc -l)
    local estimated_hours=0.5
    if [ "$file_count" -gt 5 ]; then
        estimated_hours=2.0
    elif [ "$file_count" -gt 2 ]; then
        estimated_hours=1.0
    fi
    
    # Create synthetic dream data using jq for proper JSON formatting
    jq -n --arg id "$dream_id" \
          --arg projectPath "$PROJECT_PATH" \
          --arg projectName "$PROJECT_NAME" \
          --arg timestamp "$commit_date" \
          --arg message "$message" \
          --arg hash "$hash" \
          --arg task_type "$task_type" \
          --arg file_count "$file_count" \
          --arg estimated_hours "$estimated_hours" \
          --argjson techStack "$(detect_tech_stack)" \
          --argjson fileStructure "$(echo "$files_changed" | tr ',' '\n' | jq -R -s 'split("\n") | map(select(length > 0))')" \
          '{
            id: $id,
            projectPath: $projectPath,
            projectName: $projectName,
            timestamp: $timestamp,
            context: {
              summary: ("Git-generated dream from commit: " + $message),
              techStack: $techStack,
              currentTasks: [("Working on: " + $message)],
              completedTasks: [("Committed: " + $message)],
              fileStructure: $fileStructure,
              dependencies: {},
              lastCommit: (($hash[:7]) + " - " + $message),
              customNotes: ("Auto-generated from git commit " + ($hash[:7]) + ". Task type: " + $task_type + ". Files modified: " + $file_count)
            },
            conversation: {
              keyDecisions: [("Committed changes: " + $message)],
              blockers: [],
              nextSteps: [("Continue development based on commit: " + $message)]
            },
            metadata: {
              claudeVersion: "git-seeded",
              duration: (($estimated_hours | tonumber) * 3600),
              durationHours: ($estimated_hours | tonumber),
              isGitGenerated: true,
              commitHash: $hash,
              taskType: $task_type
            }
          }' > "/tmp/git_dream_${dream_id}.json"
    
    echo "/tmp/git_dream_${dream_id}.json"
}

function seed_dreams_from_git() {
    local days=${1:-7}
    local scan_mode=${2:-current}  # 'current' or 'scan'
    
    if [ "$scan_mode" = "scan" ]; then
        echo -e "${PURPLE}🌱 Scanning for git projects and seeding dreams...${NC}"
        seed_dreams_from_all_projects "$days"
    else
        echo -e "${PURPLE}🌱 Seeding dreams from current git project (${days} days)...${NC}"
        seed_dreams_from_current_project "$days"
    fi
}

function seed_dreams_from_current_project() {
    local days=${1:-7}
    
    if [ ! -d ".git" ]; then
        echo -e "${YELLOW}⚠ No git repository found in current directory${NC}"
        return 1
    fi
    
    local count=0
    local temp_file="/tmp/git_analysis.txt"
    
    # Get git history and save to temp file for processing
    analyze_git_history "$days" > "$temp_file"
    
    # Process each line
    while IFS='|' read -r hash date message task_type files; do
        if [ -n "$hash" ] && [ "$hash" != "" ]; then
            dream_file=$(create_dream_from_commit "$hash" "$date" "$message" "$task_type" "$files")
            
            if [ -f "$dream_file" ]; then
                # Upload to cloud
                echo -e "${BLUE}☁️  Uploading git dream ${hash:0:7}...${NC}"
                response=$(curl -s -X POST "${WORKER_URL}/dream" \
                    -H "Content-Type: application/json" \
                    -H "Authorization: Bearer ${API_KEY}" \
                    -d @"$dream_file")
                
                if echo "$response" | grep -q "success"; then
                    echo -e "${GREEN}✓ Git dream uploaded: ${hash:0:7}${NC}"
                    count=$((count + 1))
                else
                    echo -e "${YELLOW}⚠ Failed to upload git dream: ${hash:0:7} - $response${NC}"
                fi
                
                # Clean up temp file
                rm -f "$dream_file"
            else
                echo -e "${YELLOW}⚠ Failed to create dream file for ${hash:0:7}${NC}"
            fi
        fi
    done < "$temp_file"
    
    # Clean up
    rm -f "$temp_file"
    
    echo -e "${GREEN}✨ Seeded ${count} dreams from current project!${NC}"
}

function find_git_projects() {
    local search_path=${1:-$HOME}
    local max_depth=${2:-3}
    
    echo -e "${BLUE}🔍 Scanning for git projects in ${search_path}...${NC}" >&2
    
    # Find all git repositories within reasonable depth
    find "$search_path" -maxdepth "$max_depth" -name ".git" -type d 2>/dev/null | while read -r git_dir; do
        project_path=$(dirname "$git_dir")
        if [ -d "$project_path" ]; then
            echo "$project_path"
        fi
    done
}

function seed_dreams_from_all_projects() {
    local days=${1:-7}
    local total_count=0
    local projects_processed=0
    
    # Common development directories to scan
    local search_paths=("$HOME/Projects" "$HOME/projects" "$HOME/dev" "$HOME/Development" "$HOME/code" "$HOME/workspace" "$HOME")
    
    for search_path in "${search_paths[@]}"; do
        if [ -d "$search_path" ]; then
            echo -e "${BLUE}🔍 Scanning ${search_path} for git projects...${NC}"
            
            find_git_projects "$search_path" 3 | while read -r project_path; do
                if [ -d "$project_path/.git" ]; then
                    project_name=$(basename "$project_path")
                    echo -e "${PURPLE}📂 Processing ${project_name} at ${project_path}${NC}"
                    
                    # Change to project directory
                    (cd "$project_path" && {
                        # Set project-specific variables
                        local old_project_path="$PROJECT_PATH"
                        local old_project_name="$PROJECT_NAME"
                        
                        PROJECT_PATH="$project_path"
                        PROJECT_NAME="$project_name"
                        
                        # Get recent activity
                        local recent_commits=$(git log --since="${days} days ago" --oneline | wc -l)
                        
                        if [ "$recent_commits" -gt 0 ]; then
                            echo -e "${GREEN}  ✓ Found ${recent_commits} recent commits${NC}"
                            
                            # Seed dreams for this project
                            seed_dreams_from_current_project "$days"
                            projects_processed=$((projects_processed + 1))
                        else
                            echo -e "${YELLOW}  ⏸ No recent activity (${days} days)${NC}"
                        fi
                        
                        # Restore original variables
                        PROJECT_PATH="$old_project_path"
                        PROJECT_NAME="$old_project_name"
                    })
                fi
            done
            
            break  # Stop after first successful directory scan
        fi
    done
    
    echo -e "${GREEN}🎉 Completed project scan - processed ${projects_processed} projects${NC}"
}

function start_dream_session() {
    # Record session start time
    SESSION_START=$(date +%s)
    echo "$SESSION_START" > ".dream_session_start"
    echo -e "${PURPLE}🌙 Dream session started at $(date)${NC}"
}

function auto_update_dream() {
    echo -e "${PURPLE}🌙 Updating dream journal...${NC}"
    
    # Start session tracking if not already started
    if [ ! -f ".dream_session_start" ]; then
        start_dream_session
    fi
    
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
    start)
        start_dream_session
        ;;
    from-git|seed)
        days=${2:-7}
        mode=${3:-current}
        seed_dreams_from_git "$days" "$mode"
        ;;
    scan-projects)
        days=${2:-7}
        seed_dreams_from_git "$days" "scan"
        ;;
    *)
        echo -e "${PURPLE}🌙 Claude Dream Manager${NC}"
        echo "Usage: dream [command]"
        echo ""
        echo "Commands:"
        echo "  init     - Begin dream tracking"
        echo "  start    - Start timing development session"
        echo "  capture  - Save current dream to cloud"
        echo "  restore  - Restore latest dream from cloud"
        echo "  update   - Update dream journal"
        echo "  next     - Generate next dream prompt"
        echo "  from-git [days] - Seed dreams from current git project (default: 7 days)"
        echo "  scan-projects [days] - Seed dreams from all git projects (default: 7 days)"
        ;;
esac