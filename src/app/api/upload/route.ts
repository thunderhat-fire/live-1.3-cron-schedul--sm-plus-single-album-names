import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImage } from '@/lib/wasabi';
import { uploadLimiter, getRateLimitIdentifier } from '@/lib/rate-limit';

// Define allowed file types
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/flac',
  'audio/aiff'
]);

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

// Maximum file sizes (in bytes)
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const identifier = getRateLimitIdentifier(request, session.user.id);
    const { success, limit, reset, remaining } = await uploadLimiter.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Upload rate limit exceeded. Please try again later.',
          reset,
          limit,
          remaining
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const nftId = formData.get('nftId') as string;
    const type = formData.get('type') as string;
    const side = formData.get('side') as 'a' | 'b' | undefined;
    const albumTitle = formData.get('albumTitle') as string | null;

    if (!file || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check file size
    const maxSize = type === 'master' || type === 'preview' ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // Validate file type based on upload type
    if (type === 'master' || type === 'preview') {
      // For audio files
      if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: 'Invalid audio file type. Only WAV, MP3, or FLAC files are allowed.' },
          { status: 400 }
        );
      }
    } else {
      // For images (artwork, profile, etc)
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: 'Invalid image file type. Only JPEG, PNG, or WebP files are allowed.' },
          { status: 400 }
        );
      }
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine folder structure for storage (Wasabi)
    let folder = type;
    if (type === 'profile') {
      folder = `profile-${session.user.id}`;
    } else if (nftId) {
      folder = `${type}/${nftId}`;
      if (side) {
        folder = `${folder}/side-${side}`;
      }
    }

    // Upload to Wasabi
    const context = albumTitle ? { album_title: albumTitle } : undefined;
    const url = await uploadImage(buffer, folder, context, session.user.id, file.name);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
} 