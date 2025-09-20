import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function isPlusMember(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/membership/check/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to check membership status');
    }
    const data = await response.json();
    return data.isPlusMember;
  } catch (error) {
    console.error('Error checking Plus membership:', error);
    return false;
  }
}

export const PLUS_MEMBER_FEATURES = {
  LIVE_STREAMING: 'live_streaming',
  // Add other plus features here
} as const; 