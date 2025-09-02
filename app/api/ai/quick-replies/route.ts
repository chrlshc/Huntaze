import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { crmData } from '@/lib/services/crmData';

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ templates: [] }, { status: 200 });
    const templates = crmData.listQuickReplies(userId);
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ templates: [] }, { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { templates } = await request.json();
    if (!Array.isArray(templates)) return NextResponse.json({ error: 'templates must be an array' }, { status: 400 });
    const saved = crmData.setQuickReplies(userId, templates as string[]);
    return NextResponse.json({ templates: saved });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save templates' }, { status: 500 });
  }
}

