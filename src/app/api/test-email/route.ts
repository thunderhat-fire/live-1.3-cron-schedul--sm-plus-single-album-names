import { NextResponse } from 'next/server';
import { sendTransactionalEmail, EMAIL_TEMPLATES } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('=== TESTING ORDER CONFIRMATION EMAIL ===');
    console.log('Environment check:', {
      brevoApiKey: process.env.BREVO_API_KEY ? 'Present' : 'Missing',
      brevoSenderName: process.env.BREVO_SENDER_NAME || 'Not set',
      brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'Not set'
    });

    // Test email parameters
    const emailParams = {
      ORDER_ID: 'TEST-ORDER-123',
      PRODUCT_NAME: 'Test Vinyl Record',
      AMOUNT: '£26.00',
      SHIPPING_ADDRESS: '123 Test Street, London, SW1A 1AA, United Kingdom',
      ESTIMATED_DELIVERY: '4-6 weeks'
    };

    console.log('Sending test order confirmation email:', {
      to: email,
      templateId: EMAIL_TEMPLATES.ORDER_CONFIRMATION,
      params: emailParams
    });

    // Send test email
    const emailResult = await sendTransactionalEmail(
      email,
      EMAIL_TEMPLATES.ORDER_CONFIRMATION,
      emailParams
    );

    if (emailResult) {
      console.log('✅ Test email sent successfully:', {
        recipient: email,
        templateId: EMAIL_TEMPLATES.ORDER_CONFIRMATION,
        success: true
      });
      
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        recipient: email,
        templateId: EMAIL_TEMPLATES.ORDER_CONFIRMATION
      });
    } else {
      console.error('Failed to send test email');
      return NextResponse.json({
        success: false,
        message: 'Failed to send test order confirmation email'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test email failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 