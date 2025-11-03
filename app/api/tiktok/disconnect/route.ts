import { NextResponse } from 'next/server';
import { tiktokService } from '@/lib/services/tiktok';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    await tiktokService.disconnect();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting TikTok:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}