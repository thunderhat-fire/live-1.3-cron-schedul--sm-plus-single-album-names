import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('🔍 WEBHOOK DEBUG - POST endpoint hit');
  console.log('🔍 Request URL:', request.url);
  console.log('🔍 Request method:', request.method);
  console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
  
  const body = await request.text();
  console.log('🔍 Request body length:', body.length);
  console.log('🔍 Request body preview:', body.substring(0, 200));
  
  // Check for redirect indicators
  const url = new URL(request.url);
  const isHttp = url.protocol === 'http:';
  const isHttps = url.protocol === 'https:';
  
  console.log('🔍 Protocol analysis:', {
    protocol: url.protocol,
    isHttp,
    isHttps,
    hostname: url.hostname,
    fullUrl: request.url
  });
  
  return NextResponse.json({ 
    message: 'Webhook debug endpoint is reachable',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    protocol: url.protocol,
    isHttp,
    isHttps,
    bodyLength: body.length,
    headers: Object.fromEntries(request.headers.entries()),
    note: 'If you see HTTP requests, your webhook URL in Stripe Dashboard needs to be updated to HTTPS'
  });
}

export async function GET(request: Request) {
  console.log('🔍 WEBHOOK DEBUG - GET endpoint hit');
  console.log('🔍 Request URL:', request.url);
  console.log('🔍 Request method:', request.method);
  
  const url = new URL(request.url);
  const isHttp = url.protocol === 'http:';
  const isHttps = url.protocol === 'https:';
  
  return NextResponse.json({ 
    message: 'Webhook debug GET endpoint is reachable',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    protocol: url.protocol,
    isHttp,
    isHttps,
    note: 'Use POST for actual webhook testing'
  });
}

