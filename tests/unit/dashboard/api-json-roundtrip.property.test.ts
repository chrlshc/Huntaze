/**
 * Property Test: API Response JSON Round-Trip
 * 
 * **Feature: creator-analytics-dashboard, Property 14: API Response JSON Round-Trip**
 * **Validates: Requirements 16.6**
 * 
 * For any valid API response object, JSON.stringify followed by JSON.parse
 * SHALL produce an equivalent object.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type {
  OverviewResponse,
  FinanceResponse,
  AcquisitionResponse,
  Kpi,
  TimeSeriesPoint,
  LiveEvent,
  EventType,
  RevenueBreakdown,
  Whale,
  AIMetrics,
  FunnelData,
  PlatformMetrics,
  TopContent,
  Platform
} from '@/lib/dashboard/types';

// ============================================
// Arbitraries (Generators)
// ============================================

const kpiArbitrary = fc.record({
  value: fc.double({ min: 0, max: 1000000, noNaN: true }),
  deltaPct: fc.double({ min: -100, max: 100, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n), // Normalize -0 to 0
  label: fc.string({ minLength: 1, maxLength: 50 }),
  tooltip: fc.string({ minLength: 1, maxLength: 200 })
}) as fc.Arbitrary<Kpi>;

const timeSeriesPointArbitrary = fc.record({
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .filter(d => !isNaN(d.getTime())) // Filter out invalid dates
    .map(d => d.toISOString().split('T')[0]),
  value: fc.double({ min: 0, max: 100000, noNaN: true })
}) as fc.Arbitrary<TimeSeriesPoint>;

const eventTypeArbitrary = fc.constantFrom(
  'NEW_SUB',
  'AI_MESSAGE',
  'TIP',
  'PPV_PURCHASE',
  'CUSTOM_ORDER'
) as fc.Arbitrary<EventType>;

const platformArbitrary = fc.constantFrom(
  'TikTok',
  'Instagram',
  'Twitter'
) as fc.Arbitrary<Platform>;

const liveEventArbitrary = fc.record({
  id: fc.uuid(),
  timestamp: fc.date().filter(d => !isNaN(d.getTime())).map(d => d.toISOString()),
  type: eventTypeArbitrary,
  amount: fc.option(fc.double({ min: 0, max: 10000, noNaN: true })),
  source: fc.option(fc.constantFrom('Instagram', 'TikTok', 'Twitter', 'OnlyFans')),
  fanHandle: fc.option(fc.string({ minLength: 1, maxLength: 30 }))
}) as fc.Arbitrary<LiveEvent>;

const revenueBreakdownArbitrary = fc.record({
  subscriptions: fc.double({ min: 0, max: 100000, noNaN: true }),
  ppv: fc.double({ min: 0, max: 100000, noNaN: true }),
  tips: fc.double({ min: 0, max: 100000, noNaN: true }),
  customs: fc.double({ min: 0, max: 100000, noNaN: true }),
  total: fc.double({ min: 0, max: 400000, noNaN: true })
}) as fc.Arbitrary<RevenueBreakdown>;

const whaleArbitrary = fc.record({
  fanId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  totalSpent: fc.double({ min: 0, max: 100000, noNaN: true }),
  lastPurchaseAt: fc.date().filter(d => !isNaN(d.getTime())).map(d => d.toISOString()),
  isOnline: fc.boolean(),
  aiPriority: fc.constantFrom('normal', 'high')
}) as fc.Arbitrary<Whale>;

const aiMetricsArbitrary = fc.record({
  rpm: kpiArbitrary,
  avgResponseTime: kpiArbitrary
}) as fc.Arbitrary<AIMetrics>;

const funnelDataArbitrary = fc.record({
  views: fc.option(fc.nat({ max: 1000000 })),
  profileClicks: fc.option(fc.nat({ max: 100000 })),
  linkTaps: fc.option(fc.nat({ max: 10000 })),
  newSubs: fc.nat({ max: 1000 })
}) as fc.Arbitrary<FunnelData>;

const platformMetricsArbitrary = fc.record({
  platform: platformArbitrary,
  views: fc.nat({ max: 1000000 }),
  profileClicks: fc.nat({ max: 100000 }),
  linkTaps: fc.nat({ max: 10000 }),
  newSubs: fc.nat({ max: 1000 })
}) as fc.Arbitrary<PlatformMetrics>;

const topContentArbitrary = fc.record({
  contentId: fc.uuid(),
  platform: platformArbitrary,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  thumbnailUrl: fc.option(fc.webUrl()),
  publishedAt: fc.date().filter(d => !isNaN(d.getTime())).map(d => d.toISOString()),
  views: fc.nat({ max: 1000000 }),
  linkTaps: fc.nat({ max: 10000 }),
  newSubs: fc.nat({ max: 1000 })
}) as fc.Arbitrary<TopContent>;

const overviewResponseArbitrary = fc.record({
  kpis: fc.record({
    netRevenue: kpiArbitrary,
    activeFans: kpiArbitrary,
    conversionRate: kpiArbitrary,
    ltv: kpiArbitrary
  }),
  revenueDaily: fc.array(timeSeriesPointArbitrary, { minLength: 1, maxLength: 365 }),
  revenueDailyPrev: fc.array(timeSeriesPointArbitrary, { minLength: 1, maxLength: 365 }),
  liveFeed: fc.array(liveEventArbitrary, { minLength: 0, maxLength: 50 }),
  lastSyncAt: fc.date().filter(d => !isNaN(d.getTime())).map(d => d.toISOString())
}) as fc.Arbitrary<OverviewResponse>;

const financeResponseArbitrary = fc.record({
  breakdown: revenueBreakdownArbitrary,
  whales: fc.array(whaleArbitrary, { minLength: 0, maxLength: 100 }),
  aiMetrics: aiMetricsArbitrary
}) as fc.Arbitrary<FinanceResponse>;

const acquisitionResponseArbitrary = fc.record({
  funnel: funnelDataArbitrary,
  platformMetrics: fc.array(platformMetricsArbitrary, { minLength: 1, maxLength: 10 }),
  topContent: fc.array(topContentArbitrary, { minLength: 0, maxLength: 10 }),
  insight: fc.option(fc.string({ minLength: 1, maxLength: 200 }))
}) as fc.Arbitrary<AcquisitionResponse>;

// ============================================
// Property Tests
// ============================================

describe('API JSON Round-Trip Properties', () => {
  it('**Feature: creator-analytics-dashboard, Property 14: API Response JSON Round-Trip** - OverviewResponse', () => {
    fc.assert(
      fc.property(overviewResponseArbitrary, (response) => {
        const serialized = JSON.stringify(response);
        const deserialized = JSON.parse(serialized);
        
        // Deep equality check
        expect(deserialized).toEqual(response);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('**Feature: creator-analytics-dashboard, Property 14: API Response JSON Round-Trip** - FinanceResponse', () => {
    fc.assert(
      fc.property(financeResponseArbitrary, (response) => {
        const serialized = JSON.stringify(response);
        const deserialized = JSON.parse(serialized);
        
        // Deep equality check
        expect(deserialized).toEqual(response);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('**Feature: creator-analytics-dashboard, Property 14: API Response JSON Round-Trip** - AcquisitionResponse', () => {
    fc.assert(
      fc.property(acquisitionResponseArbitrary, (response) => {
        const serialized = JSON.stringify(response);
        const deserialized = JSON.parse(serialized);
        
        // Deep equality check
        expect(deserialized).toEqual(response);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('handles special numeric values correctly', () => {
    // Test edge cases with special values
    const edgeCaseResponse: OverviewResponse = {
      kpis: {
        netRevenue: { value: 0, deltaPct: 0, label: 'Net Revenue', tooltip: 'Test' },
        activeFans: { value: 0, deltaPct: -100, label: 'Active Fans', tooltip: 'Test' },
        conversionRate: { value: 100, deltaPct: 100, label: 'Conversion', tooltip: 'Test' },
        ltv: { value: 0.01, deltaPct: 0.01, label: 'LTV', tooltip: 'Test' }
      },
      revenueDaily: [{ date: '2024-01-01', value: 0 }],
      revenueDailyPrev: [{ date: '2024-01-01', value: 0 }],
      liveFeed: [],
      lastSyncAt: new Date().toISOString()
    };

    const serialized = JSON.stringify(edgeCaseResponse);
    const deserialized = JSON.parse(serialized);
    
    expect(deserialized).toEqual(edgeCaseResponse);
  });

  it('handles optional fields correctly', () => {
    const responseWithOptionals: AcquisitionResponse = {
      funnel: {
        views: null,
        profileClicks: null,
        linkTaps: 100,
        newSubs: 10
      },
      platformMetrics: [{
        platform: 'TikTok',
        views: 1000,
        profileClicks: 100,
        linkTaps: 50,
        newSubs: 5
      }],
      topContent: [{
        contentId: 'test-id',
        platform: 'Instagram',
        title: 'Test Content',
        thumbnailUrl: undefined,
        publishedAt: new Date().toISOString(),
        views: 500,
        linkTaps: 25,
        newSubs: 3
      }],
      insight: undefined
    };

    const serialized = JSON.stringify(responseWithOptionals);
    const deserialized = JSON.parse(serialized);
    
    // Note: undefined values are removed during JSON serialization
    // This is expected behavior
    expect(deserialized.funnel.views).toBeNull();
    expect(deserialized.funnel.profileClicks).toBeNull();
    expect(deserialized.topContent[0].thumbnailUrl).toBeUndefined();
    expect(deserialized.insight).toBeUndefined();
  });
});
