import { NextRequest } from 'next/server';
import { withErrorHandling, jsonError } from '@/src/lib/http/errors';
import { MediaAssetSchema, PaginatedResponseSchema } from '@/src/lib/api/schemas';
import { z } from 'zod';
import { getServerAuth } from '@/lib/server-auth';
import { triggerAssetEvents, BackgroundProcessor } from '@/lib/services/sse-events';

// Query parameters schema
const AssetQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.enum(['photo', 'video', 'story', 'ppv']).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional(),
  tags: z.string().optional(), // comma-separated
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'revenue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Authentication
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validatedQuery = AssetQuerySchema.safeParse(queryParams);
    if (!validatedQuery.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid query parameters', 400, {
        errors: validatedQuery.error.errors
      });
    }

    const { page, limit, type, status, tags, search, sortBy, sortOrder } = validatedQuery.data;

    // Mock data for now - replace with actual database queries
    const mockAssets = [
      {
        id: '1',
        creatorId: auth.user.id,
        title: 'Summer Beach Photoshoot',
        description: 'Professional beach photography session',
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
        tags: ['beach', 'summer', 'professional'],
        compliance: {
          status: 'approved' as const,
          checkedAt: new Date('2024-01-15'),
          violations: [],
          score: 95
        }
      },
      {
        id: '2',
        creatorId: auth.user.id,
        title: 'Behind the Scenes Video',
        description: 'Exclusive behind the scenes content',
        type: 'video' as const,
        status: 'draft' as const,
        thumbnailUrl: '/mockups/video1-thumb.jpg',
        originalUrl: '/mockups/video1.mp4',
        fileSize: 15728640,
        duration: 180,
        dimensions: { width: 1920, height: 1080 },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        metrics: {
          views: 0,
          engagement: 0,
          revenue: 0,
          roi: 0
        },
        tags: ['bts', 'exclusive'],
        compliance: {
          status: 'pending' as const,
          checkedAt: new Date('2024-01-20'),
          violations: [],
          score: 0
        }
      }
    ];

    // Apply filters
    let filteredAssets = mockAssets.filter(asset => asset.creatorId === auth.user.id);
    
    if (type) {
      filteredAssets = filteredAssets.filter(asset => asset.type === type);
    }
    
    if (status) {
      filteredAssets = filteredAssets.filter(asset => asset.status === status);
    }
    
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase());
      filteredAssets = filteredAssets.filter(asset => 
        tagList.some(tag => asset.tags.some(assetTag => assetTag.toLowerCase().includes(tag)))
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAssets = filteredAssets.filter(asset => 
        asset.title.toLowerCase().includes(searchLower) ||
        asset.description?.toLowerCase().includes(searchLower) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filteredAssets.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'revenue':
          aValue = a.metrics.revenue;
          bValue = b.metrics.revenue;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const total = filteredAssets.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

    // Validate response data
    const validatedAssets = paginatedAssets.map(asset => MediaAssetSchema.parse(asset));

    const response = {
      success: true,
      data: {
        items: validatedAssets,
        pagination: {
          page,
          limit,
          total,
          hasNext: endIndex < total,
          hasPrev: page > 1
        }
      },
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    };

    return Response.json(response);
  });
}

// Create new media asset
const CreateAssetSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['photo', 'video', 'story', 'ppv']),
  tags: z.array(z.string()).default([]),
  scheduledDate: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const validatedData = CreateAssetSchema.safeParse(body);
    
    if (!validatedData.success) {
      return jsonError('VALIDATION_ERROR', 'Invalid asset data', 400, {
        errors: validatedData.error.errors
      });
    }

    const { title, description, type, tags, scheduledDate } = validatedData.data;

    // Mock creation - replace with actual database insert
    const newAsset = {
      id: crypto.randomUUID(),
      creatorId: auth.user.id,
      title,
      description,
      type,
      status: scheduledDate ? 'scheduled' as const : 'draft' as const,
      thumbnailUrl: '/mockups/placeholder-thumb.jpg',
      originalUrl: '/mockups/placeholder.jpg',
      fileSize: 0,
      dimensions: { width: 0, height: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: scheduledDate ? new Date(scheduledDate) : undefined,
      metrics: {
        views: 0,
        engagement: 0,
        revenue: 0,
        roi: 0
      },
      tags,
      compliance: {
        status: 'pending' as const,
        checkedAt: new Date(),
        violations: [],
        score: 0
      }
    };

    const validatedAsset = MediaAssetSchema.parse(newAsset);

    // Trigger SSE event for asset creation
    triggerAssetEvents(auth.user.id, validatedAsset, 'created');

    // Start background compliance check
    BackgroundProcessor.processAssetCompliance(auth.user.id, validatedAsset.id);

    return Response.json({
      success: true,
      data: validatedAsset,
      timestamp: new Date(),
      requestId: crypto.randomUUID()
    });
  });
}