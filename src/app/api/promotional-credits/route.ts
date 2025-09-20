import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserBenefits } from '@/lib/subscription';

// GET remaining credits
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const benefits = getUserBenefits(user);
    
    return NextResponse.json({ 
      success: true, 
      credits: user.promotionalCredits,
      maxCredits: benefits.promotionalCredit 
    });
  } catch (error) {
    console.error('Error fetching promotional credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

// POST to use credits
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.promotionalCredits < amount) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Deduct credits
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        promotionalCredits: user.promotionalCredits - amount
      },
    });

    return NextResponse.json({ 
      success: true, 
      remainingCredits: updatedUser.promotionalCredits 
    });
  } catch (error) {
    console.error('Error using promotional credits:', error);
    return NextResponse.json({ error: 'Failed to use credits' }, { status: 500 });
  }
} 