import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('🔥 WEBHOOK TEST - GET endpoint hit');
  console.log('🔥 Request URL:', request.url);
  console.log('🔥 Request method:', request.method);
  console.log('🔥 Request headers:', Object.fromEntries(request.headers.entries()));
  
  // Force production domain for webhooks
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://www.vinylfunders.com' 
    : 'http://localhost:3000';
  
  const webhookUrl = `${baseUrl}/api/webhooks/stripe`;
  
  return NextResponse.json({ 
    message: 'Webhook test GET endpoint is reachable',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    webhookUrl: webhookUrl,
    note: 'Use this webhookUrl in your Stripe Dashboard webhook configuration'
  });
}

export async function POST(request: Request) {
  console.log('🔥 WEBHOOK TEST - POST endpoint hit');
  console.log('🔥 Request URL:', request.url);
  console.log('🔥 Request method:', request.method);
  console.log('🔥 Request headers:', Object.fromEntries(request.headers.entries()));
  
  const body = await request.text();
  console.log('🔥 Request body length:', body.length);
  console.log('🔥 Request body preview:', body.substring(0, 200));
  
  // Force production domain for webhooks
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://www.vinylfunders.com' 
    : 'http://localhost:3000';
  
  const webhookUrl = `${baseUrl}/api/webhooks/stripe`;
  
  return NextResponse.json({ 
    message: 'Webhook test POST endpoint is reachable',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    bodyLength: body.length,
    headers: Object.fromEntries(request.headers.entries()),
    webhookUrl: webhookUrl,
    note: 'Use this webhookUrl in your Stripe Dashboard webhook configuration'
  });
}
