#!/usr/bin/env node

/**
 * Basic Facebook API Test
 * 
 * This tests the most basic Facebook API call to verify your token
 */

const https = require('https');

const accessToken = process.argv[2];

if (!accessToken) {
  console.log('❌ Please provide your access token');
  console.log('Usage: node test-facebook-basic.js YOUR_ACCESS_TOKEN');
  console.log('\n📋 To get a token:');
  console.log('1. Go to https://developers.facebook.com/tools/explorer/');
  console.log('2. Select your app (or use Graph API Explorer)');
  console.log('3. Click "Generate Access Token"');
  console.log('4. Copy the token (starts with EAA...)');
  process.exit(1);
}

console.log('🔍 Testing basic Facebook API connectivity...');
console.log('🎯 Token preview:', accessToken.substring(0, 20) + '...');

// Test the most basic API call - just get user info
const url = `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`;

console.log('📡 Making request to:', url.replace(accessToken, 'TOKEN_HIDDEN'));

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📊 Response Status:', res.statusCode);
    console.log('📄 Raw Response:', data);
    
    try {
      const result = JSON.parse(data);
      
      if (result.error) {
        console.log('\n❌ Facebook API Error:');
        console.log('   Code:', result.error.code);
        console.log('   Message:', result.error.message);
        console.log('   Type:', result.error.type);
        
        if (result.error.code === 190) {
          console.log('\n💡 Token is invalid or expired. Try:');
          console.log('1. Generate a new token in Graph API Explorer');
          console.log('2. Make sure you\'re logged into Facebook');
          console.log('3. Check your app is active');
        }
      } else {
        console.log('\n✅ Success! Token is valid');
        console.log('👤 User:', result.name || 'Name not available');
        console.log('🆔 User ID:', result.id || 'ID not available');
        
        console.log('\n🎯 Now let\'s try to get your pages...');
        
        // If basic call works, try pages
        const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
        
        https.get(pagesUrl, (pagesRes) => {
          let pagesData = '';
          
          pagesRes.on('data', (chunk) => {
            pagesData += chunk;
          });
          
          pagesRes.on('end', () => {
            console.log('\n📄 Pages Response:', pagesData);
            
            try {
              const pagesResult = JSON.parse(pagesData);
              
              if (pagesResult.error) {
                console.log('\n❌ Pages API Error:', pagesResult.error.message);
                console.log('💡 This usually means you need "pages_show_list" permission');
              } else if (pagesResult.data && pagesResult.data.length > 0) {
                console.log('\n🎉 Found your pages!');
                pagesResult.data.forEach((page, index) => {
                  console.log(`\n--- PAGE ${index + 1} ---`);
                  console.log(`Name: ${page.name}`);
                  console.log(`ID: ${page.id}`);
                  console.log(`Access Token: ${page.access_token}`);
                });
                
                console.log('\n✅ Success! Add these to your .env:');
                const firstPage = pagesResult.data[0];
                console.log(`FACEBOOK_PAGE_ID=${firstPage.id}`);
                console.log(`FACEBOOK_PAGE_ACCESS_TOKEN=${firstPage.access_token}`);
              } else {
                console.log('\n⚠️  No pages found. Make sure:');
                console.log('1. You admin at least one Facebook page');
                console.log('2. Your token has pages_show_list permission');
              }
            } catch (e) {
              console.log('\n❌ Error parsing pages response:', e.message);
            }
          });
        }).on('error', (error) => {
          console.log('\n❌ Pages request error:', error.message);
        });
      }
      
    } catch (error) {
      console.log('\n❌ Error parsing JSON:', error.message);
      console.log('This might mean the token is completely invalid');
    }
  });
  
}).on('error', (error) => {
  console.log('\n❌ Request error:', error.message);
  console.log('Check your internet connection');
});
