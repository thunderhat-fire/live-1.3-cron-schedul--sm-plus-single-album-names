import { NextResponse } from 'next/server';
import { EgressClient } from 'livekit-server-sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Use the same hardcoded URL as live-status API
  const livekitUrl = 'wss://vinylfunders-gdqiiai0.livekit.cloud';
  const livekitApiKey = process.env.LIVEKIT_API_KEY;
  const livekitApiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitApiKey || !livekitApiSecret) {
    console.error('EGRESS_STOP: Server environment variables not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // EgressClient requires an HTTP URL, not a WSS one.
  const httpLivekitUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');

  const egressClient = new EgressClient(
    httpLivekitUrl,
    livekitApiKey,
    livekitApiSecret
  );
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { egressId } = await req.json();

  if (!egressId) {
    return NextResponse.json({ error: 'egressId is required' }, { status: 400 });
  }

  try {
    const info = await egressClient.stopEgress(egressId);
    return NextResponse.json({ egressId: info.egressId }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Failed to stop egress', error);
    return NextResponse.json({ error: 'Failed to stop egress' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
} 