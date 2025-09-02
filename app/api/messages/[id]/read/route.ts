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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const updated = crmData.markMessageRead(userId, params.id);
  if (!updated) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  return NextResponse.json({ message: updated });
}

