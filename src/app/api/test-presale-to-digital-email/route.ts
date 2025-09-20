import { NextResponse } from 'next/server';
import { sendPresaleToDigitalEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { 
      creatorEmail, 
      creatorName, 
      projectName, 
      targetOrders, 
      actualOrders 
    } = await request.json();
    
    if (!creatorEmail) {
      return NextResponse.json({ error: 'Creator email is required' }, { status: 400 });
    }

    // Use test data if not provided
    const testData = {
      creatorEmail,
      creatorName: creatorName || 'Test Artist',
      projectName: projectName || 'Test Album',
      targetOrders: targetOrders || 100,
      actualOrders: actualOrders || 45,
      endDate: new Date(),
      digitalPrice: 13.00,
      projectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/nft-detail/test-id`,
      conversionReason: 'time_expired' as const
    };

    console.log('=== TESTING PRESALE TO DIGITAL EMAIL ===');
    console.log('Environment check:', {
      brevoApiKey: process.env.BREVO_API_KEY ? 'Present' : 'Missing',
      brevoSenderName: process.env.BREVO_SENDER_NAME || 'Not set',
      brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'Not set'
    });

    console.log('Test data:', testData);

    // Send test email
    const emailResult = await sendPresaleToDigitalEmail(testData);

    if (emailResult) {
      console.log('✅ Test presale-to-digital email sent successfully:', {
        recipient: creatorEmail,
        projectName: testData.projectName,
        success: true
      });
      
      return NextResponse.json({
        success: true,
        message: 'Test presale-to-digital email sent successfully',
        recipient: creatorEmail,
        testData
      });
    } else {
      console.error('Failed to send test presale to digital email');
      return NextResponse.json({
        success: false,
        message: 'Failed to send test presale to digital email'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test presale to digital email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test presale to digital email failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 