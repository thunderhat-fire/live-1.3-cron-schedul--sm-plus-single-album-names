import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== EGRESS TEST API CALLED ===');
  return NextResponse.json({ message: 'Egress test endpoint working' });
}

export async function POST() {
  console.log('=== EGRESS TEST POST API CALLED ===');
  return NextResponse.json({ message: 'Egress test POST endpoint working' });
} 