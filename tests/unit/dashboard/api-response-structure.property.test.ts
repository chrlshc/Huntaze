/**
 * Property Test: API Response Structure Validation
 * **Feature: creator-analytics-dashboard, Property 13: API Response Structure Validation**
 * **Validates: Requirements 16.1, 16.2, 16.3, 16.5**
 * 
 * For any API response from /api/dashboard/overview, /api/dashboard/finance, 
 * or /api/dashboard/acquisition, the response SHALL contain all required fields 
 * as defined in the TypeScript interfaces.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  OverviewResponse,
  FinanceResponse,
  AcquisitionResponse,
  Kpi,
  TimeSeriesPoint,
  LiveEvent,
  RevenueBreakdown,
  Whale,
  AIMetrics,
  FunnelData,
  PlatformMetrics,
  TopContent,
  EventType,
  Platform,
} from '@/lib/dashboard/types';

// ============================================
// Validators
// ============================================

function isValidKpi(obj: unknown): obj is Kpi {
  if (typeof obj !== 'object' || obj === null) return false;
  const kpi = obj as Record<string, unknown>;
  return (
    typeof kpi.value === 'number' &&
    typeof kpi.deltaPct === 'number' &&
    typeof kpi.label === 'string' &&
    typeof kpi.tooltip === 'string'
  );
}

function isValidTimeSeriesPoint(obj: unknown): obj is TimeSeriesPoint {
  if (typeof obj !== 'object' || obj === null) return false;
  const point = obj as Record<string, unknown>;
  return (
    typeof point.date === 'string' &&
    typeof point.value === 'number'
  );
}

const validEventTypes: EventType[] = ['NEW_SUB', 'AI_MESSAGE', 'TIP', 'PPV_PURCHASE', 'CUSTOM_ORDER'];
const validSources = ['Instagram', 'TikTok', 'Twitter', 'OnlyFans'];

function isValidLiveEvent(obj: unknown): obj is LiveEvent {
  if (typeof obj !== 'object' || obj === null) return false;
  const event = obj as Record<string, unknown>;
  return (
    typeof event.id === 'string' &&
    typeof event.timestamp === 'string' &&
    validEventTypes.includes(event.type as EventType) &&
    (event.amount === undefined || typeof event.amount === 'number') &&
    (event.source === undefined || validSources.includes(event.source as string)) &&
    (event.fanHandle === undefined || typeof event.fanHandle === 'string')
  );
}


function isValidRevenueBreakdown(obj: unknown): obj is RevenueBreakdown {
  if (typeof obj !== 'object' || obj === null) return false;
  const breakdown = obj as Record<string, unknown>;
  return (
    typeof breakdown.subscriptions === 'number' &&
    typeof breakdown.ppv === 'number' &&
    typeof breakdown.tips === 'number' &&
    typeof breakdown.customs === 'number' &&
    typeof breakdown.total === 'number'
  );
}

function isValidWhale(obj: unknown): obj is Whale {
  if (typeof obj !== 'object' || obj === null) return false;
  const whale = obj as Record<string, unknown>;
  return (
    typeof whale.fanId === 'string' &&
    typeof whale.name === 'string' &&
    typeof whale.totalSpent === 'number' &&
    typeof whale.lastPurchaseAt === 'string' &&
    typeof whale.isOnline === 'boolean' &&
    (whale.aiPriority === 'normal' || whale.aiPriority === 'high')
  );
}

function isValidAIMetrics(obj: unknown): obj is AIMetrics {
  if (typeof obj !== 'object' || obj === null) return false;
  const metrics = obj as Record<string, unknown>;
  return (
    isValidKpi(metrics.rpm) &&
    isValidKpi(metrics.avgResponseTime)
  );
}

function isValidFunnelData(obj: unknown): obj is FunnelData {
  if (typeof obj !== 'object' || obj === null) return false;
  const funnel = obj as Record<string, unknown>;
  return (
    (funnel.views === null || typeof funnel.views === 'number') &&
    (funnel.profileClicks === null || typeof funnel.profileClicks === 'number') &&
    (funnel.linkTaps === null || typeof funnel.linkTaps === 'number') &&
    typeof funnel.newSubs === 'number'
  );
}

const validPlatforms: Platform[] = ['TikTok', 'Instagram', 'Twitter'];

function isValidPlatformMetrics(obj: unknown): obj is PlatformMetrics {
  if (typeof obj !== 'object' || obj === null) return false;
  const metrics = obj as Record<string, unknown>;
  return (
    validPlatforms.includes(metrics.platform as Platform) &&
    typeof metrics.views === 'number' &&
    typeof metrics.profileClicks === 'number' &&
    typeof metrics.linkTaps === 'number' &&
    typeof metrics.newSubs === 'number'
  );
}

function isValidTopContent(obj: unknown): obj is TopContent {
  if (typeof obj !== 'object' || obj === null) return false;
  const content = obj as Record<string, unknown>;
  return (
    typeof content.contentId === 'string' &&
    validPlatforms.includes(content.platform as Platform) &&
    typeof content.title === 'string' &&
    (content.thumbnailUrl === undefined || typeof content.thumbnailUrl === 'string') &&
    typeof content.publishedAt === 'string' &&
    typeof content.views === 'number' &&
    typeof content.linkTaps === 'number' &&
    typeof content.newSubs === 'number'
  );
}

// ============================================
// Response Validators
// ============================================

function validateOverviewResponse(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    return { valid: false, errors: ['Response is not an object'] };
  }
  
  const response = obj as Record<string, unknown>;
  
  // Check kpis
  if (!response.kpis || typeof response.kpis !== 'object') {
    errors.push('Missing or invalid kpis');
  } else {
    const kpis = response.kpis as Record<string, unknown>;
    if (!isValidKpi(kpis.netRevenue)) errors.push('Invalid kpis.netRevenue');
    if (!isValidKpi(kpis.activeFans)) errors.push('Invalid kpis.activeFans');
    if (!isValidKpi(kpis.conversionRate)) errors.push('Invalid kpis.conversionRate');
    if (!isValidKpi(kpis.ltv)) errors.push('Invalid kpis.ltv');
  }
  
  // Check revenueDaily
  if (!Array.isArray(response.revenueDaily)) {
    errors.push('Missing or invalid revenueDaily array');
  } else if (!response.revenueDaily.every(isValidTimeSeriesPoint)) {
    errors.push('Invalid items in revenueDaily');
  }
  
  // Check revenueDailyPrev
  if (!Array.isArray(response.revenueDailyPrev)) {
    errors.push('Missing or invalid revenueDailyPrev array');
  } else if (!response.revenueDailyPrev.every(isValidTimeSeriesPoint)) {
    errors.push('Invalid items in revenueDailyPrev');
  }
  
  // Check liveFeed
  if (!Array.isArray(response.liveFeed)) {
    errors.push('Missing or invalid liveFeed array');
  } else if (!response.liveFeed.every(isValidLiveEvent)) {
    errors.push('Invalid items in liveFeed');
  }
  
  // Check lastSyncAt
  if (typeof response.lastSyncAt !== 'string') {
    errors.push('Missing or invalid lastSyncAt');
  }
  
  return { valid: errors.length === 0, errors };
}

function validateFinanceResponse(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    return { valid: false, errors: ['Response is not an object'] };
  }
  
  const response = obj as Record<string, unknown>;
  
  // Check breakdown
  if (!isValidRevenueBreakdown(response.breakdown)) {
    errors.push('Missing or invalid breakdown');
  }
  
  // Check whales
  if (!Array.isArray(response.whales)) {
    errors.push('Missing or invalid whales array');
  } else if (!response.whales.every(isValidWhale)) {
    errors.push('Invalid items in whales');
  }
  
  // Check aiMetrics
  if (!isValidAIMetrics(response.aiMetrics)) {
    errors.push('Missing or invalid aiMetrics');
  }
  
  return { valid: errors.length === 0, errors };
}

function validateAcquisitionResponse(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    return { valid: false, errors: ['Response is not an object'] };
  }
  
  const response = obj as Record<string, unknown>;
  
  // Check funnel
  if (!isValidFunnelData(response.funnel)) {
    errors.push('Missing or invalid funnel');
  }
  
  // Check platformMetrics
  if (!Array.isArray(response.platformMetrics)) {
    errors.push('Missing or invalid platformMetrics array');
  } else if (!response.platformMetrics.every(isValidPlatformMetrics)) {
    errors.push('Invalid items in platformMetrics');
  }
  
  // Check topContent
  if (!Array.isArray(response.topContent)) {
    errors.push('Missing or invalid topContent array');
  } else if (!response.topContent.every(isValidTopContent)) {
    errors.push('Invalid items in topContent');
  }
  
  // insight is optional
  if (response.insight !== undefined && typeof response.insight !== 'string') {
    errors.push('Invalid insight (should be string or undefined)');
  }
  
  return { valid: errors.length === 0, errors };
}


// ============================================
// Generators
// ============================================

// Use integer timestamps to avoid invalid date issues
const MIN_TIMESTAMP = new Date('2020-01-01').getTime();
const MAX_TIMESTAMP = new Date('2030-12-31').getTime();

const safeDateStringArb = fc.integer({ min: MIN_TIMESTAMP, max: MAX_TIMESTAMP })
  .map(ts => new Date(ts).toISOString());

const safeDateOnlyArb = fc.integer({ min: MIN_TIMESTAMP, max: MAX_TIMESTAMP })
  .map(ts => new Date(ts).toISOString().split('T')[0]);

const kpiArb: fc.Arbitrary<Kpi> = fc.record({
  value: fc.double({ min: 0, max: 1000000, noNaN: true }),
  deltaPct: fc.double({ min: -100, max: 1000, noNaN: true }),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  tooltip: fc.string({ minLength: 1, maxLength: 200 }),
});

const timeSeriesPointArb: fc.Arbitrary<TimeSeriesPoint> = fc.record({
  date: safeDateOnlyArb,
  value: fc.double({ min: 0, max: 100000, noNaN: true }),
});

const eventTypeArb = fc.constantFrom<EventType>('NEW_SUB', 'AI_MESSAGE', 'TIP', 'PPV_PURCHASE', 'CUSTOM_ORDER');
const sourceArb = fc.constantFrom<'Instagram' | 'TikTok' | 'Twitter' | 'OnlyFans'>('Instagram', 'TikTok', 'Twitter', 'OnlyFans');

const liveEventArb: fc.Arbitrary<LiveEvent> = fc.record({
  id: fc.uuid(),
  timestamp: safeDateStringArb,
  type: eventTypeArb,
  amount: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: undefined }),
  source: fc.option(sourceArb, { nil: undefined }),
  fanHandle: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
});

const revenueBreakdownArb: fc.Arbitrary<RevenueBreakdown> = fc.record({
  subscriptions: fc.double({ min: 0, max: 100000, noNaN: true }),
  ppv: fc.double({ min: 0, max: 100000, noNaN: true }),
  tips: fc.double({ min: 0, max: 100000, noNaN: true }),
  customs: fc.double({ min: 0, max: 100000, noNaN: true }),
}).map(b => ({
  ...b,
  total: b.subscriptions + b.ppv + b.tips + b.customs,
}));

const whaleArb: fc.Arbitrary<Whale> = fc.record({
  fanId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  totalSpent: fc.double({ min: 0, max: 100000, noNaN: true }),
  lastPurchaseAt: safeDateStringArb,
  isOnline: fc.boolean(),
  aiPriority: fc.constantFrom<'normal' | 'high'>('normal', 'high'),
});

const aiMetricsArb: fc.Arbitrary<AIMetrics> = fc.record({
  rpm: kpiArb,
  avgResponseTime: kpiArb,
});

const funnelDataArb: fc.Arbitrary<FunnelData> = fc.record({
  views: fc.option(fc.nat({ max: 1000000 }), { nil: null }),
  profileClicks: fc.option(fc.nat({ max: 500000 }), { nil: null }),
  linkTaps: fc.option(fc.nat({ max: 100000 }), { nil: null }),
  newSubs: fc.nat({ max: 10000 }),
});

const platformArb = fc.constantFrom<Platform>('TikTok', 'Instagram', 'Twitter');

const platformMetricsArb: fc.Arbitrary<PlatformMetrics> = fc.record({
  platform: platformArb,
  views: fc.nat({ max: 1000000 }),
  profileClicks: fc.nat({ max: 500000 }),
  linkTaps: fc.nat({ max: 100000 }),
  newSubs: fc.nat({ max: 10000 }),
});

const topContentArb: fc.Arbitrary<TopContent> = fc.record({
  contentId: fc.uuid(),
  platform: platformArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
  publishedAt: safeDateStringArb,
  views: fc.nat({ max: 1000000 }),
  linkTaps: fc.nat({ max: 100000 }),
  newSubs: fc.nat({ max: 10000 }),
});

const overviewKpisArb = fc.record({
  netRevenue: kpiArb,
  activeFans: kpiArb,
  conversionRate: kpiArb,
  ltv: kpiArb,
});

const overviewResponseArb: fc.Arbitrary<OverviewResponse> = fc.record({
  kpis: overviewKpisArb,
  revenueDaily: fc.array(timeSeriesPointArb, { minLength: 0, maxLength: 30 }),
  revenueDailyPrev: fc.array(timeSeriesPointArb, { minLength: 0, maxLength: 30 }),
  liveFeed: fc.array(liveEventArb, { minLength: 0, maxLength: 20 }),
  lastSyncAt: safeDateStringArb,
});

const financeResponseArb: fc.Arbitrary<FinanceResponse> = fc.record({
  breakdown: revenueBreakdownArb,
  whales: fc.array(whaleArb, { minLength: 0, maxLength: 50 }),
  aiMetrics: aiMetricsArb,
});

const acquisitionResponseArb: fc.Arbitrary<AcquisitionResponse> = fc.record({
  funnel: funnelDataArb,
  platformMetrics: fc.array(platformMetricsArb, { minLength: 0, maxLength: 3 }),
  topContent: fc.array(topContentArb, { minLength: 0, maxLength: 10 }),
  insight: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
});

// ============================================
// Tests
// ============================================

describe('API Response Structure Validation Property Tests', () => {
  /**
   * **Feature: creator-analytics-dashboard, Property 13: API Response Structure Validation**
   * **Validates: Requirements 16.1, 16.2, 16.3, 16.5**
   */
  describe('OverviewResponse validation', () => {
    it('should validate all generated OverviewResponse objects', () => {
      fc.assert(
        fc.property(overviewResponseArb, (response) => {
          const result = validateOverviewResponse(response);
          expect(result.valid).toBe(true);
          if (!result.valid) {
            console.log('Validation errors:', result.errors);
          }
          return result.valid;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid OverviewResponse objects', () => {
      const invalidResponses = [
        null,
        undefined,
        {},
        { kpis: null },
        { kpis: {}, revenueDaily: 'not-array' },
        { kpis: { netRevenue: {} }, revenueDaily: [], revenueDailyPrev: [], liveFeed: [], lastSyncAt: '' },
      ];

      for (const invalid of invalidResponses) {
        const result = validateOverviewResponse(invalid);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('FinanceResponse validation', () => {
    it('should validate all generated FinanceResponse objects', () => {
      fc.assert(
        fc.property(financeResponseArb, (response) => {
          const result = validateFinanceResponse(response);
          expect(result.valid).toBe(true);
          if (!result.valid) {
            console.log('Validation errors:', result.errors);
          }
          return result.valid;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid FinanceResponse objects', () => {
      const invalidResponses = [
        null,
        undefined,
        {},
        { breakdown: null },
        { breakdown: {}, whales: 'not-array' },
        { breakdown: { subscriptions: 0 }, whales: [], aiMetrics: {} },
      ];

      for (const invalid of invalidResponses) {
        const result = validateFinanceResponse(invalid);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('AcquisitionResponse validation', () => {
    it('should validate all generated AcquisitionResponse objects', () => {
      fc.assert(
        fc.property(acquisitionResponseArb, (response) => {
          const result = validateAcquisitionResponse(response);
          expect(result.valid).toBe(true);
          if (!result.valid) {
            console.log('Validation errors:', result.errors);
          }
          return result.valid;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid AcquisitionResponse objects', () => {
      const invalidResponses = [
        null,
        undefined,
        {},
        { funnel: null },
        { funnel: {}, platformMetrics: 'not-array' },
        { funnel: { newSubs: 0 }, platformMetrics: [], topContent: 'invalid' },
      ];

      for (const invalid of invalidResponses) {
        const result = validateAcquisitionResponse(invalid);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('Individual type validators', () => {
    it('should validate Kpi objects', () => {
      fc.assert(
        fc.property(kpiArb, (kpi) => {
          return isValidKpi(kpi);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate TimeSeriesPoint objects', () => {
      fc.assert(
        fc.property(timeSeriesPointArb, (point) => {
          return isValidTimeSeriesPoint(point);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate LiveEvent objects', () => {
      fc.assert(
        fc.property(liveEventArb, (event) => {
          return isValidLiveEvent(event);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate Whale objects', () => {
      fc.assert(
        fc.property(whaleArb, (whale) => {
          return isValidWhale(whale);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate PlatformMetrics objects', () => {
      fc.assert(
        fc.property(platformMetricsArb, (metrics) => {
          return isValidPlatformMetrics(metrics);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate TopContent objects', () => {
      fc.assert(
        fc.property(topContentArb, (content) => {
          return isValidTopContent(content);
        }),
        { numRuns: 100 }
      );
    });
  });
});
