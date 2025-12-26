import { http, HttpResponse } from 'msw';

import { queryContentItems } from './fixtures/content';
import { queryCampaigns } from './fixtures/marketing-campaigns';
import { mockOffers, type MockOffer } from './fixtures/offers';
import { mockAutomations, type MockAutomationFlow } from './fixtures/automations';
import { mockContentTemplates } from './fixtures/content-templates';
import { mockDashboardActivity } from './fixtures/dashboard';
import { mockPricingRecommendations } from './fixtures/revenue-pricing';
import { mockTrends, mockRecommendations, mockContentIdeas } from './fixtures/ai-content-trends';

const json = (data: any, init?: ResponseInit) => HttpResponse.json(data as any, init);

// -----------------------------------------------------------------------------
// In-memory stores (mock mode only)
// -----------------------------------------------------------------------------

let offersStore: MockOffer[] = [...mockOffers];
const templatesStore = [...mockContentTemplates];
const automationsStore: MockAutomationFlow[] = [...mockAutomations];

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

export const internalHandlers = [
  // Auth + CSRF
  http.get('*/api/csrf/token', () => {
    return json({
      success: true,
      data: {
        token: `mock-${Date.now()}`,
        expiresIn: 3600000,
      },
      meta: { timestamp: new Date().toISOString(), requestId: 'mock' },
    });
  }),

  http.post('*/api/auth/register', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email : 'mock@example.com';
    const name = typeof body?.name === 'string' ? body.name : null;

    return json(
      {
        success: true,
        data: {
          user: {
            id: `mock-user-${Date.now()}`,
            email,
            name,
          },
        },
        message: 'Account created successfully',
        duration: 5,
      },
      { status: 201 }
    );
  }),

  // Content
  http.get('*/api/content', ({ request }) => {
    const url = new URL(request.url);
    const status = (url.searchParams.get('status') || undefined) as any;
    const platform = url.searchParams.get('platform') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const result = queryContentItems({ status, platform, type, limit, offset });
    const items = result.items.map((item) => ({ ...item, mediaIds: item.media_ids }));

    return json({
      success: true,
      data: { ...result, items },
      meta: { timestamp: new Date().toISOString(), requestId: 'mock' },
    });
  }),

  // Marketing campaigns
  http.get('*/api/marketing/campaigns', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const channel = url.searchParams.get('channel');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const result = queryCampaigns({ status, channel, limit, offset });

    const toPercent = (value: unknown) => {
      const n = typeof value === 'number' ? value : 0;
      if (n > 1) return n;
      return Math.round(n * 10000) / 100;
    };

    const items = result.items.map((campaign: any) => ({
      ...campaign,
      stats: campaign?.stats
        ? {
            ...campaign.stats,
            openRate: toPercent(campaign.stats.openRate),
            clickRate: toPercent(campaign.stats.clickRate),
            conversionRate: toPercent(campaign.stats.conversionRate),
          }
        : campaign?.stats,
    }));
    return json({
      success: true,
      data: { ...result, items },
      meta: { timestamp: new Date().toISOString(), requestId: 'mock' },
    });
  }),

  // Offers
  http.get('*/api/offers', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let items = [...offersStore];
    if (status) items = items.filter((o) => o.status === status);

    const total = items.length;
    const offers = items.slice(offset, offset + limit);
    return json({ offers, total });
  }),

  http.get('*/api/offers/:id', ({ params }) => {
    const offer = offersStore.find((o) => o.id === params.id);
    if (!offer) return json({ error: 'Offer not found' }, { status: 404 });
    return json(offer);
  }),

  http.put('*/api/offers/:id', async ({ request, params }) => {
    const idx = offersStore.findIndex((o) => o.id === params.id);
    if (idx === -1) return json({ error: 'Offer not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    offersStore[idx] = { ...offersStore[idx], ...body, updatedAt: new Date().toISOString() };
    return json(offersStore[idx]);
  }),

  http.delete('*/api/offers/:id', ({ params }) => {
    offersStore = offersStore.filter((o) => o.id !== params.id);
    return json({ success: true });
  }),

  http.post('*/api/offers/:id/duplicate', ({ params }) => {
    const src = offersStore.find((o) => o.id === params.id);
    if (!src) return json({ error: 'Offer not found' }, { status: 404 });
    const copy = {
      ...src,
      id: `${src.id}_copy_${Date.now()}`,
      name: `${src.name} (Copy)`,
      status: 'draft' as const,
      redemptionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    offersStore = [copy, ...offersStore];
    return json(copy, { status: 201 });
  }),

  // Automations
  http.get('*/api/automations', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let items = [...automationsStore];
    if (status) items = items.filter((a) => a.status === status);
    return json({ success: true, data: items });
  }),

  http.get('*/api/automations/analytics', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'summary';

    if (type === 'compare') {
      return json({
        comparisons: automationsStore.map((a, idx) => ({
          automationId: a.id,
          name: a.name,
          metrics: { totalExecutions: (idx + 1) * 100, successRate: 90 - idx, averageStepsExecuted: 2 },
          rank: idx + 1,
        })),
      });
    }

    // summary (default)
    return json({
      metrics: { totalExecutions: 1234, successRate: 92.4, averageStepsExecuted: 2.1 },
      trends: [],
      triggerBreakdown: [],
      topPerformers: [],
    });
  }),

  // Content templates
  http.get('*/api/content/templates', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let items = [...templatesStore];
    if (category) items = items.filter((t) => t.category === category);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((t) => t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }

    const paged = items.slice(offset, offset + limit);
    const mostUsed = [...templatesStore].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

    return json({ success: true, data: { templates: paged, mostUsed } });
  }),

  http.post('*/api/content/templates/:id/use', ({ params }) => {
    const idx = templatesStore.findIndex((t) => t.id === params.id);
    if (idx !== -1) templatesStore[idx] = { ...templatesStore[idx], usageCount: templatesStore[idx].usageCount + 1 };
    return json({ success: true });
  }),

  // Dashboard (used by RecentActivity)
  http.get('*/api/dashboard', () => {
    return json({
      success: true,
      data: {
        summary: {
          totalRevenue: { value: 0, currency: 'USD', change: 0 },
          activeFans: { value: 0, change: 0 },
          messages: { total: 0, unread: 0 },
          engagement: { value: 0, change: 0 },
        },
        trends: { revenue: [], fans: [] },
        recentActivity: mockDashboardActivity,
        quickActions: [],
        connectedIntegrations: { onlyfans: false, instagram: false, tiktok: false, reddit: false },
        metadata: { sources: { onlyfans: false, instagram: false, tiktok: false, reddit: false }, hasRealData: false, generatedAt: new Date().toISOString() },
      },
      correlationId: 'mock',
      duration: 0,
    });
  }),

  // Revenue pricing (analytics/pricing page)
  http.get('*/api/revenue/pricing', () => json(mockPricingRecommendations)),

  // AI content trends (content page)
  http.get('*/api/ai/content-trends/trends', ({ request }) => {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    const data = platform ? mockTrends.filter((t) => t.platform === platform) : mockTrends;
    return json({ success: true, data: { trends: data } });
  }),

  http.get('*/api/ai/content-trends/recommendations', () =>
    json({
      success: true,
      data: {
        recommendations: mockRecommendations,
        contentIdeas: mockContentIdeas,
      },
    })
  ),
];
