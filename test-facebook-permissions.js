#!/usr/bin/env node

/**
 * Test Facebook Token Permissions
 * 
 * This script tests what permissions your access token actually has
 * 
 * Usage: node test-facebook-permissions.js YOUR_ACCESS_TOKEN
 */

const https = require('https');

const accessToken = process.argv[2];

if (!accessToken) {
  console.log('❌ Please provide your access token');
  console.log('Usage: node test-facebook-permissions.js YOUR_ACCESS_TOKEN');
  process.exit(1);
}

console.log('🔍 Testing your Facebook access token permissions...\n');

// Test what permissions the token has
const permissionsUrl = `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`;

https.get(permissionsUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.error) {
        console.log('❌ Error:', result.error.message);
        return;
      }
      
      console.log('✅ Your token permissions:');
      result.data.forEach(permission => {
        const status = permission.status === 'granted' ? '✅' : '❌';
        console.log(`${status} ${permission.permission}`);
      });
      
      // Check if we have the minimum needed permissions
      const grantedPermissions = result.data
        .filter(p => p.status === 'granted')
        .map(p => p.permission);
      
      const requiredPermissions = ['pages_show_list'];
      const hasRequired = requiredPermissions.every(perm => 
        grantedPermissions.includes(perm)
      );
      
      console.log('\n📊 Analysis:');
      if (hasRequired) {
        console.log('✅ You have the minimum required permissions!');
        console.log('💡 Now run: node get-facebook-tokens.js ' + accessToken);
      } else {
        console.log('❌ Missing required permissions');
        console.log('📋 You need at least: pages_show_list');
        console.log('🔗 Try the manual authorization URL method');
      }
      
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
  
}).on('error', (error) => {
  console.log('❌ Request error:', error.message);
});

console.log('📡 Checking permissions...');
