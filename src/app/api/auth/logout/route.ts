import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear NextAuth.js specific cookies
    const nextAuthCookies = ['next-auth.session-token', 'next-auth.csrf-token', 'next-auth.callback-url'];
    nextAuthCookies.forEach(cookieName => {
      cookieStore.delete(cookieName);
    });

    // Also clear any other session-related cookies
    cookieStore.getAll().forEach(cookie => {
      if (cookie.name.includes('next-auth') || cookie.name.includes('session')) {
        cookieStore.delete(cookie.name);
      }
    });

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Clear-Site-Data': '"cache", "cookies", "storage"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: error.message || 'Error logging out' },
      { status: 500 }
    );
  }
} 