import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Define electronic subgenres
const ELECTRONIC_SUBGENRES = ["Ambient", "DnB", "Techno"];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('query') || '';
    const genre = searchParams.get('genre') || '';
    const recordSize = searchParams.get('recordSize') || '';
    const saleType = searchParams.get('saleType') || '';
    const sortOrder = searchParams.get('sortOrder') || 'Recently-listed';
    const plusCreatorsOnly = searchParams.get('plusCreatorsOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const formatType = searchParams.get('formatType') || '';

    console.log('Search params:', {
      query,
      genre,
      recordSize,
      saleType,
      sortOrder,
      plusCreatorsOnly,
      page,
      limit,
      formatType
    });

    // Build the where clause
    const where: any = {
      isDeleted: false,
      user: {
        subscriptionStatus: 'active',
      }
    };

    // Add search filters
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (genre) where.genre = genre;
    if (recordSize) {
      const recordSizes = recordSize.split(',').filter(Boolean);
      if (recordSizes.length > 0) {
        where.recordSize = {
          in: recordSizes
        };
      }
    }
    if (saleType === 'presale') where.isVinylPresale = true;
    if (formatType.toLowerCase() === 'digital') {
      where.isVinylPresale = false;
    }
    if (formatType.toLowerCase() === 'vinyl' || formatType.toLowerCase() === 'presale') {
      where.isVinylPresale = true;
    }

    // Add Plus Creators filter
    if (plusCreatorsOnly) {
      where.user = {
        ...where.user,
        subscriptionTier: { in: ['plus', 'gold'] }, // Include both Plus and Gold
      };
    }

    console.log('Prisma where clause:', JSON.stringify(where, null, 2));

    // Get total count for pagination
    const [total, nfts] = await Promise.all([
      prisma.nFT.count({ where }),
      prisma.nFT.findMany({
        where,
        orderBy: {
          createdAt: sortOrder === 'Recently-listed' ? 'desc' : 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              image: true,
              subscriptionTier: true,
              subscriptionStatus: true,
            },
          },
          sideATracks: true,
          sideBTracks: true,
          likes: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      }),
    ]);

    console.log(`Found ${nfts.length} NFTs out of ${total} total`);
    if (nfts.length > 0) {
      console.log('Sample NFT:', {
        id: nfts[0].id,
        name: nfts[0].name,
        creator: nfts[0].user.name,
        subscriptionTier: nfts[0].user.subscriptionTier,
      });
    }

    // Transform NFTs for response
    const transformedNfts = nfts.map((nft) => ({
      id: nft.id,
      name: nft.name,
      description: nft.description || '',
      genre: nft.genre,
      creator: nft.user.name || 'Unknown Artist',
      userImage: nft.user.image || '/images/avatars/default-avatar.png',
      recordSize: nft.recordSize as '7inch' | '12inch',
      recordLabel: nft.recordLabel || 'Unknown Label',
      price: nft.price?.toString() || '0',
      endDate: nft.endDate?.toISOString() || '',
      sideAImage: nft.sideAImage,
      sideBImage: nft.sideBImage,
      sideATracks: nft.sideATracks,
      sideBTracks: nft.sideBTracks,
      currentOrders: nft.currentOrders,
      targetOrders: nft.targetOrders,
      stock: nft.currentOrders || 0,
      isLiked: nft.likes.length > 0,
      user: {
        name: nft.user.name || 'Unknown Artist',
        image: nft.user.image || '/images/avatars/default-avatar.png',
        subscriptionTier: nft.user.subscriptionTier || 'starter',
      },
    }));

    return NextResponse.json({
      nfts: transformedNfts,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search NFTs' },
      { status: 500 }
    );
  }
} 