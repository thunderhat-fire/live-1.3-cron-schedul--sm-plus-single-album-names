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
        User_A: {
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

    // Debug: log the counts for each followed user
    console.log('User_A:', user.User_A.map((u: any) => ({
      id: u.id,
      nftsCount: u.nfts.length,
      followersCount: u.User_B.length,
      name: u.name
    })));

    // Transform the data to include counts and following status
    const transformedFollowing = await Promise.all(user.User_A.map(async (followedUser: any) => {
      // Check if the logged-in user is following this user
      let isFollowing = false;
      if (session?.user?.email) {
        const loggedInUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            User_A: {
              where: { id: followedUser.id },
              select: { id: true }
            }
          }
        });
        isFollowing = loggedInUser?.User_A.length ? true : false;
      }

      return {
        id: followedUser.id,
        name: followedUser.name,
        image: followedUser.image,
        bio: followedUser.bio,
        walletAddress: followedUser.walletAddress,
        nftsCount: followedUser.nfts.length,
        followersCount: followedUser.User_B.length,
        isFollowing
      };
    }));

    return NextResponse.json({
      success: true,
      following: transformedFollowing
    });
  } catch (error: any) {
    console.error('Error fetching following:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching following' },
      { status: 500 }
    );
  }
} 