const { PrismaClient } = require('@prisma/client');
const TTSService = require('./tts-service');

async function testRadio() {
  console.log('🧪 Testing Radio Streaming Service...\n');

  // Test 1: Database Connection
  console.log('1. Testing Database Connection...');
  try {
    const prisma = new PrismaClient();
    const albumCount = await prisma.nFT.count();
    console.log(`✅ Database connected! Found ${albumCount} albums`);
    
    // Test getting albums with users
    const albums = await prisma.nFT.findMany({
      include: { user: true },
      take: 2
    });
    console.log(`✅ Sample albums: ${albums.map(a => `${a.name} by ${a.user.name}`).join(', ')}`);
    
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
  console.log('- If all tests pass, you can run: node scripts/radio-stream-service.js');
  console.log('- This service will manage your radio playlist and TTS announcements');
  console.log('- No FFmpeg or video dependencies required!');
  console.log('- Ready for audio-only radio streaming');
}

// Run the test
testRadio().catch(console.error); 