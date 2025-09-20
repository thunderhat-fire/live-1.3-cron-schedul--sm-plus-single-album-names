import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchAssetsByAlbumTitle, searchAssetsByContext, getAllTags } from '@/lib/cloudinary';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const albumTitle = searchParams.get('albumTitle');
    const contextKey = searchParams.get('contextKey');
    const contextValue = searchParams.get('contextValue');
    const action = searchParams.get('action');

    // Get all tags for debugging
    if (action === 'tags') {
      const tags = await getAllTags();
      return NextResponse.json({ tags });
    }

    // Search by album title
    if (albumTitle) {
      const results = await searchAssetsByAlbumTitle(albumTitle);
      return NextResponse.json(results);
    }

    // Search by context
    if (contextKey && contextValue) {
      const results = await searchAssetsByContext(contextKey, contextValue);
      return NextResponse.json(results);
    }

    return NextResponse.json({ 
      error: 'Please provide albumTitle, or contextKey+contextValue, or action=tags' 
    }, { status: 400 });

  } catch (error) {
    console.error('Cloudinary search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
} 