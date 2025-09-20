import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface NFTWithRelations {
  id: string;
  name: string;
  price: number;
  currentOrders: number;
  sideAImage: string | null;
  endDate: Date | null;
  recordSize: string | null;
  viewCount: number;
  sideATracks: Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
  }>;
  sideBTracks: Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
  }>;
  likes: Array<{ id: string }>;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching NFTs for user:', params.id);
    const session = await getServerSession(authOptions);
    
    // Remove authentication requirement - anyone should be able to view created NFTs
    // Session is still used for like status but is optional

    // Get the tab parameter from the URL
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'created';
    console.log('Fetching NFTs with tab:', tab);

    let nfts: NFTWithRelations[];
    if (tab === 'created') {
      // Fetch NFTs created by the user
      nfts = await prisma.nFT.findMany({
        where: {
          userId: params.id,
          isDeleted: false
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              subscriptionTier: true
            }
          },
          sideATracks: true,
          sideBTracks: true,
          likes: {
            where: {
              userId: session?.user?.id || 'no-user' // Use fallback if not logged in
            },
            select: {
              id: true
            }
          },
          presaleThreshold: true, // Include presale threshold to check completion status
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid tab parameter' }, { status: 400 });
    }

    console.log(`Found ${nfts.length} NFTs for user ${params.id}`);

    // Transform the NFTs to include like status and all card fields
    const transformedNFTs = nfts.map((nft: any) => {
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

      return {
        id: nft.id,
        name: nft.name,
        description: nft.description || '',
        genre: nft.genre,
        creator: nft.user.name || 'Unknown Artist',
        userImage: nft.user.image || '/images/avatars/default-avatar.png',
        creatorSubscriptionTier: nft.user.subscriptionTier || 'starter',
        price: price,
        currentOrders: nft.currentOrders || 0,
        targetOrders: nft.targetOrders || 100,
        sideAImage: nft.sideAImage,
        imageUrl: nft.sideAImage,
        sideBImage: nft.sideBImage,
        endDate: nft.endDate,
        recordSize: nft.recordSize,
        recordLabel: nft.recordLabel || 'Unknown Label',
        viewCount: nft.viewCount || 0,
        sideATracks: nft.sideATracks,
        sideBTracks: nft.sideBTracks || [],
        isLiked: nft.likes.length > 0,
        likeCount: nft.likes.length,
        isVinylPresale: nft.isVinylPresale && !showAsDigital, // Update presale status based on completion
        showAsDigital: showAsDigital, // Add the missing showAsDigital property
        isDeleted: nft.isDeleted || false,
        isCurated: nft.isCurated || false,
        isRadioEligible: nft.isRadioEligible || false,
        user: {
          id: nft.user.id,
          name: nft.user.name || 'Unknown Artist',
          image: nft.user.image || '/images/avatars/default-avatar.png',
          subscriptionTier: nft.user.subscriptionTier || 'starter'
        },
      };
    });

    return NextResponse.json({
      success: true,
      nfts: transformedNFTs
    });
  } catch (error: any) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching Albums' },
      { status: 500 }
    );
  }
} 