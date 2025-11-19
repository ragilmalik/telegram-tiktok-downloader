#!/bin/bash

# TikTok Bot Startup Script (for systems without systemd)
# This script provides multiple ways to run the bot in the background

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo ""
    echo "Please create your .env file first:"
    echo "  cp .env.example .env"
    echo "  nano .env  # Add your TELEGRAM_BOT_TOKEN"
    echo ""
    exit 1
fi

# Function to check if bot is already running
check_running() {
    if pgrep -f "node.*bot.js" > /dev/null; then
        echo "⚠️  Bot is already running!"
        echo ""
        echo "Running processes:"
        ps aux | grep -E "node.*bot.js" | grep -v grep
        echo ""
        echo "To stop the bot, run: ./stop-bot.sh"
        return 0
    else
        return 1
    fi
}

# Show menu
echo "🤖 TikTok Bot Startup"
echo "====================="
echo ""

if check_running; then
    exit 1
fi

echo "Choose startup method:"
echo ""
echo "1) tmux session (recommended - easy to attach/detach)"
echo "2) nohup (runs in background, logs to file)"
echo "3) foreground (runs in current terminal)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting bot in tmux session..."

        # Check if session already exists
        if tmux has-session -t tiktok-bot 2>/dev/null; then
            echo "⚠️  tmux session 'tiktok-bot' already exists!"
            echo ""
            echo "To attach: tmux attach -t tiktok-bot"
            echo "To kill:   tmux kill-session -t tiktok-bot"
            exit 1
        fi

        # Start tmux session
        tmux new-session -d -s tiktok-bot "cd $SCRIPT_DIR && node bot.js"

        sleep 2

        echo "✅ Bot started in tmux session 'tiktok-bot'"
        echo ""
        echo "📋 Useful commands:"
        echo "  View bot output:  tmux attach -t tiktok-bot"
        echo "  Detach from tmux: Press Ctrl+B then D"
        echo "  Stop bot:         ./stop-bot.sh"
        echo "  Kill session:     tmux kill-session -t tiktok-bot"
        echo ""
        ;;

    2)
        echo ""
        echo "🚀 Starting bot with nohup..."

        # Create logs directory if it doesn't exist
        mkdir -p logs

        # Start with nohup
        nohup node bot.js > logs/bot.log 2> logs/error.log &

        sleep 2

        if check_running; then
            echo "✅ Bot started in background"
            echo ""
            echo "📋 Useful commands:"
            echo "  View output:   tail -f logs/bot.log"
            echo "  View errors:   tail -f logs/error.log"
            echo "  Stop bot:      ./stop-bot.sh"
            echo "  Check status:  ps aux | grep bot.js"
            echo ""
        else
            echo "❌ Failed to start bot. Check logs/error.log for details."
            exit 1
        fi
        ;;

    3)
        echo ""
        echo "🚀 Starting bot in foreground..."
        echo "Press Ctrl+C to stop"
        echo ""
        exec node bot.js
        ;;

    *)
        echo "❌ Invalid choice!"
        exit 1
        ;;
esac
