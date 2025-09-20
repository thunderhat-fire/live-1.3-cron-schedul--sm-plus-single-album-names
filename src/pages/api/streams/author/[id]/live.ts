import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid author ID' });
  }

  try {
    // Check for active streams by this author
    const activeStream = await prisma.stream.findFirst({
      where: {
        creatorId: id,
        status: 'active',
        startedAt: {
          not: undefined
        },
        endedAt: null
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    if (activeStream) {
      return res.status(200).json({
        isLive: true,
        stream: activeStream
      });
    } else {
      return res.status(200).json({
        isLive: false,
        stream: null
      });
    }
  } catch (error) {
    console.error('Error checking live status:', error);
    return res.status(500).json({ error: 'Failed to check live status' });
  }
} 