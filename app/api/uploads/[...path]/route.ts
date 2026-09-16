import { NextRequest, NextResponse } from 'next/server';
import { readImageBuffer } from '@/lib/image/storage';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const subPath = params.path.join('/');
    const relativePath = `/uploads/${subPath}`;

    const buffer = await readImageBuffer(relativePath);
    const ext = path.extname(subPath).toLowerCase();

    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return new NextResponse('File not found', { status: 404 });
  }
}
