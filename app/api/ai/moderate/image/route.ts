import { NextRequest, NextResponse } from 'next/server'
import { contentModeration } from '@/services/content-moderation'

// POST /api/ai/moderate/image
// Body: { imageBase64: string, platform?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const b64 = String(body.imageBase64 || '')
    if (!b64) return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
    const buf = Buffer.from(b64, 'base64')
    if (!buf.length) return NextResponse.json({ error: 'invalid base64 image' }, { status: 400 })
    if (buf.length > 4 * 1024 * 1024) return NextResponse.json({ error: 'image too large (>4MB)' }, { status: 413 })
    const platform = String(body.platform || 'onlyfans')

    // Optional: basic dimension checks for PNG/JPEG/GIF/WEBP per Azure CS guidance (>=50 and <=2048)
    const dims = getImageDimensions(buf)
    if (dims) {
      const { width, height } = dims
      if (width < 50 || height < 50) {
        return NextResponse.json({ error: 'image too small (<50x50)' }, { status: 422 })
      }
      if (width > 2048 || height > 2048) {
        return NextResponse.json({ error: 'image too large in dimensions (>2048px)' }, { status: 422 })
      }
    }

    const result = await contentModeration.checkImage(buf, platform)
    return NextResponse.json({ platform, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'moderation failed' }, { status: 500 })
  }
}

// Minimal header parsers (PNG, JPEG, GIF, WEBP). Returns undefined if type unsupported.
function getImageDimensions(buf: Buffer): { width: number; height: number } | undefined {
  // PNG: signature 89504E470D0A1A0A, IHDR chunk width/height at bytes 16..24 (big-endian)
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    return { width, height }
  }
  // JPEG: starts with FFD8; scan SOFn markers for dimensions
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) { offset++; continue }
      const marker = buf[offset + 1]
      const size = buf.readUInt16BE(offset + 2)
      // SOF0..SOF3 or SOF5..SOF7 or SOF9..SOF11 or SOF13..SOF15
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        const height = buf.readUInt16BE(offset + 5)
        const width = buf.readUInt16BE(offset + 7)
        return { width, height }
      }
      if (size < 2) break
      offset += 2 + size
    }
  }
  // GIF: GIF87a/89a, width/height little-endian at 6 and 8
  if (buf.length >= 10 && buf.slice(0, 3).toString('ascii') === 'GIF') {
    const width = buf.readUInt16LE(6)
    const height = buf.readUInt16LE(8)
    return { width, height }
  }
  // WEBP: RIFF....WEBP; parse VP8X or VP8/VP8L
  if (buf.length >= 16 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
    const chunk = buf.slice(12, 16).toString('ascii')
    if (chunk === 'VP8X' && buf.length >= 30) {
      const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16))
      const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16))
      return { width, height }
    }
    // For VP8/VP8L, skip dimension check (complex); let Azure validate
  }
  return undefined
}
