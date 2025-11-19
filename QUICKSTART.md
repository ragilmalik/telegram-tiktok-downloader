# Quick Start Guide

## First Time Setup

### 1. Create your .env file

```bash
cp .env.example .env
nano .env
```

Add your bot token from @BotFather:
```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

Save and exit (Ctrl+O, Enter, Ctrl+X in nano).

### 2. Choose your startup method

#### Option A: Run with systemd (Ubuntu/Debian with systemd) - RECOMMENDED

The setup script **automatically detects** your username, node path, and bot directory!

```bash
# Install the service (auto-configures everything)
./setup-service.sh

# Start the bot
sudo systemctl start tiktok-bot

# Check status
sudo systemctl status tiktok-bot

# View logs
sudo journalctl -u tiktok-bot -f
```

**What setup-service.sh does:**
- Automatically detects your username
- Finds where Node.js is installed
- Gets the bot directory path
- Generates the service file with correct paths
- Installs and enables the service

**No manual configuration needed!**

#### Option B: Run without systemd (Docker/Container/No systemd)

```bash
# Start the bot (interactive menu)
./start-bot.sh

# Choose option:
# 1 - tmux session (recommended)
# 2 - nohup (background process)
# 3 - foreground (current terminal)

# Stop the bot
./stop-bot.sh
```

#### Option C: Run directly (for testing)

```bash
# Just run it
node bot.js
```

## Managing the Bot

### With systemd:

```bash
# Start
sudo systemctl start tiktok-bot

# Stop
sudo systemctl stop tiktok-bot

# Restart
sudo systemctl restart tiktok-bot

# Status
sudo systemctl status tiktok-bot

# Logs (live)
sudo journalctl -u tiktok-bot -f

# Logs (last 50 lines)
sudo journalctl -u tiktok-bot -n 50
```

### Without systemd:

```bash
# Start
./start-bot.sh

# Stop
./stop-bot.sh

# View logs (if using nohup)
tail -f logs/bot.log
tail -f logs/error.log

# Attach to tmux session
tmux attach -t tiktok-bot

# Detach from tmux
# Press: Ctrl+B then D
```

## Troubleshooting

### Bot won't start

1. **Check .env file exists and has your token:**
   ```bash
   ls -la .env
   cat .env | grep TELEGRAM_BOT_TOKEN
   ```

2. **Test bot manually:**
   ```bash
   node bot.js
   ```
   This will show you the exact error.

3. **Check if token is valid:**
   The bot will validate your token on startup and tell you if it's wrong.

4. **Check if another instance is running:**
   ```bash
   ps aux | grep bot.js
   pkill -f bot.js  # Stop all instances
   ```

### Common Errors

**"TELEGRAM_BOT_TOKEN is missing"**
- Create .env file: `cp .env.example .env`
- Edit and add token: `nano .env`

**"409 Conflict - Another instance is running"**
- Stop all instances: `./stop-bot.sh` or `pkill -f bot.js`
- If using systemd: `sudo systemctl stop tiktok-bot`

**"Invalid bot token"**
- Get new token from @BotFather on Telegram
- Update .env file with new token

**"Cannot reach Telegram servers"**
- Check internet: `ping 8.8.8.8`
- Check Telegram API: `curl -I https://api.telegram.org`
- If in China/Iran, use VPN

## Quick Commands Reference

```bash
# Create .env file
cp .env.example .env && nano .env

# Start bot (systemd)
sudo systemctl start tiktok-bot

# Start bot (no systemd)
./start-bot.sh

# Stop bot
./stop-bot.sh  # or: sudo systemctl stop tiktok-bot

# View logs
tail -f logs/bot.log  # or: sudo journalctl -u tiktok-bot -f

# Check if running
ps aux | grep bot.js

# Kill all instances
pkill -f bot.js
```

## Need Help?

1. Check logs: `tail -f logs/bot.log` or `sudo journalctl -u tiktok-bot -f`
2. Run bot manually to see errors: `node bot.js`
3. Check README.md for full documentation
4. Open an issue on GitHub
