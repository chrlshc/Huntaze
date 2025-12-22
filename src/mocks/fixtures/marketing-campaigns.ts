export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type CampaignChannel = 'email' | 'dm' | 'sms' | 'push';
export type CampaignGoal = 'engagement' | 'conversion' | 'retention';

export interface MockCampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface MockCampaign {
  id: string;
  user_id: number;
  name: string;
  status: CampaignStatus;
  channel: CampaignChannel;
  goal: CampaignGoal;
  audienceSegment: string;
  audienceSize: number;
  message: Record<string, unknown>;
  schedule?: Record<string, unknown>;
  stats: MockCampaignStats;
  createdAt: string;
  updated_at: string;
}

export const mockMarketingCampaigns: MockCampaign[] = [
  {
    id: 'mc_1',
    user_id: 1,
    name: 'Summer Sale PPV Promo',
    status: 'active',
    channel: 'dm',
    goal: 'conversion',
    audienceSegment: 'High Spenders',
    audienceSize: 245,
    message: { text: 'Special PPV just dropped 🔥' },
    stats: {
      sent: 245,
      opened: 198,
      openRate: 0.808,
      clicked: 87,
      clickRate: 0.355,
      converted: 34,
      conversionRate: 0.139,
    },
    createdAt: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'mc_2',
    user_id: 1,
    name: 'New Subscriber Welcome',
    status: 'active',
    channel: 'dm',
    goal: 'engagement',
    audienceSegment: 'New Fans',
    audienceSize: 89,
    message: { text: 'Welcome 💕' },
    stats: {
      sent: 89,
      opened: 76,
      openRate: 0.854,
      clicked: 45,
      clickRate: 0.506,
      converted: 12,
      conversionRate: 0.135,
    },
    createdAt: '2024-11-28T10:00:00Z',
    updated_at: '2024-11-28T10:00:00Z',
  },
  {
    id: 'mc_3',
    user_id: 1,
    name: 'Re-engagement Campaign',
    status: 'scheduled',
    channel: 'email',
    goal: 'retention',
    audienceSegment: 'At-Risk Fans',
    audienceSize: 156,
    message: { subject: 'We miss you', text: 'Come back 💕' },
    schedule: { scheduledAt: '2024-12-10T20:00:00Z' },
    stats: {
      sent: 0,
      opened: 0,
      openRate: 0,
      clicked: 0,
      clickRate: 0,
      converted: 0,
      conversionRate: 0,
    },
    createdAt: '2024-12-03T10:00:00Z',
    updated_at: '2024-12-03T10:00:00Z',
  },
  {
    id: 'mc_4',
    user_id: 1,
    name: 'Holiday Special Offer',
    status: 'draft',
    channel: 'dm',
    goal: 'conversion',
    audienceSegment: 'All Fans',
    audienceSize: 508,
    message: {},
    stats: {
      sent: 0,
      opened: 0,
      openRate: 0,
      clicked: 0,
      clickRate: 0,
      converted: 0,
      conversionRate: 0,
    },
    createdAt: '2024-12-04T10:00:00Z',
    updated_at: '2024-12-04T10:00:00Z',
  },
];

export function queryCampaigns(params: {
  status?: string | null;
  channel?: string | null;
  limit?: number;
  offset?: number;
}) {
  const { status, channel, limit = 50, offset = 0 } = params;
  let items = [...mockMarketingCampaigns];
  if (status) items = items.filter((c) => c.status === status);
  if (channel) items = items.filter((c) => c.channel === channel);
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = items.length;
  const sliced = items.slice(offset, offset + limit);
  const hasMore = offset + sliced.length < total;

  return {
    items: sliced,
    pagination: { total, limit, offset, hasMore },
  };
}

