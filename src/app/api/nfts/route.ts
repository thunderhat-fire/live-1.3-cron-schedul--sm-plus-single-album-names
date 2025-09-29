import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paramsString = searchParams.toString();
    
    const session = await getServerSession(authOptions);
    
    // Extract all possible query parameters
    const query = searchParams.get('query') || '';
    const genre = searchParams.get('genre') || '';
    const recordSize = searchParams.get('recordSize') || '';
    const saleType = searchParams.get('saleType') || '';
    const formatType = searchParams.get('formatType') || '';
    const sortOrder = searchParams.get('sortOrder') || 'Recently-listed';
    const plusCreatorsOnly = searchParams.get('plusCreatorsOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // New unified parameters
    const userId = searchParams.get('userId') || '';
    const createdBy = searchParams.get('createdBy') || '';
    const likedBy = searchParams.get('likedBy') || '';
    const subscriptionTier = searchParams.get('subscriptionTier') || '';
    const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : null;
    const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : null;
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const isLive = searchParams.get('isLive') === 'true';
    const isCurated = searchParams.get('isCurated') === 'true';
    const isRadioEligible = searchParams.get('isRadioEligible') === 'true';
    const filter = searchParams.get('filter') || ''; // For special filters like 'viewed', 'appreciated', 'recent'
    const tab = searchParams.get('tab') || ''; // For user-specific tabs like 'created'
    const showAll = searchParams.get('showAll') === 'true'; // Special parameter to show ALL NFTs without filtering

    console.log('Unified NFT API called with params:', {
      query, genre, recordSize, saleType, formatType, sortOrder, plusCreatorsOnly,
      page, limit, userId, createdBy, likedBy, subscriptionTier,
      priceMin, priceMax, dateFrom, dateTo, isLive, isCurated, isRadioEligible,
      filter, tab, showAll
    });

    // Build the comprehensive where clause
    const where: any = {
      isDeleted: false,
    };

    // If showAll is true, bypass all user and subscription filtering
    if (!showAll) {
      // User-specific filters
      if (userId) {
        where.userId = userId;
      }
      if (createdBy) {
        where.userId = createdBy;
      }

      // Subscription and user filters
      if (plusCreatorsOnly || subscriptionTier) {
        where.user = {
          subscriptionStatus: 'active',
          ...(plusCreatorsOnly && { subscriptionTier: { in: ['plus', 'gold'] } }), // Include both Plus and Gold
          ...(subscriptionTier && { subscriptionTier }),
        };
      } else {
        where.user = {
          subscriptionStatus: 'active',
        };
      }
    } else {
      // For showAll, only filter by user if specifically requested
      if (userId) {
        where.userId = userId;
      }
      if (createdBy) {
        where.userId = createdBy;
      }
      // No subscription status filtering for showAll
    }

    // Search query - enhanced to include track names
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { recordLabel: { contains: query, mode: 'insensitive' } },
        {
          sideATracks: {
            some: {
              name: { contains: query, mode: 'insensitive' }
            }
          }
        },
        {
          sideBTracks: {
            some: {
              name: { contains: query, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    // Basic filters
    if (genre) where.genre = genre;
    if (isCurated) where.isCurated = true;
    if (isRadioEligible) where.isRadioEligible = true;

    // Record size filter
    if (recordSize) {
      const recordSizes = recordSize.split(',').filter(Boolean);
      if (recordSizes.length > 0) {
        where.recordSize = {
          in: recordSizes
        };
      }
    }

    // Sale type and format type filters
    if (saleType === 'presale' || formatType === 'vinyl' || formatType === 'presale') {
      where.isVinylPresale = true;
    } else if (formatType === 'digital') {
      where.isVinylPresale = false;
    }

    // Price range filter
    if (priceMin !== null || priceMax !== null) {
      where.price = {};
      if (priceMin !== null) where.price.gte = priceMin;
      if (priceMax !== null) where.price.lte = priceMax;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Live status filter (if implemented)
    if (isLive) {
      // This would need to be implemented based on your live streaming logic
      // where.isLive = true;
    }

    console.log('Enhanced Prisma where clause:', JSON.stringify(where, null, 2));

    // Debug: log the where clause before querying
    console.log('DEBUG: Final Prisma where clause:', JSON.stringify(where, null, 2));

    // Define comprehensive sorting options
    const orderBy: any = (() => {
      switch (sortOrder) {
        case 'Recently-listed':
          return { createdAt: 'desc' };
        case 'Ending-soon':
          return { endDate: 'asc' };
        case 'Most-favorited':
          return { favoritesCount: 'desc' };
        case 'Most-viewed':
          return { viewCount: 'desc' };
        case 'Price-low-to-high':
          return { price: 'asc' };
        case 'Price-high-to-low':
          return { price: 'desc' };
        case 'Oldest-first':
          return { createdAt: 'asc' };
        default:
          return { createdAt: 'desc' };
      }
    })();

    // Special filter handling
    if (filter === 'viewed') {
      orderBy.viewCount = 'desc';
    } else if (filter === 'appreciated') {
      orderBy.favoritesCount = 'desc';
    } else if (filter === 'recent') {
      orderBy.createdAt = 'desc';
    }

    // Get total count for pagination
    const [total, nfts] = await Promise.all([
      prisma.nFT.count({ where }),
      prisma.nFT.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sideATracks: true,
          sideBTracks: true,
          presaleThreshold: true, // Include presale threshold to check completion status
          likes: {
            select: {
              id: true,
              userId: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              subscriptionTier: true,
              subscriptionStatus: true,
            },
          },
        },
      })
    ]);

    // Debug: log the number of NFTs returned
    console.log('DEBUG: NFTs returned:', nfts.length);
    if (nfts.length > 0) {
      console.log('DEBUG: recordSize values of returned NFTs:', nfts.map((nft: any) => nft.recordSize));
    }

    // Post-query filtering for complex logic
    let filteredNfts = nfts;

    // Sale type specific filtering
    if (saleType === '70% Funded') {
      filteredNfts = nfts.filter((nft: any) => {
        const current = nft.currentOrders ?? 0;
        const target = nft.targetOrders ?? 100;
        return target > 0 && current / target >= 0.7;
      });
    } else if (saleType === 'New') {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      filteredNfts = nfts.filter((nft: any) => {
        const createdAt = nft.createdAt instanceof Date ? nft.createdAt : new Date(nft.createdAt);
        return createdAt >= twoDaysAgo;
      });
    }

    // Sort order specific filtering
    if (sortOrder === 'Recently-listed' && !showAll) {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
      filteredNfts = filteredNfts.filter((nft: any) => {
        const createdAt = nft.createdAt instanceof Date ? nft.createdAt : new Date(nft.createdAt);
        return createdAt >= threeDaysAgo;
      });
    } else if (sortOrder === 'Ending-soon') {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      filteredNfts = filteredNfts.filter((nft: any) => {
        if (!nft.endDate) return false;
        const endDate = nft.endDate instanceof Date ? nft.endDate : new Date(nft.endDate);
        return endDate > now && endDate <= in24Hours;
      });
    }

    // Handle liked by filter
    if (likedBy) {
      // This would require a join with the likes table
      // For now, we'll filter in memory (not ideal for large datasets)
      filteredNfts = filteredNfts.filter((nft: any) => 
        nft.likes.some((like: any) => like.userId === likedBy)
      );
    }

    console.log(`Found ${filteredNfts.length} NFTs out of ${total} total`);
    if (filteredNfts.length > 0) {
      console.log('Sample NFT:', {
        id: filteredNfts[0].id,
        name: filteredNfts[0].name,
        creator: filteredNfts[0].user.name,
        subscriptionTier: filteredNfts[0].user.subscriptionTier,
        subscriptionStatus: filteredNfts[0].user.subscriptionStatus
      });
    }

    // Transform NFTs with consistent data structure
    const transformedNfts = filteredNfts
      .map((nft: any) => {
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
        let price: number;
        
        if (showAsDigital) {
          // Digital pricing based on record size
          price = nft.recordSize === '7 inch' ? 4.00 : 13.00;
        } else {
          // Vinyl pricing
          if (nft.recordSize === '7 inch') {
            price = 13.00; // Fixed price for 7-inch vinyl
          } else {
            // 12-inch tiered pricing based on target orders
            if (nft.targetOrders === 200) price = 22.00;
            else if (nft.targetOrders === 500) price = 20.00;
            else price = 26.00; // Default for 100 orders or unspecified
          }
        }

        // Debug: log image URLs to see what's being returned
        console.log('🖼️ NFT Image URLs:', {
          id: nft.id,
          name: nft.name,
          sideAImage: nft.sideAImage,
          sideBImage: nft.sideBImage,
          isCloudinary: nft.sideAImage?.includes('cloudinary') || nft.sideBImage?.includes('cloudinary'),
          isWasabi: nft.sideAImage?.includes('wasabisys') || nft.sideBImage?.includes('wasabisys')
        });

        return {
          id: nft.id,
          name: nft.name,
          description: nft.description || '',
          genre: nft.genre,
          creator: nft.user.name,
          userImage: nft.user.image,
          creatorSubscriptionTier: nft.user.subscriptionTier || 'starter',
          recordSize: nft.recordSize,
          recordLabel: nft.recordLabel || '',
          price: price,
          endDate: nft.endDate?.toISOString() || '',
          imageUrl: nft.sideAImage,
          sideAImage: nft.sideAImage,
          sideBImage: nft.sideBImage,
          sideATracks: nft.sideATracks,
          sideBTracks: nft.sideBTracks,
          currentOrders: nft.currentOrders ?? 0,
          targetOrders: nft.targetOrders ?? 100,
          isVinylPresale: nft.isVinylPresale && !showAsDigital, // Update presale status based on completion
          wasVinylPresale: nft.isVinylPresale, // Preserve original presale status for volume calculations
          isPresaleCompleted: isPresaleCompleted,
          showAsDigital: showAsDigital,
          isLiked: session?.user?.id ? nft.likes.some((like: any) => like.userId === session.user.id) : false,
          likeCount: nft.likes.length,
          viewCount: nft.viewCount || 0,
          isDeleted: false,
          isCurated: nft.isCurated || false,
          isRadioEligible: nft.isRadioEligible || false,
          user: {
            id: nft.userId,
            name: nft.user.name,
            image: nft.user.image,
            subscriptionTier: nft.user.subscriptionTier || 'starter'
          },
        };
      });

    const response = {
      success: true,
      nfts: transformedNfts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: (page * limit) < total,
      filters: {
        applied: {
          query, genre, recordSize, saleType, formatType, sortOrder,
          plusCreatorsOnly, userId, createdBy, likedBy, subscriptionTier,
          priceMin, priceMax, dateFrom, dateTo, isLive, isCurated, isRadioEligible,
          filter, tab, showAll
        }
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in unified NFT API:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching NFTs' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await req.json();

    const nft = await prisma.nFT.create({
      data: {
        ...data,
        userId: user.id,
        currentOrders: 100,
        targetOrders: 100,
      }
    });

    return NextResponse.json({ success: true, nft });
  } catch (error) {
    console.error('Error creating NFT:', error);
    return NextResponse.json(
      { error: 'Failed to create NFT' },
      { status: 500 }
    );
  }
} 