import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Facebook Graph API integration for automated posting
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting Facebook auto-post for active presales...');

    // Get active presales
    const activePresales = await prisma.nFT.findMany({
      where: {
        isDeleted: false,
        isVinylPresale: true,
        endDate: { gte: new Date() }, // Active presales only
      },
      include: {
        user: {
          select: {
            name: true,
            recordLabel: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5, // Limit to avoid spam
    });

    console.log(`📦 Found ${activePresales.length} active presales to post`);

    const results: any[] = [];
    const errors: any[] = [];

    for (const nft of activePresales) {
      try {
        // Create engaging post content
        const postContent = generateFacebookPost(nft);
        
        // Post to Facebook (if API keys are configured)
        if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
          const facebookResult = await postToFacebook(postContent, nft);
          results.push({
            nftId: nft.id,
            platform: 'facebook',
            success: facebookResult.success,
            postId: facebookResult.postId,
          });
        } else {
          console.log('📝 Facebook post content generated (API not configured):', postContent.message);
          results.push({
            nftId: nft.id,
            platform: 'facebook',
            success: true,
            postId: 'simulated',
            content: postContent.message,
          });
        }
        
      } catch (error: any) {
        console.error(`❌ Error posting NFT ${nft.id}:`, error);
        errors.push({
          nftId: nft.id,
          platform: 'facebook',
          error: error.message,
        });
      }
    }

    const response = {
      success: true,
      totalProcessed: activePresales.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Facebook auto-post completed:', response);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error in Facebook auto-post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate engaging Facebook post content
function generateFacebookPost(nft: any) {
  const daysLeft = Math.ceil((new Date(nft.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const progress = Math.round((nft.currentOrders / nft.targetOrders) * 100);
  
  const message = `🎵 NEW VINYL PRESALE ALERT! 🎵

"${nft.name}" by ${nft.user?.name || 'Independent Artist'}
${nft.recordSize} Vinyl Record

💿 Target: ${nft.targetOrders} orders
📈 Progress: ${nft.currentOrders}/${nft.targetOrders} (${progress}%)
⏰ Only ${daysLeft} days left!

${nft.description?.substring(0, 200)}${nft.description?.length > 200 ? '...' : ''}

Support independent music and get exclusive vinyl! 🔥

#VinylFunders #IndependentMusic #VinylRecord #Presale #${nft.user?.recordLabel || 'Music'}`;

  return {
    message,
    link: `https://www.vinylfunders.com/nft-detail/${nft.id}`,
    picture: nft.sideAImage || nft.sideBImage,
  };
}

// Post to Facebook using Graph API
async function postToFacebook(postContent: any, nft: any) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PAGE_ID}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: postContent.message,
        link: postContent.link,
        picture: postContent.picture,
        access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
      }),
    });

    const result = await response.json();

    if (response.ok && result.id) {
      console.log(`✅ Facebook post successful for ${nft.name}: ${result.id}`);
      return { success: true, postId: result.id };
    } else {
      console.error(`❌ Facebook post failed for ${nft.name}:`, result);
      return { success: false, error: result.error?.message || 'Unknown error' };
    }
  } catch (error: any) {
    console.error('❌ Facebook API error:', error);
    return { success: false, error: error.message };
  }
}

// Get posting status and configuration
export async function GET() {
  try {
    const activePresales = await prisma.nFT.count({
      where: {
        isDeleted: false,
        isVinylPresale: true,
        endDate: { gte: new Date() },
      },
    });

    return NextResponse.json({
      success: true,
      activePresales,
      facebookConfigured: !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID),
      lastRun: new Date().toISOString(),
      nextScheduledRun: 'Daily at 9:00 AM UTC', // Configure as needed
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
