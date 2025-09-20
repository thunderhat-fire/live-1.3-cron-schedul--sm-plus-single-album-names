import { NextRequest, NextResponse } from 'next/server';
import { playlistManager, PLAYLIST_ALGORITHMS } from '@/lib/radio/playlistManager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      maxDuration = 3600, 
      includeTTS = true, 
      voiceId = 'default', 
      shuffleTracks = true,
      algorithm = 'balanced',
      curatorId
    } = body;

    const playlistId = await playlistManager.generateAdvancedPlaylist({
      maxDuration,
      includeTTS,
      voiceId,
      shuffleTracks,
      algorithm,
      curatorId,
    });

    return NextResponse.json({ 
      success: true, 
      playlistId,
      algorithm: PLAYLIST_ALGORITHMS[algorithm]?.name || 'Balanced Mix',
      message: 'Advanced playlist generated successfully' 
    });

  } catch (error) {
    console.error('Error generating advanced playlist:', error);
    return NextResponse.json(
      { error: 'Failed to generate advanced playlist' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const algorithms = searchParams.get('algorithms');
    const performance = searchParams.get('performance');
    const playlistId = searchParams.get('playlistId');

    if (algorithms) {
      // Return available algorithms
      return NextResponse.json({ 
        success: true, 
        algorithms: PLAYLIST_ALGORITHMS 
      });
    }

    if (performance && playlistId) {
      // Return playlist performance analysis
      const performanceData = await playlistManager.analyzePlaylistPerformance(playlistId);
      return NextResponse.json({ 
        success: true, 
        performance: performanceData 
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching advanced playlist data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advanced playlist data' },
      { status: 500 }
    );
  }
} 