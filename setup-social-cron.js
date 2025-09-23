#!/usr/bin/env node

/**
 * Social Media Automation Cron Job Setup
 * 
 * This script helps you set up automated social media posting for VinylFunders
 * 
 * Usage:
 * node setup-social-cron.js
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 VinylFunders Social Media Automation Setup\n');

// Configuration options
const cronConfigs = {
  daily: {
    time: '0 9 * * *', // 9 AM daily
    description: 'Daily at 9:00 AM UTC',
  },
  twiceDaily: {
    time: '0 9,18 * * *', // 9 AM and 6 PM daily
    description: 'Twice daily at 9:00 AM and 6:00 PM UTC',
  },
  weekdays: {
    time: '0 9 * * 1-5', // 9 AM on weekdays
    description: 'Weekdays at 9:00 AM UTC',
  },
  custom: {
    time: '0 10 * * *', // 10 AM daily (customize as needed)
    description: 'Custom schedule - modify as needed',
  },
};

const platforms = ['facebook']; // Add 'twitter', 'instagram' when implemented

function generateCronCommand(schedule) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vinylfunders.com';
  
  return `curl -X POST "${baseUrl}/api/social/scheduler" \\
  -H "Content-Type: application/json" \\
  -d '{"platforms": ${JSON.stringify(platforms)}, "force": false}' \\
  >> /var/log/vinylfunders-social.log 2>&1`;
}

function generateCrontab(scheduleKey) {
  const config = cronConfigs[scheduleKey];
  const command = generateCronCommand(config);
  
  return `# VinylFunders Social Media Automation
# ${config.description}
${config.time} ${command}`;
}

console.log('Available scheduling options:');
Object.keys(cronConfigs).forEach((key, index) => {
  console.log(`${index + 1}. ${key}: ${cronConfigs[key].description}`);
});

console.log('\n📋 Example crontab entries:\n');

Object.keys(cronConfigs).forEach(key => {
  console.log(`--- ${key.toUpperCase()} ---`);
  console.log(generateCrontab(key));
  console.log('');
});

console.log('🔧 Setup Instructions:');
console.log('1. Choose a schedule above');
console.log('2. Add the crontab entry to your server:');
console.log('   crontab -e');
console.log('3. Configure environment variables:');
console.log('   FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_token');
console.log('   FACEBOOK_PAGE_ID=your_facebook_page_id');
console.log('4. Test manually first:');
console.log(`   curl -X POST "${process.env.NEXT_PUBLIC_APP_URL || 'https://www.vinylfunders.com'}/api/social/scheduler" -H "Content-Type: application/json" -d '{"platforms": ["facebook"]}'`);

console.log('\n📝 Log file location: /var/log/vinylfunders-social.log');
console.log('📊 Monitor with: tail -f /var/log/vinylfunders-social.log');

// Generate a ready-to-use crontab file
const defaultCrontab = generateCrontab('daily');
fs.writeFileSync(path.join(__dirname, 'social-crontab.txt'), defaultCrontab);
console.log('\n✅ Generated social-crontab.txt file for easy installation');

console.log('\n🚀 Quick setup command:');
console.log('cat social-crontab.txt | crontab -');
