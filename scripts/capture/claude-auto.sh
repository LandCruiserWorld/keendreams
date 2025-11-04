#!/bin/bash

# Claude Auto-Context Detector
# Automatically detects and restores context when entering a project directory

function claude_auto_detect() {
    # Generate project fingerprint
    PROJECT_HASH=$(echo "$(pwd)" | sha256sum | cut -d' ' -f1)
    FINGERPRINT_FILE=".claude_fingerprint"
    
    # Check if we're in a known project
    if [ -f "$FINGERPRINT_FILE" ]; then
        echo "🧠 Claude Memory: Detected project $(basename $(pwd))"
        
        # Check for recent session
        if claude-session restore 2>/dev/null | grep -q "Context restored"; then
            echo "✨ Previous context automatically restored!"
            echo "📋 Check RESTORED_CONTEXT.md for details"
        fi
    else
        # New project - create fingerprint
        if [ -d ".git" ] || [ -f "package.json" ] || [ -f "requirements.txt" ]; then
            echo "$PROJECT_HASH" > "$FINGERPRINT_FILE"
            echo "🆕 New project detected! Initializing Claude memory..."
            claude-session init
        fi
    fi
}

# Hook into cd command
function cd() {
    builtin cd "$@"
    claude_auto_detect
}

# Also check on shell startup
claude_auto_detect