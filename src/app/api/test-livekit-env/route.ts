import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ? 'SET' : 'MISSING',
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET ? 'SET' : 'MISSING',
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL ? 'SET' : 'MISSING',
    LIVEKIT_API_KEY_PREFIX: process.env.LIVEKIT_API_KEY?.substring(0, 4),
    LIVEKIT_API_SECRET_LENGTH: process.env.LIVEKIT_API_SECRET?.length,
    NEXT_PUBLIC_LIVEKIT_URL_VALUE: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    NODE_ENV: process.env.NODE_ENV
  };
  console.log('LiveKit Env Debug:', envCheck);
  return NextResponse.json(envCheck);
} 