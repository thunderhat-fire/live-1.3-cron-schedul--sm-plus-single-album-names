import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSocialShareEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        success: false 
      }, { status: 401 });
    }

    // Parse request body
    const { nftId, recipientEmail, shareMessage } = await request.json();

    // Validate inputs
    if (!nftId || !recipientEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        success: false 
      }, { status: 400 });
    }

    // Get NFT details
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
      select: {
        id: true,
        name: true,
        description: true,
        genre: true,
        recordSize: true,
        price: true,
        recordLabel: true,
        sideAImage: true,
      }
    });

    if (!nft) {
      return NextResponse.json({ 
        error: 'NFT not found',
        success: false 
      }, { status: 404 });
    }

    // Get sender details
    const sender = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true }
    });

    // Send email
    const emailResult = await sendSocialShareEmail({
      senderName: sender?.name || 'A Vinyl Funders User',
      recipientEmail,
      nft: {
        id: nft.id,
        name: nft.name || 'Untitled Vinyl',
        imageUrl: nft.sideAImage || '',
        description: nft.description || undefined,
        genre: nft.genre || undefined,
        recordSize: nft.recordSize || undefined,
        price: nft.price || undefined,
        recordLabel: nft.recordLabel || undefined,
      },
      shareMessage
    });

    if (!emailResult) {
      return NextResponse.json({ 
        error: 'Failed to send share email',
        success: false 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Share email sent successfully'
    });
  } catch (error) {
    console.error('Share email error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false 
    }, { status: 500 });
  }
} 