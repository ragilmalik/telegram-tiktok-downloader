#!/bin/bash

# Service Setup Script for TikTok Bot
# This script helps install and configure the systemd service

set -e

echo "🔧 TikTok Bot Service Setup"
echo "================================"
echo ""

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

# Check if bot token is set
if grep -q "your_telegram_bot_token_here" .env; then
    echo "⚠️  WARNING: Looks like you haven't set your bot token yet!"
    echo ""
    echo "Please edit .env and add your real TELEGRAM_BOT_TOKEN from @BotFather"
    echo "  nano .env"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit..."
fi

echo "1️⃣  Copying service file to systemd..."
sudo cp tiktok-bot.service /etc/systemd/system/

echo "2️⃣  Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "3️⃣  Enabling service (auto-start on boot)..."
sudo systemctl enable tiktok-bot

echo ""
echo "✅ Service installed successfully!"
echo ""
echo "📋 Available commands:"
echo ""
echo "  Start the bot:"
echo "    sudo systemctl start tiktok-bot"
echo ""
echo "  Stop the bot:"
echo "    sudo systemctl stop tiktok-bot"
echo ""
echo "  Check status:"
echo "    sudo systemctl status tiktok-bot"
echo ""
echo "  View logs (live):"
echo "    sudo journalctl -u tiktok-bot -f"
echo ""
echo "  View recent logs:"
echo "    sudo journalctl -u tiktok-bot -n 50"
echo ""
echo "  Restart the bot:"
echo "    sudo systemctl restart tiktok-bot"
echo ""
echo "  Disable auto-start:"
echo "    sudo systemctl disable tiktok-bot"
echo ""
echo "🚀 To start the bot now, run:"
echo "    sudo systemctl start tiktok-bot"
echo ""
