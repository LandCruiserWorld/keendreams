#!/bin/bash

# 🌙 Claude Dream System Installation

echo "🌙 Installing Claude Dream System..."

# Make scripts executable
chmod +x scripts/claude-dream.sh

# Create symlink for global access
sudo ln -sf $(pwd)/scripts/claude-dream.sh /usr/local/bin/dream

# Install dependencies
npm install

# Create KV namespaces
echo "Creating Cloudflare KV namespaces..."
echo "Run these commands:"
echo ""
echo "wrangler kv:namespace create DREAMS"
echo "wrangler kv:namespace create PROJECTS"
echo ""
echo "Then update wrangler.toml with the IDs shown above"

# Add to shell profile
SHELL_PROFILE=""
if [ -f ~/.zshrc ]; then
    SHELL_PROFILE=~/.zshrc
elif [ -f ~/.bashrc ]; then
    SHELL_PROFILE=~/.bashrc
fi

if [ -n "$SHELL_PROFILE" ]; then
    echo "" >> $SHELL_PROFILE
    echo "# 🌙 Claude Dream System" >> $SHELL_PROFILE
    echo "export KEENDREAMS_URL='https://keendreams.workers.dev'" >> $SHELL_PROFILE
    echo "" >> $SHELL_PROFILE
    echo "# Dream aliases" >> $SHELL_PROFILE
    echo "alias dream='dream'" >> $SHELL_PROFILE
    echo "alias dream-save='dream capture'" >> $SHELL_PROFILE
    echo "alias dream-restore='dream restore'" >> $SHELL_PROFILE
    echo "alias dream-journal='dream update'" >> $SHELL_PROFILE
    echo "alias ds='dream save'" >> $SHELL_PROFILE
    echo "alias dr='dream restore'" >> $SHELL_PROFILE
    echo "alias dj='dream journal'" >> $SHELL_PROFILE
    echo "" >> $SHELL_PROFILE
    echo "# Quick dream capture before closing terminal" >> $SHELL_PROFILE
    echo "alias goodnight='dream capture && echo \"Sweet dreams! 🌙\"'" >> $SHELL_PROFILE
    echo "alias wake='dream restore && echo \"Welcome back! ☀️\"'" >> $SHELL_PROFILE
fi

echo "✨ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Run the KV namespace creation commands shown above"
echo "2. Update wrangler.toml with your KV namespace IDs"
echo "3. Deploy: wrangler deploy"
echo "4. Restart terminal or run: source $SHELL_PROFILE"
echo ""
echo "🌙 Dream Commands:"
echo "  dream init      - Begin dream tracking in any project"
echo "  dream-save      - Capture your work before leaving"
echo "  dream-restore   - Wake up where you left off"
echo "  goodnight       - Quick save before bed"
echo "  wake           - Quick restore when starting"
echo ""
echo "Your dreams will be at: https://keendreams.workers.dev"