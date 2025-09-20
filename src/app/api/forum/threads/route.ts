import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    console.log('Starting thread creation...');
    
    const session = await getServerSession(authOptions);
    console.log('Session data:', {
      user: session?.user,
      userId: session?.user?.id,
      email: session?.user?.email,
      expires: session?.expires
    });

    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    if (!session?.user?.id) {
      console.log('No user ID in session:', session?.user);
      return NextResponse.json(
        { error: 'Authentication required - Please log in again' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { title, content, categoryId } = body;

    // Validate input
    if (!title || !content || !categoryId) {
      console.log('Missing required fields:', { title, content, categoryId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (title.length < 3 || title.length > 200) {
      console.log('Invalid title length:', title.length);
      return NextResponse.json(
        { error: 'Title must be between 3 and 200 characters' },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      console.log('Content too short:', content.length);
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Check if category exists
    console.log('Checking category:', categoryId);
    const category = await prisma.$queryRaw`
      SELECT id, name, description, slug, "threadCount"
      FROM "ForumCategory"
      WHERE id = ${categoryId}
      LIMIT 1
    `;

    if (!category || !Array.isArray(category) || category.length === 0) {
      console.log('Category not found:', categoryId);
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Verify user exists
    console.log('Attempting to find user with ID:', session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      console.log('Database query returned no user for ID:', session.user.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create thread
    console.log('Creating thread with data:', {
      title,
      content: content.substring(0, 50) + '...',
      authorId: session.user.id,
      categoryId
    });

    let createdThread;
    try {
      const thread = await prisma.$queryRaw`
        INSERT INTO "ForumThread" (id, title, content, "authorId", "categoryId", "isPinned", "isLocked", "viewCount", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${title},
          ${content},
          ${session.user.id},
          ${categoryId},
          false,
          false,
          0,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING id, title, content, "authorId", "categoryId", "createdAt"
      `;

      if (!thread || !Array.isArray(thread) || thread.length === 0) {
        console.error('Thread creation failed - no data returned');
        throw new Error('Failed to create thread - database error');
      }

      createdThread = thread[0];
    } catch (error) {
      console.error('Database error creating thread:', error);
      return NextResponse.json(
        { error: 'Failed to create thread - database error' },
        { status: 500 }
      );
    }

    try {
      // Update category thread count
      await prisma.$executeRaw`
        UPDATE "ForumCategory"
        SET "threadCount" = "threadCount" + 1
        WHERE id = ${categoryId}
      `;

      console.log('Thread created successfully:', {
        threadId: createdThread.id,
        categoryId: createdThread.categoryId
      });

      return NextResponse.json({
        success: true,
        thread: {
          id: createdThread.id,
          title: createdThread.title,
          content: createdThread.content,
          author: {
            id: session.user.id,
            name: session.user.name,
            image: session.user.image
          },
          createdAt: createdThread.createdAt.toISOString(),
          categoryId: createdThread.categoryId
        }
      });
    } catch (error) {
      console.error('Error updating category count:', error);
      // Thread was created but category count update failed
      // We'll still return success but log the error
      return NextResponse.json({
        success: true,
        thread: {
          id: createdThread.id,
          title: createdThread.title,
          content: createdThread.content,
          author: {
            id: session.user.id,
            name: session.user.name,
            image: session.user.image
          },
          createdAt: createdThread.createdAt.toISOString(),
          categoryId: createdThread.categoryId
        }
      });
    }
  } catch (error) {
    console.error('Error creating thread:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      type: error?.constructor?.name
    });
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint failed')) {
        return NextResponse.json(
          { error: 'Invalid category or user ID' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'A thread with this title already exists' },
          { status: 400 }
        );
      }

      // Return the actual error message in development
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json(
          { error: `Server error: ${error.message}` },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 