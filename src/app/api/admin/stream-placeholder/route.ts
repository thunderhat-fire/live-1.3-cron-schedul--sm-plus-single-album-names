import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, check if user email is admin (you can modify this logic)
    const isAdmin = session.user.email.includes('admin') || session.user.email === 'your-admin-email@domain.com';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const extension = path.extname(file.name) || '.mp4';
    const filename = `stream-placeholder-${timestamp}${extension}`;
    
    // Save to public/videos directory
    const filePath = path.join(process.cwd(), 'public', 'videos', filename);
    await writeFile(filePath, buffer);

    // Remove old custom placeholder if it exists (keep the default vinyl-background.mp4)
    try {
      const oldPlaceholders = await import('fs').then(fs => 
        fs.promises.readdir(path.join(process.cwd(), 'public', 'videos'))
      );
      
      for (const oldFile of oldPlaceholders) {
        if (oldFile.startsWith('stream-placeholder-') && oldFile !== filename) {
          await unlink(path.join(process.cwd(), 'public', 'videos', oldFile));
        }
      }
    } catch (error) {
      // Ignore errors when cleaning up old files
      console.warn('Could not clean up old placeholder files:', error);
    }

    const videoUrl = `/videos/${filename}`;

    return NextResponse.json({ 
      success: true, 
      videoUrl,
      message: 'Placeholder video uploaded successfully' 
    });

  } catch (error) {
    console.error('Error uploading placeholder video:', error);
    return NextResponse.json({ 
      error: 'Failed to upload video' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.email.includes('admin') || session.user.email === 'your-admin-email@domain.com';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Remove all custom placeholder files (keep default)
    try {
      const placeholders = await import('fs').then(fs => 
        fs.promises.readdir(path.join(process.cwd(), 'public', 'videos'))
      );
      
      for (const file of placeholders) {
        if (file.startsWith('stream-placeholder-')) {
          await unlink(path.join(process.cwd(), 'public', 'videos', file));
        }
      }
    } catch (error) {
      console.warn('Could not clean up placeholder files:', error);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reset to default placeholder' 
    });

  } catch (error) {
    console.error('Error resetting placeholder video:', error);
    return NextResponse.json({ 
      error: 'Failed to reset placeholder' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current placeholder video
    const videosPath = path.join(process.cwd(), 'public', 'videos');
    const files = await import('fs').then(fs => fs.promises.readdir(videosPath));
    
    // Look for custom placeholder
    const customPlaceholder = files.find(file => file.startsWith('stream-placeholder-'));
    
    const currentVideo = customPlaceholder 
      ? `/videos/${customPlaceholder}` 
      : '/videos/vinyl-background.mp4';

    return NextResponse.json({ 
      currentVideo,
      hasCustom: !!customPlaceholder 
    });

  } catch (error) {
    return NextResponse.json({ 
      currentVideo: '/videos/vinyl-background.mp4',
      hasCustom: false 
    });
  }
}
