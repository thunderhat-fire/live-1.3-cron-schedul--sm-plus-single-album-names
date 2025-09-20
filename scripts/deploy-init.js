const { PrismaClient } = require('@prisma/client');

async function deployInit() {
  console.log('🚀 Running deployment initialization...');
  
  // Only run in production or when explicitly requested
  if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_INIT) {
    console.log('⏭️  Skipping initialization (not in production)');
    return;
  }
  
  const prisma = new PrismaClient();
  
  try {
    // Check if database is accessible
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Check if radio system needs initialization
    const radioStreams = await prisma.radioStream.findMany();
    
    if (radioStreams.length === 0) {
      console.log('🎵 Initializing radio system...');
      
      // Create radio stream
      const radioStream = await prisma.radioStream.create({
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
      
      console.log(`✅ Created radio stream: ${radioStream.name}`);
      
      // Check for eligible tracks
      const eligibleTracks = await prisma.nFT.findMany({
        where: {
          isRadioEligible: true,
          previewAudioUrl: { not: null },
          deletedAt: null,
          isDeleted: false,
        },
        take: 20, // Limit to first 20 tracks for initial playlist
      });
      
      if (eligibleTracks.length > 0) {
        // Create initial playlist
        const playlist = await prisma.playlist.create({
          data: {
            name: `Initial Playlist - ${new Date().toLocaleDateString()}`,
            status: 'active',
            radioStreamId: radioStream.id,
            trackCount: 0,
            totalDuration: 0,
          },
        });
        
        // Add tracks to playlist
        const playlistTracks = eligibleTracks.map((track, index) => ({
          playlistId: playlist.id,
          nftId: track.id,
          position: index,
          ttsAudioId: null,
          sampleStart: 0,
          sampleEnd: 30,
          duration: 180, // 3 minutes default
          isAd: false,
          isIntro: false,
          ttsAudioUrl: null,
        }));
        
        await prisma.playlistTrack.createMany({
          data: playlistTracks,
        });
        
        // Update playlist stats
        await prisma.playlist.update({
          where: { id: playlist.id },
          data: {
            trackCount: playlistTracks.length,
            totalDuration: playlistTracks.length * 180,
          },
        });
        
        // Link playlist to radio stream
        await prisma.radioStream.update({
          where: { id: radioStream.id },
          data: { currentPlaylistId: playlist.id },
        });
        
        console.log(`✅ Created initial playlist with ${playlistTracks.length} tracks`);
      } else {
        console.log('⚠️  No eligible tracks found for initial playlist');
      }
      
      console.log('🎵 Radio system initialized successfully!');
    } else {
      console.log('✅ Radio system already initialized');
    }
    
  } catch (error) {
    console.error('❌ Deployment initialization failed:', error);
    // Don't fail the deployment if initialization fails
    process.exit(0);
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
deployInit().catch((error) => {
  console.error('❌ Fatal error during deployment init:', error);
  process.exit(0); // Don't fail deployment
}); 