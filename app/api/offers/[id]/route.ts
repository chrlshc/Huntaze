/**
 * Offer Detail API Routes
 * GET /api/offers/[id] - Get offer
 * PUT /api/offers/[id] - Update offer
 * DELETE /api/offers/[id] - Delete offer
 * Requirements: 5.2, 5.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import { offersService } from '@/lib/offers/offers.service';
import { UpdateOfferInput } from '@/lib/offers/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;

    const offer = await offersService.getOffer(id, userId);

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error getting offer:', error);
    return NextResponse.json(
      { error: 'Failed to get offer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;
    const body = await request.json();

    const input: UpdateOfferInput = {};

    if (body.name !== undefined) input.name = body.name;
    if (body.description !== undefined) input.description = body.description;
    if (body.discountType !== undefined) input.discountType = body.discountType;
    if (body.discountValue !== undefined) input.discountValue = body.discountValue;
    if (body.originalPrice !== undefined) input.originalPrice = body.originalPrice;
    if (body.validFrom !== undefined) input.validFrom = new Date(body.validFrom);
    if (body.validUntil !== undefined) input.validUntil = new Date(body.validUntil);
    if (body.status !== undefined) input.status = body.status;
    if (body.targetAudience !== undefined) input.targetAudience = body.targetAudience;
    if (body.contentIds !== undefined) input.contentIds = body.contentIds;

    // Validate dates if both provided
    if (input.validFrom && input.validUntil && input.validUntil <= input.validFrom) {
      return NextResponse.json(
        { error: 'validUntil must be after validFrom' },
        { status: 400 }
      );
    }

    const offer = await offersService.updateOffer(id, userId, input);

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;

    const deleted = await offersService.deleteOffer(id, userId);

    if (!deleted) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}
