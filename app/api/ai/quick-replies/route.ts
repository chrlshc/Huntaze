import { NextRequest, NextResponse } from 'next/server';
import { crmData } from '@/lib/services/crmData';
import { getUserFromRequest } from '@/lib/auth/request';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const userId = user?.userId || null;
    if (!userId) return NextResponse.json({ templates: [] }, { status: 200 });
    const templates = crmData.listQuickReplies(userId);
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ templates: [] }, { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const userId = user?.userId || null;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { templates } = await request.json();
    if (!Array.isArray(templates)) return NextResponse.json({ error: 'templates must be an array' }, { status: 400 });
    const saved = crmData.setQuickReplies(userId, templates as string[]);
    return NextResponse.json({ templates: saved });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save templates' }, { status: 500 });
  }
}
