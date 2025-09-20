import { NextResponse } from 'next/server';
import { sendAbandonedCartEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { userEmail, userName } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    // Test cart items
    const testCartItems = [
      { name: 'Test Vinyl Album', price: 26.00, format: 'vinyl' },
      { name: 'Digital EP', price: 13.00, format: 'digital' }
    ];

    console.log('=== TESTING ABANDONED CART EMAIL ===');
    console.log('Environment check:', {
      brevoApiKey: process.env.BREVO_API_KEY ? 'Present' : 'Missing',
      brevoSenderName: process.env.BREVO_SENDER_NAME || 'Not set',
      brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'Not set'
    });

    // Send test email
    const emailResult = await sendAbandonedCartEmail({
      userEmail,
      userName: userName || 'Test User',
      cartItems: testCartItems,
      cartUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart`
    });

    if (emailResult) {
      console.log('✅ Test abandoned cart email sent successfully:', {
        recipient: userEmail,
        itemCount: testCartItems.length,
        success: true
      });
      
      return NextResponse.json({
        success: true,
        message: 'Test abandoned cart email sent successfully',
        recipient: userEmail,
        testItems: testCartItems
      });
    } else {
      console.error('Failed to send test abandoned cart email');
      return NextResponse.json({
        success: false,
        message: 'Failed to send test abandoned cart email'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test abandoned cart email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test abandoned cart email failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 