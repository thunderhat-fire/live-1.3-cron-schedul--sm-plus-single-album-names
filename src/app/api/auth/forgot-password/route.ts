import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendTransactionalEmail, EMAIL_TEMPLATES } from '@/lib/brevo';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Processing password reset for:', email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

// Create reset URL
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    console.log('Sending reset email with URL:', resetUrl);

    // Send reset email with correct parameters
    const emailResult = await sendTransactionalEmail(
      email,
      EMAIL_TEMPLATES.PASSWORD_RESET,
      {
        USER_NAME: user.name || 'there',  // Default to "there" if name is missing
        RESET_LINK: resetUrl,  // Send just the URL, let template handle button styling
        EXPIRY_TIME: '1 hour'  // Match the actual token expiry time
      }
    );

    if (!emailResult) {
      console.error('Failed to send reset email');
      throw new Error('Failed to send reset email');
    }

    console.log('Reset email sent successfully');

    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.' 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred while processing your request.' 
      },
      { status: 500 }
    );
  }
} 