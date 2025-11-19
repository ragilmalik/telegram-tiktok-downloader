<div align="center">

# 🎬 Multi-Platform Video Downloader Bot

### *Download videos from 15+ platforms, delivered straight to your Telegram! ⚡*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Telegram Bot API](https://img.shields.io/badge/Telegram-Bot%20API-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots/api)
[![yt-dlp](https://img.shields.io/badge/yt--dlp-powered-red?style=for-the-badge&logo=youtube&logoColor=white)](https://github.com/yt-dlp/yt-dlp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**TikTok** • **Instagram** • **YouTube** • **Twitter/X** • **Facebook** • **Reddit** • **And 10+ More!**

[🚀 Quick Start](#-one-command-installation) • [📖 Features](#-features) • [🎯 Usage](#-how-to-use) • [📊 Admin Panel](#-admin-panel) • [❓ FAQ](#-faq)

---

</div>

## 🌟 Why This Bot?

Ever wanted to save that hilarious TikTok, awesome Instagram Reel, or YouTube Short? Just paste the link in Telegram and **BOOM** 💥 - the video appears instantly in your chat! No ads, no sketchy websites, no clicking around. Just pure video downloading magic! ✨

### What Makes This Special?

- 🎯 **One-Click Downloads** - Just paste a link, get your video
- 🚀 **Lightning Fast** - Smart caching means instant re-downloads
- 🎨 **Beautiful Admin Panel** - Dark-themed dashboard with analytics
- 🛡️ **Production Ready** - Comprehensive error handling & failover mechanisms
- 🔄 **Auto-Everything** - Auto-retry, auto-cleanup, auto-restart
- 📊 **Full Analytics** - Track every download with beautiful charts

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎥 **Multi-Platform Support**
- ✅ TikTok (including VM links)
- ✅ Instagram (Reels, Posts, Stories)
- ✅ YouTube (Videos & Shorts)
- ✅ Twitter/X (Videos & GIFs)
- ✅ Facebook (Videos & Reels)
- ✅ Reddit (Videos)
- ✅ Pinterest, Snapchat, LinkedIn
- ✅ Twitch Clips
- ✅ Vimeo, Dailymotion
- ✅ Tumblr, Bilibili, VK
- ✅ **And many more via yt-dlp!**

### ⚡ **Smart Performance**
- 🚀 **Concurrent Downloads** - Handle 3 downloads simultaneously
- 💾 **Smart Caching** - Same video? Instant delivery!
- 🔄 **Queue System** - Fair processing for all users
- 🎯 **Rate Limiting** - 1 request/minute per user
- 🧹 **Auto-Cleanup** - Removes old files automatically

</td>
<td width="50%">

### 📤 **Seamless Delivery**
- 🎬 **Direct to Telegram** - Videos sent right to your chat
- 📥 **Smart Fallback** - Download links for large files
- 📊 **Live Progress** - Real-time download updates
- 🗑️ **Auto-Delete** - Files removed after sending
- ⏱️ **24hr Links** - Fallback links expire after 24 hours

### 🛡️ **Enterprise Features**
- 🔄 **Auto-Retry** - 3 attempts with exponential backoff
- 🏥 **Health Checks** - API endpoint monitoring
- 💪 **Graceful Shutdown** - Finishes downloads before stopping
- 📝 **Detailed Logging** - Human-readable error messages
- 🔐 **SQLite Database** - Persistent analytics storage

### 📊 **Analytics Dashboard**
- 🎨 **Dark Theme** - Pure black (#000000) modern UI
- 📈 **Real-time Stats** - Downloads, success rate, users
- 🔍 **Advanced Search** - Filter by date, platform, status
- 📥 **Export Data** - CSV/JSON export for analysis
- 🗑️ **Bulk Operations** - Select and delete multiple records

</td>
</tr>
</table>

---

## 📸 Screenshots

### Bot Interface
```
User: https://vm.tiktok.com/ZMexample/

Bot: ⏳ Downloading TikTok video... Please wait!
Bot: ⏳ Downloading... 45%
Bot: 📤 Uploading to Telegram...
Bot: [Video sent directly to chat] ✅ Downloaded from TikTok
```

### Admin Panel Features
- 🎨 **Pure Black Dark Theme** - Easy on the eyes
- 📊 **6 Stat Cards** - Total, Successful, Failed, Users, Platforms, Cache Hit Rate
- 🔍 **Search Bar** - Real-time filtering across all fields
- 📅 **Date Range Filter** - From/To date pickers
- 🌐 **Platform Filter** - Dropdown with all platforms
- ✅ **Status Filter** - Success/Failed/Cached
- 🔀 **Sortable Columns** - Click to sort any column
- 📄 **Pagination** - 10/25/50/100 items per page
- ☑️ **Bulk Selection** - Select all/deselect all
- 🗑️ **Delete Modal** - Confirmation before deletion
- 🎉 **Toast Notifications** - Visual feedback
- 📥 **Export Buttons** - JSON/CSV download

---

## 🚀 One-Command Installation

**For the impatient (automated installation):**

```bash
curl -o- https://raw.githubusercontent.com/ragilmalik/telegram-tiktok-downloader/main/install.sh | bash
```

**That's it!** The script will:
1. ✅ Check and install Git (if needed)
2. ✅ Clone the repository
3. ✅ Check and install Node.js (if needed)
4. ✅ Install yt-dlp (video downloader)
5. ✅ Install dependencies
6. ✅ Configure environment variables
7. ✅ Test the bot (optional)
8. ✅ Set up systemd service (auto-start on boot)
9. ✅ Configure firewall (optional)

**After installation, your bot will be running at:**
- 🤖 Telegram Bot: Ready to receive links
- 🌐 Web Server: `http://your-server-ip:3000`
- 📊 Admin Panel: `http://your-server-ip:5000`

---

## 📖 Manual Installation (Step-by-Step for Beginners)

Don't worry if you've never touched a server before! This guide will walk you through **every single step**. Just follow along! 🎓

### 📋 What You'll Need

- 🖥️ **A Server** - Can be:
  - VPS (DigitalOcean, Linode, Vultr, AWS EC2, etc.)
  - Your home computer running Linux
  - Raspberry Pi
  - Any Linux machine with internet access

- 💰 **Budget**: $5-10/month for a basic VPS (or free if using home computer)
- ⏱️ **Time**: ~15-20 minutes
- 🧠 **Skill Level**: Complete beginner friendly!

---

### Step 1️⃣: Get a Telegram Bot Token

**What's a bot token?** Think of it as a password that lets your bot talk to Telegram.

1. **Open Telegram** on your phone or computer
2. **Search for** `@BotFather` (it's an official Telegram bot)
3. **Start a chat** with BotFather
4. **Type:** `/newbot`
5. **Follow the prompts:**
   - Give your bot a name (Example: "My Video Downloader")
   - Give your bot a username (Must end in "bot", Example: "myvideo_dl_bot")
6. **🎉 Success!** BotFather will give you a token that looks like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567
   ```
7. **📋 Copy this token** - you'll need it soon!

**⚠️ Important:** Keep your token secret! Anyone with this token can control your bot.

---

### Step 2️⃣: Connect to Your Server

**If you're using a VPS or remote server:**

```bash
# Replace 'your-server-ip' with your actual server IP address
# Replace 'root' with your username if different
ssh root@your-server-ip
```

**First time connecting?** You'll see a message asking "Are you sure you want to continue connecting?" - Type `yes` and press Enter.

**If you're on your local Linux machine:** You can skip this step and just open a terminal!

---

### Step 3️⃣: Install Node.js

**What's Node.js?** It's the engine that runs our bot. Like how you need an engine to drive a car! 🚗

**For Ubuntu/Debian:**

```bash
# Update package list
sudo apt update

# Install Node.js (version 18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

**For other systems:**
- **CentOS/RHEL:** Replace `apt` with `yum`
- **macOS:** `brew install node`
- **Already have Node?** Make sure it's version 18 or higher!

---

### Step 4️⃣: Install yt-dlp

**What's yt-dlp?** The magic tool that actually downloads videos from all those platforms! 🪄

**Choose ONE method that works for you:**

**Method 1: Using pip (Recommended)**
```bash
# Install pip if you don't have it
sudo apt install -y python3-pip

# Install yt-dlp
sudo pip3 install -U yt-dlp

# Verify
yt-dlp --version
```

**Method 2: Download binary (if pip doesn't work)**
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verify
yt-dlp --version
```

**Method 3: Using package manager**
```bash
# Ubuntu/Debian
sudo apt install -y yt-dlp

# macOS
brew install yt-dlp
```

---

### Step 5️⃣: Download the Bot Code

**Let's get the bot code onto your server!**

```bash
# Install git if you don't have it
sudo apt install -y git

# Clone the repository
git clone https://github.com/ragilmalik/telegram-tiktok-downloader.git

# Enter the directory
cd telegram-tiktok-downloader

# Check that you're in the right place
ls  # You should see files like bot.js, package.json, etc.
```

---

### Step 6️⃣: Install Dependencies

**What are dependencies?** Think of them as helper tools the bot needs to work properly.

```bash
# This command reads package.json and installs everything needed
npm install
```

**You'll see a lot of text scrolling by - that's normal!** ✅

Wait for it to finish (usually takes 1-2 minutes).

---

### Step 7️⃣: Configure the Bot

**Now we'll tell the bot your settings!**

```bash
# Copy the example configuration file
cp .env.example .env

# Open the file for editing
nano .env
```

**You'll see a file that looks like this:**

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Server Configuration
PORT=3000
ADMIN_PORT=5000
PUBLIC_URL=http://your-server-ip:3000

# Download Settings
MAX_FILE_AGE_HOURS=24
CLEANUP_INTERVAL_MINUTES=60
MAX_CONCURRENT_DOWNLOADS=3

# Rate Limiting
RATE_LIMIT_MINUTES=1

# Retry Settings
MAX_RETRIES=3
```

**Now let's fill it in:**

1. **Replace `your_bot_token_here`** with the token you got from BotFather in Step 1

2. **Replace `your-server-ip`** with your actual server IP address
   - Don't know your IP? Run: `curl ifconfig.me`
   - Example: `PUBLIC_URL=http://142.93.123.45:3000`

3. **Leave everything else as default** (you can customize later!)

**To save and exit nano:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**🎯 Pro Tip:** If you make a mistake, just run `nano .env` again to fix it!

---

### Step 8️⃣: Test the Bot Manually

**Before setting up auto-start, let's make sure everything works!**

```bash
# Start the bot
node bot.js
```

**You should see:**
```
✅ Database initialized successfully
✅ Directories ready
✅ yt-dlp is available
✅ Web server running on port 3000
✅ Public URL: http://your-server-ip:3000
✅ Admin panel running on port 5000
📊 Access admin panel at: http://localhost:5000
🤖 Multi-Platform Video Downloader Bot is running...
📊 Features: Queue (3 concurrent), Caching, Rate Limiting, Analytics
📱 Waiting for messages...
```

**✅ Perfect!** Now let's test it:

1. **Open Telegram**
2. **Find your bot** (search for the username you created)
3. **Send:** `/start`
4. **Bot replies?** ✅ Success!
5. **Send a TikTok/Instagram/YouTube link**
6. **Video downloads?** 🎉 You're in business!

**To stop the bot:**
- Press `Ctrl + C`

---

### Step 9️⃣: Set Up Auto-Start (systemd)

**What's this?** Makes your bot start automatically when your server boots up, and restart if it crashes! 🔄

**Create the service file:**

```bash
sudo nano /etc/systemd/system/tiktok-bot.service
```

**Paste this (replace `/home/yourusername` with your actual path):**

```ini
[Unit]
Description=Telegram Multi-Platform Video Downloader Bot
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/home/yourusername/telegram-tiktok-downloader
ExecStart=/usr/bin/node bot.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=tiktok-bot
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**⚠️ Important replacements:**
- Replace `yourusername` with your Linux username (run `whoami` to find out)
- Replace the WorkingDirectory path with the actual path to your bot
  - Find it by running: `pwd` in the bot directory

**Save and exit:**
- Press `Ctrl + X`, then `Y`, then `Enter`

**Enable and start the service:**

```bash
# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable tiktok-bot

# Start the bot now
sudo systemctl start tiktok-bot

# Check if it's running
sudo systemctl status tiktok-bot
```

**You should see:**
```
● tiktok-bot.service - Telegram Multi-Platform Video Downloader Bot
   Loaded: loaded
   Active: active (running) since ...
```

**🎉 Congratulations!** Your bot is now running and will auto-start on reboot!

---

### Step 🔟: Access the Admin Panel

**Open your browser and go to:**

```
http://your-server-ip:5000
```

**Replace `your-server-ip` with your actual server IP!**

**You should see:**
- 🎨 Beautiful dark-themed dashboard
- 📊 Stats cards showing downloads, users, platforms
- 📋 Table with all download records
- 🔍 Search and filter options
- 📥 Export buttons

**🎯 Bookmark this page!** This is your control center for monitoring the bot.

---

## 🎯 How to Use

### For Users (Telegram)

**It's incredibly simple:**

1. **Open the bot** in Telegram
2. **Send `/start`** to see the welcome message
3. **Paste any video link** from supported platforms
4. **Wait a few seconds** ⏳
5. **Receive your video** directly in the chat! 🎉

**Supported commands:**
- `/start` - Welcome message & instructions
- `/help` - Show help and supported platforms
- `/stats` - Your personal statistics

**Example:**
```
You: https://www.tiktok.com/@username/video/1234567890

Bot: ⏳ Downloading TikTok video... Please wait!
Bot: ⏳ Downloading... 25%
Bot: ⏳ Downloading... 50%
Bot: ⏳ Downloading... 75%
Bot: 📤 Uploading to Telegram...
Bot: [Sends video] ✅ Downloaded from TikTok
```

### For Admins (Dashboard)

**Access the admin panel at:** `http://your-server-ip:5000`

**What you can do:**

1. **📊 View Statistics**
   - Total downloads
   - Success/failure rates
   - Unique users
   - Platform breakdown
   - Cache hit rate
   - Average download time

2. **🔍 Search & Filter**
   - Search by URL, username, platform
   - Filter by date range
   - Filter by platform
   - Filter by status (success/failed/cached)

3. **📋 Manage Records**
   - Sort by any column
   - Select individual records
   - Select all records
   - Delete selected records
   - Pagination (10/25/50/100 per page)

4. **📥 Export Data**
   - Export to JSON
   - Export to CSV
   - Import into Excel/Google Sheets for analysis

5. **📈 Analytics**
   - Platform breakdown cards
   - Last 7 days activity
   - User activity patterns
   - Download trends

---

## 🛠️ Managing the Bot

### Useful Commands

```bash
# Check if bot is running
sudo systemctl status tiktok-bot

# Stop the bot
sudo systemctl stop tiktok-bot

# Start the bot
sudo systemctl start tiktok-bot

# Restart the bot (after making changes)
sudo systemctl restart tiktok-bot

# View bot logs (live)
sudo journalctl -u tiktok-bot -f

# View last 100 log lines
sudo journalctl -u tiktok-bot -n 100

# Disable auto-start on boot
sudo systemctl disable tiktok-bot
```

### Updating the Bot

**When a new version is released:**

```bash
# Navigate to bot directory
cd telegram-tiktok-downloader

# Stop the bot
sudo systemctl stop tiktok-bot

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart the bot
sudo systemctl start tiktok-bot

# Check it's running
sudo systemctl status tiktok-bot
```

### Backup Your Data

**Backup your database:**

```bash
# Create backup directory
mkdir -p ~/backups

# Copy database
cp analytics.db ~/backups/analytics-$(date +%Y%m%d).db

# Copy configuration
cp .env ~/backups/.env-$(date +%Y%m%d)
```

**💡 Pro Tip:** Set up a cron job to backup automatically!

```bash
# Edit crontab
crontab -e

# Add this line (backup daily at 2 AM)
0 2 * * * cp ~/telegram-tiktok-downloader/analytics.db ~/backups/analytics-$(date +\%Y\%m\%d).db
```

---

## ⚙️ Configuration Deep Dive

**Let's understand each setting in `.env`:**

### Bot Configuration

```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```
- **What:** Your unique bot token from BotFather
- **Required:** YES
- **Where to get:** [@BotFather](https://t.me/BotFather) on Telegram

### Server Configuration

```bash
PORT=3000
```
- **What:** Port for the download link server
- **Default:** 3000
- **Change if:** Port 3000 is already in use
- **Examples:** 3001, 8080, 8000

```bash
ADMIN_PORT=5000
```
- **What:** Port for the admin dashboard
- **Default:** 5000
- **Change if:** Port 5000 is already in use
- **Access:** `http://your-server-ip:5000`

```bash
PUBLIC_URL=http://142.93.123.45:3000
```
- **What:** Your server's public URL
- **Format:** `http://YOUR_IP:PORT`
- **Required for:** Fallback download links (when files are too large)
- **Find your IP:** Run `curl ifconfig.me`

### Download Settings

```bash
MAX_FILE_AGE_HOURS=24
```
- **What:** How long to keep downloaded files before deletion
- **Default:** 24 hours
- **Range:** 1-720 (30 days)
- **Why:** Saves disk space
- **Note:** Files are also deleted immediately after successful Telegram send

```bash
CLEANUP_INTERVAL_MINUTES=60
```
- **What:** How often to run the cleanup job
- **Default:** 60 minutes (1 hour)
- **Range:** 5-1440 (24 hours)
- **Why:** Removes old files automatically

```bash
MAX_CONCURRENT_DOWNLOADS=3
```
- **What:** Maximum simultaneous downloads
- **Default:** 3
- **Range:** 1-10
- **Increase if:** You have powerful server (more CPU/RAM)
- **Decrease if:** Server struggles with performance
- **Sweet spot:** 3-5 for most VPS

### Rate Limiting

```bash
RATE_LIMIT_MINUTES=1
```
- **What:** Minimum time between requests per user
- **Default:** 1 minute
- **Range:** 0.5-60
- **Why:** Prevents spam and abuse
- **Set to 0.5:** For trusted users only
- **Set to 5:** For public bots with many users

### Retry Settings

```bash
MAX_RETRIES=3
```
- **What:** How many times to retry failed downloads
- **Default:** 3
- **Range:** 1-10
- **Backoff:** 2s, 4s, 8s (exponential)
- **Why:** Handles temporary network issues

---

## 🚨 Troubleshooting

### Bot doesn't respond to messages

**Check if bot is running:**
```bash
sudo systemctl status tiktok-bot
```

**Check logs for errors:**
```bash
sudo journalctl -u tiktok-bot -n 50
```

**Common issues:**
1. ❌ **Invalid token**
   - Error: `CONFIGURATION ERROR: Telegram bot token is missing`
   - Fix: Check your `.env` file, ensure token is correct

2. ❌ **Network issues**
   - Error: `TELEGRAM POLLING ERROR: Connection issue`
   - Fix: Check internet connection, firewall rules

3. ❌ **Bot is blocked**
   - Error: `Failed to send initial status message`
   - Fix: Unblock the bot in Telegram settings

### Downloads fail

**Check yt-dlp installation:**
```bash
yt-dlp --version
```

**Update yt-dlp:**
```bash
sudo pip3 install -U yt-dlp
# or
sudo yt-dlp -U
```

**Common issues:**
1. ❌ **403 Forbidden**
   - Reason: Video is private or geo-restricted
   - Fix: Ensure video is publicly accessible

2. ❌ **404 Not Found**
   - Reason: Video was deleted or link is broken
   - Fix: Check if the link works in a browser

3. ❌ **Unable to extract**
   - Reason: Platform changed their format
   - Fix: Update yt-dlp: `sudo pip3 install -U yt-dlp`

4. ❌ **Network timeout**
   - Reason: Slow connection or large file
   - Fix: Check internet speed, try again later

### Admin panel doesn't load

**Check if admin server is running:**
```bash
curl http://localhost:5000
```

**Check firewall:**
```bash
# Allow port 5000
sudo ufw allow 5000/tcp

# Or disable firewall temporarily to test
sudo ufw disable
```

**Check if port is in use:**
```bash
sudo lsof -i :5000
```

**If port is taken, change it:**
```bash
# Edit .env
nano .env

# Change ADMIN_PORT=5000 to ADMIN_PORT=5001

# Restart bot
sudo systemctl restart tiktok-bot
```

### Database errors

**Database locked:**
```bash
# Stop the bot
sudo systemctl stop tiktok-bot

# Check if database file exists and has correct permissions
ls -la analytics.db

# If corrupted, backup and recreate
mv analytics.db analytics.db.backup

# Start the bot (will create new database)
sudo systemctl start tiktok-bot
```

### File system errors

**Disk full:**
```bash
# Check disk space
df -h

# Clean up old downloads
cd ~/telegram-tiktok-downloader/downloads
rm -rf *

# Or reduce MAX_FILE_AGE_HOURS in .env
```

**Permission denied:**
```bash
# Fix permissions
cd ~/telegram-tiktok-downloader
chmod 755 .
chmod 644 .env
chmod 755 downloads
```

### Port already in use

**Find what's using the port:**
```bash
# For port 3000
sudo lsof -i :3000

# For port 5000
sudo lsof -i :5000
```

**Kill the process:**
```bash
# Find the PID from above command
sudo kill -9 PID_NUMBER
```

**Or change the port in `.env`:**
```bash
nano .env
# Change PORT=3000 to PORT=3001
# Change ADMIN_PORT=5000 to ADMIN_PORT=5001
sudo systemctl restart tiktok-bot
```

---

## 💡 Advanced Tips & Tricks

### Performance Optimization

**For high-traffic bots:**

```bash
# Edit .env
nano .env
```

**Recommended settings for busy bots:**
```bash
MAX_CONCURRENT_DOWNLOADS=5          # More parallel downloads
MAX_FILE_AGE_HOURS=6                # Clean up faster
CLEANUP_INTERVAL_MINUTES=30         # Run cleanup more often
RATE_LIMIT_MINUTES=2                # Stricter rate limiting
```

**For powerful servers:**
```bash
MAX_CONCURRENT_DOWNLOADS=10         # Max parallel downloads
```

### Custom Domain Setup

**Want `bot.yourdomain.com` instead of `http://142.93.123.45:5000`?**

**1. Point your domain to your server IP** (in your domain registrar)

**2. Install Nginx:**
```bash
sudo apt install -y nginx
```

**3. Create Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/tiktok-bot
```

**Paste this:**
```nginx
server {
    listen 80;
    server_name bot.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**4. Enable and restart:**
```bash
sudo ln -s /etc/nginx/sites-available/tiktok-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**5. (Optional) Add SSL with Let's Encrypt:**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bot.yourdomain.com
```

**Now access your admin panel at:** `https://bot.yourdomain.com` 🎉

---

## 🏗️ Architecture

**How it all works under the hood:**

```
User sends link to Telegram Bot
           ↓
    Telegram API validates message
           ↓
    Bot receives message via polling
           ↓
    Check rate limit (1 req/min)
           ↓
    Add to queue (max 3 concurrent)
           ↓
    Check cache (SHA-256 hash of URL)
           ↓
    Cache Hit? → Send from cache (instant!)
           ↓
    Cache Miss → Download with yt-dlp
           ↓
    Parse progress & update user
           ↓
    Retry on failure (3 attempts, exponential backoff)
           ↓
    File downloaded successfully
           ↓
    Try to send via Telegram API
           ↓
    Success? → Delete file, log to DB
           ↓
    File too large? → Send download link (fallback)
           ↓
    Log everything to SQLite
           ↓
    Admin panel displays stats in real-time
```

### Tech Stack

- **Runtime:** Node.js 18+
- **Bot Framework:** node-telegram-bot-api
- **Downloader:** yt-dlp
- **Queue:** p-queue (concurrency control)
- **Database:** SQLite via better-sqlite3
- **Web Server:** Express.js
- **Service Manager:** systemd
- **Admin UI:** Vanilla HTML/CSS/JS (no framework!)

---

## 🔐 Security Considerations

**Keep your bot secure! 🛡️**

### Essential Security

1. **🔑 Never share your bot token**
   - Treat it like a password
   - Don't commit `.env` to Git (it's in .gitignore)
   - Regenerate token if accidentally exposed

2. **🔥 Configure firewall**
   ```bash
   # Allow SSH
   sudo ufw allow 22/tcp

   # Allow bot ports only from your IP (optional)
   sudo ufw allow from YOUR_IP to any port 3000
   sudo ufw allow from YOUR_IP to any port 5000

   # Enable firewall
   sudo ufw enable
   ```

3. **🚪 Secure admin panel**
   ```bash
   # Option 1: Use Nginx with basic auth
   sudo apt install -y apache2-utils
   sudo htpasswd -c /etc/nginx/.htpasswd admin

   # Add to Nginx config
   location / {
       auth_basic "Restricted";
       auth_basic_user_file /etc/nginx/.htpasswd;
       proxy_pass http://localhost:5000;
   }
   ```

4. **📦 Regular updates**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Update Node.js packages
   npm update

   # Update yt-dlp
   sudo pip3 install -U yt-dlp
   ```

---

## ❓ FAQ (Frequently Asked Questions)

### General Questions

**Q: Is this free?**
A: Yes! The bot code is completely free and open-source (MIT license). You only pay for your server hosting (~$5-10/month for a basic VPS).

**Q: Do I need coding experience?**
A: Not at all! Just follow the step-by-step guide above. If you can copy-paste, you can set this up! 😊

**Q: Can I use this on Windows?**
A: The bot is designed for Linux servers, but you can run it on Windows using WSL (Windows Subsystem for Linux) or Docker.

**Q: How many users can it handle?**
A: Depends on your server. A $5/month VPS can easily handle 100-500 users. For thousands of users, upgrade to a more powerful server.

**Q: Can I monetize this bot?**
A: Yes! You can add ads, require subscriptions, or accept donations. The code is yours to modify as you wish (MIT license).

### Technical Questions

**Q: Why do some downloads fail?**
A: Common reasons:
- Video is private or deleted
- Geo-restricted content
- Platform changed their format (update yt-dlp)
- Network issues
- File too large for Telegram (50MB limit)

**Q: Can I download private/premium content?**
A: No. The bot can only download publicly accessible content. This is a limitation of yt-dlp and respects content creators' privacy settings.

**Q: What's the maximum video length?**
A: No specific limit, but:
- Telegram has a 50MB file size limit for bots
- Larger files will use fallback download links
- Very long downloads might timeout

**Q: Can I add more platforms?**
A: If yt-dlp supports it, the bot supports it! yt-dlp works with 1000+ sites. The platform detection is just for nice labels.

**Q: How do I change the bot's messages/language?**
A: Edit `bot.js` and search for the messages you want to change. All bot responses are plain text strings.

### Troubleshooting Questions

**Q: Bot was working, now it's not. What happened?**
A: Check in this order:
1. Is the bot running? `sudo systemctl status tiktok-bot`
2. Check logs: `sudo journalctl -u tiktok-bot -n 50`
3. Did server restart? Bot should auto-start
4. Did you change anything in .env? Restart bot after changes
5. Is yt-dlp updated? `sudo pip3 install -U yt-dlp`

**Q: "Port already in use" error?**
A: Another application is using that port. Either:
- Stop that application
- Change PORT in .env to a different number
- Find what's using it: `sudo lsof -i :3000`

**Q: Database errors?**
A: Database might be locked or corrupted:
```bash
# Backup
cp analytics.db analytics.db.backup

# Stop bot
sudo systemctl stop tiktok-bot

# Delete corrupted DB
rm analytics.db

# Restart (creates new DB)
sudo systemctl start tiktok-bot
```

---

## 🎓 Advanced Customization

**Want to make the bot truly yours? Here are some ideas!**

### Custom Welcome Message

**Edit `bot.js` around line 560:**

```javascript
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🎬 *Your Custom Bot Name!*

✨ *Your tagline here!*

📱 *How to use:*
1. Send me any video link
2. I'll download it for you
3. Receive it instantly!

Add your own custom instructions here...
  `.trim();

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});
```

### Custom Admin Panel Theme

**Edit `admin/index.html` CSS variables (around line 14):**

```css
:root {
  --bg-primary: #1a1a2e;           /* Dark blue instead of black */
  --accent-primary: #00ff88;        /* Green accent */
  --accent-secondary: #ff0088;      /* Pink accent */
  /* ... customize all colors ... */
}
```

---

## 🤝 Contributing

**Want to make this bot even better?** Contributions are welcome!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit:** `git commit -m 'Add amazing feature'`
6. **Push:** `git push origin feature/amazing-feature`
7. **Open a Pull Request**

---

## 📄 License

**MIT License** - Free to use, modify, and distribute!

**What this means:**
- ✅ Use commercially
- ✅ Modify as you want
- ✅ Distribute freely
- ✅ Private use
- ❌ No warranty (use at your own risk)

---

## 🙏 Acknowledgments

**This bot wouldn't be possible without:**

- 🎬 **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** - The amazing video downloader that powers everything
- 🤖 **[node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)** - Telegram Bot API wrapper
- 📊 **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** - Fast SQLite3 for Node.js
- ⚡ **[p-queue](https://github.com/sindresorhus/p-queue)** - Promise queue with concurrency control
- 💚 **Node.js Community** - For the amazing ecosystem

---

<div align="center">

### Made with ❤️ by developers, for developers

**If this bot helped you, consider:**
- ⭐ Starring the repo
- 🍴 Sharing with friends
- 💬 Leaving feedback
- ☕ [Buying me a coffee](https://buymeacoffee.com/ragilmalik)

---

**Happy Downloading! 🎬✨**

*Last updated: 2025-11-18*

</div>
