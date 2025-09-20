import { NextApiRequest, NextApiResponse } from 'next';
import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roomName } = req.query;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret || !roomName) {
    return res.status(400).json({ error: 'Missing LiveKit credentials or roomName' });
  }

  const identity = `viewer-${Math.random().toString(36).substr(2, 9)}`;
  const token = new AccessToken(apiKey, apiSecret, { identity });
  token.addGrant({ roomJoin: true, room: roomName as string, canPublish: false, canSubscribe: true });

  console.log('LiveKit Viewer Token Debug:', {
    roomName,
    identity,
    apiKeyPresent: !!apiKey,
    apiSecretPresent: !!apiSecret,
    apiKeyPrefix: apiKey?.substring(0, 4),
    apiSecretLength: apiSecret?.length
  });

  const jwt = typeof token.toJwt === 'function' ? await token.toJwt() : token.toJwt;
  res.status(200).json({ token: jwt });
} 