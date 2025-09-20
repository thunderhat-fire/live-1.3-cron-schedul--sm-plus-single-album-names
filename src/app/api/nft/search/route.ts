import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const genre = searchParams.get('genre') || '';
    const recordSize = searchParams.get('recordSize') || '';
    const sortOrder = searchParams.get('sortOrder') || 'Recently-listed';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    console.log('Search API called with params:', {
      query,
      genre,
      recordSize,
      sortOrder,
      page,
      limit
    });

    const where: Prisma.NFTWhereInput = {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
            {
              sideATracks: {
                some: {
                  name: { contains: query, mode: Prisma.QueryMode.insensitive }
                }
              }
            },
            {
              sideBTracks: {
                some: {
                  name: { contains: query, mode: Prisma.QueryMode.insensitive }
                }
              }
            }
          ],
        },
        genre ? { genre: { equals: genre, mode: Prisma.QueryMode.insensitive } } : {},
        recordSize ? { recordSize: { equals: recordSize } } : {},
        { isDeleted: false },
      ],
    };

    console.log('Prisma where clause:', JSON.stringify(where, null, 2));

    // Define sorting options
    const orderBy: Prisma.NFTOrderByWithRelationInput = (() => {
      switch (sortOrder) {
        case 'Recently-listed':
          return { createdAt: Prisma.SortOrder.desc };
        case 'Ending-soon':
          return { endDate: Prisma.SortOrder.asc };
        case 'Most-favorited':
          return { favoritesCount: Prisma.SortOrder.desc };
        default:
          return { createdAt: Prisma.SortOrder.desc };
      }
    })();

    const [nfts, total] = await Promise.all([
      prisma.nFT.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
          sideATracks: true,
          sideBTracks: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.nFT.count({ where }),
    ]);

    // Transform the NFTs to ensure consistent record size format
    const transformedNfts = nfts.map(nft => ({
      ...nft,
      recordSize: (nft.recordSize || "12 inch").replace(' ', '') as "7inch" | "12inch",
      sideATracks: nft.sideATracks || [],
      sideBTracks: nft.sideBTracks || []
    }));

    console.log(`Found ${nfts.length} NFTs out of ${total} total`);
    if (nfts.length > 0) {
      console.log('Sample NFT:', {
        id: nfts[0].id,
        name: nfts[0].name,
        genre: nfts[0].genre,
        recordSize: nfts[0].recordSize
      });
    }

    return NextResponse.json({
      nfts: transformedNfts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search NFTs' },
      { status: 500 }
    );
  }
} 