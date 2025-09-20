import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user?.isAdmin) {
      console.log('Unauthorized: not admin');
      return NextResponse.json(
        { error: 'Unauthorized: not admin' },
        { status: 401 }
      );
    }

    const { userId } = params;
    console.log('Attempting to delete user:', userId);
    console.log('Current admin user:', session.user.id);

    // Don't allow admins to delete themselves
    if (session.user.id === userId) {
      console.log('Cannot delete your own account');
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });

    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting other admins
    if (user.isAdmin) {
      console.log('Cannot delete admin users');
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      );
    }

    // Find all threads and replies by this user
    const threads = await prisma.forumThread.findMany({ where: { authorId: userId }, select: { id: true, categoryId: true } });
    // const replies = await prisma.forumReply.findMany({ where: { authorId: userId }, select: { id: true, threadId: true } });

    // Delete related forum replies
    await prisma.forumReply.deleteMany({ where: { authorId: userId } });
    // Delete related forum threads
    await prisma.forumThread.deleteMany({ where: { authorId: userId } });

    // Now delete the user
    await prisma.user.delete({ where: { id: userId } });
    console.log('User and related data deleted successfully');

    // Update threadCount for affected categories
    const affectedCategoryIds = Array.from(new Set(threads.map(t => t.categoryId)));
    for (const categoryId of affectedCategoryIds) {
      const count = await prisma.forumThread.count({ where: { categoryId } });
      await prisma.forumCategory.update({ where: { id: categoryId }, data: { threadCount: count } });
    }

    // No replyCount update since field does not exist

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
} 