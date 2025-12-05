/**
 * Offer Duplicate API Route
 * POST /api/offers/[id]/duplicate - Duplicate an offer
 * Requirements: 5.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { offersService } from '@/lib/offers/offers.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
