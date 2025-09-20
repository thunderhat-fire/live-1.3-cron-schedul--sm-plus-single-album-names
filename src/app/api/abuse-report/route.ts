import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'abuse-report endpoint not yet implemented' },
    { status: 501 },
  );
} 