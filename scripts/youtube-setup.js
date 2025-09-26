#!/usr/bin/env node

/**
 * YouTube API Setup Script
 * 
 * This script helps set up YouTube API credentials for live streaming.
 * It will guide you through the OAuth flow and get your refresh token.
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');
const readline = require('readline');

class YouTubeSetup {
  constructor() {
    this.oauth2Client = null;
    this.youtube = null;
    this.credentials = {
      clientId: process.env.YOUTUBE_CLIENT_ID,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri: 'http://localhost:8080/callback'
    };
  }

  async setup() {
    console.log('🎥 YouTube Live Streaming Setup');
    console.log('================================\n');

    // Check if credentials are provided
    if (!this.credentials.clientId || !this.credentials.clientSecret) {
      console.log('❌ Missing YouTube API credentials!');
      console.log('');
      console.log('Please set these environment variables:');
      console.log('YOUTUBE_CLIENT_ID=your_client_id_here');
      console.log('YOUTUBE_CLIENT_SECRET=your_client_secret_here');
      console.log('');
      console.log('Get them from: https://console.cloud.google.com/apis/credentials');
      process.exit(1);
    }

    try {
      // Initialize OAuth client
      this.oauth2Client = new google.auth.OAuth2(
        this.credentials.clientId,
        this.credentials.clientSecret,
        this.credentials.redirectUri
      );

      this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });

      // Start OAuth flow
      await this.getAuthorizationCode();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async getAuthorizationCode() {
    console.log('📡 Starting OAuth authentication...');
    
    // Generate auth URL
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtube.readonly'
      ]
    });

    console.log('🔗 Opening browser for authentication...');
    console.log('If browser doesn\'t open, visit:', authUrl);
    
    // Start local server to capture callback
    const server = http.createServer(async (req, res) => {
      const urlParts = url.parse(req.url, true);
      
      if (urlParts.pathname === '/callback') {
        const code = urlParts.query.code;
        
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>✅ Authentication successful!</h1><p>You can close this window and return to the terminal.</p>');
          
          server.close();
          await this.exchangeCodeForTokens(code);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>❌ Authentication failed!</h1><p>No authorization code received.</p>');
          server.close();
          process.exit(1);
        }
      }
    });

    server.listen(8080, () => {
      console.log('🔄 Waiting for authentication...');
      open(authUrl);
    });
  }

  async exchangeCodeForTokens(code) {
    try {
      console.log('🔑 Exchanging code for tokens...');
      
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      console.log('✅ Tokens received successfully!');
      console.log('');

      // Display tokens
      console.log('📋 Add these to your .env file:');
      console.log('================================');
      console.log(`YOUTUBE_CLIENT_ID=${this.credentials.clientId}`);
      console.log(`YOUTUBE_CLIENT_SECRET=${this.credentials.clientSecret}`);
      if (tokens.refresh_token) {
        console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        console.log('⚠️  No refresh token received. You may need to revoke access and try again.');
        console.log('   Go to: https://myaccount.google.com/permissions');
      }
      console.log('');

      // Get channel info
      await this.getChannelInfo();
      
      // Test live streaming capability
      await this.testLiveStreamingCapability();

    } catch (error) {
      console.error('❌ Token exchange failed:', error.message);
      process.exit(1);
    }
  }

  async getChannelInfo() {
    try {
      console.log('📺 Getting channel information...');
      
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'status'],
        mine: true
      });

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        
        console.log('✅ Channel found:');
        console.log(`   Name: ${channel.snippet.title}`);
        console.log(`   ID: ${channel.id}`);
        console.log(`   Subscribers: ${channel.statistics.subscriberCount}`);
        console.log(`   Videos: ${channel.statistics.videoCount}`);
        console.log(`   Views: ${channel.statistics.viewCount}`);
        console.log('');
        
        console.log('📋 Add this to your .env file:');
        console.log(`YOUTUBE_CHANNEL_ID=${channel.id}`);
        console.log('');

        return channel;
      } else {
        console.log('❌ No channel found for this account');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get channel info:', error.message);
      return null;
    }
  }

  async testLiveStreamingCapability() {
    try {
      console.log('🔴 Testing live streaming capability...');
      
      // Check if live streaming is enabled
      const response = await this.youtube.liveBroadcasts.list({
        part: ['snippet'],
        broadcastStatus: 'all',
        maxResults: 1
      });

      console.log('✅ Live streaming API accessible');
      
      // Note about requirements
      console.log('');
      console.log('📋 Live Streaming Requirements:');
      console.log('   • Channel must be verified with phone number');
      console.log('   • No live streaming restrictions in past 90 days');
      console.log('   • Channel must have 50+ subscribers OR be verified');
      console.log('');
      console.log('Check your status at: https://www.youtube.com/live_dashboard');
      
    } catch (error) {
      if (error.code === 403) {
        console.log('❌ Live streaming not available for this channel');
        console.log('   Check YouTube Studio → Settings → Channel → Features');
        console.log('   You may need to verify your channel or meet subscriber requirements');
      } else {
        console.error('❌ Live streaming test failed:', error.message);
      }
    }
  }
}

// Check if running directly
if (require.main === module) {
  const setup = new YouTubeSetup();
  setup.setup().catch(console.error);
}

module.exports = YouTubeSetup;

