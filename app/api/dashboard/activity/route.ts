import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch recent activities from different sources
    const [recentMessages, recentCampaigns, recentContent] = await Promise.all([
      // Recent messages
      prisma.message.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          recipientCount: true,
          createdAt: true,
        },
      }),
      // Recent campaigns
      prisma.campaign.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
        },
      }),
      // Recent content uploads
      prisma.media.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          createdAt: true,
        },
      }),
    ]);

    // Transform to activity format
    const activities = [
      ...recentMessages.map((msg) => ({
        id: `msg-${msg.id}`,
        type: 'message' as const,
        title: getMessageTitle(msg.status),
        description: `Message delivered to ${msg.recipientCount || 0} subscribers`,
        status: mapMessageStatus(msg.status),
        timestamp: msg.createdAt,
      })),
      ...recentCampaigns.map((campaign) => ({
        id: `campaign-${campaign.id}`,
        type: 'campaign' as const,
        title: getCampaignTitle(campaign.status),
        description: `Campaign "${campaign.name}" ${getCampaignDescription(campaign.status, campaign.scheduledAt)}`,
        status: mapCampaignStatus(campaign.status),
        timestamp: campaign.createdAt,
      })),
      ...recentContent.map((media) => ({
        id: `content-${media.id}`,
        type: 'content' as const,
        title: 'Content uploaded',
        description: `New ${media.type} added to content library`,
        status: 'success' as const,
        timestamp: media.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('[Dashboard Activity API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch activity data',
        },
      },
      { status: 500 }
    );
  }
}

function getMessageTitle(status: string): string {
  switch (status) {
    case 'sent':
      return 'Message sent successfully';
    case 'queued':
      return 'Message queued';
    case 'failed':
      return 'Message failed';
    default:
      return 'Message status updated';
  }
}

function getCampaignTitle(status: string): string {
  switch (status) {
    case 'active':
      return 'Campaign active';
    case 'scheduled':
      return 'Campaign scheduled';
    case 'completed':
      return 'Campaign completed';
    case 'paused':
      return 'Campaign paused';
    default:
      return 'Campaign updated';
  }
}

function getCampaignDescription(status: string, scheduledAt: Date | null): string {
  if (status === 'scheduled' && scheduledAt) {
    return `scheduled for ${scheduledAt.toLocaleDateString()}`;
  }
  return status;
}

function mapMessageStatus(status: string): 'success' | 'pending' | 'failed' | 'warning' {
  switch (status) {
    case 'sent':
      return 'success';
    case 'queued':
      return 'pending';
    case 'failed':
      return 'failed';
    default:
      return 'warning';
  }
}

function mapCampaignStatus(status: string): 'success' | 'pending' | 'failed' | 'warning' {
  switch (status) {
    case 'active':
      return 'success';
    case 'scheduled':
      return 'pending';
    case 'completed':
      return 'success';
    case 'paused':
      return 'warning';
    default:
      return 'warning';
  }
}
