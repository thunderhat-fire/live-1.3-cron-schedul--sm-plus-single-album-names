const { prisma } = require('./src/lib/db/prisma');

async function debugRadioState() {
  console.log('🎵 RADIO STATE DEBUG\n');

  // Check radio streams
  const radioStreams = await prisma.radioStream.findMany({
    include: {
      currentPlaylist: {
        include: {
          tracks: {
            include: {
              nft: {
                select: { id: true, title: true, user: { select: { name: true } } }
              }
            },
            orderBy: { position: 'asc' },
            take: 10
          }
        }
      }
    }
  });

  console.log(`Found ${radioStreams.length} radio streams:`);
  radioStreams.forEach(stream => {
    console.log(`\nStream: ${stream.name}`);
    console.log(`Status: ${stream.status}`);
    console.log(`Current Track Index: ${stream.currentTrackIndex}`);
    console.log(`Total Tracks in Playlist: ${stream.currentPlaylist?.tracks?.length || 0}`);
    
    if (stream.currentPlaylist?.tracks) {
      console.log('\nPlaylist tracks:');
      stream.currentPlaylist.tracks.forEach((track, i) => {
        const isCurrentTrack = i === stream.currentTrackIndex;
        console.log(`  ${isCurrentTrack ? '→' : ' '} ${i}: ${track.nft?.title || 'TTS/Ad'} (${track.nft?.id || track.ttsAudioId})`);
      });
    }
  });

  // Check total radio-eligible NFTs
  const radioEligibleNFTs = await prisma.nFT.findMany({
    where: {
      isRadioEligible: true,
      isDeleted: false,
      previewAudioUrl: { not: null }
    },
    select: { id: true, title: true, user: { select: { name: true } } }
  });

  console.log(`\n🎵 Total Radio-Eligible NFTs: ${radioEligibleNFTs.length}`);
  radioEligibleNFTs.forEach(nft => {
    console.log(`  - ${nft.title} by ${nft.user?.name} (${nft.id})`);
  });

  await prisma.$disconnect();
}

debugRadioState().catch(console.error);
