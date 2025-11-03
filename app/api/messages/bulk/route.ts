import { NextRequest, NextResponse } from 'next/server';
import { CampaignsRepository, FansRepository } from '@/lib/db/repositories';
import { getUserFromRequest } from '@/lib/auth/request';
import { checkRateLimit, idFromRequestHeaders } from '@/src/lib/rate-limit';
import { withMonitoring } from '@/lib/observability/bootstrap';
import { OnlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';
import { z } from 'zod';

// Validation schema for bulk messaging
const BulkMessageSchema = z.object({
  recipientIds: z.array(z.number().int()).min(1).max(100),
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).optional(),
  campaignName: z.string().min(1).max(255),
  priority: z.number().int().min(1).max(10).optional(),
});

async function postHandler(request: NextRequest) {
  try {
    // Strict rate limit for bulk operations
    const ident = idFromRequestHeaders(request.headers);
    const rl = await checkRateLimit({ id: ident.id, limit: 5, windowSec: 3600 }); // 5 per hour
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

    const body = await request.json();
    const validated = BulkMessageSchema.parse(body);

    // Verify all recipients belong to the user
    const recipientChecks = await Promise.all(
      validated.recipientIds.map((fanId) => FansRepository.getFan(userId, fanId))
    );

    const invalidRecipients = recipientChecks
      .map((fan, idx) => (fan ? null : validated.recipientIds[idx]))
      .filter((id) => id !== null);

    if (invalidRecipients.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid recipients',
          details: `Recipients not found or not owned by user: ${invalidRecipients.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create campaign record
    const campaign = await CampaignsRepository.createCampaign(userId, {
      name: validated.campaignName,
      type: 'bulk_message',
      status: 'active',
      template: {
        content: validated.content,
        mediaUrls: validated.mediaUrls || [],
      },
      targetAudience: {
        recipientIds: validated.recipientIds,
      },
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        revenueCents: 0,
      },
    });

    // Initialize rate limiter service
    const rateLimiterService = new OnlyFansRateLimiterService();

    // Prepare messages for batch sending
    const messages = validated.recipientIds.map((recipientId) => ({
      messageId: crypto.randomUUID(),
      userId: user.userId,
      recipientId: recipientId.toString(),
      content: validated.content,
      mediaUrls: validated.mediaUrls,
      metadata: {
        campaignId: campaign.id.toString(),
        priority: validated.priority || 5,
      },
      priority: validated.priority || 5,
    }));

    // Send messages in batches (SQS supports max 10 messages per batch)
    const batchSize = 10;
    const batches: typeof messages[] = [];
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize));
    }

    let totalSent = 0;
    let totalFailed = 0;

    for (const batch of batches) {
      try {
        const results = await rateLimiterService.sendBatch(batch);
        
        // Count successes and failures
        results.forEach((result) => {
          if (result.status === 'queued') {
            totalSent++;
          } else {
            totalFailed++;
          }
        });
      } catch (error) {
        console.error('Batch send failed:', error);
        totalFailed += batch.length;
      }
    }

    // Update campaign metrics
    await CampaignsRepository.updateCampaignMetrics(campaign.id, {
      sent: totalSent,
      delivered: 0, // Will be updated by webhook/worker later
      opened: 0,
      clicked: 0,
      revenueCents: 0,
    });

    // Calculate estimated completion time (10 messages per minute)
    const estimatedMinutes = Math.ceil(validated.recipientIds.length / 10);
    const estimatedCompletionTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    return NextResponse.json(
      {
        campaignId: campaign.id,
        totalRecipients: validated.recipientIds.length,
        queued: totalSent,
        failed: totalFailed,
        estimatedCompletionTime: estimatedCompletionTime.toISOString(),
        status: 'queued',
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to send bulk messages:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk messages', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export const POST = withMonitoring('messages.bulk', postHandler as any, {
  domain: 'crm',
  feature: 'bulk_messaging',
  getUserId: (req) => (req as any)?.headers?.get?.('x-user-id') || undefined,
});
