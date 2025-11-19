#!/bin/bash

# Stop TikTok Bot Script

echo "🛑 Stopping TikTok Bot..."
echo ""

# Find and kill bot processes
PIDS=$(pgrep -f "node.*bot.js")

if [ -z "$PIDS" ]; then
    echo "ℹ️  No bot process found running"

    # Check for tmux session
    if tmux has-session -t tiktok-bot 2>/dev/null; then
        echo "Found tmux session 'tiktok-bot', killing it..."
        tmux kill-session -t tiktok-bot
        echo "✅ tmux session killed"
    fi

    exit 0
fi

echo "Found running bot process(es):"
ps aux | grep -E "node.*bot.js" | grep -v grep
echo ""

# Kill processes
echo "$PIDS" | xargs kill -15

sleep 2

# Check if still running
if pgrep -f "node.*bot.js" > /dev/null; then
    echo "⚠️  Process still running, using force kill..."
    echo "$PIDS" | xargs kill -9
    sleep 1
fi

if pgrep -f "node.*bot.js" > /dev/null; then
    echo "❌ Failed to stop bot"
    exit 1
else
    echo "✅ Bot stopped successfully"

    # Also kill tmux session if exists
    if tmux has-session -t tiktok-bot 2>/dev/null; then
        tmux kill-session -t tiktok-bot
        echo "✅ tmux session cleaned up"
    fi
fi
