#!/usr/bin/env node

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const PQueue = require('p-queue').default;
const Database = require('better-sqlite3');

// Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_SERVER_PORT = process.env.PORT || 3456;
const ADMIN_PORT = process.env.ADMIN_PORT || 5789;
const PUBLIC_URL = process.env.PUBLIC_URL;
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const MAX_FILE_AGE_HOURS = parseInt(process.env.MAX_FILE_AGE_HOURS || '24');
const CLEANUP_INTERVAL_MINUTES = parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '60');
const MAX_CONCURRENT_DOWNLOADS = parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '3');
const RATE_LIMIT_MINUTES = parseInt(process.env.RATE_LIMIT_MINUTES || '1');
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
const MAX_POLLING_ERRORS = parseInt(process.env.MAX_POLLING_ERRORS || '5');

// Polling error tracking
let pollingErrorCount = 0;
let lastPollingErrorTime = 0;

// Validate configuration
if (!TELEGRAM_TOKEN) {
  console.error('❌ CONFIGURATION ERROR: Telegram bot token is missing!');
  console.error('');
  console.error('Please follow these steps to fix this:');
  console.error('1. Copy .env.example to .env: cp .env.example .env');
  console.error('2. Edit .env file: nano .env');
  console.error('3. Get your bot token from @BotFather on Telegram');
  console.error('4. Set TELEGRAM_BOT_TOKEN=your_token_here in the .env file');
  console.error('5. Save and restart the bot');
  console.error('');
  console.error('For help creating a bot, visit: https://t.me/BotFather');
  process.exit(1);
}

// Initialize bot WITHOUT polling first (we'll validate token first)
let bot;
try {
  bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
} catch (error) {
  console.error('❌ BOT INITIALIZATION ERROR: Failed to create bot instance');
  console.error('');
  console.error('Error details:', error.message);
  process.exit(1);
}

// Validate token by testing connection BEFORE starting polling
(async () => {
  console.log('🔍 Validating bot token...');

  try {
    const botInfo = await bot.getMe();
    console.log('✅ Bot token is valid!');
    console.log(`📱 Bot username: @${botInfo.username}`);
    console.log(`🤖 Bot name: ${botInfo.first_name}`);
    console.log('');
    console.log('🔄 Starting polling...');

    // NOW start polling after validation
    await bot.startPolling();
    console.log('✅ Polling started successfully');

  } catch (error) {
    console.error('❌ CONNECTION FAILED: Cannot connect to Telegram API');
    console.error('');

    // Check if it's a token issue or network issue
    if (error.response && error.response.statusCode === 401) {
      console.error('🚫 INVALID BOT TOKEN');
      console.error('');
      console.error('Your token is incorrect or has been revoked.');
      console.error('');
      console.error('Steps to fix:');
      console.error('1. Open Telegram and message @BotFather');
      console.error('2. Send /mybots');
      console.error('3. Select your bot');
      console.error('4. Click "API Token" to view/regenerate your token');
      console.error('5. Copy the token and update TELEGRAM_BOT_TOKEN in your .env file');
      console.error('');
      console.error('Current token (first 10 chars):', TELEGRAM_TOKEN.substring(0, 10) + '...');
    } else if (error.code === 'EFATAL' && error.message.includes('409')) {
      console.error('⚠️  CONFLICT: Another instance is already running');
      console.error('');
      console.error('Telegram bots can only have ONE active polling connection.');
      console.error('');
      console.error('To fix this:');
      console.error('1. Stop ALL running instances of this bot');
      console.error('2. Check systemd: sudo systemctl stop tiktok-bot');
      console.error('3. Kill node processes: pkill -f bot.js');
      console.error('4. Check PM2: pm2 list && pm2 delete all');
      console.error('5. Then restart this bot');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('🌐 NETWORK ERROR: Cannot reach Telegram servers');
      console.error('');
      console.error('Possible causes:');
      console.error('1. No internet connection');
      console.error('2. Firewall blocking api.telegram.org');
      console.error('3. DNS resolution failure');
      console.error('4. Telegram is blocked in your country (use VPN)');
      console.error('');
      console.error('Tests to run:');
      console.error('  ping 8.8.8.8  # Test basic connectivity');
      console.error('  curl -I https://api.telegram.org  # Test Telegram API access');
      console.error('  nslookup api.telegram.org  # Test DNS resolution');
    } else {
      console.error('❌ UNKNOWN ERROR');
      console.error('');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('');
      if (error.response) {
        console.error('Response status:', error.response.statusCode);
        console.error('Response body:', error.response.body);
      }
    }

    console.error('');
    process.exit(1);
  }
})();

// Initialize download queue with concurrency limit
const downloadQueue = new PQueue({ concurrency: MAX_CONCURRENT_DOWNLOADS });

// In-memory rate limiting map: userId -> { lastRequest: timestamp, count: number }
const rateLimitMap = new Map();

// In-memory cache map: urlHash -> { filename, timestamp, filePath }
const cacheMap = new Map();

// Initialize SQLite database with error handling
let db;
try {
  db = new Database(path.join(__dirname, 'analytics.db'));
  console.log('✅ Database initialized successfully');
} catch (error) {
  console.error('❌ DATABASE ERROR: Failed to initialize SQLite database');
  console.error('');
  console.error('Possible causes:');
  console.error('1. No write permission in the current directory');
  console.error('2. Disk is full or out of inodes');
  console.error('3. Database file is corrupted');
  console.error('');
  console.error('Solutions:');
  console.error('- Check permissions: ls -la analytics.db');
  console.error('- Check disk space: df -h');
  console.error('- If corrupted, backup and delete: mv analytics.db analytics.db.backup');
  console.error('');
  console.error('Error details:', error.message);
  process.exit(1);
}

// Create database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,
    platform TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    file_size INTEGER,
    download_time_ms INTEGER,
    from_cache BOOLEAN DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_user_id ON downloads(user_id);
  CREATE INDEX IF NOT EXISTS idx_platform ON downloads(platform);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON downloads(timestamp);
  CREATE INDEX IF NOT EXISTS idx_url_hash ON downloads(url_hash);
`);

// Prepare statements for better performance
const insertDownloadStmt = db.prepare(`
  INSERT INTO downloads (user_id, username, first_name, last_name, url, url_hash, platform, success, error_message, file_size, download_time_ms, from_cache)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Initialize Express servers
const app = express();
const adminApp = express();

// Middleware for JSON parsing
app.use(express.json());
adminApp.use(express.json());

// Serve static files from downloads directory
app.use('/downloads', express.static(DOWNLOADS_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), queueSize: downloadQueue.size });
});

// Admin panel - serve static HTML
adminApp.get('/', (req, res) => {
  const adminPath = path.join(__dirname, 'admin', 'index.html');
  res.sendFile(adminPath, (err) => {
    if (err) {
      console.error('⚠️  Failed to serve admin panel:', err.message);
      res.status(500).send('Failed to load admin panel. Please ensure the admin/index.html file exists and has proper read permissions.');
    }
  });
});

// Admin API - Get statistics
adminApp.get('/api/stats', (req, res) => {
  try {
    const stats = {
      totalDownloads: db.prepare('SELECT COUNT(*) as count FROM downloads').get().count,
      successfulDownloads: db.prepare('SELECT COUNT(*) as count FROM downloads WHERE success = 1').get().count,
      failedDownloads: db.prepare('SELECT COUNT(*) as count FROM downloads WHERE success = 0').get().count,
      uniqueUsers: db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM downloads').get().count,
      platformBreakdown: db.prepare('SELECT platform, COUNT(*) as count FROM downloads WHERE success = 1 GROUP BY platform').all(),
      recentDownloads: db.prepare('SELECT * FROM downloads ORDER BY timestamp DESC LIMIT 50').all(),
      downloadsByDay: db.prepare(`
        SELECT DATE(timestamp) as date, COUNT(*) as count, SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
        FROM downloads
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `).all(),
      totalFileSize: db.prepare('SELECT SUM(file_size) as total FROM downloads WHERE success = 1').get().total || 0,
      avgDownloadTime: db.prepare('SELECT AVG(download_time_ms) as avg FROM downloads WHERE success = 1').get().avg || 0,
      cacheHitRate: (() => {
        const total = db.prepare('SELECT COUNT(*) as count FROM downloads WHERE success = 1').get().count;
        const cached = db.prepare('SELECT COUNT(*) as count FROM downloads WHERE from_cache = 1').get().count;
        return total > 0 ? ((cached / total) * 100).toFixed(2) : 0;
      })()
    };
    res.json(stats);
  } catch (error) {
    console.error('⚠️  ADMIN PANEL STATS ERROR: Failed to retrieve statistics from database');
    console.error('');
    console.error('Possible causes:');
    console.error('1. Database is locked or corrupted');
    console.error('2. Query timeout due to large dataset');
    console.error('3. Missing database indexes');
    console.error('');
    console.error('Error details:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve statistics from the database. The database might be locked, corrupted, or experiencing high load. Please try again in a moment.'
    });
  }
});

// Admin API - Export data
adminApp.get('/api/export/:format', (req, res) => {
  const format = req.params.format;

  try {
    const data = db.prepare('SELECT * FROM downloads ORDER BY timestamp DESC').all();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=downloads-export.json');
      res.json(data);
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).map(v => JSON.stringify(v)).join(','));
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=downloads-export.csv');
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Invalid export format. Please use either "json" or "csv".' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data. Please try again later or contact support if the issue persists.' });
  }
});

// Admin API - Delete records
adminApp.post('/api/delete', (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Invalid request. Please provide an array of record IDs to delete.'
      });
    }

    // Validate that all IDs are numbers
    if (!ids.every(id => Number.isInteger(id))) {
      return res.status(400).json({
        error: 'Invalid record IDs. All IDs must be integers.'
      });
    }

    // Delete records
    const placeholders = ids.map(() => '?').join(',');
    const deleteStmt = db.prepare(`DELETE FROM downloads WHERE id IN (${placeholders})`);
    const result = deleteStmt.run(...ids);

    res.json({
      success: true,
      deleted: result.changes,
      message: `Successfully deleted ${result.changes} record(s).`
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete records. The database might be locked or the records may have already been deleted.'
    });
  }
});

// Start servers with error handling
const webServer = app.listen(WEB_SERVER_PORT, () => {
  console.log(`✅ Web server running on port ${WEB_SERVER_PORT}`);
  console.log(`✅ Public URL: ${PUBLIC_URL || 'Not set (download links disabled)'}`);
}).on('error', (error) => {
  console.error('❌ WEB SERVER ERROR: Failed to start web server');
  console.error('');
  console.error('Possible causes:');
  console.error(`1. Port ${WEB_SERVER_PORT} is already in use by another application`);
  console.error('2. No permission to bind to this port (ports < 1024 require root)');
  console.error('3. Firewall blocking the port');
  console.error('');
  console.error('Solutions:');
  console.error('- Check what is using the port: sudo lsof -i :' + WEB_SERVER_PORT);
  console.error('- Change PORT in .env file to a different port (e.g., 3001)');
  console.error('- Stop the conflicting service');
  console.error('- Use sudo if port is below 1024');
  console.error('');
  console.error('Error details:', error.message);
  process.exit(1);
});

const adminServer = adminApp.listen(ADMIN_PORT, () => {
  console.log(`✅ Admin panel running on port ${ADMIN_PORT}`);
  console.log(`📊 Access admin panel at: http://localhost:${ADMIN_PORT}`);
}).on('error', (error) => {
  console.error('❌ ADMIN SERVER ERROR: Failed to start admin panel server');
  console.error('');
  console.error('Possible causes:');
  console.error(`1. Port ${ADMIN_PORT} is already in use by another application`);
  console.error('2. No permission to bind to this port');
  console.error('3. Firewall blocking the port');
  console.error('');
  console.error('Solutions:');
  console.error('- Check what is using the port: sudo lsof -i :' + ADMIN_PORT);
  console.error('- Change ADMIN_PORT in .env file to a different port (e.g., 5001)');
  console.error('- Stop the conflicting service');
  console.error('');
  console.error('Error details:', error.message);
  process.exit(1);
});

// Create required directories
(async () => {
  try {
    await fs.mkdir(DOWNLOADS_DIR, { recursive: true });
    await fs.mkdir(path.join(__dirname, 'admin'), { recursive: true });
    console.log('✅ Directories ready');
  } catch (error) {
    console.error('❌ DIRECTORY CREATION ERROR: Failed to create required directories');
    console.error('');
    console.error('Possible causes:');
    console.error('1. No write permission in the current directory');
    console.error('2. Disk is full or out of inodes');
    console.error('3. Parent directory does not exist');
    console.error('');
    console.error('Solutions:');
    console.error('- Check permissions: ls -la');
    console.error('- Check disk space: df -h');
    console.error('- Verify you are in the correct directory: pwd');
    console.error('- Ensure you have write access: touch test.txt && rm test.txt');
    console.error('');
    console.error('Error details:', error.message);
    process.exit(1);
  }
})();

// Function to check if yt-dlp is installed
async function checkYtDlp() {
  return new Promise((resolve) => {
    exec('yt-dlp --version', (error) => {
      if (error) {
        console.error('⚠️  WARNING: yt-dlp is not installed or not found in PATH');
        console.error('');
        console.error('This bot requires yt-dlp to download videos. Please install it:');
        console.error('');
        console.error('📦 Installation options:');
        console.error('');
        console.error('Option 1 - Using pip (recommended):');
        console.error('  sudo pip3 install -U yt-dlp');
        console.error('');
        console.error('Option 2 - Download binary (Linux/macOS):');
        console.error('  sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp');
        console.error('  sudo chmod a+rx /usr/local/bin/yt-dlp');
        console.error('');
        console.error('Option 3 - Using package manager:');
        console.error('  Ubuntu/Debian: sudo apt install yt-dlp');
        console.error('  macOS: brew install yt-dlp');
        console.error('');
        console.error('After installation, verify by running: yt-dlp --version');
        console.error('');
        console.error('For more information: https://github.com/yt-dlp/yt-dlp#installation');
        console.error('');
        console.error('⚠️  The bot will continue running but will fail to download videos until yt-dlp is installed.');
        console.error('');
        resolve(false);
      } else {
        console.log('✅ yt-dlp is available');
        resolve(true);
      }
    });
  });
}

// Function to detect platform from URL
function detectPlatform(url) {
  const patterns = {
    'TikTok': /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i,
    'Instagram': /(instagram\.com|instagr\.am)/i,
    'YouTube': /(youtube\.com|youtu\.be)/i,
    'Twitter/X': /(twitter\.com|x\.com|t\.co)/i,
    'Facebook': /(facebook\.com|fb\.watch|fb\.me)/i,
    'Reddit': /reddit\.com/i,
    'Pinterest': /pinterest\.com/i,
    'Snapchat': /snapchat\.com/i,
    'LinkedIn': /linkedin\.com/i,
    'Twitch': /twitch\.tv/i,
    'Vimeo': /vimeo\.com/i,
    'Dailymotion': /dailymotion\.com/i,
    'Tumblr': /tumblr\.com/i,
    'Bilibili': /bilibili\.com/i,
    'VK': /vk\.com/i
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return platform;
    }
  }

  return 'Other';
}

// Function to extract video URLs from message (multi-platform)
function extractVideoUrl(text) {
  // Generic URL pattern that matches most video platforms
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);

  if (!matches) return null;

  // Return the first URL that looks like a video platform
  for (const url of matches) {
    if (detectPlatform(url) !== 'Other') {
      return url;
    }
  }

  return matches[0]; // Return first URL if no known platform detected
}

// Function to hash URL for caching
function hashUrl(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

// Function to check rate limit
function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit) {
    rateLimitMap.set(userId, { lastRequest: now, count: 1 });
    return { allowed: true, waitTime: 0 };
  }

  const timeSinceLastRequest = now - userLimit.lastRequest;
  const waitTime = (RATE_LIMIT_MINUTES * 60 * 1000) - timeSinceLastRequest;

  if (timeSinceLastRequest < RATE_LIMIT_MINUTES * 60 * 1000) {
    return { allowed: false, waitTime: Math.ceil(waitTime / 1000) };
  }

  // Update rate limit
  rateLimitMap.set(userId, { lastRequest: now, count: userLimit.count + 1 });

  // Cleanup old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [uid, data] of rateLimitMap.entries()) {
      if (now - data.lastRequest > 60 * 60 * 1000) { // 1 hour
        rateLimitMap.delete(uid);
      }
    }
  }

  return { allowed: true, waitTime: 0 };
}

// Function to download video with progress updates and retry logic
async function downloadVideo(url, chatId, statusMessageId, attempt = 1) {
  const urlHash = hashUrl(url);
  const startTime = Date.now();

  // Check cache first
  const cached = cacheMap.get(urlHash);
  if (cached) {
    // Verify file still exists
    try {
      await fs.access(cached.filePath);
      console.log(`📦 Cache hit for ${url}`);
      return {
        ...cached,
        fromCache: true,
        downloadTime: Date.now() - startTime
      };
    } catch (error) {
      // File doesn't exist, remove from cache
      console.log(`📦 Cache entry invalid for ${url.substring(0, 50)}... (file was deleted), re-downloading`);
      cacheMap.delete(urlHash);
    }
  }

  const videoId = crypto.randomBytes(16).toString('hex');
  const outputTemplate = path.join(DOWNLOADS_DIR, `${videoId}.%(ext)s`);

  return new Promise((resolve, reject) => {
    // yt-dlp command with progress
    const args = [
      '-f', 'best[ext=mp4]/best',
      '--no-playlist',
      '--newline',
      '-o', outputTemplate,
      url
    ];

    const ytdlp = spawn('yt-dlp', args);
    let errorOutput = '';

    ytdlp.stdout.on('data', async (data) => {
      const output = data.toString();

      // Parse progress: [download]  45.0% of 5.20MiB at 1.50MiB/s ETA 00:02
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);

        // Update progress every 20% to avoid rate limiting
        if (progress % 20 < 5) {
          try {
            await bot.editMessageText(
              `⏳ Downloading... ${Math.floor(progress)}%`,
              {
                chat_id: chatId,
                message_id: statusMessageId
              }
            );
          } catch (error) {
            // Ignore rate limit errors for progress updates
          }
        }
      }
    });

    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', async (code) => {
      if (code !== 0) {
        console.error(`yt-dlp error (attempt ${attempt}):`, errorOutput);

        // Retry logic with exponential backoff
        if (attempt < MAX_RETRIES) {
          const backoffTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Retrying in ${backoffTime / 1000}s... (attempt ${attempt + 1}/${MAX_RETRIES})`);

          try {
            await bot.editMessageText(
              `⏳ Download failed, retrying... (${attempt}/${MAX_RETRIES})`,
              {
                chat_id: chatId,
                message_id: statusMessageId
              }
            );
          } catch (error) {}

          setTimeout(async () => {
            try {
              const result = await downloadVideo(url, chatId, statusMessageId, attempt + 1);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, backoffTime);
        } else {
          // Provide detailed error message based on common issues
          let errorMessage = 'Failed to download video after 3 attempts. ';

          if (errorOutput.includes('HTTP Error 403') || errorOutput.includes('Forbidden')) {
            errorMessage += 'The video is private or geo-restricted. Please check if the video is publicly accessible.';
          } else if (errorOutput.includes('HTTP Error 404') || errorOutput.includes('Not Found')) {
            errorMessage += 'The video was not found. The link may be broken or the video may have been deleted.';
          } else if (errorOutput.includes('Unable to extract')) {
            errorMessage += 'Unable to extract video from this URL. The platform may have changed their format or yt-dlp needs to be updated. Try running: sudo yt-dlp -U';
          } else if (errorOutput.includes('ENOTFOUND') || errorOutput.includes('getaddrinfo')) {
            errorMessage += 'Network connection failed. Please check your internet connection and try again.';
          } else if (errorOutput.includes('timeout')) {
            errorMessage += 'Download timed out. The video might be too large or your connection is too slow. Try again later.';
          } else {
            errorMessage += 'Please verify the URL is correct and the video is publicly accessible. If the problem persists, the platform may be temporarily down.';
          }

          reject(new Error(errorMessage));
        }
        return;
      }

      try {
        // Find the downloaded file
        const files = await fs.readdir(DOWNLOADS_DIR);
        const downloadedFile = files.find(f => f.startsWith(videoId));

        if (!downloadedFile) {
          reject(new Error('Video file not found after download. Possible causes: yt-dlp completed but saved the file elsewhere, file was immediately deleted by another process, or disk write failed. Check disk space and permissions.'));
          return;
        }

        const filePath = path.join(DOWNLOADS_DIR, downloadedFile);
        const stats = await fs.stat(filePath);
        const downloadTime = Date.now() - startTime;

        const result = {
          filename: downloadedFile,
          filePath: filePath,
          fileSize: stats.size,
          downloadTime: downloadTime,
          fromCache: false,
          timestamp: Date.now()
        };

        // Add to cache
        cacheMap.set(urlHash, result);

        // Cleanup cache if too large
        if (cacheMap.size > 1000) {
          const oldestKey = Array.from(cacheMap.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
          cacheMap.delete(oldestKey);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Function to clean up old files
async function cleanupOldFiles() {
  try {
    const files = await fs.readdir(DOWNLOADS_DIR);
    const now = Date.now();
    const maxAge = MAX_FILE_AGE_HOURS * 60 * 60 * 1000;

    let deletedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const filePath = path.join(DOWNLOADS_DIR, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.unlink(filePath);

          // Remove from cache
          for (const [hash, cached] of cacheMap.entries()) {
            if (cached.filename === file) {
              cacheMap.delete(hash);
              break;
            }
          }

          deletedCount++;
        }
      } catch (fileError) {
        errorCount++;
        console.warn(`⚠️  Failed to process file "${file}" during cleanup: ${fileError.message}`);
        // Continue with other files
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old file(s)`);
    }
    if (errorCount > 0) {
      console.warn(`⚠️  ${errorCount} file(s) could not be cleaned up (they may be in use or already deleted)`);
    }
  } catch (error) {
    console.error('⚠️  CLEANUP ERROR: Failed to perform file cleanup');
    console.error('');
    console.error('Possible causes:');
    console.error('1. Downloads directory is missing or inaccessible');
    console.error('2. No read permission on downloads directory');
    console.error('3. File system error');
    console.error('');
    console.error('This is not critical - cleanup will retry in', CLEANUP_INTERVAL_MINUTES, 'minutes');
    console.error('Error details:', error.message);
  }
}

// Schedule periodic cleanup
setInterval(cleanupOldFiles, CLEANUP_INTERVAL_MINUTES * 60 * 1000);

// Bot command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🎬 *Welcome to Multi-Platform Video Downloader Bot!*

📱 *How to use:*
1. Send me any video link
2. I'll download it for you
3. Video will be sent directly to you!

🌐 *Supported platforms:*
• TikTok
• Instagram (Reels, Posts, Stories)
• YouTube (Videos, Shorts)
• Twitter/X
• Facebook
• Reddit
• And many more!

Just paste the link and I'll handle the rest! 🚀
  `.trim();

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📖 *Help & Commands*

*Commands:*
/start - Show welcome message
/help - Show this help message
/stats - Show your usage statistics

*Usage:*
Simply send me a video URL from any supported platform!

*Example:*
https://vm.tiktok.com/ZMexample/
https://www.instagram.com/reel/example/
https://youtube.com/shorts/example

*Features:*
✅ Direct video delivery to Telegram
✅ Multi-platform support
✅ Smart caching for faster downloads
✅ Auto-retry on failures
✅ Progress tracking

*Need support?*
If something doesn't work, make sure:
• The video link is valid and public
• The video is not too large (max 50MB for Telegram)
• You're not sending requests too fast (1 per minute)
  `.trim();

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const userStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN from_cache = 1 THEN 1 ELSE 0 END) as from_cache
      FROM downloads
      WHERE user_id = ?
    `).get(userId);

    const platformStats = db.prepare(`
      SELECT platform, COUNT(*) as count
      FROM downloads
      WHERE user_id = ? AND success = 1
      GROUP BY platform
      ORDER BY count DESC
      LIMIT 5
    `).all(userId);

    let platformText = '';
    if (platformStats.length > 0) {
      platformText = '\n\n*Your top platforms:*\n' +
        platformStats.map(p => `• ${p.platform}: ${p.count}`).join('\n');
    }

    const statsMessage = `
📊 *Your Statistics*

🎥 Total requests: ${userStats.total}
✅ Successful: ${userStats.successful}
❌ Failed: ${userStats.total - userStats.successful}
📦 From cache: ${userStats.from_cache}
${platformText}

⏱️ Bot uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
🔄 Queue size: ${downloadQueue.size}
    `.trim();

    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Stats command error:', error);
    bot.sendMessage(
      chatId,
      '❌ *Failed to retrieve your statistics*\n\nReason: Database query error. This might be temporary. Please try again in a moment.\n\nIf the problem persists, contact the bot administrator.',
      { parse_mode: 'Markdown' }
    );
  }
});

// Handle all messages
bot.on('message', async (msg) => {
  // Skip if it's a command
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || '';
  const firstName = msg.from.first_name || '';
  const lastName = msg.from.last_name || '';
  const messageText = msg.text || '';

  // Extract video URL
  const videoUrl = extractVideoUrl(messageText);

  if (!videoUrl) {
    return; // Ignore messages without video URLs
  }

  const platform = detectPlatform(videoUrl);
  const urlHash = hashUrl(videoUrl);

  // Check rate limit
  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    try {
      await bot.sendMessage(
        chatId,
        `⏳ Please wait ${rateLimit.waitTime} seconds before sending another request.`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (error) {
      console.error('Failed to send rate limit message:', error.message);
    }
    return;
  }

  // Notify user that download is starting
  let statusMessage;
  try {
    statusMessage = await bot.sendMessage(
      chatId,
      `⏳ Downloading ${platform} video... Please wait!`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (error) {
    console.error('❌ Failed to send initial status message:', error.message);
    console.error('Possible causes: Bot is blocked by user, chat does not exist, or rate limited by Telegram');
    // If we can't send the initial message, there's no point in continuing
    return;
  }

  // Add to queue
  downloadQueue.add(async () => {
    const startTime = Date.now();
    let success = false;
    let errorMessage = null;
    let fileSize = null;
    let fromCache = false;

    try {
      // Download the video
      const result = await downloadVideo(videoUrl, chatId, statusMessage.message_id);
      fileSize = result.fileSize;
      fromCache = result.fromCache;

      // Try to send video directly to Telegram
      try {
        try {
          await bot.editMessageText(
            '📤 Uploading to Telegram...',
            {
              chat_id: chatId,
              message_id: statusMessage.message_id
            }
          );
        } catch (editError) {
          // Ignore edit errors, continue with upload
          console.log('Could not update status to uploading:', editError.message);
        }

        await bot.sendVideo(
          chatId,
          result.filePath,
          {
            caption: `✅ Downloaded from ${platform}${fromCache ? ' (cached)' : ''}`,
            reply_to_message_id: msg.message_id
          }
        );

        // Delete the status message since video was sent
        try {
          await bot.deleteMessage(chatId, statusMessage.message_id);
        } catch (deleteError) {
          // Ignore errors - message might already be deleted or too old
          console.log(`⚠️  Could not delete status message (this is normal): ${deleteError.message}`);
        }

        // Delete file after successful send to save space
        try {
          await fs.unlink(result.filePath);
          cacheMap.delete(urlHash);
          console.log(`🗑️  Deleted file after sending: ${result.filename}`);
        } catch (deleteError) {
          console.warn(`⚠️  Failed to delete file after sending: ${result.filename}`);
          console.warn(`Reason: ${deleteError.message}`);
          console.warn('File will be cleaned up during next scheduled cleanup cycle.');
        }

        success = true;
        console.log(`✅ Successfully sent video directly for ${platform} (chat ${chatId})`);

      } catch (sendError) {
        // If direct send fails, provide download link as fallback
        console.warn('Direct send failed, attempting fallback:', sendError.message);

        const downloadUrl = PUBLIC_URL ? `${PUBLIC_URL}/downloads/${result.filename}` : null;

        if (downloadUrl) {
          // Determine reason for failure
          let reason = '';
          if (sendError.message && sendError.message.includes('file is too big')) {
            reason = '(File exceeds Telegram\'s 50MB limit for bots)';
          } else if (sendError.message && sendError.message.includes('ETELEGRAM: 400')) {
            reason = '(Invalid file format or corrupted file)';
          } else {
            reason = '(Direct send not available - using download link instead)';
          }

          try {
            await bot.editMessageText(
              `✅ *Video downloaded successfully!*\n\n📥 [Click here to download](${downloadUrl})\n\n💡 ${reason}\n\nThe link will expire after ${MAX_FILE_AGE_HOURS} hours.`,
              {
                chat_id: chatId,
                message_id: statusMessage.message_id,
                parse_mode: 'Markdown'
              }
            );
            success = true;
          } catch (editError) {
            // If we can't edit the message, send a new one
            console.warn('Could not edit status message, sending new message:', editError.message);
            await bot.sendMessage(
              chatId,
              `✅ *Video downloaded successfully!*\n\n📥 [Click here to download](${downloadUrl})\n\n💡 ${reason}\n\nThe link will expire after ${MAX_FILE_AGE_HOURS} hours.`,
              {
                reply_to_message_id: msg.message_id,
                parse_mode: 'Markdown'
              }
            );
            success = true;
          }
        } else {
          throw new Error('Video download completed but cannot be delivered. Reason: Direct Telegram send failed and PUBLIC_URL is not configured in your .env file. Please add PUBLIC_URL=http://your-server-ip:3000 to your .env file and restart the bot.');
        }
      }

    } catch (error) {
      console.error('Processing error:', error);
      errorMessage = error.message;

      try {
        await bot.editMessageText(
          `❌ *Failed to download video*\n\nPlatform: ${platform}\nError: ${error.message}\n\nPlease make sure the link is valid and try again.`,
          {
            chat_id: chatId,
            message_id: statusMessage.message_id,
            parse_mode: 'Markdown'
          }
        );
      } catch (editError) {
        // If we can't edit the message, send a new one
        console.warn('Could not edit error message, sending new message:', editError.message);
        try {
          await bot.sendMessage(
            chatId,
            `❌ *Failed to download video*\n\nPlatform: ${platform}\nError: ${error.message}\n\nPlease make sure the link is valid and try again.`,
            {
              reply_to_message_id: msg.message_id,
              parse_mode: 'Markdown'
            }
          );
        } catch (sendError) {
          console.error('❌ Could not notify user of error:', sendError.message);
        }
      }
    }

    // Log to database
    const downloadTime = Date.now() - startTime;
    try {
      insertDownloadStmt.run(
        userId,
        username,
        firstName,
        lastName,
        videoUrl,
        urlHash,
        platform,
        success ? 1 : 0,
        errorMessage,
        fileSize,
        downloadTime,
        fromCache ? 1 : 0
      );
    } catch (dbError) {
      console.error('⚠️  DATABASE LOGGING ERROR: Failed to log download activity to database');
      console.error(`User: ${username} (${userId}), Platform: ${platform}`);
      console.error('Possible causes:');
      console.error('1. Database is locked by another process');
      console.error('2. Disk is full');
      console.error('3. Database file permissions changed');
      console.error('');
      console.error('This does not affect video downloads, but analytics will be incomplete.');
      console.error('Error details:', dbError.message);
    }
  });
});

// Error handling for Telegram polling with maximum retry limit
bot.on('polling_error', (error) => {
  const now = Date.now();

  // Reset counter if last error was more than 5 minutes ago (successful connection period)
  if (now - lastPollingErrorTime > 300000) {
    pollingErrorCount = 0;
  }

  pollingErrorCount++;
  lastPollingErrorTime = now;

  console.error(`⚠️  TELEGRAM POLLING ERROR (${pollingErrorCount}/${MAX_POLLING_ERRORS}): Connection issue with Telegram servers`);
  console.error('');
  console.error('Possible causes:');
  console.error('1. Network connectivity issue - Check your internet connection');
  console.error('2. Telegram API is temporarily down - Check https://telegram.org');
  console.error('3. Invalid bot token - Verify TELEGRAM_BOT_TOKEN in .env file');
  console.error('4. Firewall blocking connection - Check firewall rules');
  console.error('5. Rate limiting - Too many requests to Telegram API');
  console.error('');
  console.error('Error details:', error.code || error.message);
  console.error('');

  if (pollingErrorCount >= MAX_POLLING_ERRORS) {
    console.error('❌ MAXIMUM POLLING ERRORS REACHED');
    console.error('');
    console.error(`The bot has encountered ${MAX_POLLING_ERRORS} consecutive polling errors.`);
    console.error('This usually indicates a persistent connection issue that cannot be automatically resolved.');
    console.error('');
    console.error('Please check the following before restarting:');
    console.error('1. Verify your internet connection is working');
    console.error('2. Check if Telegram.org is accessible');
    console.error('3. Verify your TELEGRAM_BOT_TOKEN is correct in .env file');
    console.error('4. Check firewall rules are not blocking Telegram API');
    console.error('5. If using a VPN/proxy, try disabling it temporarily');
    console.error('');
    console.error('To increase the retry limit, set MAX_POLLING_ERRORS in your .env file');
    console.error('Example: MAX_POLLING_ERRORS=10');
    console.error('');
    console.error('🛑 Shutting down bot to prevent infinite error loop...');
    console.error('');

    // Graceful shutdown
    try {
      bot.stopPolling();
      console.log('✅ Telegram polling stopped');
    } catch (stopError) {
      console.error('⚠️  Error stopping polling:', stopError.message);
    }

    try {
      db.close();
      console.log('✅ Database closed');
    } catch (dbError) {
      console.error('⚠️  Error closing database:', dbError.message);
    }

    try {
      webServer.close();
      adminServer.close();
      console.log('✅ Servers closed');
    } catch (serverError) {
      console.error('⚠️  Error closing servers:', serverError.message);
    }

    console.log('');
    console.log('Bot has been shut down. Please fix the underlying issue and restart.');
    process.exit(1);
  } else {
    console.error(`The bot will automatically retry. Remaining attempts: ${MAX_POLLING_ERRORS - pollingErrorCount}`);
    console.error('');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  UNHANDLED PROMISE REJECTION: An async operation failed without proper error handling');
  console.error('');
  console.error('This indicates a bug in the code where a promise rejection was not caught.');
  console.error('The bot will continue running, but this issue should be reported.');
  console.error('');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('');
  console.error('Stack trace:', reason?.stack || 'No stack trace available');
  console.error('');
});

process.on('uncaughtException', (error, origin) => {
  console.error('❌ CRITICAL ERROR: Uncaught exception occurred');
  console.error('');
  console.error('This is a fatal error that will cause the bot to shut down.');
  console.error('The bot should automatically restart if running under systemd or PM2.');
  console.error('');
  console.error('Origin:', origin);
  console.error('Error:', error.message);
  console.error('Stack trace:', error.stack);
  console.error('');
  console.error('If you see this frequently, please report the issue with the full error details.');
  console.error('');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  console.log(`⏳ Waiting for ${downloadQueue.size + downloadQueue.pending} download(s) to complete...`);

  try {
    // Wait for queue to drain with timeout
    await Promise.race([
      downloadQueue.onIdle(),
      new Promise((resolve) => setTimeout(() => {
        console.warn('⚠️  Timeout waiting for downloads to complete. Forcing shutdown...');
        resolve();
      }, 30000)) // 30 second timeout
    ]);

    console.log('✅ All downloads completed');
  } catch (error) {
    console.error('⚠️  Error during queue drainage:', error.message);
  }

  try {
    bot.stopPolling();
    console.log('✅ Telegram polling stopped');
  } catch (error) {
    console.error('⚠️  Error stopping polling:', error.message);
  }

  try {
    db.close();
    console.log('✅ Database closed');
  } catch (error) {
    console.error('⚠️  Error closing database:', error.message);
  }

  console.log('👋 Shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully (SIGTERM)...');
  console.log(`⏳ Waiting for ${downloadQueue.size + downloadQueue.pending} download(s) to complete...`);

  try {
    // Wait for queue to drain with timeout
    await Promise.race([
      downloadQueue.onIdle(),
      new Promise((resolve) => setTimeout(() => {
        console.warn('⚠️  Timeout waiting for downloads to complete. Forcing shutdown...');
        resolve();
      }, 30000)) // 30 second timeout
    ]);

    console.log('✅ All downloads completed');
  } catch (error) {
    console.error('⚠️  Error during queue drainage:', error.message);
  }

  try {
    bot.stopPolling();
    console.log('✅ Telegram polling stopped');
  } catch (error) {
    console.error('⚠️  Error stopping polling:', error.message);
  }

  try {
    db.close();
    console.log('✅ Database closed');
  } catch (error) {
    console.error('⚠️  Error closing database:', error.message);
  }

  console.log('👋 Shutdown complete');
  process.exit(0);
});

// Check yt-dlp on startup
checkYtDlp();

console.log('🤖 Multi-Platform Video Downloader Bot is running...');
console.log(`📊 Features: Queue (${MAX_CONCURRENT_DOWNLOADS} concurrent), Caching, Rate Limiting, Analytics`);
console.log('📱 Waiting for messages...');
