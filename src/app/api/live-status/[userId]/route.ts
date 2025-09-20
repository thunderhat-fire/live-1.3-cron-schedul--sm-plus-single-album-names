import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

// LiveKit configuration
const LIVEKIT_URL = 'wss://vinylfunders-gdqiiai0.livekit.cloud';

// Helper function to check if HLS stream is accessible
async function checkHLSStream(hlsUrl: string): Promise<boolean> {
  try {
    const response = await fetch(hlsUrl);
    if (!response.ok) {
      console.log('HLS stream HTTP error:', response.status);
      return false;
    }
    
    const content = await response.text();
    console.log('HLS stream content preview:', content.substring(0, 100));
    
    // Check if it's a proper HLS manifest (should start with #EXTM3U)
    if (content.trim() === 'OK') {
      console.log('HLS stream not ready yet (returning OK)');
      return false;
    }
    
    if (content.includes('#EXTM3U')) {
      console.log('HLS stream is ready with proper manifest');
      return true;
    }
    
    console.log('HLS stream content is not a valid manifest');
    return false;
  } catch (error) {
    console.log('HLS stream not accessible:', error);
    return false;
  }
}

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
  const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

  try {
    const { userId } = params;
    
    console.log('=== Live Status API Debug ===');
    console.log('Checking live status for user:', userId);
    console.log('Environment check:', {
      hasApiKey: !!LIVEKIT_API_KEY,
      hasApiSecret: !!LIVEKIT_API_SECRET,
      apiKeyPrefix: LIVEKIT_API_KEY?.substring(0, 3),
      apiSecretLength: LIVEKIT_API_SECRET?.length,
      livekitUrl: LIVEKIT_URL
    });
    
    // Check if LiveKit credentials are configured
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.error('LiveKit credentials not configured');
      return NextResponse.json({
        isLive: false,
        hlsUrl: null,
        participants: 0,
        error: 'LiveKit credentials not configured'
      });
    }
    
    const roomService = new RoomServiceClient(
      LIVEKIT_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );
    
    // Check if the user's room exists and has participants
    const roomName = userId;
    
    try {
      console.log('Attempting to list rooms...');
      const rooms = await roomService.listRooms([roomName]);
      console.log('All rooms returned by LiveKit API:', rooms.map(r => ({
        name: r.name,
        numParticipants: r.numParticipants,
        creationTime: r.creationTime
      })));
      
      // Also check all rooms (not just the filtered ones)
      const allRooms = await roomService.listRooms();
      console.log('All active rooms in LiveKit:', allRooms.map(r => ({
        name: r.name,
        numParticipants: r.numParticipants,
        creationTime: r.creationTime
      })));
      
      const room = rooms.find(r => r.name === roomName);
      
      console.log('Room details:', {
        roomFound: !!room,
        roomName: room?.name,
        numParticipants: room?.numParticipants,
        metadata: room?.metadata,
        creationTime: room?.creationTime,
        emptyTimeout: room?.emptyTimeout,
        maxParticipants: room?.maxParticipants
      });
      
      if (room && room.numParticipants > 0) {
        // User is live streaming
        const hlsUrl = `https://vinylfunders-gdqiiai0.livekit.cloud/hls/${roomName}/index.m3u8`;
        console.log('User is live, HLS URL:', hlsUrl);
        
        // Check if HLS stream is actually accessible
        console.log('=== Checking HLS Stream Accessibility ===');
        const hlsAccessible = await checkHLSStream(hlsUrl);
        console.log('HLS stream accessible:', hlsAccessible);
        
        // Return isLive: true if room has participants, regardless of HLS
        return NextResponse.json({
          isLive: true,
          hlsUrl: hlsAccessible ? hlsUrl : null,
          participants: room.numParticipants
        });
      } else {
        // User is not live streaming
        console.log('User is not live');
        return NextResponse.json({
          isLive: false,
          hlsUrl: null,
          participants: 0
        });
      }
    } catch (error) {
      // Room doesn't exist or other error
      console.log('Error checking room:', error);
      return NextResponse.json({
        isLive: false,
        hlsUrl: null,
        participants: 0,
        error: 'Failed to check room status'
      });
    }
  } catch (error) {
    console.error('Error checking live status:', error);
    return NextResponse.json(
      { error: 'Failed to check live status' },
      { status: 500 }
    );
  }
} 