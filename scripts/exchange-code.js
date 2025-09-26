#!/usr/bin/env node

/**
 * Exchange Authorization Code for Refresh Token
 */

const { google } = require('googleapis');

async function exchangeCode() {
  const authCode = process.argv[2];
  
  if (!authCode) {
    console.log('❌ Please provide the authorization code');
    console.log('Usage: node scripts/exchange-code.js YOUR_AUTH_CODE');
    process.exit(1);
  }

  try {
    console.log('🔑 Exchanging authorization code for tokens...');
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      'http://localhost:8080/callback'
    );

    const { tokens } = await oauth2Client.getToken(authCode);
    
    console.log('✅ Success! Got tokens:');
    console.log('');
    console.log('📋 Update your .env file with:');
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('');
    
    // Test the tokens
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    const response = await youtube.channels.list({
      part: ['snippet'],
      mine: true
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      console.log('✅ Tokens working! Channel info:');
      console.log(`   Name: ${channel.snippet.title}`);
      console.log(`   ID: ${channel.id}`);
      console.log('');
      console.log('📋 Also add to .env:');
      console.log(`YOUTUBE_CHANNEL_ID=${channel.id}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to exchange code:', error.message);
  }
}

exchangeCode();

