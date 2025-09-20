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
      credits: user.aiMasteringCredits,
      maxCredits: benefits.aiMasteringLimit 
    });
  } catch (error) {
    console.error('Error fetching AI mastering credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

// POST to use a credit
export async function POST(req: Request) {
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

    if (user.aiMasteringCredits <= 0) {
      return NextResponse.json({ error: 'No credits remaining' }, { status: 400 });
    }

    // Deduct one credit
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        aiMasteringCredits: user.aiMasteringCredits - 1
      },
    });

    return NextResponse.json({ 
      success: true, 
      remainingCredits: updatedUser.aiMasteringCredits 
    });
  } catch (error) {
    console.error('Error using AI mastering credit:', error);
    return NextResponse.json({ error: 'Failed to use credit' }, { status: 500 });
  }
} 