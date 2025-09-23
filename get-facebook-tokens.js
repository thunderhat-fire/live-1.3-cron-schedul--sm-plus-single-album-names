#!/usr/bin/env node

/**
 * Facebook Token Helper Script
 * 
 * Run this script to convert your User Access Token to a Page Access Token
 * 
 * Usage:
 * 1. Get User Access Token from Graph API Explorer (with pages_manage_posts permission)
 * 2. Run: node get-facebook-tokens.js YOUR_USER_ACCESS_TOKEN
 */

const https = require('https');

const userAccessToken = process.argv[2];

if (!userAccessToken) {
  console.log('❌ Please provide your User Access Token');
  console.log('Usage: node get-facebook-tokens.js YOUR_USER_ACCESS_TOKEN');
  console.log('\n📋 Steps:');
  console.log('1. Go to https://developers.facebook.com/tools/explorer/');
  console.log('2. Select your app');
  console.log('3. Add permissions: pages_show_list, pages_manage_posts');
  console.log('4. Generate Access Token');
  console.log('5. Copy the token and run this script');
  process.exit(1);
}

console.log('🔍 Getting your Facebook pages and tokens...\n');

// Get user's pages and their access tokens
const url = `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`;

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.error) {
        console.log('❌ Error:', result.error.message);
        console.log('💡 Make sure your User Access Token has the correct permissions');
        return;
      }
      
      if (!result.data || result.data.length === 0) {
        console.log('❌ No pages found. Make sure:');
        console.log('1. You are an admin of at least one Facebook page');
        console.log('2. Your access token has pages_show_list permission');
        return;
      }
      
      console.log('✅ Found your Facebook pages:\n');
      
      result.data.forEach((page, index) => {
        console.log(`--- PAGE ${index + 1} ---`);
        console.log(`📄 Name: ${page.name}`);
        console.log(`🆔 Page ID: ${page.id}`);
        console.log(`🔑 Page Access Token: ${page.access_token}`);
        console.log(`📊 Category: ${page.category}`);
        console.log(`🔗 Tasks: ${page.tasks ? page.tasks.join(', ') : 'None'}\n`);
      });
      
      console.log('🎯 Add these to your .env file:');
      console.log('');
      
      // Show example for first page
      const firstPage = result.data[0];
      console.log(`FACEBOOK_PAGE_ID=${firstPage.id}`);
      console.log(`FACEBOOK_PAGE_ACCESS_TOKEN=${firstPage.access_token}`);
      
      console.log('\n💡 Tips:');
      console.log('• Use the Page Access Token (not the User Access Token)');
      console.log('• Page Access Tokens don\'t expire (unless you change your password)');
      console.log('• Test your setup with: curl -X POST "https://www.vinylfunders.com/api/social/facebook/post"');
      
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
  
}).on('error', (error) => {
  console.log('❌ Request error:', error.message);
});

console.log('📡 Making request to Facebook Graph API...');
