import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/wasabi';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.aiMasteringCredits <= 0) {
    return NextResponse.json({ error: 'No mastering credits left' }, { status: 400 });
  }

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('track') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Convert File to Buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload file to Wasabi
  const url = await uploadImage(buffer, `master/user-${user.id}`, undefined, user.id, file.name);

  // Create MasteringRequest
  const masteringRequest = await prisma.masteringRequest.create({
    data: {
      userId: user.id,
      originalTrackUrl: url,
      status: 'pending',
    },
  });

  // Decrement credits
  await prisma.user.update({
    where: { id: user.id },
    data: { aiMasteringCredits: { decrement: 1 } },
  });

  return NextResponse.json({ success: true, masteringRequest });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const requests = await prisma.masteringRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ success: true, requests });
} 