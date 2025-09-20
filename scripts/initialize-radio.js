const { PrismaClient } = require('@prisma/client');

async function initializeRadio() {
  console.log('🎵 Initializing Radio System...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Check if radio stream exists
    console.log('1. Checking for existing radio streams...');
    const existingStreams = await prisma.radioStream.findMany();
    console.log(`   Found ${existingStreams.length} existing radio streams`);
    
    let radioStream;
    
    if (existingStreams.length === 0) {
      // Create a new radio stream
      console.log('2. Creating new radio stream...');
      radioStream = await prisma.radioStream.create({
        data: {
          name: 'VinylFunders Radio',
          status: 'active',
          isLive: false,
          currentTrackIndex: 0,
          currentTrackStartTime: new Date(),
          totalListeners: 0,
          peakListeners: 0,
          totalPlayTime: 0,
        },
      });
      console.log(`   ✅ Created radio stream: ${radioStream.name} (ID: ${radioStream.id})`);
    } else {
      // Use existing stream and activate it
      radioStream = existingStreams[0];
      console.log('2. Using existing radio stream...');
      
      // Activate the stream if it's not active
      if (radioStream.status !== 'active') {
        radioStream = await prisma.radioStream.update({
          where: { id: radioStream.id },
          data: { 
            status: 'active',
            currentTrackIndex: 0,
            currentTrackStartTime: new Date(),
          },
        });
        console.log(`   ✅ Activated radio stream: ${radioStream.name}`);
      } else {
        console.log(`   ✅ Radio stream already active: ${radioStream.name}`);
      }
    }
    
    // Step 2: Check for eligible tracks
    console.log('3. Checking for eligible tracks...');
    const eligibleTracks = await prisma.nFT.findMany({
      where: {
        isRadioEligible: true,
        previewAudioUrl: { not: null },
        deletedAt: null,
        isDeleted: false,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`   Found ${eligibleTracks.length} eligible tracks`);
    
    if (eligibleTracks.length === 0) {
      console.log('   ⚠️  No eligible tracks found. Upload some albums first!');
      return;
    }
    
    // Show sample tracks
    console.log('   Sample tracks:');
    eligibleTracks.slice(0, 3).forEach((track, index) => {
      console.log(`     ${index + 1}. "${track.name}" by ${track.user.name}`);
    });
    
    // Step 3: Check for existing playlist
    console.log('4. Checking for existing playlist...');
    const existingPlaylist = await prisma.playlist.findFirst({
      where: {
        status: 'active',
        radioStreamId: radioStream.id,
      },
      include: {
        tracks: {
          take: 5,
          include: {
            nft: {
              select: { name: true },
            },
          },
        },
      },
    });
    
    if (existingPlaylist) {
      console.log(`   ✅ Found existing active playlist: ${existingPlaylist.name}`);
      console.log(`   Track count: ${existingPlaylist.trackCount}`);
      console.log(`   Duration: ${Math.round(existingPlaylist.totalDuration / 60)} minutes`);
      
      // Update radio stream to use this playlist
      await prisma.radioStream.update({
        where: { id: radioStream.id },
        data: { currentPlaylistId: existingPlaylist.id },
      });
      
      console.log('   ✅ Radio stream updated with existing playlist');
    } else {
      // Step 4: Generate new playlist
      console.log('4. Generating new playlist...');
      
      // Create playlist
      const playlist = await prisma.playlist.create({
        data: {
          name: `Radio Playlist - ${new Date().toLocaleDateString()}`,
          status: 'active',
          radioStreamId: radioStream.id,
          trackCount: 0,
          totalDuration: 0,
        },
      });
      
      console.log(`   ✅ Created playlist: ${playlist.name}`);
      
      // Add tracks to playlist
      const playlistTracks = [];
      let currentDuration = 0;
      const maxDuration = 3600; // 1 hour
      
      for (const track of eligibleTracks) {
        if (currentDuration >= maxDuration) break;
        
        const trackDuration = 180; // Default 3 minutes (180 seconds)
        
        playlistTracks.push({
          playlistId: playlist.id,
          nftId: track.id,
          position: playlistTracks.length,
          ttsAudioId: null,
          sampleStart: 0,
          sampleEnd: 30, // 30 second sample
          duration: trackDuration,
          isAd: false,
          isIntro: false,
          ttsAudioUrl: null,
        });
        
        currentDuration += trackDuration;
      }
      
      // Create playlist tracks
      await prisma.playlistTrack.createMany({
        data: playlistTracks,
      });
      
      // Update playlist stats
      await prisma.playlist.update({
        where: { id: playlist.id },
        data: {
          trackCount: playlistTracks.length,
          totalDuration: currentDuration,
        },
      });
      
      // Update radio stream with new playlist
      await prisma.radioStream.update({
        where: { id: radioStream.id },
        data: { currentPlaylistId: playlist.id },
      });
      
      console.log(`   ✅ Added ${playlistTracks.length} tracks to playlist`);
      console.log(`   Total duration: ${Math.round(currentDuration / 60)} minutes`);
    }
    
    // Step 5: Verify setup
    console.log('5. Verifying radio setup...');
    const finalStream = await prisma.radioStream.findUnique({
      where: { id: radioStream.id },
      include: {
        currentPlaylist: {
          include: {
            tracks: {
              take: 3,
              include: {
                nft: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });
    
    if (finalStream && finalStream.currentPlaylist) {
      console.log('   ✅ Radio system initialized successfully!');
      console.log(`   Stream: ${finalStream.name} (${finalStream.status})`);
      console.log(`   Playlist: ${finalStream.currentPlaylist.name}`);
      console.log(`   Tracks: ${finalStream.currentPlaylist.trackCount}`);
      console.log(`   Current track index: ${finalStream.currentTrackIndex}`);
      
      console.log('\n🎵 Radio is ready! The footer player should now work.');
      console.log('   - Visit your app and check the footer radio player');
      console.log('   - New uploads will automatically be added via the refresh API');
    } else {
      console.log('   ❌ Setup verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error initializing radio system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeRadio().catch(console.error); 