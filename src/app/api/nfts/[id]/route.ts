import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const nft = await prisma.nFT.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            subscriptionTier: true,
          },
        },
        sideATracks: true,
        sideBTracks: true,
        presaleThreshold: true, // Include presale threshold to check completion status
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 4
        }
      },
    });

    if (!nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Check if presale has been completed
    const isPresaleCompleted = nft.presaleThreshold && 
      (nft.presaleThreshold.status === 'completed' || 
       nft.presaleThreshold.status === 'reached' ||
       nft.presaleThreshold.currentOrders >= nft.presaleThreshold.targetOrders);
    
    // Check if presale time has ended
    const isPresaleTimeEnded = nft.endDate && new Date(nft.endDate) < new Date();
    
    // Determine if this should show as digital (presale completed or time ended)
    const showAsDigital = nft.isVinylPresale ? 
      (isPresaleCompleted || isPresaleTimeEnded) : 
      true;
    
    // Set price based on presale completion status
    let vinylPrice = 26;
    if (nft.targetOrders === 200) vinylPrice = 22;
    if (nft.targetOrders === 500) vinylPrice = 20;
    
    const price = showAsDigital ? '13.00' : vinylPrice.toString();

    // Transform the data to match the frontend interface
    const transformedNft = {
      id: nft.id,
      name: nft.name,
      description: nft.description,
      externalLink: nft.externalLink,
      genre: nft.genre,
      creator: nft.user.name || 'Unknown Artist',
      userImage: nft.user.image || '/images/avatars/default-avatar.png',
      creatorSubscriptionTier: nft.user.subscriptionTier,
      user: {
        id: nft.user.id,
      },
      recordSize: nft.recordSize,
      price: price,
      digitalPrice: '13.00',
      endDate: nft.endDate?.toISOString(),
      imageUrl: nft.sideAImage, // Using side A image as the main image
      sideAImage: nft.sideAImage,
      sideBImage: nft.sideBImage,
      sideATracks: nft.sideATracks,
      sideBTracks: nft.sideBTracks,
      recordLabel: nft.recordLabel,
      currentOrders: nft.currentOrders,
      targetOrders: nft.targetOrders,
      isVinylPresale: nft.isVinylPresale && !showAsDigital, // Update presale status based on completion
      isPresaleCompleted: isPresaleCompleted,
      showAsDigital: showAsDigital,
      isLiked: nft.likes.some(like => like.user.id === session?.user?.id),
      recentLikers: nft.likes.map(like => ({
        id: like.user.id,
        name: like.user.name || 'Unknown User',
        image: like.user.image || '/images/avatars/default-avatar.png'
      }))
    };

    return NextResponse.json(transformedNft);
  } catch (error) {
    console.error('Error fetching NFT:', error);
    return NextResponse.json(
      { error: 'Error fetching Album' },
      { status: 500 }
    );
  }
} 