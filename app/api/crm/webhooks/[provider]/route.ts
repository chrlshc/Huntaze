import { NextRequest, NextResponse } from 'next/server';

// Generic webhook entrypoint for CRM providers (placeholder)
export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const provider = (params.provider || '').toLowerCase();
    // TODO: Verify signature once provider docs are known
    const payload = await request.json().catch(() => ({}));
    console.log(`[CRM Webhook] provider=${provider}`, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

