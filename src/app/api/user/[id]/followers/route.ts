import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        User_B: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            walletAddress: true,
            nfts: {
              select: {
                id: true
              }
            },
            User_B: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform the data to include counts and following status
    const transformedFollowers = await Promise.all(user.User_B.map(async follower => {
      // Check if the logged-in user is following this user
      let isFollowing = false;
      if (session?.user?.email) {
        const loggedInUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            User_A: {
              where: { id: follower.id },
              select: { id: true }
            }
          }
        });
        isFollowing = loggedInUser?.User_A.length ? true : false;
      }

      return {
        id: follower.id,
        name: follower.name,
        image: follower.image,
        bio: follower.bio,
        walletAddress: follower.walletAddress,
        nftsCount: follower.nfts.length,
        followersCount: follower.User_B.length,
        isFollowing
      };
    }));

    return NextResponse.json({
      success: true,
      followers: transformedFollowers
    });
  } catch (error: any) {
    console.error('Error fetching followers:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching followers' },
      { status: 500 }
    );
  }
} 