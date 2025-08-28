import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const resp = await fetch(`${API_URL}/schedule`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const payload = await request.json();
  const resp = await fetch(`${API_URL}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}

