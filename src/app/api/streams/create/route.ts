import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma, { testPrismaConnection } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // Test database connection first
    const isConnected = await testPrismaConnection();
    if (!isConnected) {
      console.error('Database connection test failed');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('No session or user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', session.user);

    const { title, channelName, token, uid } = await req.json();
    if (!title || !channelName || !token || !uid) {
      console.error('Missing required fields:', { title, channelName, token, uid });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create stream in database using unchecked create
    const streamData = {
      title,
      status: 'scheduled',
      channelName,
      token,
      uid,
      creatorId: session.user.id,
      startedAt: new Date()
    } as Prisma.StreamUncheckedCreateInput;

    console.log('Creating stream with data:', streamData);

    const stream = await prisma.stream.create({
      data: streamData
    });

    console.log('Stream created successfully:', stream);
    return NextResponse.json(stream);
  } catch (error) {
    console.error('Error creating stream:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'Failed to create stream', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 