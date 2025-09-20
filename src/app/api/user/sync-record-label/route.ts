import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's current record label from their profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { recordLabel: true, name: true }
    });

    if (!user?.recordLabel) {
      return NextResponse.json({ error: 'No record label set in profile' }, { status: 400 });
    }

    // Update all NFTs owned by this user to use their current record label
    const updateResult = await prisma.nFT.updateMany({
      where: {
        userId: session.user.id,
        isDeleted: false
      },
      data: {
        recordLabel: user.recordLabel
      }
    });

    console.log(`Updated ${updateResult.count} NFTs for user ${user.name} to use record label: ${user.recordLabel}`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updateResult.count} NFTs to use record label: ${user.recordLabel}`,
      recordLabel: user.recordLabel,
      updatedCount: updateResult.count
    });

  } catch (error: any) {
    console.error('Error syncing record label:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync record label' },
      { status: 500 }
    );
  }
} 