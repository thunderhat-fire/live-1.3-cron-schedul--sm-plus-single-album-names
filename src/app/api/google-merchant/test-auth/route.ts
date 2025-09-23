import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleMerchantConfig } from '@/lib/google-merchant-config';

export async function GET() {
  try {
    console.log('🔍 Testing Google Merchant authentication...');
    
    // Get config
    const config = getGoogleMerchantConfig();
    console.log('✅ Config loaded:', {
      merchantId: config.merchantId,
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      hasPrivateKey: !!config.privateKey,
      privateKeyLength: config.privateKey.length
    });

    // Initialize auth client
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

    // Get access token info
    const accessToken = await authClient.getAccessToken();
    console.log('🎫 Access token obtained:', {
      hasToken: !!accessToken.token,
      tokenType: typeof accessToken.token
    });

    // Initialize Content API
    const content = google.content({
      version: 'v2.1',
      auth: authClient,
    });

    console.log('🛍️ Content API initialized, testing simple call...');

    // Try the simplest possible API call - just list accounts
    const response = await content.accounts.list({
      merchantId: config.merchantId,
    });

    console.log('🎉 API call successful!', {
      statusCode: response.status,
      dataType: typeof response.data,
      hasAccounts: !!response.data.resources
    });

    return NextResponse.json({
      success: true,
      message: 'Google Merchant Center authentication successful!',
      config: {
        merchantId: config.merchantId,
        projectId: config.projectId,
        clientEmail: config.clientEmail,
      },
      authTest: {
        authorized: true,
        hasAccessToken: !!accessToken.token,
      },
      apiTest: {
        status: response.status,
        accountsFound: response.data.resources?.length || 0,
      }
    });

  } catch (error: any) {
    console.error('❌ Google Merchant authentication test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      errorCode: error.code,
      errorDetails: {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.status,
        statusText: error.statusText,
        stack: error.stack
      }
    }, { status: 500 });
  }
}
