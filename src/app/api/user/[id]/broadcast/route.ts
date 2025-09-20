import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    // Fetch all followers (User_B are followers of this user)
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { User_B: { select: { id: true } } },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const followers = user.User_B;
    if (!followers.length) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    // Create a message for each follower
    const messages = await prisma.$transaction(
      followers.map(follower =>
        prisma.message.create({
          data: {
            content,
            fromUserId: session.user.id,
            toUserId: follower.id,
          },
        })
      )
    );

    return NextResponse.json({ success: true, sent: messages.length });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast message' },
      { status: 500 }
    );
  }
} 