import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { queueManager } from '@/lib/queue/queue-manager';
import { analytics } from '@/lib/analytics/realtime-analytics';
import { z } from 'zod';

const contentSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(['photos', 'videos', 'bundle', 'live']),
  price: z.number().min(0).optional(),
  tags: z.array(z.string()).max(10),
  platforms: z.array(z.enum(['onlyfans', 'instagram', 'tiktok', 'reddit'])).min(1),
  scheduledDate: z.string().optional(),
  mediaUrls: z.array(z.string()).min(1).max(20),
  isBundle: z.boolean(),
  bundleItems: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      const r = NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = contentSchema.parse(body);

    // Generate unique content ID
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create content object with metadata
    const content = {
      id: contentId,
      userId: session.user?.email || 'unknown',
      ...validatedData,
      createdAt: new Date().toISOString(),
      status: validatedData.scheduledDate ? 'scheduled' : 'published',
      metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        revenue: 0
      }
    };

    // Queue for AI processing and optimization
    await queueManager.queueAIProcessing({
      type: 'optimize_content',
      payload: {
        contentId,
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        platforms: validatedData.platforms,
        mediaUrls: validatedData.mediaUrls,
        category: validatedData.category
      },
      userId: session.user?.email || 'unknown',
      priority: 'high'
    });

    // Queue for platform-specific publishing
    for (const platform of validatedData.platforms) {
      await queueManager.queueAIProcessing({
        type: 'publish_content',
        payload: {
          contentId,
          platform,
          content: {
            title: validatedData.title,
            description: validatedData.description,
            mediaUrls: validatedData.mediaUrls,
            tags: validatedData.tags,
            price: validatedData.price
          },
          scheduledDate: validatedData.scheduledDate
        },
        userId: session.user?.email || 'unknown',
        priority: validatedData.scheduledDate ? 'normal' : 'high'
      });
    }

    // Track content creation analytics
    await analytics.trackEvent({
      userId: session.user?.email || 'unknown',
      eventType: 'content_created',
      properties: {
        contentId,
        category: validatedData.category,
        platformCount: validatedData.platforms.length,
        platforms: validatedData.platforms,
        hasPrice: !!validatedData.price,
        priceAmount: validatedData.price || 0,
        isScheduled: !!validatedData.scheduledDate,
        mediaCount: validatedData.mediaUrls.length,
        tagCount: validatedData.tags.length,
        isBundle: validatedData.isBundle
      },
      revenue: validatedData.price || 0
    });

    // If content has media, queue for AI analysis
    if (validatedData.mediaUrls.length > 0) {
      await queueManager.queueAIProcessing({
        type: 'analyze_media',
        payload: {
          contentId,
          mediaUrls: validatedData.mediaUrls,
          category: validatedData.category
        },
        userId: session.user?.email || 'unknown',
        priority: 'normal'
      });
    }

    // Return success response
    const r = NextResponse.json({
      success: true,
      data: {
        contentId,
        status: content.status,
        platforms: validatedData.platforms,
        scheduledDate: validatedData.scheduledDate,
        message: validatedData.scheduledDate 
          ? `Content scheduled for ${new Date(validatedData.scheduledDate).toLocaleString()}`
          : 'Content published successfully'
      },
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('content_creation_failed', { error: error?.message || 'unknown_error' });

    if (error instanceof z.ZodError) {
      const r = NextResponse.json({ error: 'Invalid request data', details: error.errors, requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const r = NextResponse.json({ error: 'Failed to create content', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
