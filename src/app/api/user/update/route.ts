import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface UserUpdateData {
  username?: string;
  bio?: string | null;
  website?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
  walletAddress?: string | null;
  image?: string | null;
  recordLabel?: string | null;
  recordLabelImage?: string | null;
}

interface ExtendedUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  website: string | null;
  facebook: string | null;
  twitter: string | null;
  tiktok: string | null;
  walletAddress: string | null;
  recordLabel: string | null;
  recordLabelImage: string | null;
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json() as UserUpdateData;
    console.log('Received update data:', data);

    // Update all fields at once
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: data.username ?? undefined,
        bio: data.bio ?? undefined,
        website: data.website ?? undefined,
        facebook: data.facebook ?? undefined,
        twitter: data.twitter ?? undefined,
        tiktok: data.tiktok ?? undefined,
        walletAddress: data.walletAddress ?? undefined,
        image: data.image ?? undefined,
        recordLabel: data.recordLabel ?? undefined,
        recordLabelImage: data.recordLabelImage ?? undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        walletAddress: true,
        recordLabel: true,
        recordLabelImage: true
      }
    });

    // Return the updated user data
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Error updating user' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        walletAddress: true,
        recordLabel: true,
        recordLabelImage: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching user' },
      { status: 500 }
    );
  }
} 