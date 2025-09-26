#!/usr/bin/env node

/**
 * Test YouTube API Connection
 * 
 * Simple test to verify YouTube API credentials are working
 */

const { google } = require('googleapis');

async function testYouTubeConnection() {
  try {
    console.log('🎥 Testing YouTube API Connection');
    console.log('=================================\n');

    // Get credentials from environment
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!clientId || !clientSecret) {
      console.log('❌ Missing YouTube API credentials in environment variables');
      process.exit(1);
    }

    if (!refreshToken) {
      console.log('⚠️  No refresh token found. You may need to authenticate first.');
    }

    // Initialize OAuth client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3000/api/youtube/callback'
    );

    if (refreshToken) {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
    }

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Test 1: Get channel information
    console.log('📺 Testing channel access...');
    try {
      const channelResponse = await youtube.channels.list({
        part: ['snippet', 'statistics', 'status'],
        mine: true
      });

      if (channelResponse.data.items && channelResponse.data.items.length > 0) {
        const channel = channelResponse.data.items[0];
        console.log('✅ Channel access successful!');
        console.log(`   Name: ${channel.snippet.title}`);
        console.log(`   ID: ${channel.id}`);
        console.log(`   Subscribers: ${channel.statistics.subscriberCount}`);
        console.log(`   Videos: ${channel.statistics.videoCount}`);
        console.log('');

        // Update .env suggestion
        if (channel.id !== channelId) {
          console.log('📋 Update your .env file:');
          console.log(`YOUTUBE_CHANNEL_ID=${channel.id}`);
          console.log('');
        }
      }
    } catch (error) {
      console.error('❌ Channel access failed:', error.message);
      if (error.code === 401) {
        console.log('💡 Try refreshing your credentials or re-authenticating');
      }
      return;
    }

    // Test 2: Check live streaming capability
    console.log('🔴 Testing live streaming access...');
    try {
      const broadcastResponse = await youtube.liveBroadcasts.list({
        part: ['snippet'],
        broadcastStatus: 'all',
        maxResults: 1
      });

      console.log('✅ Live streaming API accessible!');
      console.log(`   Found ${broadcastResponse.data.items?.length || 0} previous broadcasts`);
      console.log('');
    } catch (error) {
      if (error.code === 403) {
        console.log('❌ Live streaming not available for this channel');
        console.log('💡 Requirements:');
        console.log('   • Channel must be verified with phone number');
        console.log('   • No live streaming restrictions in past 90 days');
        console.log('   • Check YouTube Studio → Settings → Channel → Features');
      } else {
        console.error('❌ Live streaming test failed:', error.message);
      }
      return;
    }

    // Test 3: Check quotas and limits
    console.log('📊 API Connection Summary:');
    console.log('✅ Authentication: Working');
    console.log('✅ Channel Access: Working');
    console.log('✅ Live Streaming: Available');
    console.log('');
    console.log('🚀 Ready to start live streaming!');
    console.log('   Go to: /admin/radio/live-stream');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.code === 401) {
      console.log('💡 Authentication failed. You may need to:');
      console.log('   1. Check your credentials are correct');
      console.log('   2. Regenerate your refresh token');
      console.log('   3. Ensure your OAuth client is properly configured');
    }
  }
}

// Run test
testYouTubeConnection();

