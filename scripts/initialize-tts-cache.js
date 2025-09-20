#!/usr/bin/env node

/**
 * Initialize TTS Cache
 * Pre-generates all generic ads to reduce ElevenLabs API usage
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function initializeTTSCache() {
  console.log('🎙️  Initializing TTS Cache...');
  
  try {
    // Call the admin API to pre-generate TTS cache
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/tts-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'pregenerate',
        voiceId: 'EXAVITQu4vr4xnSDxMaL' // Default voice
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ TTS Cache initialized successfully!');
      console.log('📊 Cache Statistics:');
      console.log(`   Total cached: ${result.stats.totalCached}`);
      console.log(`   Generic ads: ${result.stats.ads}`);
      console.log(`   Track intros: ${result.stats.intros}`);
      console.log('');
      console.log('💰 Cost Savings:');
      console.log(`   Generic ads will now be served from cache instead of generating new ones`);
      console.log(`   This will significantly reduce ElevenLabs API usage and costs`);
    } else {
      console.error('❌ Failed to initialize TTS cache:', result.error);
    }

  } catch (error) {
    console.error('❌ Error initializing TTS cache:', error.message);
    
    // Fallback: try to initialize manually
    console.log('🔄 Attempting manual initialization...');
    
    const genericAds = [
      "You're listening to VinylFunders Radio. Discover amazing independent artists and support the vinyl revival! Visit vinylfunders.com to explore exclusive vinyl presales.",
      "This broadcast is brought to you by VinylFunders. Where music lovers meet vinyl collectors. Find your next favorite artist and pre-order their vinyl today.",
      "VinylFunders Radio - your gateway to independent music. Every track you hear is from an artist with vinyl available for pre-sale. Support the artists, own the music.",
      "Thanks for tuning into VinylFunders Radio. We're connecting independent musicians with vinyl enthusiasts worldwide. Check out our latest vinyl releases at vinylfunders.com.",
      "Welcome to VinylFunders Radio, where independent music meets vinyl culture. Each artist you hear has vinyl available for pre-order. Join the vinyl revolution!",
      "Support independent artists by purchasing their music on VinylFunders. Visit our website to discover more amazing vinyl releases.",
      "You're listening to the best in independent music on VinylFunders Radio. Every track is available on vinyl. Pre-order now and support the artists directly.",
      "VinylFunders Radio brings you the finest independent music. All tracks are available for vinyl pre-sale. Discover, support, and own the music you love."
    ];

    console.log(`📝 Found ${genericAds.length} generic ads to cache`);
    console.log('💡 Run this script after deployment to pre-generate TTS cache');
    console.log('💡 Or call POST /api/admin/tts-cache with action: "pregenerate"');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeTTSCache().catch(console.error); 