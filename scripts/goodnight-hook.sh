#!/bin/bash
# Goodnight Hook - Auto-capture Claude sessions as dreams
# This gets triggered when user says "goodnight"

echo "🌙 Goodnight hook triggered - capturing session..."

# Use the absolute path to the auto-session-capture script
CAPTURE_SCRIPT="/Users/terry/claude-memory/scripts/auto-session-capture.js"

# Run the auto-capture script
node "$CAPTURE_SCRIPT" "goodnight" --upload

echo "✅ Session captured and uploaded as dream"
echo "😴 Sweet dreams! Your conversation is safely stored."