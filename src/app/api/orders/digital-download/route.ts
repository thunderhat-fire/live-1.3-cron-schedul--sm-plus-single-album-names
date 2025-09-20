import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';

const generateSignedUrl = (
  url: string, 
  trackName: string, 
  albumName: string, 
  artistName: string, 
  artworkUrl: string,
  genre: string
) => {
  // Ensure JWT_SECRET is properly configured
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  
  // Create a signed URL that expires in 1 hour, including all metadata for embedding
  const token = sign(
    { 
      url,
      trackName: trackName.replace(/[^a-zA-Z0-9\s\-_\.]/g, ''), // Sanitize filename
      albumName: albumName,
      artistName: artistName,
      artworkUrl: artworkUrl,
      genre: genre,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  return `/api/download/${token}`;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, trackUrl } = await request.json();

    console.log('🔍 Digital download request:', { orderId, trackUrl });

    // Verify the order belongs to the user and is a digital purchase
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        format: 'digital',
        status: { in: ['completed', 'processing'] }, // Include both completed and processing
        paymentStatus: { in: ['processed', 'captured', 'completed'] }, // Ensure payment was successful
      },
      include: {
        nft: {
          include: {
            sideATracks: true,
            sideBTracks: true,
            user: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });

    if (!order) {
      console.error('❌ Order not found for:', { orderId, userId: session.user.id });
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('✅ Found order:', {
      orderId: order.id,
      nftId: order.nft.id,
      nftName: order.nft.name,
      genre: order.nft.genre,
      artistName: order.nft.user?.name,
      artworkUrl: order.nft.sideAImage,
      tracksCount: order.nft.sideATracks.length + order.nft.sideBTracks.length
    });

    // Find the requested track
    const track = [
      ...order.nft.sideATracks,
      ...order.nft.sideBTracks
    ].find(t => t.url === trackUrl);

    if (!track) {
      console.error('❌ Track not found for URL:', trackUrl);
      console.log('Available tracks:', [
        ...order.nft.sideATracks.map(t => ({ name: t.name, url: t.url })),
        ...order.nft.sideBTracks.map(t => ({ name: t.name, url: t.url }))
      ]);
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const metadata = {
      trackName: track.name,
      albumName: order.nft.name,
      artistName: order.nft.user?.name || 'Unknown Artist',
      genre: order.nft.genre || 'Unknown',
      artworkUrl: order.nft.sideAImage || ''
    };

    console.log('🎵 Generating download URL with metadata:', metadata);

    // Generate download URL for the specific track with all metadata
    const downloadUrl = generateSignedUrl(
      track.url, 
      metadata.trackName,
      metadata.albumName,
      metadata.artistName,
      metadata.artworkUrl,
      metadata.genre
    );

    return NextResponse.json({
      success: true,
      downloadUrl,
      trackName: track.name
    });
  } catch (error) {
    console.error('❌ Error processing digital download:', error);
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
  }
} 