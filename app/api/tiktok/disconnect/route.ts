import { NextResponse } from 'next/server';
import { tiktokService } from '@/lib/services/tiktok';

export async function POST() {
  try {
    await tiktokService.disconnect();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting TikTok:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}