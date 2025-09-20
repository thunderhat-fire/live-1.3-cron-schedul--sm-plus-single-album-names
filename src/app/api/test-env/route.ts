import { NextResponse } from 'next/server';

export async function GET() {
  // Don't log the actual values, just check their presence and format
  const envCheck = {
    hasMuxTokenId: !!process.env.MUX_TOKEN_ID,
    muxTokenIdFormat: process.env.MUX_TOKEN_ID?.substring(0, 3),
    hasMuxTokenSecret: !!process.env.MUX_TOKEN_SECRET,
    muxTokenSecretFormat: process.env.MUX_TOKEN_SECRET?.substring(0, 3),
    nodeEnv: process.env.NODE_ENV,
    // List all environment variables (without values)
    envKeys: Object.keys(process.env).filter(key => key.startsWith('MUX_'))
  };

  return NextResponse.json(envCheck);
} 