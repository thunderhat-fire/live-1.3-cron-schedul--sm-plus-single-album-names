import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleMerchantConfig } from '@/lib/google-merchant-config';

export async function GET() {
  try {
    console.log('🔍 Testing Google Merchant products.list operation...');
    
    // Get config
    const config = getGoogleMerchantConfig();
    console.log('✅ Config loaded:', {
      merchantId: config.merchantId,
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      hasPrivateKey: !!config.privateKey,
    });

    // Initialize auth client (same as working test-auth)
    const authClient = new google.auth.JWT(
      config.clientEmail,
      undefined,
      config.privateKey,
      ['https://www.googleapis.com/auth/content'],
      undefined
    );

    console.log('🔑 Auth client created, attempting authorization...');
    
    // Test authorization
    await authClient.authorize();
    console.log('✅ Authorization successful!');

    // Initialize Content API
    const content = google.content({
      version: 'v2.1',
      auth: authClient,
    });

    console.log('🛍️ Content API initialized, testing products.list...');

    // Try the simplest possible API call - just list products
    const response = await content.products.list({
      merchantId: config.merchantId,
      // No other parameters needed
    });

    console.log('✅ Products list successful!', {
      statusCode: response.status,
      productCount: response.data.resources?.length || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Products list operation successful',
      merchantId: config.merchantId,
      statusCode: response.status,
      productCount: response.data.resources?.length || 0,
      products: response.data.resources || [],
    });

  } catch (error: any) {
    console.error('❌ Products list test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred',
      errorCode: error.code || error.status,
      merchantId: getGoogleMerchantConfig().merchantId,
      errorDetails: {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack,
      },
    }, { 
      status: error.status || 500 
    });
  }
}
