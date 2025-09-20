import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type CategoryResponse = {
  id: string;
  name: string;
  description: string;
  slug: string;
  threadCount: number;
  lastThread?: {
    id: string;
    title: string;
    author: {
      id: string;
      name: string | null;
      image: string | null;
      subscriptionTier: string;
    };
    createdAt: string;
  };
};

export async function GET() {
  try {
    console.log('Attempting to fetch categories...');
    
    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');

    const categories = await prisma.forumCategory.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        threads: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                subscriptionTier: true
              }
            }
          }
        }
      }
    });

    console.log('Found categories:', categories);

    // Transform the data to match the expected format
    const transformedCategories: CategoryResponse[] = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      threadCount: category.threadCount,
      lastThread: category.threads[0] ? {
        id: category.threads[0].id,
        title: category.threads[0].title,
        author: category.threads[0].author,
        createdAt: category.threads[0].createdAt.toISOString()
      } : undefined
    }));

    return NextResponse.json({
      success: true,
      categories: transformedCategories
    });
  } catch (error) {
    console.error('Error in categories API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 