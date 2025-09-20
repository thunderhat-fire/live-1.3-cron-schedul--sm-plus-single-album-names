import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      include: {
        User_B: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            walletAddress: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      followers: user.User_B
    });
  } catch (error: any) {
    console.error('Error fetching followers:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching followers' },
      { status: 500 }
    );
  }
} 