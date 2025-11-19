#!/bin/bash

# Telegram TikTok Downloader Bot - Installation Script
# This script automates the installation and setup process

set -e

echo "🚀 Telegram TikTok Downloader Bot - Installation"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

# Get current user
CURRENT_USER=$(whoami)
REPO_NAME="telegram-tiktok-downloader"
REPO_URL="https://github.com/ragilmalik/telegram-tiktok-downloader.git"

print_info "Current user: $CURRENT_USER"
echo ""

# Step 1: Check for Git and clone repository
echo "📦 Step 1: Checking Git installation..."
if ! command -v git &> /dev/null; then
    print_warning "Git is not installed"
    echo "Installing Git..."
    sudo apt-get update
    sudo apt-get install -y git
    print_success "Git installed successfully"
else
    print_success "Git is already installed"
fi

# Check if we're already in the repository directory
if [ -f "package.json" ] && [ -f "bot.js" ]; then
    print_info "Already in repository directory, skipping clone"
    INSTALL_DIR=$(pwd)
else
    print_info "Cloning repository..."

    # Remove existing directory if it exists
    if [ -d "$REPO_NAME" ]; then
        print_warning "Directory $REPO_NAME already exists, removing..."
        rm -rf "$REPO_NAME"
    fi

    # Clone the repository
    git clone "$REPO_URL"

    if [ $? -ne 0 ]; then
        print_error "Failed to clone repository"
        exit 1
    fi

    # Enter the directory
    cd "$REPO_NAME"
    INSTALL_DIR=$(pwd)

    print_success "Repository cloned successfully"
fi

print_info "Installation directory: $INSTALL_DIR"
echo ""

# Step 2: Check for Node.js
echo "📦 Step 2: Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed"
    echo "Installing Node.js via NodeSource..."

    # Install Node.js LTS
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs

    print_success "Node.js installed successfully"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js is already installed ($NODE_VERSION)"
fi
echo ""

# Step 3: Check for yt-dlp
echo "📦 Step 3: Checking yt-dlp installation..."
if ! command -v yt-dlp &> /dev/null; then
    print_warning "yt-dlp is not installed"
    echo "Installing yt-dlp..."

    sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
    sudo chmod a+rx /usr/local/bin/yt-dlp

    print_success "yt-dlp installed successfully"
else
    YT_DLP_VERSION=$(yt-dlp --version)
    print_success "yt-dlp is already installed ($YT_DLP_VERSION)"
fi
echo ""

# Step 4: Install Node.js dependencies
echo "📦 Step 4: Installing Node.js dependencies..."
npm install
print_success "Dependencies installed successfully"
echo ""

# Step 5: Create necessary directories
echo "📁 Step 5: Creating directories..."
mkdir -p downloads
mkdir -p logs
print_success "Directories created"
echo ""

# Step 6: Configure environment variables
echo "⚙️  Step 6: Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_warning "Please edit .env file with your configuration"
    print_info "You need to set:"
    print_info "  - TELEGRAM_BOT_TOKEN (get from @BotFather)"
    print_info "  - PUBLIC_URL (your server's public URL)"
    echo ""
    read -p "Press Enter to open .env file in nano editor..."
    nano .env
    print_success ".env file configured"
else
    print_info ".env file already exists, skipping"
fi
echo ""

# Step 7: Test the bot
echo "🧪 Step 7: Testing bot configuration..."
read -p "Do you want to test the bot now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting bot in test mode (Press Ctrl+C to stop)..."
    npm start &
    BOT_PID=$!
    sleep 5

    if ps -p $BOT_PID > /dev/null; then
        print_success "Bot is running successfully!"
        kill $BOT_PID
        wait $BOT_PID 2>/dev/null
    else
        print_error "Bot failed to start. Please check your configuration."
        exit 1
    fi
fi
echo ""

# Step 8: Setup systemd service
echo "🔧 Step 8: Setting up systemd service..."
read -p "Do you want to set up the bot to run automatically? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Update service file with correct paths
    sed -e "s|YOUR_USERNAME|$CURRENT_USER|g" \
        -e "s|/path/to/telegram-tiktok-downloader|$INSTALL_DIR|g" \
        tiktok-bot.service > tiktok-bot-configured.service

    sudo cp tiktok-bot-configured.service /etc/systemd/system/tiktok-bot.service
    sudo systemctl daemon-reload
    sudo systemctl enable tiktok-bot.service

    print_success "Systemd service installed and enabled"
    print_info "Service will start automatically on boot"
    echo ""

    read -p "Do you want to start the service now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl start tiktok-bot.service
        sleep 2

        if sudo systemctl is-active --quiet tiktok-bot.service; then
            print_success "Service started successfully!"
            print_info "Check status with: sudo systemctl status tiktok-bot"
        else
            print_error "Service failed to start"
            print_info "Check logs with: sudo journalctl -u tiktok-bot -f"
        fi
    fi

    rm tiktok-bot-configured.service
fi
echo ""

# Step 9: Configure firewall (if UFW is active)
echo "🔥 Step 9: Checking firewall configuration..."
if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
    print_warning "UFW firewall is active"
    PORT=$(grep -oP 'PORT=\K\d+' .env || echo "3000")

    read -p "Do you want to open port $PORT in the firewall? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo ufw allow $PORT/tcp
        print_success "Port $PORT opened in firewall"
    fi
else
    print_info "UFW firewall not active or not installed"
fi
echo ""

# Installation complete
echo "================================================"
print_success "Installation completed successfully! 🎉"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your .env file is properly configured"
echo "2. Ensure your PUBLIC_URL is accessible from the internet"
echo "3. Test your bot by sending it a TikTok link on Telegram"
echo ""
echo "🔧 Useful commands:"
echo "  Start bot:         sudo systemctl start tiktok-bot"
echo "  Stop bot:          sudo systemctl stop tiktok-bot"
echo "  Restart bot:       sudo systemctl restart tiktok-bot"
echo "  Check status:      sudo systemctl status tiktok-bot"
echo "  View logs:         sudo journalctl -u tiktok-bot -f"
echo "  Manual run:        npm start"
echo ""
echo "📖 For more information, check the README.md file"
echo "================================================"
