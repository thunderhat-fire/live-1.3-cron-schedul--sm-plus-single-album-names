import { NextResponse } from 'next/server';
import { sendTransactionalEmail, EMAIL_TEMPLATES } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { email, tier } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const testTier = tier || 'plus';

    console.log('=== TESTING SUBSCRIPTION UPGRADE EMAIL ===');
    console.log('Environment check:', {
      brevoApiKey: process.env.BREVO_API_KEY ? 'Present' : 'Missing',
      brevoSenderName: process.env.BREVO_SENDER_NAME || 'Not set',
      brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'Not set'
    });

    // Test email parameters
    const emailParams = {
      USER_NAME: 'Test User',
      NEW_TIER: testTier.charAt(0).toUpperCase() + testTier.slice(1),
      AI_CREDITS: testTier === 'plus' || testTier === 'gold' ? '8' : '0',
      PROMOTIONAL_CREDITS: testTier === 'plus' ? '20' : '0',
      SUBSCRIPTION_END_DATE: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
    };

    console.log('Sending test subscription upgrade email:', {
      to: email,
      templateId: EMAIL_TEMPLATES.SUBSCRIPTION_UPGRADE,
      params: emailParams
    });

    // Send test email
    const emailResult = await sendTransactionalEmail(
      email,
      EMAIL_TEMPLATES.SUBSCRIPTION_UPGRADE,
      emailParams
    );

    if (emailResult) {
      console.log('✅ Test subscription email sent successfully:', {
        recipient: email,
        tier: testTier,
        success: true
      });
      
      return NextResponse.json({
        success: true,
        message: 'Test subscription email sent successfully',
        recipient: email,
        tier: testTier
      });
    } else {
      console.error('Failed to send test subscription upgrade email');
      return NextResponse.json({
        success: false,
        message: 'Failed to send test subscription upgrade email'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test subscription upgrade email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test subscription upgrade email failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 