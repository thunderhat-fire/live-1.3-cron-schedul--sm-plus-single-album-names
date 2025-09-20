import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Category slug is required' },
        { status: 400 }
      );
    }

    // First verify the category exists
    const category = await prisma.$queryRaw`
      SELECT id FROM "ForumCategory"
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (!category || !Array.isArray(category) || category.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const categoryId = category[0].id;

    // Fetch threads with author info and reply count
    const threads = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.title,
        t.content,
        t."createdAt",
        u.id as "authorId",
        u.name as "authorName",
        u.image as "authorImage",
        u."subscriptionTier" as "authorSubscriptionTier",
        (
          SELECT COUNT(*)
          FROM "ForumReply" r
          WHERE r."threadId" = t.id
        ) as "replyCount"
      FROM "ForumThread" t
      LEFT JOIN "User" u ON t."authorId" = u.id
      WHERE t."categoryId" = ${categoryId}
      ORDER BY t."createdAt" DESC
      LIMIT 1
    `;

    return NextResponse.json({
      threads: Array.isArray(threads) ? threads.map(thread => ({
        id: thread.id,
        title: thread.title,
        content: thread.content,
        author: {
          id: thread.authorId,
          name: thread.authorName,
          image: thread.authorImage,
          subscriptionTier: thread.authorSubscriptionTier
        },
        createdAt: thread.createdAt.toISOString(),
        replyCount: Number(thread.replyCount)
      })) : []
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
} 