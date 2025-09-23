import { NextRequest, NextResponse } from 'next/server';

// Social media posting scheduler - can be called by cron jobs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platforms = ['facebook'], force = false } = body;

    console.log('📅 Social media scheduler running...', { platforms, force });

    const results: any = {
      success: true,
      platforms: {},
      timestamp: new Date().toISOString(),
    };

    // Post to Facebook
    if (platforms.includes('facebook')) {
      try {
        const facebookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/facebook/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force }),
        });
        
        const facebookResult = await facebookResponse.json();
        results.platforms.facebook = facebookResult;
        console.log('✅ Facebook posting completed');
      } catch (error: any) {
        console.error('❌ Facebook posting failed:', error);
        results.platforms.facebook = { success: false, error: error.message };
      }
    }

    // Post to Twitter/X (placeholder for future implementation)
    if (platforms.includes('twitter')) {
      results.platforms.twitter = { 
        success: false, 
        message: 'Twitter integration not yet implemented' 
      };
    }

    // Post to Instagram (placeholder for future implementation)
    if (platforms.includes('instagram')) {
      results.platforms.instagram = { 
        success: false, 
        message: 'Instagram integration not yet implemented' 
      };
    }

    console.log('✅ Social media scheduler completed:', results);
    return NextResponse.json(results);

  } catch (error: any) {
    console.error('❌ Social media scheduler error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Get scheduler status
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      availablePlatforms: ['facebook', 'twitter', 'instagram'],
      configuredPlatforms: [
        ...(process.env.FACEBOOK_PAGE_ACCESS_TOKEN ? ['facebook'] : []),
        ...(process.env.TWITTER_API_KEY ? ['twitter'] : []),
        ...(process.env.INSTAGRAM_ACCESS_TOKEN ? ['instagram'] : []),
      ],
      schedulerActive: true,
      lastRun: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
