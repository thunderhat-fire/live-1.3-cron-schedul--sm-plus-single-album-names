import { NextRequest, NextResponse } from 'next/server';
import { radioService } from '@/lib/radio/radioService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { maxDuration = 3600, includeTTS = false, voiceId = 'default', shuffleTracks = true } = body;

    const playlistId = await radioService.generatePlaylist({
      maxDuration,
      includeTTS,
      voiceId,
      shuffleTracks,
    });

    return NextResponse.json({ 
      success: true, 
      playlistId,
      message: 'Playlist generated successfully' 
    });

  } catch (error) {
    console.error('Error generating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to generate playlist' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Playlist API: Fetching current playlist...');
    const playlist = await radioService.getCurrentPlaylist();
    console.log('Playlist API: Raw playlist data:', playlist);

    if (!playlist) {
      console.log('Playlist API: No active playlist found');
      return NextResponse.json({ error: 'No active playlist found' }, { status: 404 });
    }

    // Log the structure of the playlist data
    console.log('Playlist API: Playlist structure:', {
      id: playlist.id,
      name: playlist.name,
      status: playlist.status,
      trackCount: playlist.trackCount,
      totalDuration: playlist.totalDuration,
      tracksLength: playlist.tracks?.length,
      tracksType: typeof playlist.tracks,
      tracksKeys: playlist.tracks ? Object.keys(playlist.tracks[0] || {}) : 'no tracks'
    });

    if (playlist.tracks && playlist.tracks.length > 0) {
      console.log('Playlist API: First track structure:', {
        id: playlist.tracks[0].id,
        isAd: playlist.tracks[0].isAd,
        isIntro: playlist.tracks[0].isIntro,
        nftId: playlist.tracks[0].nftId,
        nft: playlist.tracks[0].nft ? 'present' : 'null',
        duration: playlist.tracks[0].duration
      });
    }

    return NextResponse.json(playlist);

  } catch (error) {
    console.error('Playlist API: Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { maxDuration = 3600, includeTTS = false, voiceId = 'EXAVITQu4vr4xnSDxMaL', shuffleTracks = true } = body;

    console.log('Regenerating playlist...');
    const playlistId = await radioService.generatePlaylist({
      maxDuration,
      includeTTS,
      voiceId,
      shuffleTracks,
    });

    // Update current radio stream to use the new playlist
    await prisma.radioStream.updateMany({
      where: { status: 'active' },
      data: { 
        currentPlaylistId: playlistId,
        currentTrackIndex: 0, // Reset to start of new playlist
        currentTrackStartTime: new Date(), // Reset timing
      },
    });

    return NextResponse.json({ 
      success: true, 
      playlistId,
      message: 'Playlist regenerated successfully' 
    });

  } catch (error) {
    console.error('Error regenerating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate playlist' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('Regenerating playlist with TTS disabled...');
    
    // Generate new playlist with TTS disabled for now
    const playlistId = await radioService.generatePlaylist({
      maxDuration: 3600, // 1 hour
      includeTTS: false, // Disable TTS due to quota issues
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Use the default voice ID
      shuffleTracks: true,
    });

    // Update current radio stream to use the new playlist
    await prisma.radioStream.updateMany({
      where: { status: 'active' },
      data: { 
        currentPlaylistId: playlistId,
        currentTrackIndex: 0, // Reset to start of new playlist
        currentTrackStartTime: new Date(), // Reset timing
      },
    });

    console.log('Playlist regenerated without TTS:', playlistId);

    return NextResponse.json({ 
      success: true, 
      playlistId,
      message: 'Playlist regenerated successfully without TTS (quota exceeded)' 
    });

  } catch (error) {
    console.error('Error regenerating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate playlist' },
      { status: 500 }
    );
  }
} 