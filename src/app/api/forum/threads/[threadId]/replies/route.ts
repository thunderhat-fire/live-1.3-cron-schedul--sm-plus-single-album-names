import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { threadId } = params;
    const { content } = await request.json();

    if (!content || content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    // Verify thread exists
    const thread = await prisma.$queryRaw`
      SELECT id FROM "ForumThread"
      WHERE id = ${threadId}
      LIMIT 1
    `;

    if (!thread || !Array.isArray(thread) || thread.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Create reply
    const reply = await prisma.$queryRaw`
      INSERT INTO "ForumReply" (
        id,
        content,
        "authorId",
        "threadId",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${content},
        ${session.user.id},
        ${threadId},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id, content, "createdAt"
    `;

    if (!reply || !Array.isArray(reply) || reply.length === 0) {
      throw new Error('Failed to create reply');
    }

    const replyData = reply[0];

    return NextResponse.json({
      reply: {
        id: replyData.id,
        content: replyData.content,
        author: {
          id: session.user.id,
          name: session.user.name,
          image: session.user.image
        },
        createdAt: replyData.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;

    const replies = await prisma.$queryRaw`
      SELECT 
        r.id,
        r.content,
        r."createdAt",
        u.id as "authorId",
        u.name as "authorName",
        u.image as "authorImage"
      FROM "ForumReply" r
      LEFT JOIN "User" u ON r."authorId" = u.id
      WHERE r."threadId" = ${threadId}
      ORDER BY r."createdAt" ASC
    `;

    return NextResponse.json({
      replies: Array.isArray(replies) ? replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        author: {
          id: reply.authorId,
          name: reply.authorName,
          image: reply.authorImage
        },
        createdAt: reply.createdAt.toISOString()
      })) : []
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
} 