# 🎬 Telegram TikTok Video Downloader Bot

A powerful multi-platform Telegram bot that downloads videos from TikTok, Instagram, YouTube, Twitter/X, and 10+ other platforms. Videos are sent directly to Telegram with smart caching, queue management, and comprehensive analytics!

## ✨ Features

### Core Features
- 🎥 **Multi-Platform Support**: TikTok, Instagram, YouTube, Twitter/X, Facebook, Reddit, and 10+ more!
- 📤 **Direct Telegram Delivery**: Videos sent directly to chat (no clicking links!)
- 🚀 **Smart Caching**: Same video requested twice? Instant delivery from cache
- ⚡ **Queue System**: Handles multiple requests efficiently (3 concurrent downloads)
- 🔄 **Auto-Retry**: Failed downloads? Automatic retry with exponential backoff
- 📊 **Live Progress**: Real-time download progress updates

### Performance & Reliability
- 🛡️ **Rate Limiting**: Prevents abuse (1 request per minute per user)
- 💾 **Auto Storage Management**: Files deleted after sending to save space
- 🔄 **Auto-Start**: Runs on boot, restarts on crashes
- ⏱️ **Queue Management**: Smart concurrent download handling
- 🧹 **Auto-Cleanup**: Removes old files automatically

### Analytics & Monitoring
- 📊 **Analytics Dashboard**: Beautiful admin panel on port 5000
- 📈 **Real-Time Stats**: Total downloads, success rate, platform breakdown
- 👥 **User Tracking**: Monitor usage patterns and top users
- 💾 **Data Export**: Export analytics to CSV/JSON
- 🎯 **Cache Hit Rate**: Track bandwidth savings

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start Installation](#quick-start-installation)
- [Manual Installation](#manual-installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Deployment](#deployment)
- [Managing the Bot](#managing-the-bot)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)
- [Architecture](#architecture)
- [Security Considerations](#security-considerations)
- [FAQ](#faq)

## 🔧 Prerequisites

Before you begin, ensure you have:

1. **A Linux server** (Ubuntu 20.04+ recommended)
   - VPS, cloud server, or dedicated server
   - Minimum 1GB RAM, 1 CPU core
   - Public IP address or domain name

2. **Server access**
   - SSH access to your server
   - sudo/root privileges

3. **Telegram Bot Token**
   - Get one from [@BotFather](https://t.me/BotFather) on Telegram
   - [How to create a bot](#creating-a-telegram-bot)

4. **Basic knowledge of Linux command line**

## 🚀 Quick Start Installation

### Option 1: Automated Installation (Recommended)

1. **Connect to your server via SSH:**
   ```bash
   ssh your_username@your_server_ip
   ```

2. **Clone or download this repository:**
   ```bash
   git clone https://github.com/yourusername/telegram-tiktok-downloader.git
   cd telegram-tiktok-downloader
   ```

3. **Run the installation script:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

4. **Follow the interactive prompts:**
   - The script will install Node.js and yt-dlp if needed
   - Configure your `.env` file when prompted
   - Choose whether to set up auto-start
   - Choose whether to start the bot immediately

5. **Done!** Your bot is now running and will auto-start on server reboot.

### Option 2: Manual Installation

If you prefer to install manually, follow the [Manual Installation](#manual-installation-guide) section below.

## 📝 Manual Installation Guide

### Step 1: Install Node.js

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Install yt-dlp

```bash
# Download yt-dlp
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp

# Make it executable
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verify installation
yt-dlp --version
```

### Step 3: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/telegram-tiktok-downloader.git

# Navigate to the directory
cd telegram-tiktok-downloader
```

### Step 4: Install Dependencies

```bash
# Install Node.js packages
npm install
```

### Step 5: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the configuration file
nano .env
```

**Important: Configure these variables in `.env`:**

```env
# Your Telegram bot token from @BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Your server's public URL (how users access your server)
PUBLIC_URL=http://123.456.789.012:3000

# Port for the web server (default: 3000)
PORT=3000

# How long to keep downloaded files (in hours)
MAX_FILE_AGE_HOURS=24

# How often to check for old files to delete (in minutes)
CLEANUP_INTERVAL_MINUTES=60
```

**Finding your PUBLIC_URL:**
- If you have a domain: `https://yourdomain.com` or `https://bot.yourdomain.com`
- If using IP: `http://YOUR_SERVER_IP:3000`
- Get your server IP: `curl ifconfig.me`

### Step 6: Create Required Directories

```bash
# Create directories for downloads and logs
mkdir -p downloads logs
```

### Step 7: Test the Bot

```bash
# Run the bot in test mode
npm start
```

You should see:
```
✅ yt-dlp is available
✅ Downloads directory ready
✅ Web server running on port 3000
✅ Public URL: http://your-server:3000
🤖 Telegram TikTok Downloader Bot is running...
📱 Waiting for messages...
```

**Test it:**
1. Open Telegram and find your bot
2. Send `/start`
3. Send a TikTok video link
4. You should receive a download link!

If it works, press `Ctrl+C` to stop the test.

## 🔄 Deployment (Auto-Start Setup)

To keep the bot running 24/7 and auto-start on server reboot:

### Method 1: Using systemd (Recommended)

1. **Edit the service file with your paths:**

```bash
# Get your current username
whoami

# Get the full path to your installation
pwd
```

2. **Edit the service file:**

```bash
nano tiktok-bot.service
```

Replace these values:
- `YOUR_USERNAME` → your username (from `whoami`)
- `/path/to/telegram-tiktok-downloader` → your installation path (from `pwd`)

Example:
```ini
User=ubuntu
WorkingDirectory=/home/ubuntu/telegram-tiktok-downloader
ExecStart=/usr/bin/node /home/ubuntu/telegram-tiktok-downloader/bot.js
StandardOutput=append:/home/ubuntu/telegram-tiktok-downloader/logs/bot.log
StandardError=append:/home/ubuntu/telegram-tiktok-downloader/logs/error.log
```

3. **Install and enable the service:**

```bash
# Copy service file to systemd
sudo cp tiktok-bot.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable tiktok-bot

# Start the service
sudo systemctl start tiktok-bot

# Check status
sudo systemctl status tiktok-bot
```

### Method 2: Using PM2 (Alternative)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the bot with PM2
pm2 start bot.js --name tiktok-bot

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup

# Run the command that PM2 outputs
```

## 🎯 Usage

### Bot Commands

- `/start` - Show welcome message and instructions
- `/help` - Display help information
- `/stats` - Show bot statistics (uptime, cached videos, etc.)

### Downloading Videos

1. **Find a TikTok video** you want to download
2. **Share or copy the link** (any TikTok link format works)
3. **Send the link** to your bot on Telegram
4. **Wait** for the bot to process (usually 5-10 seconds)
5. **Click the download link** the bot sends back
6. **Save the video** to your device

### Supported Platforms & Link Formats

**Supported Platforms:**
- **TikTok**: `tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com`
- **Instagram**: Reels, Posts, Stories, IGTV
- **YouTube**: Videos, Shorts
- **Twitter/X**: Video tweets
- **Facebook**: Videos, Watch
- **Reddit**: Video posts
- **And 10+ more**: Vimeo, Dailymotion, Twitch, Pinterest, LinkedIn, etc.

**Example Links:**
- `https://www.tiktok.com/@username/video/1234567890`
- `https://www.instagram.com/reel/ABC123/`
- `https://youtube.com/shorts/XYZ789`
- `https://twitter.com/user/status/123456789`
- Any other supported platform URL!

## 📊 Admin Panel

### Accessing the Dashboard

The bot includes a comprehensive analytics dashboard accessible at:
```
http://your-server-ip:5000
```

### Dashboard Features

**Real-Time Statistics:**
- Total downloads (all time)
- Success/failure rates
- Unique user count
- Cache hit rate percentage
- Average download time
- Total bandwidth used

**Platform Analytics:**
- Breakdown by platform (TikTok, Instagram, YouTube, etc.)
- Downloads per platform
- Success rates by platform

**Recent Activity:**
- Last 50 downloads with details
- User information (username, ID)
- Download status and errors
- File sizes and processing times

**Historical Data:**
- Last 30 days of activity
- Daily download counts
- Success rate trends
- Visual charts and graphs

**Data Export:**
- Export all data to JSON format
- Export all data to CSV format
- Includes: timestamps, users, URLs, platforms, file sizes, success status

### Admin Panel Configuration

Change the admin port in `.env`:
```env
ADMIN_PORT=5000  # Change to your preferred port
```

To secure the admin panel behind a reverse proxy:
```nginx
location /admin {
    proxy_pass http://localhost:5000;
    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

## 🔧 Managing the Bot

### If Using systemd:

```bash
# Start the bot
sudo systemctl start tiktok-bot

# Stop the bot
sudo systemctl stop tiktok-bot

# Restart the bot
sudo systemctl restart tiktok-bot

# Check status
sudo systemctl status tiktok-bot

# View live logs
sudo journalctl -u tiktok-bot -f

# View last 100 log lines
sudo journalctl -u tiktok-bot -n 100

# Disable auto-start
sudo systemctl disable tiktok-bot

# Enable auto-start
sudo systemctl enable tiktok-bot
```

### If Using PM2:

```bash
# Start the bot
pm2 start tiktok-bot

# Stop the bot
pm2 stop tiktok-bot

# Restart the bot
pm2 restart tiktok-bot

# Check status
pm2 status

# View logs
pm2 logs tiktok-bot

# Monitor in real-time
pm2 monit
```

### Manual Running (Development):

```bash
# Navigate to the directory
cd /path/to/telegram-tiktok-downloader

# Start the bot
npm start

# Or for development with auto-reload
npm run dev
```

## 🐛 Troubleshooting

### Bot doesn't respond to messages

1. **Check if the bot is running:**
   ```bash
   sudo systemctl status tiktok-bot
   # or
   pm2 status
   ```

2. **Check the logs:**
   ```bash
   sudo journalctl -u tiktok-bot -n 50
   # or
   pm2 logs tiktok-bot
   ```

3. **Verify your bot token:**
   ```bash
   grep TELEGRAM_BOT_TOKEN .env
   ```

4. **Test manually:**
   ```bash
   npm start
   ```

### "Failed to download video" error

1. **Check yt-dlp is installed:**
   ```bash
   yt-dlp --version
   ```

2. **Update yt-dlp to latest version:**
   ```bash
   sudo yt-dlp -U
   ```

3. **Test yt-dlp directly:**
   ```bash
   yt-dlp "https://vm.tiktok.com/test/" -o test.mp4
   ```

4. **Check disk space:**
   ```bash
   df -h
   ```

### Download link doesn't work

1. **Check PUBLIC_URL is correct:**
   ```bash
   grep PUBLIC_URL .env
   ```

2. **Test if web server is accessible:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check firewall settings:**
   ```bash
   sudo ufw status
   ```

4. **Make sure ports are open:**
   ```bash
   sudo ufw allow 3000/tcp  # Web server
   sudo ufw allow 5000/tcp  # Admin panel
   sudo ufw reload
   ```

5. **Test from outside:**
   ```bash
   # From your local computer
   curl http://YOUR_SERVER_IP:3000/health
   ```

### Bot stops after closing terminal

**Solution:** Use systemd or PM2 as described in the [Deployment](#deployment-auto-start-setup) section.

### Permission errors

```bash
# Fix ownership of files
sudo chown -R $USER:$USER /path/to/telegram-tiktok-downloader

# Fix permissions
chmod -R 755 /path/to/telegram-tiktok-downloader
```

### "Cannot find module" errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## ⚙️ Advanced Configuration

### Using HTTPS with Nginx

For production use, it's recommended to use HTTPS:

1. **Install Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Configure Nginx as reverse proxy:**
   ```bash
   sudo nano /etc/nginx/sites-available/tiktok-bot
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/tiktok-bot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Install SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

5. **Update your .env:**
   ```env
   PUBLIC_URL=https://yourdomain.com
   ```

### Changing the Port

1. **Edit .env:**
   ```bash
   nano .env
   ```
   Change `PORT=3000` to your desired port

2. **Update firewall:**
   ```bash
   sudo ufw allow YOUR_NEW_PORT/tcp
   ```

3. **Restart the bot:**
   ```bash
   sudo systemctl restart tiktok-bot
   ```

### Performance Tuning

Edit `.env` to optimize performance:

```env
# Concurrent downloads (default: 3)
# Increase for better throughput (requires more CPU/RAM)
MAX_CONCURRENT_DOWNLOADS=5

# Rate limiting (default: 1 minute)
# Increase to prevent abuse, decrease for power users
RATE_LIMIT_MINUTES=2

# Retry attempts (default: 3)
# Increase for unreliable networks
MAX_RETRIES=5

# File cleanup
MAX_FILE_AGE_HOURS=12
CLEANUP_INTERVAL_MINUTES=30
```

Restart bot after changes:
```bash
sudo systemctl restart tiktok-bot
```

### Monitoring Performance

Check queue and cache performance:
```bash
# Check health endpoint
curl http://localhost:3000/health

# View admin dashboard for detailed metrics
open http://localhost:5000
```

### Database Management

The SQLite database is stored in `analytics.db`. To backup:
```bash
# Backup database
cp analytics.db analytics-backup-$(date +%Y%m%d).db

# Check database size
du -h analytics.db
```

To reset analytics (careful!):
```bash
# Stop the bot first
sudo systemctl stop tiktok-bot

# Remove database
rm analytics.db

# Start bot (will create new database)
sudo systemctl start tiktok-bot
```

## 🏗️ Architecture

```
┌─────────────┐
│   Telegram  │
│    User     │
└──────┬──────┘
       │
       │ Sends TikTok URL
       │
       ▼
┌─────────────────────┐
│   Telegram Bot API  │
│  (node-telegram-    │
│     bot-api)        │
└──────┬──────────────┘
       │
       │ Receives URL
       │
       ▼
┌─────────────────────┐
│    Bot Logic        │
│    (bot.js)         │
│                     │
│  • URL validation   │
│  • Download mgmt    │
│  • Cleanup logic    │
└──────┬──────────────┘
       │
       │ Calls yt-dlp
       │
       ▼
┌─────────────────────┐
│      yt-dlp         │
│                     │
│  Downloads video    │
│  from TikTok        │
└──────┬──────────────┘
       │
       │ Saves file
       │
       ▼
┌─────────────────────┐
│   downloads/        │
│   directory         │
│                     │
│  • video1.mp4       │
│  • video2.mp4       │
└──────┬──────────────┘
       │
       │ Served by
       │
       ▼
┌─────────────────────┐
│  Express Server     │
│                     │
│  /downloads/*       │
│  /health            │
└──────┬──────────────┘
       │
       │ Returns URL
       │
       ▼
┌─────────────┐
│   Telegram  │
│    User     │
│             │
│ Clicks link │
│ Downloads!  │
└─────────────┘
```

## 🔒 Security Considerations

### Important Security Notes:

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use HTTPS in production** - Protect download links
3. **Keep dependencies updated** - Run `npm update` regularly
4. **Monitor disk usage** - Set appropriate cleanup intervals
5. **Use a firewall** - Only open necessary ports
6. **Regular backups** - Backup your configuration

### Recommended Security Practices:

```bash
# Keep yt-dlp updated
sudo yt-dlp -U

# Update Node.js packages
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Enable firewall
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 3000/tcp  # Bot (or your port)

# Monitor system
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 🆘 Creating a Telegram Bot

1. **Open Telegram** and search for [@BotFather](https://t.me/BotFather)

2. **Start a chat** and send `/newbot`

3. **Follow the prompts:**
   - Choose a name for your bot (e.g., "My TikTok Downloader")
   - Choose a username (must end in 'bot', e.g., "mytiktokdownload_bot")

4. **Save your token** - BotFather will give you a token like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

5. **Configure bot settings** (optional):
   - Send `/setdescription` to set a description
   - Send `/setabouttext` to set about text
   - Send `/setuserpic` to set a profile picture

6. **Use the token** in your `.env` file

## ❓ FAQ

### Q: What platforms are supported?
**A:** TikTok, Instagram, YouTube (including Shorts), Twitter/X, Facebook, Reddit, Vimeo, Dailymotion, Twitch, Pinterest, LinkedIn, Tumblr, Bilibili, VK, and more! Any platform supported by yt-dlp works.

### Q: Does this work with private accounts?
**A:** No, only public videos can be downloaded. Private content requires authentication which this bot doesn't support.

### Q: What's the maximum video size?
**A:** Telegram has a 50MB limit for bot file uploads. Larger files will be provided as download links instead.

### Q: How does the caching work?
**A:** When a video URL is downloaded, it's cached. If someone requests the same URL again, it's delivered instantly from cache without re-downloading. Cache is automatically managed.

### Q: Why am I rate limited?
**A:** To prevent abuse, each user can make 1 request per minute. This protects the server and prevents API bans from video platforms.

### Q: Can I download multiple videos at once?
**A:** Yes! The bot uses a queue system and processes up to 3 downloads concurrently (configurable). Send multiple links and they'll be processed in order.

### Q: How much disk space do I need?
**A:** Not much! Files are automatically deleted after being sent to Telegram. The database file grows slowly (~1MB per 10,000 downloads). Start with 5GB free.

### Q: Can I use this on shared hosting?
**A:** You need VPS/cloud hosting with SSH access and ability to run Node.js applications and install yt-dlp.

### Q: Does this download without watermarks?
**A:** yt-dlp attempts to get the best quality available. TikTok videos may have watermarks depending on the API response.

### Q: How do I access the admin panel?
**A:** Navigate to `http://your-server-ip:5000` in your browser. Make sure port 5000 is open in your firewall.

### Q: Is the database secure?
**A:** The database stores user IDs, usernames, and download logs. It doesn't store video content or personal messages. Keep your server secure and consider encrypting the database file for sensitive deployments.

### Q: How do I update the bot?
**A:**
```bash
cd /path/to/telegram-tiktok-downloader
git pull
npm install
sudo systemctl restart tiktok-bot
```

### Q: Can I use a custom domain instead of IP address?
**A:** Yes! Point your domain to your server's IP and update `PUBLIC_URL` in `.env`.

### Q: Is this legal?
**A:** You're responsible for ensuring your use complies with TikTok's Terms of Service and local laws. This is intended for personal use and backing up your own content.

## 📊 Monitoring & Logs

### View Real-time Logs:
```bash
# systemd
sudo journalctl -u tiktok-bot -f

# PM2
pm2 logs tiktok-bot --lines 100

# File logs
tail -f logs/bot.log
tail -f logs/error.log
```

### Check Disk Usage:
```bash
# Overall disk usage
df -h

# Downloads directory size
du -sh downloads/

# Count files in downloads
ls -1 downloads/ | wc -l
```

### Monitor Bot Performance:
```bash
# Check bot status
sudo systemctl status tiktok-bot

# Check system resources
htop

# Check network connections
sudo netstat -tulpn | grep :3000
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Amazing video downloader
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - Telegram Bot API wrapper
- [Express](https://expressjs.com/) - Web framework

## 📞 Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [FAQ](#faq)
3. Check existing GitHub issues
4. Create a new issue with:
   - Your OS and version
   - Node.js version (`node --version`)
   - Error messages from logs
   - Steps to reproduce

## 🎉 You're All Set!

Your Telegram TikTok Downloader Bot is now ready to use! Send it a TikTok link and enjoy downloading videos directly to your device.

Happy downloading! 🚀