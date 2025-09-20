import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Follow API called with params:', params);
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user);

    if (!session?.user?.email) {
      console.log('No session or email found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    console.log('Current user:', currentUser?.id);

    if (!currentUser) {
      console.log('Current user not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    });
    console.log('Target user:', targetUser?.id);

    if (!targetUser) {
      console.log('Target user not found');
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.user.findFirst({
      where: {
        id: currentUser.id,
        User_A: {
          some: {
            id: params.id
          }
        }
      }
    });
    console.log('Existing follow:', existingFollow ? 'yes' : 'no');

    if (existingFollow) {
      // Unfollow
      console.log('Unfollowing user');
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          User_A: {
            disconnect: { id: params.id }
          }
        }
      });

      return NextResponse.json({
        success: true,
        following: false
      });
    } else {
      // Follow
      console.log('Following user');
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          User_A: {
            connect: { id: params.id }
          }
        }
      });

      return NextResponse.json({
        success: true,
        following: true
      });
    }
  } catch (error: any) {
    console.error('Error toggling follow:', error);
    return NextResponse.json(
      { error: error.message || 'Error toggling follow' },
      { status: 500 }
    );
  }
} 