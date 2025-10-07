import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Conversation = { id: string } & Record<string, any>;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';

    // Basic aggregation stub: fetch conversations list (server proxies handle auth)
    const convRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crm/conversations${from||to?`?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`:''}`, { cache: 'no-store' });
    const convJson = convRes.ok ? await convRes.json() : {};
    const conversations: Conversation[] = Array.isArray(convJson.items) ? convJson.items : [];

    // Minimal metrics scaffold; real aggregation depends on upstream payloads
    const byDay: { t: number; v: number }[] = [];
    const ttr: { t: number; v: number }[] = [];
    const slaPct: { t: number; v: number }[] = [];

    return NextResponse.json({ byDay, ttr, slaPct });
  } catch (e) {
    return NextResponse.json({ byDay: [], ttr: [], slaPct: [] });
  }
}

