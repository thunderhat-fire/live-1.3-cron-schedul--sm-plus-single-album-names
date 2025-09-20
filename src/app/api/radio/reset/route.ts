import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await prisma.radioStream.updateMany({
      where: { status: 'active' },
      data: {
        currentTrackIndex: 0,
        currentTrackStartTime: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting radio stream:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset radio stream' }, { status: 500 });
  }
} 