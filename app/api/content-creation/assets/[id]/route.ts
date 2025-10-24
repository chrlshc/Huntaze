import { NextRequest } from 'next/server';
import { withErrorHandling, jsonError } from '@/src/lib/http/errors';
import { MediaAssetSchema } from '@/src/lib/api/schemas';
import { z } from 'zod';
import { getServerAuth } from '@/lib/server-auth';
import { triggerAssetEvents } from '@/lib/services/sse-events';

interface RouteParams {
  params: {
    id: string;
  };
}

// Update asset schema
const UpdateAssetSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  scheduledDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = params;

    // Mock data - replace with actual database query
    const mockAsset = {
      id,
      creatorId: auth.user.id,
      title: 'Summer Beach Photoshoot',
      description: 'Professional beach photography session with sunset lighting',
      type: 'photo' as const,
      status: 'published' as const,
      thumbnailUrl: '/mockups/photo1-thumb.jpg',
      originalUrl: '/mockups/photo1.jpg',
      fileSize: 2048576,
      dimensions: { width: 1920, height: 1080 },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      publishedAt: new Date('2024-01-15'),
      metrics: {
        views: 1234,
        engagement: 89,
        revenue: 150.50,
        roi: 12.5
      },
      tags: ['beach', 'summer', 'professional', 'sunset'],
      compliance: {
        status: 'approved' as const,
        checkedAt: new Date('2024-01-15'),
        violations: [],
        score: 95
      }
    };

    // Check if asset exists and belongs to user
    if (mockAsset.creatorId !== auth.user.id) {
      return jsonError('FORBIDDEN', 'Access denied to this asset', 403);
    }

    const validatedAsset = MediaAssetSchema.parse(mockAsset);

    return Response.json({
      success: true,
      data: validatedAsset,
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    });
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = params;
    const body = await request.json();
    
    const validatedData = UpdateAssetSchema.safeParse(body);
    if (!validatedData.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid update data', 400, {
        errors: validatedData.error.errors
      });
    }

    // Mock update - replace with actual database update
    const updatedAsset = {
      id,
      creatorId: auth.user.id,
      title: validatedData.data.title || 'Summer Beach Photoshoot',
      description: validatedData.data.description || 'Professional beach photography session',
      type: 'photo' as const,
      status: validatedData.data.status || 'published' as const,
      thumbnailUrl: '/mockups/photo1-thumb.jpg',
      originalUrl: '/mockups/photo1.jpg',
      fileSize: 2048576,
      dimensions: { width: 1920, height: 1080 },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(), // Updated timestamp
      publishedAt: validatedData.data.scheduledDate ? new Date(validatedData.data.scheduledDate) : new Date('2024-01-15'),
      metrics: {
        views: 1234,
        engagement: 89,
        revenue: 150.50,
        roi: 12.5
      },
      tags: validatedData.data.tags || ['beach', 'summer', 'professional'],
      compliance: {
        status: 'approved' as const,
        checkedAt: new Date('2024-01-15'),
        violations: [],
        score: 95
      }
    };

    const validatedAsset = MediaAssetSchema.parse(updatedAsset);

    // Trigger SSE event for asset update
    triggerAssetEvents(auth.user.id, validatedAsset, 'updated');

    return Response.json({
      success: true,
      data: validatedAsset,
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    });
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = params;

    // Mock deletion - replace with actual database delete
    // Check if asset exists and belongs to user first
    
    // Trigger SSE event for asset deletion
    triggerAssetEvents(auth.user.id, { id } as any, 'deleted');
    
    return Response.json({
      success: true,
      data: { deleted: true, id },
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    });
  });
}