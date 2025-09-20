import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/wasabi';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = params;
  const masteringRequest = await prisma.masteringRequest.findUnique({ where: { id } });
  if (!masteringRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  if (masteringRequest.status === 'completed') {
    return NextResponse.json({ error: 'Already completed' }, { status: 400 });
  }
  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('track') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  // Convert File to Buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  // Upload mastered file to Wasabi
  const url = await uploadImage(buffer, `mastering-complete/mastering-${id}`, undefined, session.user.id, file.name);
  // Update request
  await prisma.masteringRequest.update({
    where: { id },
    data: {
      masteredTrackUrl: url,
      status: 'completed',
    },
  });
  return NextResponse.json({ success: true });
} 