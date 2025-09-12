import { NextRequest, NextResponse } from 'next/server';
import { platformConnections } from '@/lib/services/platformConnections';
import { crmConnections } from '@/lib/services/crmConnections';
import { getUserFromRequest } from '@/lib/auth/request';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const userId = user.userId as string;

    const onlyFans = (platformConnections.get(userId) || []).some(c => c.platform === 'onlyfans' && c.isActive);
    const tiktok = Boolean(request.cookies.get('tiktok_access_token'));
    const instagram = request.cookies.get('instagram_connected')?.value === 'yes';
    const reddit = request.cookies.get('reddit_connected')?.value === 'yes';
    const inflow = (crmConnections.get(userId) || []).some(c => c.provider === 'inflow' && c.isActive);
    const supercreator = (crmConnections.get(userId) || []).some(c => c.provider === 'supercreator' && c.isActive);

    return NextResponse.json({ onlyfans: onlyFans, tiktok, instagram, reddit, inflow, supercreator });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get platform status' }, { status: 500 });
  }
}
