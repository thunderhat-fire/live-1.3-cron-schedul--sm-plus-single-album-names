import { NextResponse } from 'next/server';
import { sendAbandonedCartEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { userEmail, userName, cartItems } = await request.json();
    
    if (!userEmail || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ 
        error: 'userEmail and cartItems are required' 
      }, { status: 400 });
    }

    console.log('=== SENDING ABANDONED CART EMAIL ===');
    console.log('User:', userEmail);
    console.log('Items:', cartItems.length);

    // Create cart recovery URL
    const cartUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart`;

    // Send abandoned cart email
    const emailResult = await sendAbandonedCartEmail({
      userEmail,
      userName: userName || 'Music Lover',
      cartItems,
      cartUrl
    });

    if (emailResult) {
      console.log('✅ Abandoned cart email sent successfully:', {
        recipient: userEmail,
        itemCount: cartItems.length,
        success: true
      });
      
      return NextResponse.json({
        success: true,
        message: 'Abandoned cart email sent successfully',
        recipient: userEmail,
        itemCount: cartItems.length
      });
    } else {
      console.error('Failed to send abandoned cart email');
      return NextResponse.json({
        success: false,
        message: 'Failed to send abandoned cart email'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Abandoned cart email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Abandoned cart email failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 