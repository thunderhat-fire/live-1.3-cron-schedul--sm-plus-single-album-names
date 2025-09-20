import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const nfts = await prisma.nFT.findMany({
      include: {
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
      return NextResponse.json({ nfts: [] }, { status: 200 });
    }

    // Transform the data to match the NFT interface
    const transformedNFTs = nfts.map(nft => {
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

    return NextResponse.json({ nfts: transformedNFTs });
  } catch (error: any) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching NFTs' },
      { status: 500 }
    );
  }
} 