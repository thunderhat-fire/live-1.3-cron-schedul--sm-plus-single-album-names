import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // First check if the NFT exists
    const nft = await prisma.nFT.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Soft delete the NFT by updating isDeleted and deletedAt
    const updateData: Prisma.NFTUpdateInput = {
      isDeleted: true,
      deletedAt: new Date(),
    };

    await prisma.nFT.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error soft deleting NFT:', error);
    return NextResponse.json(
      { error: 'Failed to delete NFT' },
      { status: 500 }
    );
  }
} 