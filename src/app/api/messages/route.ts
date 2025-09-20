import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST endpoint to send a message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, toUserId } = await request.json();

    if (!content || !toUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        fromUserId: session.user.id,
        toUserId,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve messages
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { toUserId: session.user.id },
          { fromUserId: session.user.id }
        ],
        ...(unreadOnly ? { read: false, toUserId: session.user.id } : {})
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      messages,
      unreadCount: messages.filter(m => !m.read && m.toUserId === session.user.id).length
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 