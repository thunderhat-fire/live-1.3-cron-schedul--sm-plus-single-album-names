import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPlusMember } from '@/utils/membership';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a Plus member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true
      }
    });

    const isPlus = user?.subscriptionTier === 'plus' && user?.subscriptionStatus === 'active';
    if (!isPlus) {
      return NextResponse.json({ 
        error: 'Only Plus members can schedule streams',
        action: {
          type: 'redirect',
          url: '/subscription',
          text: 'Join Plus now'
        }
      }, { status: 403 });
    }

    const { startTime, title, userId } = await request.json();

    if (!startTime || !title || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is scheduling their own stream
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestedStartTime = new Date(startTime);
    const requestedEndTime = new Date(requestedStartTime.getTime() + 10 * 60 * 1000); // 10 minutes later

    // Check for any overlapping scheduled streams
    const overlappingStream = await prisma.stream.findFirst({
      where: {
        status: 'scheduled',
        OR: [
          // Check if new stream starts during an existing stream
          {
            startedAt: {
              lte: requestedStartTime,
            },
            endedAt: {
              gte: requestedStartTime,
            },
          },
          // Check if new stream ends during an existing stream
          {
            startedAt: {
              lte: requestedEndTime,
            },
            endedAt: {
              gte: requestedEndTime,
            },
          },
          // Check if new stream completely contains an existing stream
          {
            startedAt: {
              gte: requestedStartTime,
            },
            endedAt: {
              lte: requestedEndTime,
            },
          },
        ],
      },
    });

    if (overlappingStream) {
      console.log('Found overlapping stream:', overlappingStream);
      return NextResponse.json(
        { error: 'This time slot is already booked. Please choose a different time.' },
        { status: 409 }
      );
    }

    // Create stream in database with scheduled status
    const stream = await prisma.stream.create({
      data: {
        title,
        status: 'scheduled',
        startedAt: requestedStartTime,
        endedAt: requestedEndTime,
        creatorId: userId
      }
    });

    return NextResponse.json(stream);
  } catch (error) {
    console.error('Error scheduling stream:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to schedule stream' },
      { status: 500 }
    );
  }
} 