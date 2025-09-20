import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { radioService } from '@/lib/radio/radioService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { liveStreamService } from '@/lib/radio/liveStreamService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, status = 'inactive', isLive = false } = body;

    if (!name) {
      return NextResponse.json({ error: 'Stream name is required' }, { status: 400 });
    }

    // Create new radio stream
    const radioStream = await prisma.radioStream.create({
      data: {
        name,
        status,
        isLive,
      },
    });

    return NextResponse.json({ 
      success: true, 
      radioStream,
      message: 'Radio stream created successfully' 
    });

  } catch (error) {
    console.error('Error creating radio stream:', error);
    return NextResponse.json(
      { error: 'Failed to create radio stream' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    // If the admin page is requesting the list of streams it will pass ?admin=1.
    // In that case (and only if the user is authenticated) we return the full
    // collection instead of the public-facing "current stream" payload.
    const isAdminListRequest = url.searchParams.get('admin') === '1';

    if (isAdminListRequest) {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const radioStreams = await prisma.radioStream.findMany({ orderBy: { createdAt: 'desc' } });

      return NextResponse.json({ success: true, radioStreams });
    }

    // Get current playlist
    const currentPlaylist = await radioService.getCurrentPlaylist();
    
    if (!currentPlaylist) {
      return NextResponse.json(
        { error: 'No active radio stream' },
        { status: 404 }
      );
    }

    // Get stream metadata
    const metadata = liveStreamService.getMetadata();
    
    if (!metadata.isLive) {
      return NextResponse.json(
        { error: 'Radio stream is not live' },
        { status: 503 }
      );
    }

    // For now, return a simple response indicating the stream is available
    // In a real implementation, this would serve the actual audio stream
    // or redirect to the streaming service (e.g., HLS stream URL)
    
    const streamUrl = process.env.RADIO_STREAM_URL || '/api/radio/audio-stream';
    
    return NextResponse.json({
      success: true,
      streamUrl,
      currentTrack: metadata.currentTrack,
      isLive: metadata.isLive,
      totalListeners: metadata.totalListeners,
    });

  } catch (error) {
    console.error('Error serving radio stream:', error);
    return NextResponse.json(
      { error: 'Failed to serve radio stream' },
      { status: 500 }
    );
  }
}

// Handle HEAD requests for stream availability
export async function HEAD(request: NextRequest) {
  try {
    const metadata = liveStreamService.getMetadata();
    
    if (!metadata.isLive) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, isLive, currentPlaylistId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 });
    }

    // Update radio stream
    const radioStream = await prisma.radioStream.update({
      where: { id },
      data: {
        status,
        isLive,
        currentPlaylistId,
        lastUpdated: new Date(),
      },
      include: {
        currentPlaylist: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      radioStream,
      message: 'Radio stream updated successfully' 
    });

  } catch (error) {
    console.error('Error updating radio stream:', error);
    return NextResponse.json(
      { error: 'Failed to update radio stream' },
      { status: 500 }
    );
  }
} 