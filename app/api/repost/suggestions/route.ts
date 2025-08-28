import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET() {
  const resp = await fetch(`${API_URL}/repost/suggestions`, { cache: 'no-store', headers: {} });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}

