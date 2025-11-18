#!/usr/bin/env node

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { PQueue } = require('p-queue');
const Database = require('better-sqlite3');

// Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_SERVER_PORT = process.env.PORT || 3000;
const ADMIN_PORT = process.env.ADMIN_PORT || 5000;
const PUBLIC_URL = process.env.PUBLIC_URL;
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const MAX_FILE_AGE_HOURS = parseInt(process.env.MAX_FILE_AGE_HOURS || '24');
const CLEANUP_INTERVAL_MINUTES = parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '60');
const MAX_CONCURRENT_DOWNLOADS = parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '3');
const RATE_LIMIT_MINUTES = parseInt(process.env.RATE_LIMIT_MINUTES || '1');
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');

// Validate configuration
if (!TELEGRAM_TOKEN) {
  console.error('❌ ERROR: TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Initialize download queue with concurrency limit
const downloadQueue = new PQueue({ concurrency: MAX_CONCURRENT_DOWNLOADS });

// In-memory rate limiting map: userId -> { lastRequest: timestamp, count: number }
const rateLimitMap = new Map();

// In-memory cache map: urlHash -> { filename, timestamp, filePath }
const cacheMap = new Map();

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'analytics.db'));

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
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
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
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
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
      res.status(400).json({ error: 'Invalid format. Use json or csv.' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Start servers
app.listen(WEB_SERVER_PORT, () => {
  console.log(`✅ Web server running on port ${WEB_SERVER_PORT}`);
  console.log(`✅ Public URL: ${PUBLIC_URL || 'Not set'}`);
});

adminApp.listen(ADMIN_PORT, () => {
  console.log(`✅ Admin panel running on port ${ADMIN_PORT}`);
  console.log(`📊 Access admin panel at: http://localhost:${ADMIN_PORT}`);
});

// Create required directories
(async () => {
  try {
    await fs.mkdir(DOWNLOADS_DIR, { recursive: true });
    await fs.mkdir(path.join(__dirname, 'admin'), { recursive: true });
    console.log('✅ Directories ready');
  } catch (error) {
    console.error('❌ Failed to create directories:', error);
    process.exit(1);
  }
})();

// Function to check if yt-dlp is installed
async function checkYtDlp() {
  return new Promise((resolve) => {
    exec('yt-dlp --version', (error) => {
      if (error) {
        console.warn('⚠️  yt-dlp not found. Please install it: https://github.com/yt-dlp/yt-dlp#installation');
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
          reject(new Error('Failed to download video after multiple attempts. The URL might be invalid or the video is unavailable.'));
        }
        return;
      }

      try {
        // Find the downloaded file
        const files = await fs.readdir(DOWNLOADS_DIR);
        const downloadedFile = files.find(f => f.startsWith(videoId));

        if (!downloadedFile) {
          reject(new Error('Video file not found after download'));
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

    for (const file of files) {
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
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old file(s)`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
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
    bot.sendMessage(chatId, '❌ Failed to retrieve statistics');
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
    bot.sendMessage(
      chatId,
      `⏳ Please wait ${rateLimit.waitTime} seconds before sending another request.`,
      { reply_to_message_id: msg.message_id }
    );
    return;
  }

  // Notify user that download is starting
  const statusMessage = await bot.sendMessage(
    chatId,
    `⏳ Downloading ${platform} video... Please wait!`,
    { reply_to_message_id: msg.message_id }
  );

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
        await bot.editMessageText(
          '📤 Uploading to Telegram...',
          {
            chat_id: chatId,
            message_id: statusMessage.message_id
          }
        );

        await bot.sendVideo(
          chatId,
          result.filePath,
          {
            caption: `✅ Downloaded from ${platform}${fromCache ? ' (cached)' : ''}`,
            reply_to_message_id: msg.message_id
          }
        );

        // Delete the status message since video was sent
        await bot.deleteMessage(chatId, statusMessage.message_id);

        // Delete file after successful send to save space
        try {
          await fs.unlink(result.filePath);
          cacheMap.delete(urlHash);
          console.log(`🗑️  Deleted file after sending: ${result.filename}`);
        } catch (deleteError) {
          console.error('Error deleting file:', deleteError);
        }

        success = true;
        console.log(`✅ Successfully sent video directly for ${platform} (chat ${chatId})`);

      } catch (sendError) {
        // If direct send fails (file too large), send download link
        console.warn('Direct send failed, providing download link:', sendError.message);

        const downloadUrl = PUBLIC_URL ? `${PUBLIC_URL}/downloads/${result.filename}` : null;

        if (downloadUrl) {
          await bot.editMessageText(
            `✅ *Video downloaded!*\n\n📥 [Click here to download](${downloadUrl})\n\n💡 (File too large for direct send)`,
            {
              chat_id: chatId,
              message_id: statusMessage.message_id,
              parse_mode: 'Markdown'
            }
          );
          success = true;
        } else {
          throw new Error('Cannot send video directly and PUBLIC_URL not configured');
        }
      }

    } catch (error) {
      console.error('Processing error:', error);
      errorMessage = error.message;

      await bot.editMessageText(
        `❌ *Failed to download video*\n\nPlatform: ${platform}\nError: ${error.message}\n\nPlease make sure the link is valid and try again.`,
        {
          chat_id: chatId,
          message_id: statusMessage.message_id,
          parse_mode: 'Markdown'
        }
      );
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
      console.error('Database error:', dbError);
    }
  });
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await downloadQueue.onIdle();
  bot.stopPolling();
  db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await downloadQueue.onIdle();
  bot.stopPolling();
  db.close();
  process.exit(0);
});

// Check yt-dlp on startup
checkYtDlp();

console.log('🤖 Multi-Platform Video Downloader Bot is running...');
console.log(`📊 Features: Queue (${MAX_CONCURRENT_DOWNLOADS} concurrent), Caching, Rate Limiting, Analytics`);
console.log('📱 Waiting for messages...');
