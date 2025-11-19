#!/bin/bash

# Service Setup Script for TikTok Bot
# This script automatically configures and installs the systemd service
# with correct paths for your system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔧 TikTok Bot Service Setup"
echo "================================"
echo ""

# Auto-detect configuration
CURRENT_USER=$(whoami)
NODE_PATH=$(which node)
SERVICE_FILE="tiktok-bot.service"
TEMP_SERVICE_FILE="/tmp/tiktok-bot.service.tmp"

echo "🔍 Auto-detecting system configuration..."
echo "  Current user: $CURRENT_USER"
echo "  Node path: $NODE_PATH"
echo "  Bot directory: $SCRIPT_DIR"
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

echo "1️⃣  Generating service file with correct paths..."

# Create service file with detected paths
cat > "$TEMP_SERVICE_FILE" << EOF
[Unit]
Description=Telegram TikTok Downloader Bot
Documentation=https://github.com/ragilmalik/telegram-tiktok-downloader
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=300
StartLimitBurst=5

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$NODE_PATH $SCRIPT_DIR/bot.js

# CRITICAL: Load environment variables from .env file
EnvironmentFile=$SCRIPT_DIR/.env

# Additional environment
Environment=NODE_ENV=production

# Restart policy
Restart=on-failure
RestartSec=10

# Logging - systemd journal (use journalctl to view logs)
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tiktok-bot

# Security settings
NoNewPrivileges=true
PrivateTmp=true

# Resource limits
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file generated"
echo ""

echo "2️⃣  Installing service file to systemd..."
sudo cp "$TEMP_SERVICE_FILE" /etc/systemd/system/tiktok-bot.service
rm "$TEMP_SERVICE_FILE"

echo "3️⃣  Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "4️⃣  Enabling service (auto-start on boot)..."
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
