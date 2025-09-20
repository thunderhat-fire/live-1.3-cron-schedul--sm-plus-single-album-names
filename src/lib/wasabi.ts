import { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import crypto from 'crypto';

// Mandatory environment variables (should be defined in .env.*)
const {
  WASABI_ACCESS_KEY,
  WASABI_SECRET_KEY,
  WASABI_REGION = 'us-east-1',
  WASABI_BUCKET,
  WASABI_ENDPOINT,
  WASABI_PUBLIC_URL,
} = process.env as Record<string, string>;

if (!WASABI_ACCESS_KEY || !WASABI_SECRET_KEY || !WASABI_BUCKET || !WASABI_ENDPOINT) {
  throw new Error('Wasabi configuration missing. Please set WASABI_ACCESS_KEY, WASABI_SECRET_KEY, WASABI_BUCKET and WASABI_ENDPOINT in your environment.');
}

// Initialise S3-compatible client for Wasabi
const s3 = new S3Client({
  region: WASABI_REGION,
  endpoint: WASABI_ENDPOINT, // e.g. https://s3.eu-central-1.wasabisys.com
  credentials: {
    accessKeyId: WASABI_ACCESS_KEY,
    secretAccessKey: WASABI_SECRET_KEY,
  },
});

// Improved public URL construction
export function getPublicUrl(publicId?: string): string {
  const baseUrl = WASABI_PUBLIC_URL ? 
    (WASABI_PUBLIC_URL.endsWith('/') ? WASABI_PUBLIC_URL.slice(0, -1) : WASABI_PUBLIC_URL) :
    `${WASABI_ENDPOINT.replace(/\/$/, '')}/${WASABI_BUCKET}`;
  
  return publicId ? `${baseUrl}/${publicId}` : baseUrl;
}

const PUBLIC_ROOT = getPublicUrl();

console.log('🔧 Wasabi Configuration:', {
  endpoint: WASABI_ENDPOINT,
  bucket: WASABI_BUCKET,
  publicUrl: PUBLIC_ROOT,
  region: WASABI_REGION
});

function generateFileName(originalName?: string): string {
  const ext = originalName ? path.extname(originalName) : '';
  // Replace any unsafe characters (spaces, unicode, etc.) with safe dashes
  const baseRaw = originalName ? path.basename(originalName, ext) : 'file';
  const baseSafe = baseRaw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // collapse to alphanumerics & dashes
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes

  const random = crypto.randomBytes(6).toString('hex');
  return `${baseSafe || 'file'}-${Date.now()}-${random}${ext}`;
}

/**
 * Upload a Buffer to Wasabi and return the public URL.
 * The signature mirrors the old Cloudinary `uploadImage` util so existing calls can be updated with minimal changes.
 */
export async function uploadImage(
  file: Buffer,
  folder: string = 'forum',
  _context?: Record<string, string>, // preserved for signature compatibility – ignored
  _userId?: string, // preserved for signature compatibility – ignored
  originalFilename?: string,
): Promise<string> {
  try {
    const keyPath = [folder.replace(/^\/+|\/+$/g, '')] // trim leading/trailing slashes
      .filter(Boolean)
      .join('/')
      .replace(/\/+/g, '/');

    const fileName = generateFileName(originalFilename);
    const fullKey = `${keyPath}/${fileName}`.replace(/^[\/]+/, '');

    console.log('📤 Uploading to Wasabi:', {
      bucket: WASABI_BUCKET,
      key: fullKey,
      size: file.length,
      publicUrl: `${PUBLIC_ROOT}/${fullKey}`
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: WASABI_BUCKET,
        Key: fullKey,
        Body: file,
        ACL: 'public-read',
        ContentType: getContentType(originalFilename),
      })
    );

    const publicUrl = `${PUBLIC_ROOT}/${fullKey}`;
    console.log('✅ Upload successful:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Wasabi upload failed:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(filename?: string): string {
  if (!filename) return 'application/octet-stream';
  
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.aiff': 'audio/aiff',
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Copy (effectively "rename") an object within the Wasabi bucket.
 */
export async function moveObject(oldKey: string, newKey: string): Promise<void> {
  if (oldKey === newKey) return; // no-op

  // S3 CopySource must be URL-encoded but keep slashes intact
  const encodedCopySource = `${WASABI_BUCKET}/${encodeURIComponent(oldKey).replace(/%2F/g, '/')}`;

  await s3.send(
    new CopyObjectCommand({
      Bucket: WASABI_BUCKET,
      CopySource: encodedCopySource,
      Key: newKey,
      ACL: 'public-read',
    })
  );

  await s3.send(
    new DeleteObjectCommand({
      Bucket: WASABI_BUCKET,
      Key: oldKey,
    })
  );
}

/**
 * Validate if a Wasabi URL is accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('❌ Image URL validation failed:', url, error);
    return false;
  }
} 