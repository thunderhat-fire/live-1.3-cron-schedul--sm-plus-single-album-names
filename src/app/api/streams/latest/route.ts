import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const streams = await prisma.stream.findMany({
      where: { status: 'live' },
      orderBy: { startedAt: 'desc' },
      take: 4,
      include: { creator: true }
    });
    return NextResponse.json(streams);
  } catch (error) {
    console.error('Error fetching latest streams:', error);
    return NextResponse.json({ error: 'Failed to fetch latest streams' }, { status: 500 });
  }
} 