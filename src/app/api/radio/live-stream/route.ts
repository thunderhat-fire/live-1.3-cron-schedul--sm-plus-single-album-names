import { NextRequest, NextResponse } from 'next/server';
import { liveStreamService, StreamTrack } from '@/lib/radio/liveStreamService';
import { youtubeService } from '@/lib/radio/youtubeService';
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
    const { 
      action,
      config,
      trackId,
      youtubeEnabled = false,
      title,
      description
    } = body;

    switch (action) {
      case 'start':
        // Start live streaming
        if (youtubeEnabled) {
          // Create YouTube stream
          const youtubeStream = await youtubeService.createLiveStream(title, description);
          
          // Start local streaming to YouTube
          await liveStreamService.startStreaming({
            ...config,
            outputUrl: youtubeStream.streamUrl,
          });

          // Start YouTube stream
          await youtubeService.startLiveStream(youtubeStream.id);

          return NextResponse.json({ 
            success: true, 
            streamId: youtubeStream.id,
            streamUrl: youtubeStream.streamUrl,
            chatUrl: youtubeStream.chatUrl,
            message: 'Live stream started on YouTube' 
          });
        } else {
          // Start local streaming only
          await liveStreamService.startStreaming(config);
          
          return NextResponse.json({ 
            success: true, 
            message: 'Local live stream started' 
          });
        }

      case 'stop':
        // Stop live streaming
        const currentStream = youtubeService.getCurrentStream();
        if (currentStream) {
          await youtubeService.endLiveStream(currentStream.id);
        }
        
        await liveStreamService.stopStreaming();
        
        return NextResponse.json({ 
          success: true, 
          message: 'Live stream stopped' 
        });

      case 'add-track':
        // Add track to streaming queue
        if (!trackId) {
          return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
        }

        // Get track details from database
        const nft = await prisma.nFT.findUnique({
          where: { id: trackId },
          include: {
            user: { select: { name: true } },
            sideATracks: true,
            sideBTracks: true,
          },
        });

        if (!nft) {
          return NextResponse.json({ error: 'Track not found' }, { status: 404 });
        }

        const allTracks = [...(nft.sideATracks || []), ...(nft.sideBTracks || [])];
        const totalDuration = allTracks.reduce((sum, track) => sum + track.duration, 0);

        const streamTrack: Omit<StreamTrack, 'id'> = {
          name: nft.name,
          artist: nft.user.name || 'Unknown Artist',
          albumArtUrl: nft.sideAImage || '',
          albumUrl: `${process.env.NEXT_PUBLIC_APP_URL}/nft-detail/${nft.id}`,
          duration: totalDuration,
          startTime: 0,
          endTime: totalDuration,
          genre: nft.genre || 'Unknown',
          recordLabel: nft.recordLabel || 'Independent',
        };

        const trackId2 = liveStreamService.addTrack(streamTrack);
        
        return NextResponse.json({ 
          success: true, 
          trackId: trackId2,
          message: 'Track added to streaming queue' 
        });

      case 'update-track':
        // Update current track info
        if (!trackId) {
          return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
        }

        const nft2 = await prisma.nFT.findUnique({
          where: { id: trackId },
          include: {
            user: { select: { name: true } },
            sideATracks: true,
            sideBTracks: true,
          },
        });

        if (!nft2) {
          return NextResponse.json({ error: 'Track not found' }, { status: 404 });
        }

        const allTracks2 = [...(nft2.sideATracks || []), ...(nft2.sideBTracks || [])];
        const totalDuration2 = allTracks2.reduce((sum, track) => sum + track.duration, 0);

        const currentTrack: StreamTrack = {
          id: trackId,
          name: nft2.name,
          artist: nft2.user.name || 'Unknown Artist',
          albumArtUrl: nft2.sideAImage || '',
          albumUrl: `${process.env.NEXT_PUBLIC_APP_URL}/nft-detail/${nft2.id}`,
          duration: totalDuration2,
          startTime: 0,
          endTime: totalDuration2,
          genre: nft2.genre || 'Unknown',
          recordLabel: nft2.recordLabel || 'Independent',
        };

        await liveStreamService.updateCurrentTrack(currentTrack);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Current track updated' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in live stream API:', error);
    return NextResponse.json(
      { error: 'Failed to process live stream request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        // Get current stream status
        const metadata = liveStreamService.getMetadata();
        const youtubeStream = youtubeService.getCurrentStream();
        
        return NextResponse.json({ 
          success: true, 
          metadata,
          youtubeStream,
        });

      case 'youtube-analytics':
        // Get YouTube analytics
        const streamId = searchParams.get('streamId');
        if (!streamId) {
          return NextResponse.json({ error: 'Stream ID required' }, { status: 400 });
        }

        const analytics = await youtubeService.getStreamAnalytics(streamId);
        
        return NextResponse.json({ 
          success: true, 
          analytics,
        });

      case 'youtube-chat':
        // Get YouTube chat messages
        const chatStreamId = searchParams.get('streamId');
        if (!chatStreamId) {
          return NextResponse.json({ error: 'Stream ID required' }, { status: 400 });
        }

        const messages = await youtubeService.getChatMessages(chatStreamId);
        
        return NextResponse.json({ 
          success: true, 
          messages,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in live stream API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live stream data' },
      { status: 500 }
    );
  }
} 