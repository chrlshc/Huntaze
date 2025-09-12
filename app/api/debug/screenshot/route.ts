import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pB64 = url.searchParams.get('p');
    const pRaw = url.searchParams.get('path');

    // Default to env var, then fallback to the provided macOS temporary path
    const defaultPath = '/var/folders/2c/0x1gfpss16jf0fxqdvjwdg940000gn/T/TemporaryItems/NSIRD_screencaptureui_b8tK63/Screenshot 2025-09-08 at 8.59.29 AM.png';
    const filePath = pB64
      ? Buffer.from(pB64, 'base64').toString('utf8')
      : (pRaw || process.env.LOCAL_SCREENSHOT_PATH || defaultPath);

    // Read file from local filesystem
    const data = await fs.readFile(filePath);
    const type = contentTypeFor(filePath);

    return new Response(data as any, {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Unable to read local screenshot', details: String(err?.message || err) },
      { status: 404 }
    );
  }
}
