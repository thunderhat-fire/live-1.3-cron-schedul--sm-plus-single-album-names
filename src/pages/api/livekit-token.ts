import type { NextApiRequest, NextApiResponse } from 'next';
import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('LiveKit token request received:', {
    method: req.method,
    body: req.body,
    hasApiKey: !!process.env.LIVEKIT_API_KEY,
    hasApiSecret: !!process.env.LIVEKIT_API_SECRET,
    apiKeyPrefix: process.env.LIVEKIT_API_KEY?.substring(0, 3),
    apiSecretLength: process.env.LIVEKIT_API_SECRET?.length
  });

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { room, identity } = req.body;
  if (!room || !identity) {
    console.log('Missing required fields:', { room, identity });
    return res.status(400).json({ error: 'Missing room or identity' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('LiveKit credentials not configured');
    return res.status(500).json({ error: 'LiveKit credentials not configured' });
  }

  try {
    console.log('LiveKit Token Debug:', {
      room,
      identity,
      apiKeyPresent: !!apiKey,
      apiSecretPresent: !!apiSecret,
      apiKeyPrefix: apiKey?.substring(0, 4),
      apiSecretLength: apiSecret?.length
    });

    console.log('Generating token with:', {
      room,
      identity,
      apiKeyLength: apiKey.length,
      apiSecretLength: apiSecret.length
    });

    const at = new AccessToken(apiKey, apiSecret, { identity });
    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: false });

    const token = await at.toJwt();
    
    // Validate token
    if (!token || token.length < 10) {
      console.error('Generated invalid token:', { token });
      return res.status(500).json({ error: 'Failed to generate valid token' });
    }

    console.log('LiveKit token generated successfully:', {
      room,
      identity,
      tokenGenerated: true,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10) + '...'
    });
    
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
} 