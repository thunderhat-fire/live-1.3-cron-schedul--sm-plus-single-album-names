#!/usr/bin/env node

/**
 * Facebook Authorization URL Generator
 * 
 * This generates a direct Facebook login URL with all required permissions
 * Use this if the Graph API Explorer permission interface isn't working
 */

console.log('🔗 Facebook Authorization URL Generator\n');

// You'll need your App ID from your Facebook App dashboard
const APP_ID = 'YOUR_APP_ID_HERE'; // Replace with your actual App ID
const REDIRECT_URI = 'https://developers.facebook.com/tools/explorer/';

// All the permissions we need
const permissions = [
  'pages_show_list',
  'pages_manage_posts', 
  'pages_read_engagement',
  'public_profile'
].join(',');

const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
  `client_id=${APP_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `scope=${encodeURIComponent(permissions)}&` +
  `response_type=token`;

console.log('📋 Steps:');
console.log('1. Replace YOUR_APP_ID_HERE with your actual Facebook App ID');
console.log('2. Open the generated URL in your browser');
console.log('3. Login and approve permissions');
console.log('4. Copy the access_token from the redirected URL');
console.log('5. Use that token with get-facebook-tokens.js');

console.log('\n🔗 Your Authorization URL:');
console.log(authUrl);

console.log('\n📍 To find your App ID:');
console.log('1. Go to https://developers.facebook.com/apps/');
console.log('2. Click on your app');
console.log('3. Copy the App ID from the dashboard');

console.log('\n💡 After authorization, look for access_token in the URL:');
console.log('https://developers.facebook.com/tools/explorer/#access_token=YOUR_TOKEN_HERE&...');

if (APP_ID === 'YOUR_APP_ID_HERE') {
  console.log('\n⚠️  Remember to replace YOUR_APP_ID_HERE with your real App ID!');
}
