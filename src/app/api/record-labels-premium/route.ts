import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get record labels from plus and gold members only
    const recordLabels = await prisma.$queryRaw`
      SELECT 
        n."recordLabel" as name,
        COUNT(n.id) as count,
        -- Get the first available record label image from any plus/gold user with this label
        (
          SELECT u2."recordLabelImage" 
          FROM "NFT" n2 
          JOIN "User" u2 ON n2."userId" = u2.id 
          WHERE n2."recordLabel" = n."recordLabel" 
            AND u2."recordLabelImage" IS NOT NULL
            AND u2."subscriptionStatus" = 'active'
            AND u2."subscriptionTier" IN ('plus', 'gold')
          LIMIT 1
        ) as "recordLabelImage",
        -- Aggregate all NFTs from plus/gold users with this record label
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
        AND u."subscriptionTier" IN ('plus', 'gold')
      GROUP BY n."recordLabel"
      ORDER BY COUNT(n.id) DESC, n."recordLabel"
    `;

    // Transform the data to match the expected format
    const transformedRecordLabels = (recordLabels as any[]).map(label => ({
      name: label.name,
      count: parseInt(label.count),
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

    console.log('Premium record labels (plus/gold members) found:', transformedRecordLabels.length);
    console.log('Premium record labels:', transformedRecordLabels.map(r => ({ name: r.name, count: r.count })));

    return NextResponse.json({
      success: true,
      recordLabels: transformedRecordLabels
    });
  } catch (error: any) {
    console.error('Error fetching premium record labels:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching premium record labels' },
      { status: 500 }
    );
  }
}
