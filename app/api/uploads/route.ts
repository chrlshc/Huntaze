import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, stat } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extGuess = (file as any).name ? path.extname((file as any).name) : '';
    const ext = extGuess && extGuess.length <= 8 ? extGuess : '';
    const filename = `${randomUUID()}${ext || '.bin'}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure uploads directory exists
    try { await stat(uploadDir); } catch { await mkdir(uploadDir, { recursive: true }); }

    await writeFile(path.join(uploadDir, filename), buffer);
    const url = `/uploads/${filename}`;

    return NextResponse.json({
      url,
      name: (file as any).name || filename,
      size: buffer.length,
      type: file.type || 'application/octet-stream',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
