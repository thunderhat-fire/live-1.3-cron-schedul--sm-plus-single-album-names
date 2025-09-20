import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const thread = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.title,
        t.content,
        t."createdAt",
        t."categoryId",
        u.id as "authorId",
        u.name as "authorName",
        u.image as "authorImage"
      FROM "ForumThread" t
      LEFT JOIN "User" u ON t."authorId" = u.id
      WHERE t.id = ${threadId}
      LIMIT 1
    `;

    if (!thread || !Array.isArray(thread) || thread.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    const threadData = thread[0];

    return NextResponse.json({
      thread: {
        id: threadData.id,
        title: threadData.title,
        content: threadData.content,
        author: {
          id: threadData.authorId,
          name: threadData.authorName,
          image: threadData.authorImage,
        },
        createdAt: threadData.createdAt.toISOString(),
        categoryId: threadData.categoryId,
      }
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
} 