import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });
    }
    const nft = await prisma.nFT.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
    });
    if (!nft) {
      return NextResponse.json({ nft: null }, { status: 200 });
    }
    return NextResponse.json({ nft });
  } catch (error) {
    console.error('Error in exact NFT search:', error);
    return NextResponse.json({ error: 'Failed to search NFT by exact name' }, { status: 500 });
  }
} 