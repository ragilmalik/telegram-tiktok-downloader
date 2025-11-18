#!/usr/bin/env node

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_SERVER_PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL; // Your server's public URL
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const MAX_FILE_AGE_HOURS = parseInt(process.env.MAX_FILE_AGE_HOURS || '24');
const CLEANUP_INTERVAL_MINUTES = parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '60');

// Validate configuration
if (!TELEGRAM_TOKEN) {
  console.error('❌ ERROR: TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

if (!PUBLIC_URL) {
  console.error('❌ ERROR: PUBLIC_URL is not set in .env file');
  process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Initialize Express server
const app = express();

// Serve static files from downloads directory
app.use('/downloads', express.static(DOWNLOADS_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Start web server
app.listen(WEB_SERVER_PORT, () => {
  console.log(`✅ Web server running on port ${WEB_SERVER_PORT}`);
  console.log(`✅ Public URL: ${PUBLIC_URL}`);
});

// Create downloads directory if it doesn't exist
(async () => {
  try {
    await fs.mkdir(DOWNLOADS_DIR, { recursive: true });
    console.log('✅ Downloads directory ready');
  } catch (error) {
    console.error('❌ Failed to create downloads directory:', error);
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

// Function to extract TikTok URLs from message
function extractTikTokUrl(text) {
  const tiktokRegex = /(https?:\/\/)?(www\.)?(vm\.tiktok\.com|tiktok\.com|vt\.tiktok\.com)\/[^\s]+/gi;
  const matches = text.match(tiktokRegex);
  return matches ? matches[0] : null;
}

// Function to download TikTok video
async function downloadTikTokVideo(url) {
  const videoId = crypto.randomBytes(16).toString('hex');
  const outputTemplate = path.join(DOWNLOADS_DIR, `${videoId}.%(ext)s`);

  return new Promise((resolve, reject) => {
    // yt-dlp command with best quality and no watermark options
    const command = `yt-dlp -f "best[ext=mp4]/best" --no-playlist --no-warnings --quiet -o "${outputTemplate}" "${url}"`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('Download error:', error);
        reject(new Error('Failed to download video. Please make sure the URL is valid.'));
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

        resolve(downloadedFile);
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
🎬 *Welcome to TikTok Video Downloader Bot!*

📱 *How to use:*
1. Send me any TikTok video link
2. I'll download it for you
3. Click the download link I send back
4. Save the video to your device!

💡 *Supported formats:*
• tiktok.com/...
• vm.tiktok.com/...
• vt.tiktok.com/...

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
/stats - Show bot statistics

*Usage:*
Simply send me a TikTok video URL and I'll download it for you!

*Example:*
https://vm.tiktok.com/ZMexample/

*Need support?*
If something doesn't work, make sure:
• The TikTok link is valid
• The video is publicly accessible
• The link is not expired
  `.trim();

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const files = await fs.readdir(DOWNLOADS_DIR);
    const statsMessage = `
📊 *Bot Statistics*

🎥 Videos cached: ${files.length}
⏱️ Uptime: ${Math.floor(process.uptime() / 3600)} hours
🧹 Auto-cleanup: Every ${CLEANUP_INTERVAL_MINUTES} minutes
📁 Max file age: ${MAX_FILE_AGE_HOURS} hours
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
  const messageText = msg.text || '';

  // Extract TikTok URL
  const tiktokUrl = extractTikTokUrl(messageText);

  if (!tiktokUrl) {
    return; // Ignore messages without TikTok URLs
  }

  // Notify user that download is starting
  const statusMessage = await bot.sendMessage(
    chatId,
    '⏳ Downloading your TikTok video... Please wait!',
    { reply_to_message_id: msg.message_id }
  );

  try {
    // Download the video
    const filename = await downloadTikTokVideo(tiktokUrl);
    const downloadUrl = `${PUBLIC_URL}/downloads/${filename}`;

    // Send success message with download link
    await bot.editMessageText(
      `✅ *Video downloaded successfully!*\n\n📥 [Click here to download](${downloadUrl})\n\n💡 Tap the link above and save the video to your device!`,
      {
        chat_id: chatId,
        message_id: statusMessage.message_id,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      }
    );

    console.log(`✅ Successfully processed video for chat ${chatId}`);

  } catch (error) {
    console.error('Processing error:', error);
    await bot.editMessageText(
      `❌ *Failed to download video*\n\nError: ${error.message}\n\nPlease make sure the link is valid and try again.`,
      {
        chat_id: chatId,
        message_id: statusMessage.message_id,
        parse_mode: 'Markdown'
      }
    );
  }
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
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  bot.stopPolling();
  process.exit(0);
});

// Check yt-dlp on startup
checkYtDlp();

console.log('🤖 Telegram TikTok Downloader Bot is running...');
console.log('📱 Waiting for messages...');
