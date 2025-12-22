export interface MockDashboardActivityItem {
  id: string;
  type: 'content_published' | 'campaign_sent' | 'fan_subscribed' | 'message_received';
  title: string;
  createdAt: string;
  source: 'content' | 'marketing' | 'onlyfans' | 'messages';
  meta?: Record<string, unknown>;
}

export const mockDashboardActivity: MockDashboardActivityItem[] = [
  {
    id: 'act_1',
    type: 'fan_subscribed',
    title: 'New subscriber: @sarah_jones',
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    source: 'onlyfans',
  },
  {
    id: 'act_2',
    type: 'message_received',
    title: 'You received 3 new messages',
    createdAt: new Date(Date.now() - 15 * 60_000).toISOString(),
    source: 'messages',
  },
  {
    id: 'act_3',
    type: 'campaign_sent',
    title: 'Campaign sent: Summer Sale PPV Promo',
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    source: 'marketing',
  },
  {
    id: 'act_4',
    type: 'content_published',
    title: 'Content published: Summer vibes',
    createdAt: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
    source: 'content',
  },
];

