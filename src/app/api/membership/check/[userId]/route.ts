import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  console.log('Membership check API called for user:', params.userId);

  if (!params.userId) {
    console.error('No userId provided');
    return NextResponse.json(
      { error: 'Invalid user ID' },
      { status: 400 }
    );
  }

  try {
    console.log('Querying database for user:', params.userId);
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { 
        subscriptionTier: true,
        subscriptionStatus: true 
      }
    });

    if (!user) {
      console.error('User not found:', params.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User found:', user);
    // Check both tier and status - both plus and gold members can stream
    const isPlusMember = (user.subscriptionTier === 'plus' || user.subscriptionTier === 'gold') && user.subscriptionStatus === 'active';
    console.log('Is plus member (includes gold):', isPlusMember);

    return NextResponse.json({ isPlusMember });
  } catch (error) {
    console.error('Error in membership check:', error);
    return NextResponse.json(
      { error: 'Failed to check membership status' },
      { status: 500 }
    );
  }
} 