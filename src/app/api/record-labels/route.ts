import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get record labels from all active users
    const recordLabels = await prisma.$queryRaw`
      SELECT 
        n."recordLabel" as name,
        COUNT(n.id) as count,
        COUNT(CASE WHEN n."recordSize" = '7 inch' THEN 1 END) as "singlesCount",
        COUNT(CASE WHEN n."recordSize" = '12 inch' THEN 1 END) as "albumsCount",
        -- Get the first available record label image from any active user with this label
        (
          SELECT u2."recordLabelImage" 
          FROM "NFT" n2 
          JOIN "User" u2 ON n2."userId" = u2.id 
          WHERE n2."recordLabel" = n."recordLabel" 
            AND u2."recordLabelImage" IS NOT NULL
            AND u2."subscriptionStatus" = 'active'
          LIMIT 1
        ) as "recordLabelImage",
        -- Aggregate all NFTs from active users with this record label
        ARRAY_AGG(
          json_build_object(
            'id', n.id,
            'name', n.name,
            'sideAImage', n."sideAImage",
            'creator', u.name,
            'creatorImage', u.image,
            'creatorSubscriptionTier', u."subscriptionTier"
          )
        ) as nfts
      FROM "NFT" n
      JOIN "User" u ON n."userId" = u.id
      WHERE n."recordLabel" IS NOT NULL
        AND n."isDeleted" = false
        AND u."subscriptionStatus" = 'active'
      GROUP BY n."recordLabel"
      ORDER BY COUNT(n.id) DESC, n."recordLabel"
    `;

    // Transform the data to match the expected format
    const transformedRecordLabels = (recordLabels as any[]).map(label => ({
      name: label.name,
      count: parseInt(label.count),
      singlesCount: parseInt(label.singlesCount || 0),
      albumsCount: parseInt(label.albumsCount || 0),
      recordLabelImage: label.recordLabelImage,
      nfts: (label.nfts || []).slice(0, 4).map((nft: any) => ({
        id: nft.id,
        name: nft.name,
        sideAImage: nft.sideAImage,
        creator: nft.creator || 'Unknown Artist',
        creatorImage: nft.creatorImage,
        creatorSubscriptionTier: nft.creatorSubscriptionTier,
      }))
    }));

    console.log('Record labels found:', transformedRecordLabels.length);
    console.log('Record labels:', transformedRecordLabels.map(r => ({ name: r.name, count: r.count })));
    
    // Debug: Show all NFTs that should be included but might be filtered out
    const debugNFTs = await prisma.nFT.findMany({
      include: {
        user: {
          select: {
            name: true,
            subscriptionTier: true,
            subscriptionStatus: true
          }
        }
      },
      where: {
        isDeleted: false
      }
    });
    
    console.log('DEBUG: All non-deleted NFTs and their user info:');
    debugNFTs.forEach(nft => {
      console.log(`- NFT "${nft.name}" by ${nft.user?.name} (tier: ${nft.user?.subscriptionTier}, status: ${nft.user?.subscriptionStatus}, recordLabel: ${nft.recordLabel})`);
    });

    return NextResponse.json({
      success: true,
      recordLabels: transformedRecordLabels
    });
  } catch (error: any) {
    console.error('Error fetching record labels:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching record labels' },
      { status: 500 }
    );
  }
} 