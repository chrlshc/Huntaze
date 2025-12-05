/**
 * Offers API Routes
 * GET /api/offers - List offers
 * POST /api/offers - Create offer
 * Requirements: 5.1, 5.2, 5.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import { offersService } from '@/lib/offers/offers.service';
import { CreateOfferInput, OfferStatus } from '@/lib/offers/types';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    const userId = parseInt(session.user.id, 10);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') as OfferStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await offersService.listOffers(userId, {
      status: status || undefined,
      limit: Math.min(limit, 100),
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing offers:', error);
    return NextResponse.json(
      { error: 'Failed to list offers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.discountType || body.discountValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, discountType, discountValue' },
        { status: 400 }
      );
    }

    if (!body.validFrom || !body.validUntil) {
      return NextResponse.json(
        { error: 'Missing required fields: validFrom, validUntil' },
        { status: 400 }
      );
    }

    const input: CreateOfferInput = {
      name: body.name,
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue,
      originalPrice: body.originalPrice,
      validFrom: new Date(body.validFrom),
      validUntil: new Date(body.validUntil),
      status: body.status,
      targetAudience: body.targetAudience,
      contentIds: body.contentIds,
    };

    // Validate dates
    if (input.validUntil <= input.validFrom) {
      return NextResponse.json(
        { error: 'validUntil must be after validFrom' },
        { status: 400 }
      );
    }

    const offer = await offersService.createOffer(userId, input);

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}
