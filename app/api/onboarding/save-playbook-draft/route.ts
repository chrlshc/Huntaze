import { NextRequest, NextResponse } from 'next/server';
import { mergeOnboarding } from '@/app/api/_store/onboarding';
import { withMonitoring } from '@/lib/observability/bootstrap';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value || 'dev-user';
    const body = await request.json();
    const { niche, dmSequences, cadence, upsellMenu } = body || {};

    // Accept partial fields only (draft saves can be incremental)
    const payload: any = {
      playbookDraft: {
        niche: niche || null,
        updatedAt: new Date().toISOString(),
      },
    };

    if (dmSequences) payload.playbookDraft.dmSequences = dmSequences;
    if (cadence) payload.playbookDraft.cadence = cadence;
    if (upsellMenu) payload.playbookDraft.upsellMenu = upsellMenu;

    mergeOnboarding(token, payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save playbook draft' }, { status: 500 });
  }
}

export const POST = withMonitoring('onboarding.save-playbook-draft', handler as any);
