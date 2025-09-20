const TTSService = require('./tts-service');
const { PrismaClient } = require('@prisma/client');

async function testLocal() {
  console.log('🧪 Testing YouTube Streaming Service Locally...\n');

  // Test 1: Database Connection
  console.log('1. Testing Database Connection...');
  try {
    const prisma = new PrismaClient();
    const albumCount = await prisma.nFT.count();
    console.log(`✅ Database connected! Found ${albumCount} albums`);
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }

  // Test 2: TTS Service
  console.log('\n2. Testing ElevenLabs TTS...');
  try {
    const ttsService = new TTSService();
    
    if (!process.env.ELEVENLABS_API_KEY) {
      console.log('⚠️  ELEVENLABS_API_KEY not set, testing with system TTS...');
    } else {
      console.log('✅ ELEVENLABS_API_KEY found');
    }

    const testText = 'Welcome to VinylFunders Radio. Testing TTS functionality.';
    const audioPath = await ttsService.generateTTSAudio(testText);
    console.log(`✅ TTS audio generated: ${audioPath}`);
    
    const duration = await ttsService.getAudioDuration(audioPath);
    console.log(`✅ Audio duration: ${duration}ms`);
  } catch (error) {
    console.log('❌ TTS test failed:', error.message);
  }

  // Test 3: Dependencies
  console.log('\n3. Testing Dependencies...');
  try {
    const ffmpeg = require('fluent-ffmpeg');
    console.log('✅ FFmpeg loaded');
    
    const { createCanvas } = require('canvas');
    console.log('✅ Canvas loaded');
    
    const QRCode = require('qrcode');
    console.log('✅ QRCode loaded');
    
    const cron = require('node-cron');
    console.log('✅ Node-cron loaded');
    
    const fetch = require('node-fetch');
    console.log('✅ Node-fetch loaded');
  } catch (error) {
    console.log('❌ Dependency test failed:', error.message);
  }

  // Test 4: Environment Variables
  console.log('\n4. Checking Environment Variables...');
  const requiredVars = [
    'DATABASE_URL',
    'ELEVENLABS_API_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];

  const optionalVars = [
    'YOUTUBE_STREAM_KEY'
  ];

  console.log('Required:');
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is NOT set`);
    }
  });

  console.log('\nOptional:');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`⚠️  ${varName} is NOT set (using default: b5pm-5a36-7c3g-tfze-f791)`);
    }
  });

  console.log('\n🎯 Test Summary:');
  console.log('- If all tests pass, you can run: node scripts/youtube-stream-simple.js');
  console.log('- Set ELEVENLABS_API_KEY for TTS functionality');
  console.log('- YouTube stream key is ready to use!');
}

// Run the test
testLocal().catch(console.error); 