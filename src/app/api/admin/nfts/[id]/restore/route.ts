import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'restore endpoint not yet implemented' },
    { status: 501 },
  );
} 