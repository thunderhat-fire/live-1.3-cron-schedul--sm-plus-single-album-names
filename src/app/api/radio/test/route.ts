import { NextRequest, NextResponse } from 'next/server';
import { radioService } from '@/lib/radio/radioService';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing radio service...');
    
    // Test 1: Get eligible tracks
    const eligibleTracks = await radioService.getEligibleTracks();
    console.log(`Found ${eligibleTracks.length} eligible tracks`);
    
    // Test 2: Get current status
    const status = await radioService.getStatus();
    console.log('Radio status:', status);
    
    // Test 3: Try to generate a playlist with TTS enabled
    let playlistId = null;
    try {
      playlistId = await radioService.generatePlaylist({
        maxDuration: 600, // 10 minutes for testing
        includeTTS: true, // Enable TTS for ads and intros
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Use the default voice ID
        shuffleTracks: true,
      });
      console.log('Test playlist with TTS generated:', playlistId);
    } catch (error) {
      console.error('Failed to generate test playlist with TTS:', error);
    }
    
    return NextResponse.json({
      success: true,
      eligibleTracksCount: eligibleTracks.length,
      radioStatus: status,
      testPlaylistId: playlistId,
      tracks: eligibleTracks.slice(0, 3).map(track => ({
        name: track.name,
        artist: track.artist,
        duration: track.totalDuration,
      })),
    });

  } catch (error) {
    console.error('Error in radio test endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to test radio system', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 