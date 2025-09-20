import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendOrderConfirmationEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== DEBUGGING ORDER CONFIRMATION EMAIL ===');
    console.log('Environment check:', {
      brevoApiKey: process.env.BREVO_API_KEY ? 'Present' : 'Missing',
      brevoSenderName: process.env.BREVO_SENDER_NAME || 'Not set',
      brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'Not set'
    });

    // Test the sendOrderConfirmationEmail function with realistic parameters
    const testData = {
      customerEmail: session.user.email,
      customerName: session.user.name || 'Test Customer',
      orderId: `TEST-ORDER-${Date.now()}`,
      productName: 'Test Vinyl Album - Debug Test',
      amount: 26.00,
      orderQuantity: 1,
      format: 'vinyl',
      projectUrl: 'https://vinylfunders.com/nft-detail/test-123'
    };

    console.log('Testing order confirmation email with parameters:', testData);

    // Call the actual function used in production
    const emailResult = await sendOrderConfirmationEmail(testData);

    if (emailResult) {
      console.log('✅ Debug order confirmation email sent successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Debug order confirmation email sent successfully',
        recipient: testData.customerEmail,
        emailResult: {
          messageId: emailResult.messageId || 'N/A',
          hasResult: !!emailResult
        }
      });
    } else {
      console.error('❌ Failed to send debug order confirmation email');
      return NextResponse.json({
        success: false,
        message: 'Failed to send debug order confirmation email',
        error: 'Email function returned null'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Debug order confirmation email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing order confirmation email',
      error: error.message
    }, { status: 500 });
  }
}
