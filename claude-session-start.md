# 🌙 Claude Session Startup Protocol

When starting a new Claude session, this is the recommended flow:

## 1. Wake Command
```bash
./scripts/claude-dream.sh restore
```

This will:
- Restore your previous dream context
- Show recent work and achievements  
- Display working commands and modified files
- **Ask you to confirm current project focus**

## 2. Context Confirmation
Claude should immediately ask:

> **"I can see from KeenDreams that you work on 16+ projects including claude-memory, shush, aifi, and others. Which project are you focusing on in this session?"**

This prevents context confusion and ensures Claude provides relevant help.

## 3. Project-Specific Briefing  
Once confirmed, Claude should provide:
- Recent work on that specific project
- Known issues or blockers
- Typical workflow for that project
- Tech stack reminders

## Example Session Start:

```
User: wake

🌟 Dream context restored!

📋 Complete Project Portfolio:

🔥 Recent Activity (Last 7 days):
  • claude-memory [Node.js, Git] - 6.6h
  • Ideas Tracker Development [API] - 0h

📅 Active (Last 30 days):  
  • drkimberlybaer.com backup [Git] - 0h
  • aifi-repo [Git] - 6h
  • story-health-lens [Node.js, TypeScript] - 4h

📚 Older Projects:
  • Maryland-Register-App [Node.js, TypeScript] - 13.5h
  • shush [Node.js, Git] - 3h  
  • galaxy [Node.js, Git] - 6h
  • git-repo-accelerator [Node.js, TypeScript] - 10h
  • idea-evaluator [Node.js, TypeScript] - 5h
  • And 7+ more projects...

Which project are you focusing on in this session?

User: shush

Claude: Perfect! Based on KeenDreams, Shush is your 175ms AI Avatar platform using Node.js and WebRTC. 
It's been inactive since August 23rd but has 3 hours of development time invested.
Last session focused on "intelligent conversation and WebRTC fixes." 

Ready to revive Shush development - what would you like to tackle first?
```

This ensures every session starts with perfect context alignment!