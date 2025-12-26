import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ppv/campaigns - List PPV campaigns
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = { userId: session.user.id };
    if (templateId) {
      where.templateId = templateId;
    }

    const [campaigns, total] = await Promise.all([
      prisma.pPVCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { template: { select: { title: true, thumbnail: true } } },
      }),
      prisma.pPVCampaign.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaigns.map((c) => ({
          id: c.id,
          templateId: c.templateId,
          templateTitle: c.template?.title || 'Unknown',
          thumbnail: c.template?.thumbnail || '',
          price: c.price,
          status: c.status,
          sentAt: c.sentAt?.toISOString() || null,
          recipientsCount: c.recipientsCount,
          sentCount: c.sentCount,
          openedCount: c.openedCount,
          purchaseCount: c.purchaseCount,
          revenue: c.revenue,
          createdAt: c.createdAt.toISOString(),
        })),
        pagination: { total, limit, offset, hasMore: offset + campaigns.length < total },
      },
    });
  } catch (error) {
    console.error('[PPV Campaigns GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

/**
 * POST /api/ppv/campaigns - Create and send PPV campaign
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, recipientIds, price, scheduledAt } = body;

    if (!templateId) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 });
    }

    const template = await prisma.pPVTemplate.findFirst({
      where: { id: templateId, userId: session.user.id },
    });

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const recipientsCount = Array.isArray(recipientIds) ? recipientIds.length : 0;
    const campaignPrice = price !== undefined ? parseFloat(price) : template.price;

    const campaign = await prisma.pPVCampaign.create({
      data: {
        userId: session.user.id,
        templateId,
        price: campaignPrice,
        status: scheduledAt ? 'scheduled' : 'sending',
        recipientsCount,
        sentCount: 0,
        openedCount: 0,
        purchaseCount: 0,
        revenue: 0,
        sentAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      },
    });

    // TODO: Queue actual sending via OnlyFans API
    // For now, mark as sent immediately
    if (!scheduledAt) {
      await prisma.pPVCampaign.update({
        where: { id: campaign.id },
        data: { status: 'sent', sentCount: recipientsCount },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: campaign.id,
        templateId: campaign.templateId,
        status: scheduledAt ? 'scheduled' : 'sent',
        recipientsCount,
        sentAt: campaign.sentAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('[PPV Campaigns POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create campaign' }, { status: 500 });
  }
}
