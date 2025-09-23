#!/usr/bin/env node

/**
 * VinylFunders Social Media Background Worker
 * 
 * This runs as a background service on Render and posts to social media daily
 * 
 * Usage:
 * - Deploy as a "Background Worker" on Render
 * - Or run with: node social-worker.js
 */

const https = require('https');

// Configuration
const SCHEDULE_HOUR = 9; // 9 AM UTC
const CHECK_INTERVAL = 60 * 1000; // Check every minute
const API_URL = process.env.RENDER_EXTERNAL_URL || 'https://www.vinylfunders.com';

let lastRunDate = null;

console.log('🤖 VinylFunders Social Media Worker started');
console.log(`⏰ Scheduled to run daily at ${SCHEDULE_HOUR}:00 UTC`);
console.log(`🔗 API URL: ${API_URL}`);

function shouldRunToday() {
  const now = new Date();
  const today = now.toDateString();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  
  // Check if we should run (at the scheduled hour, within first 5 minutes)
  const shouldRun = currentHour === SCHEDULE_HOUR && currentMinute < 5;
  
  // Check if we already ran today
  const alreadyRanToday = lastRunDate === today;
  
  return shouldRun && !alreadyRanToday;
}

async function postToSocialMedia() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      platforms: ['facebook'],
      force: false
    });
    
    const options = {
      hostname: new URL(API_URL).hostname,
      port: 443,
      path: '/api/social/scheduler',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log(`📡 Making request to ${API_URL}/api/social/scheduler`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Social media posting completed:', result);
          resolve(result);
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function checkAndRun() {
  try {
    if (shouldRunToday()) {
      console.log('🚀 Time to post! Running social media automation...');
      
      const result = await postToSocialMedia();
      
      if (result.success) {
        lastRunDate = new Date().toDateString();
        console.log(`✅ Social media posting successful at ${new Date().toISOString()}`);
        console.log(`📊 Results: ${result.platforms?.facebook?.successCount || 0} posts created`);
      } else {
        console.error('❌ Social media posting failed:', result);
      }
    } else {
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setUTCHours(SCHEDULE_HOUR, 0, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      // Only log every hour to avoid spam
      if (now.getUTCMinutes() === 0) {
        console.log(`⏰ Next run scheduled for: ${nextRun.toISOString()}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in checkAndRun:', error);
  }
}

// Health check endpoint for Render
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      lastRun: lastRunDate,
      nextRun: SCHEDULE_HOUR + ':00 UTC daily',
      uptime: process.uptime()
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`💓 Health check server running on port ${PORT}`);
});

// Start the scheduler
setInterval(checkAndRun, CHECK_INTERVAL);

// Run initial check
checkAndRun();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Social media worker shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
