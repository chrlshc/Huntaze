/**
 * Dashboard API Test Fixtures
 * 
 * Mock data for dashboard integration tests
 */

export const mockUserId = 'test_user_123';
export const mockUnauthorizedUserId = 'unauthorized_user_456';

export const mockAnalyticsData = {
  success: true,
  data: {
    totalRevenue: 12500,
    revenueChange: 15.5,
    engagementRate: 78.5,
    engagementChange: 5.2,
    revenueTrend: [
      { date: '2024-11-01', value: 400 },
      { date: '2024-11-02', value: 420 },
      { date: '2024-11-03', value: 450 },
      { date: '2024-11-04', value: 430 },
      { date: '2024-11-05', value: 480 },
    ],
  },
};

export const mockFansData = {
  success: true,
  data: {
    activeCount: 1250,
    growthRate: 8.3,
    growthTrend: [
      { date: '2024-11-01', value: 1200 },
      { date: '2024-11-02', value: 1210 },
      { date: '2024-11-03', value: 1230 },
      { date: '2024-11-04', value: 1240 },
      { date: '2024-11-05', value: 1250 },
    ],
  },
};

export const mockMessagesData = {
  success: true,
  data: {
    total: 45,
    unread: 12,
    recent: [
      {
        id: 'msg_1',
        from: 'Sarah M.',
        createdAt: '2024-11-05T10:30:00Z',
        unread: true,
      },
      {
        id: 'msg_2',
        from: 'Mike R.',
        createdAt: '2024-11-05T09:15:00Z',
        unread: false,
      },
    ],
  },
};

export const mockContentData = {
  success: true,
  data: {
    items: [
      {
        id: 'content_1',
        title: 'Beach Photoshoot',
        type: 'photo',
        platform: 'onlyfans',
        publishedAt: '2024-11-05T08:00:00Z',
        createdAt: '2024-11-04T20:00:00Z',
      },
      {
        id: 'content_2',
        title: 'Behind the Scenes Video',
        type: 'video',
        platform: 'fansly',
        publishedAt: '2024-11-04T15:00:00Z',
        createdAt: '2024-11-04T10:00:00Z',
      },
    ],
  },
};

export const mockDashboardResponse = {
  success: true,
  data: {
    summary: {
      totalRevenue: {
        value: 12500,
        currency: 'USD',
        change: 15.5,
      },
      activeFans: {
        value: 1250,
        change: 8.3,
      },
      messages: {
        total: 45,
        unread: 12,
      },
      engagement: {
        value: 78.5,
        change: 5.2,
      },
    },
    trends: {
      revenue: [],
      fans: [],
    },
    recentActivity: [],
    quickActions: [
      {
        id: 'create_content',
        label: 'Create Content',
        icon: 'plus',
        href: '/content/new',
      },
    ],
  },
};

export const mockEmptyDashboardResponse = {
  success: true,
  data: {
    summary: {
      totalRevenue: {
        value: 0,
        currency: 'USD',
        change: 0,
      },
      activeFans: {
        value: 0,
        change: 0,
      },
      messages: {
        total: 0,
        unread: 0,
      },
      engagement: {
        value: 0,
        change: 0,
      },
    },
    trends: {
      revenue: [],
      fans: [],
    },
    recentActivity: [],
    quickActions: [],
  },
};

export const mockErrorResponse = {
  error: {
    code: 'AGGREGATION_FAILED',
    message: 'Failed to aggregate dashboard data',
  },
};

export const mockUnauthorizedResponse = {
  error: {
    code: 'UNAUTHORIZED',
    message: 'User not authenticated',
  },
};
