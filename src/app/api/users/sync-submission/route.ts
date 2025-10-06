import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { syncSubmissionOptIn } = await request.json();

    if (typeof syncSubmissionOptIn !== 'boolean') {
      return NextResponse.json({ error: 'Invalid syncSubmissionOptIn value' }, { status: 400 });
    }

    // Update the user's sync submission preference
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { syncSubmissionOptIn },
      select: { id: true, syncSubmissionOptIn: true }
    });

    return NextResponse.json({ 
      success: true, 
      syncSubmissionOptIn: updatedUser.syncSubmissionOptIn 
    });
  } catch (error) {
    console.error('Error updating sync submission preference:', error);
    return NextResponse.json(
      { error: 'Failed to update sync submission preference' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's current sync submission preference
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { syncSubmissionOptIn: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      syncSubmissionOptIn: user.syncSubmissionOptIn 
    });
  } catch (error) {
    console.error('Error fetching sync submission preference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync submission preference' },
      { status: 500 }
    );
  }
}
