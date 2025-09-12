import { NextRequest, NextResponse } from 'next/server';
import { mergeOnboarding } from '@/app/api/_store/onboarding';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selectedTests, niche } = body || {};

    if (!Array.isArray(selectedTests) || !niche) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value || 'dev-user';

    mergeOnboarding(token, {
      abTests: {
        selectedTests,
        niche,
        createdAt: new Date().toISOString(),
        status: 'pending_setup',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save AB tests:', error);
    return NextResponse.json({ error: 'Failed to save tests' }, { status: 500 });
  }
}

