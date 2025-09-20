import { NextRequest, NextResponse } from 'next/server';
import { radioService } from '@/lib/radio/radioService';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🎵 Audio stream endpoint called at:', new Date().toISOString());
    console.log('🎵 Request URL:', request.url);
    
    // Get current track with position information
    const currentTrackData = await radioService.getCurrentTrack();
    console.log('🎵 Current track data:', currentTrackData ? 'Found' : 'Not found');
    
    if (!currentTrackData) {
      console.log('No active track data');
      return NextResponse.json(
        { error: 'No active radio stream or playlist' },
        { status: 404 }
      );
    }

    const currentTrack = currentTrackData.track;
    console.log('Current track details:', {
      id: currentTrack?.id,
      isAd: currentTrack?.isAd,
      isIntro: currentTrack?.isIntro,
      hasTtsAudioUrl: !!currentTrack?.ttsAudioUrl,
      hasNft: !!currentTrack?.nft,
      hasPreviewAudioUrl: !!currentTrack?.nft?.previewAudioUrl
    });
    
    if (!currentTrack) {
      console.log('No current track');
      return NextResponse.json(
        { error: 'No audio available' },
        { status: 404 }
      );
    }

    // Handle ad and intro tracks (they have ttsAudioUrl)
    if ((currentTrack.isAd || currentTrack.isIntro) && currentTrack.ttsAudioUrl) {
      console.log(`Redirecting to TTS audio URL (${currentTrack.isAd ? 'ad' : 'intro'}):`, currentTrack.ttsAudioUrl);
      // For TTS audio, we need to serve it from our public directory
      const fullUrl = `${request.nextUrl.origin}${currentTrack.ttsAudioUrl}`;
      console.log('Full redirect URL:', fullUrl);
      return NextResponse.redirect(fullUrl);
    }
    
    // Get the audio URL to proxy/redirect
    const audioUrl = currentTrack.audioUrl || currentTrack.nft?.previewAudioUrl;
    
    if (!audioUrl) {
      console.log('No audio URL found for track');
      return NextResponse.json(
        { error: 'No audio available' },
        { status: 404 }
      );
    }

    console.log('Audio URL found:', audioUrl);
    
    // Check if this is an external URL that might need CORS handling
    const isExternalUrl = audioUrl.startsWith('http') && !audioUrl.includes(request.nextUrl.hostname);
    
    if (isExternalUrl) {
      console.log('External audio URL detected, proxying to avoid CORS issues');
      
      try {
        // Fetch the audio file and proxy it
        const audioResponse = await fetch(audioUrl, {
          headers: {
            'Range': request.headers.get('range') || '',
          }
        });
        
        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
        }
        
        // Create response with proper headers for audio streaming
        const headers = new Headers();
        headers.set('Content-Type', audioResponse.headers.get('Content-Type') || 'audio/mpeg');
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cache-Control', 'public, max-age=3600');
        
        // Copy range headers if present
        if (audioResponse.headers.get('Content-Range')) {
          headers.set('Content-Range', audioResponse.headers.get('Content-Range')!);
        }
        if (audioResponse.headers.get('Content-Length')) {
          headers.set('Content-Length', audioResponse.headers.get('Content-Length')!);
        }
        
        return new NextResponse(audioResponse.body, {
          status: audioResponse.status,
          headers
        });
        
      } catch (error) {
        console.error('Error proxying audio:', error);
        // Fallback to redirect if proxy fails
        return NextResponse.redirect(audioUrl);
      }
    } else {
      // Local or same-domain audio, safe to redirect
      console.log('Local audio URL, redirecting:', audioUrl);
      return NextResponse.redirect(audioUrl);
    }

  } catch (error) {
    console.error('Error serving audio stream:', error);
    return NextResponse.json(
      { error: 'Failed to serve audio stream' },
      { status: 500 }
    );
  }
} 