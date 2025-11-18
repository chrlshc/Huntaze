import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/utils/response';

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

    // Return standardized format
    return NextResponse.json(
      createSuccessResponse({
        byDay,
        ttr,
        slaPct,
        period: {
          from: from || null,
          to: to || null,
        },
        conversationCount: conversations.length,
      })
    );
  } catch (e) {
    return NextResponse.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to fetch message metrics',
        500
      ),
      { status: 500 }
    );
  }
}

