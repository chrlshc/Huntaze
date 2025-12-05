/**
 * Offer Duplicate API Route
 * POST /api/offers/[id]/duplicate - Duplicate an offer
 * Requirements: 5.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import { offersService } from '@/lib/offers/offers.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;

    const duplicated = await offersService.duplicateOffer(id, userId);

    if (!duplicated) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error('Error duplicating offer:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate offer' },
      { status: 500 }
    );
  }
}
