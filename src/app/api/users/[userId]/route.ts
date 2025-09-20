import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile data
    const user = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.image,
        u."subscriptionTier",
        u.bio,
        u."createdAt" as "joinedAt",
        (
          SELECT COUNT(*)
          FROM "ForumThread" t
          WHERE t."authorId" = u.id
        ) as "threadCount",
        (
          SELECT COUNT(*)
          FROM "ForumReply" r
          WHERE r."authorId" = u.id
        ) as "replyCount"
      FROM "User" u
      WHERE u.id = ${userId}
      LIMIT 1
    `;

    if (!user || !Array.isArray(user) || user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's recent threads with category info
    const threads = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.title,
        t."createdAt",
        c.id as "categoryId",
        c.name as "categoryName",
        c.slug as "categorySlug",
        (
          SELECT COUNT(*)
          FROM "ForumReply" r
          WHERE r."threadId" = t.id
        ) as "replyCount"
      FROM "ForumThread" t
      LEFT JOIN "ForumCategory" c ON t."categoryId" = c.id
      WHERE t."authorId" = ${userId}
      ORDER BY t."createdAt" DESC
      LIMIT 10
    `;

    const userData = user[0];

    return NextResponse.json({
      profile: {
        id: userData.id,
        name: userData.name,
        image: userData.image,
        subscriptionTier: userData.subscriptionTier,
        bio: userData.bio,
        joinedAt: userData.joinedAt.toISOString(),
        threadCount: Number(userData.threadCount),
        replyCount: Number(userData.replyCount),
        threads: Array.isArray(threads) ? threads.map(thread => ({
          id: thread.id,
          title: thread.title,
          createdAt: thread.createdAt.toISOString(),
          replyCount: Number(thread.replyCount),
          category: {
            id: thread.categoryId,
            name: thread.categoryName,
            slug: thread.categorySlug
          }
        })) : []
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 