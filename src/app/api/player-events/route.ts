import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const headersList = await headers();
    
    const body = await request.json();
    const { 
      nftId, 
      eventType, 
      playPosition, 
      trackDuration, 
      sessionId 
    } = body;

    // Validate required fields
    if (!nftId || !eventType || playPosition === undefined || !trackDuration || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate event type
    const validEventTypes = ['play_start', 'play_pause', 'play_resume', 'play_end', 'skip', 'progress'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Validate that the NFT exists before creating the event (prevent foreign key constraint errors)
    const nftExists = await prisma.nFT.findUnique({
      where: { id: nftId },
      select: { id: true }
    });

    if (!nftExists) {
      console.warn('🎵 PlayerEvent: Attempted to track event for non-existent NFT:', nftId, eventType);
      // Return success to avoid disrupting user experience, but don't create the event
      return NextResponse.json({ 
        success: true, 
        eventId: null,
        note: 'Event not tracked - NFT not found (likely TTS ad or intro track)'
      });
    }

    // Get user agent and IP for analytics (anonymized)
    const userAgent = headersList.get('user-agent') || '';
    const forwarded = headersList.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';

    // Create player event
    const playerEvent = await prisma.playerEvent.create({
      data: {
        userId: session?.user?.id || null, // null for anonymous users
        nftId,
        eventType,
        playPosition: Math.floor(playPosition), // Ensure integer
        trackDuration: Math.floor(trackDuration), // Ensure integer
        sessionId,
        userAgent,
        ipAddress: ipAddress.substring(0, 15), // Truncate IP for privacy
      },
    });

    return NextResponse.json({ 
      success: true, 
      eventId: playerEvent.id 
    });
  } catch (error) {
    console.error('Error tracking player event:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}

// GET endpoint to retrieve player analytics (for testing)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const nftId = url.searchParams.get('nftId');

    if (!nftId) {
      return NextResponse.json({ error: 'NFT ID required' }, { status: 400 });
    }

    // Check if user owns this NFT
    const nft = await prisma.nFT.findFirst({
      where: {
        id: nftId,
        userId: session.user.id,
      },
    });

    if (!nft) {
      return NextResponse.json({ error: 'NFT not found or access denied' }, { status: 404 });
    }

    // Get player events for this NFT
    const events = await prisma.playerEvent.findMany({
      where: { nftId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for testing
    });

    return NextResponse.json({ 
      success: true, 
      events,
      total: events.length 
    });
  } catch (error) {
    console.error('Error fetching player events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
} 