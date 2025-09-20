import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const nfts = await prisma.nFT.findMany({
      where: {
        user: {
          email: session.user.email
        },
        isDeleted: false // Only show non-deleted NFTs
      },
      select: {
        id: true,
        name: true,
        description: true,
        genre: true,
        recordSize: true,
        recordLabel: true,
        price: true,
        endDate: true,
        sideAImage: true,
        sideBImage: true,
        currentOrders: true,
        targetOrders: true,
        isVinylPresale: true,
        userId: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        sideATracks: true,
        sideBTracks: true,
        presaleThreshold: true, // Include presale threshold to check completion status
      },
    });

    if (!nfts || nfts.length === 0) {
      return NextResponse.json({ success: true, nfts: [] }, { status: 200 });
    }

    // Transform the data to match the NFT interface
    const transformedNFTs = nfts.map(nft => {
      console.log('Raw NFT data:', {
        id: nft.id,
        name: nft.name,
        isVinylPresale: nft.isVinylPresale,
        currentOrders: nft.currentOrders,
        targetOrders: nft.targetOrders,
        endDate: nft.endDate,
        presaleThreshold: nft.presaleThreshold
      });

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
        userImage: nft.user.image || '/images/placeholder.png',
        recordSize: nft.recordSize || '12 inch',
        recordLabel: nft.recordLabel || 'Unknown Label',
        price: price,
        endDate: nft.endDate?.toISOString() || new Date().toISOString(),
        imageUrl: nft.sideAImage,
        sideAImage: nft.sideAImage,
        sideBImage: nft.sideBImage,
        sideATracks: nft.sideATracks,
        sideBTracks: nft.sideBTracks,
        currentOrders: nft.currentOrders,
        targetOrders: nft.targetOrders,
        isVinylPresale: nft.isVinylPresale && !showAsDigital, // Update presale status based on completion
        isPresaleCompleted: isPresaleCompleted,
        showAsDigital: showAsDigital
      };
    });

    console.log('Transformed NFTs:', transformedNFTs.map(nft => ({
      id: nft.id,
      name: nft.name,
      isVinylPresale: nft.isVinylPresale,
      showAsDigital: nft.showAsDigital,
      price: nft.price
    })));

    return NextResponse.json({ success: true, nfts: transformedNFTs });
  } catch (error: any) {
    console.error('Error fetching user NFTs:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching user NFTs' },
      { status: 500 }
    );
  }
} 