import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      id: user.id,
      username: user.username ?? null,
      email: user.email ?? null,
      groups: user.groups ?? [],
    });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to fetch profile' }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const payload = await req.json();
    // TODO: persist profile (DB). For now, echo back with user id
    return NextResponse.json({ id: user.id, ...payload });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const payload = await req.json();
    // TODO: persist profile (DB). For now, echo back with user id
    return NextResponse.json({ id: user.id, ...payload });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status });
  }
}
