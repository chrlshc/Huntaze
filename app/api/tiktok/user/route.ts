import { NextResponse } from 'next/server';
import { tiktokService } from '@/lib/services/tiktok';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await tiktokService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error getting TikTok user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}