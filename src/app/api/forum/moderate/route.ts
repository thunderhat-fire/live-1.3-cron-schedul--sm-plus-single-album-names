import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';

// Add TransactionClient type for robust transaction compatibility
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

type ModActionParams = {
  action: string;
  targetId: string;
  targetType: string;
  details?: string;
  moderatorId: string;
};

async function logModAction(tx: TransactionClient, params: ModActionParams) {
  return await tx.modLog.create({
    data: {
      action: params.action,
      targetId: params.targetId,
      targetType: params.targetType,
      details: params.details,
      moderatorId: params.moderatorId
    }
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, threadId, replyId } = body;

    // Use transaction to ensure both the action and logging succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      switch (action) {
        case 'pin':
          if (!threadId) {
            return NextResponse.json(
              { error: 'Thread ID is required' },
              { status: 400 }
            );
          }

          // Get current thread state
          const thread = await tx.forumThread.findFirst({
            where: { id: threadId }
          });

          if (!thread) {
            return NextResponse.json(
              { error: 'Thread not found' },
              { status: 404 }
            );
          }

          // Toggle pin state
          await tx.forumThread.update({
            where: { id: threadId },
            data: { isPinned: !thread.isPinned }
          });

          // Log the action
          await logModAction(tx, {
            action: thread.isPinned ? 'unpin' : 'pin',
            targetId: threadId,
            targetType: 'thread',
            details: `Thread ${thread.isPinned ? 'unpinned' : 'pinned'}`,
            moderatorId: session.user.id
          });

          return NextResponse.json({ success: true, isPinned: !thread.isPinned });

        case 'lock':
          if (!threadId) {
            return NextResponse.json(
              { error: 'Thread ID is required' },
              { status: 400 }
            );
          }

          // Get current thread state
          const threadToLock = await tx.forumThread.findFirst({
            where: { id: threadId }
          });

          if (!threadToLock) {
            return NextResponse.json(
              { error: 'Thread not found' },
              { status: 404 }
            );
          }

          // Toggle lock state
          await tx.forumThread.update({
            where: { id: threadId },
            data: { isLocked: !threadToLock.isLocked }
          });

          // Log the action
          await logModAction(tx, {
            action: threadToLock.isLocked ? 'unlock' : 'lock',
            targetId: threadId,
            targetType: 'thread',
            details: `Thread ${threadToLock.isLocked ? 'unlocked' : 'locked'}`,
            moderatorId: session.user.id
          });

          return NextResponse.json({ success: true, isLocked: !threadToLock.isLocked });

        case 'delete_thread':
          if (!threadId) {
            return NextResponse.json(
              { error: 'Thread ID is required' },
              { status: 400 }
            );
          }

          // Delete thread and all its replies (cascade delete will handle this)
          await tx.forumThread.delete({
            where: { id: threadId }
          });

          // Log the action
          await logModAction(tx, {
            action: 'delete_thread',
            targetId: threadId,
            targetType: 'thread',
            details: 'Thread and all replies deleted',
            moderatorId: session.user.id
          });

          return NextResponse.json({ success: true });

        case 'delete_reply':
          if (!replyId) {
            return NextResponse.json(
              { error: 'Reply ID is required' },
              { status: 400 }
            );
          }

          // Delete single reply
          await tx.forumReply.delete({
            where: { id: replyId }
          });

          // Log the action
          await logModAction(tx, {
            action: 'delete_reply',
            targetId: replyId,
            targetType: 'reply',
            details: 'Reply deleted',
            moderatorId: session.user.id
          });

          return NextResponse.json({ success: true });

        case 'resolve_report':
        case 'dismiss_report':
          // Log the report handling
          await logModAction(tx, {
            action,
            targetId: threadId || replyId || '',
            targetType: threadId ? 'thread' : 'reply',
            details: `Report ${action === 'resolve_report' ? 'resolved' : 'dismissed'}`,
            moderatorId: session.user.id
          });
          
          return NextResponse.json({ success: true });

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    });

    return result;
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 