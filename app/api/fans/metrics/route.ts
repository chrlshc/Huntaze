import { NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET() {
  try {
    const fansRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crm/fans`, { cache: 'no-store' });
    const fansJson = fansRes.ok ? await fansRes.json() : {};
    const items = Array.isArray(fansJson.items) ? fansJson.items : [];

    // Scaffold metrics: cohorts/retention placeholders
    const cohorts = [] as any[];
    const retention = [] as any[];
    const ltvHistogram = [] as any[];

    return NextResponse.json({ cohorts, retention, ltvHistogram });
  } catch {
    return NextResponse.json({ cohorts: [], retention: [], ltvHistogram: [] });
  }
}

