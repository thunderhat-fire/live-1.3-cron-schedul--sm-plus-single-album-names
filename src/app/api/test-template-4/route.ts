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

    console.log('=== TESTING TEMPLATE 4 ORDER CONFIRMATION EMAIL ===');
    
    // Test with the exact same parameters that would be sent in a real order
    const testOrderData = {
      customerEmail: session.user.email,
      customerName: session.user.name || 'Test Customer',
      orderId: `TEST-${Date.now()}`,
      productName: 'Test Vinyl Album - Template 4 Test',
      amount: 26.00,
      orderQuantity: 1,
      format: 'vinyl',
      projectUrl: 'https://vinylfunders.com/nft-detail/test-123'
    };

    console.log('Testing Template 4 with exact order parameters:', testOrderData);

    // Test the actual sendOrderConfirmationEmail function
    const emailResult = await sendOrderConfirmationEmail(testOrderData);

    if (emailResult) {
      console.log('✅ Template 4 test successful:', {
        recipient: testOrderData.customerEmail,
        messageId: emailResult.messageId || 'Unknown',
        success: true
      });
      
      return NextResponse.json({
        success: true,
        message: 'Template 4 order confirmation email sent successfully',
        recipient: testOrderData.customerEmail,
        messageId: emailResult.messageId || 'Unknown',
        testData: testOrderData
      });
    } else {
      console.error('❌ Template 4 test failed - emailResult is null');
      return NextResponse.json({
        success: false,
        message: 'Template 4 order confirmation email failed - function returned null',
        testData: testOrderData
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Template 4 test error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack
    });
    
    return NextResponse.json({
      success: false,
      message: 'Template 4 test failed with error',
      error: {
        message: error.message,
        code: error.code || 'Unknown',
        status: error.status || 'Unknown'
      }
    }, { status: 500 });
  }
}
