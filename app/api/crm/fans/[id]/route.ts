import { NextRequest, NextResponse } from 'next/server';
import { FansRepository } from '@/lib/db/repositories';
import { getUserFromRequest } from '@/lib/auth/request';
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit';
import { z } from 'zod';

// Validation schema for fan updates
const UpdateFanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  platform: z.string().optional(),
  handle: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  valueCents: z.number().int().min(0).optional(),
  lastSeenAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const fanId = parseInt(id, 10);
    if (isNaN(fanId)) {
      return NextResponse.json({ error: 'Invalid fan ID' }, { status: 400 });
    }

    const fan = await FansRepository.getFan(userId, fanId);
    
    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 });
    }

    return NextResponse.json({ fan });
  } catch (error) {
    console.error('Failed to get fan:', error);
    return NextResponse.json({ error: 'Failed to get fan' }, { status: 500 });
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Rate limit write operations
    const ident = idFromRequestHeaders(request.headers);
    const rl = await checkRateLimit({ id: ident.id, limit: 60, windowSec: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const fanId = parseInt(id, 10);
    if (isNaN(fanId)) {
      return NextResponse.json({ error: 'Invalid fan ID' }, { status: 400 });
    }

    const body = await request.json();
    const validated = UpdateFanSchema.parse(body);

    // Convert datetime string to Date if provided, keep as string for repository
    const updateData: any = {
      ...validated,
      lastSeenAt: validated.lastSeenAt,
    };

    const fan = await FansRepository.updateFan(userId, fanId, updateData);

    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 });
    }

    return NextResponse.json({ fan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Failed to update fan:', error);
    return NextResponse.json({ error: 'Failed to update fan' }, { status: 500 });
  }
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Rate limit write operations
    const ident = idFromRequestHeaders(request.headers);
    const rl = await checkRateLimit({ id: ident.id, limit: 60, windowSec: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const fanId = parseInt(id, 10);
    if (isNaN(fanId)) {
      return NextResponse.json({ error: 'Invalid fan ID' }, { status: 400 });
    }

    const deleted = await FansRepository.deleteFan(userId, fanId);

    if (!deleted) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete fan:', error);
    return NextResponse.json({ error: 'Failed to delete fan' }, { status: 500 });
  }
}

export const GET = getHandler as any;
export const PUT = putHandler as any;
export const DELETE = deleteHandler as any;
