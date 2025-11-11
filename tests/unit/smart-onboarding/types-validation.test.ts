import { describe, test, expect, expectTypeOf } from 'vitest';
import type {
  AnalyticsDashboard,
  InteractionEvent,
  InteractionPattern,
  OnboardingJourney,
  MetricPoint,
  RealTimeMetrics,
  EngagementTrend,
  ProgressSummary,
  Alert,
  Adaptation
} from '@/lib/smart-onboarding/types';

describe('Smart Onboarding Types - Core Validation', () => {
  test('AnalyticsDashboard has correct structure', () => {
    const dashboard: AnalyticsDashboard = {
      realTimeMetrics: {
        activeUsers: 10,
        averageEngagement: 0.85,
        completionRate: 0.75,
        interventionRate: 0.15
      },
      engagementTrends: {
        trend: 'increasing',
        changeRate: 0.05,
        predictions: [],
        anomalies: []
      },
      progressSummary: {
        totalUsers: 100,
        completedJourneys: 75,
        averageCompletionTime: 1800,
        topStruggles: ['step-3', 'step-7']
      },
      alerts: []
    };

    expect(dashboard.realTimeMetrics.activeUsers).toBeGreaterThanOrEqual(0);
    expectTypeOf(dashboard.realTimeMetrics.activeUsers).toBeNumber();
  });

  test('InteractionEvent has required properties', () => {
    const event: InteractionEvent = {
      id: 'evt-1',
      userId: 'user-1',
      sessionId: 'sess-1',
      stepId: 'step-1',
      timestamp: new Date(),
      eventType: 'click',
      interactionData: {
        mouseMovements: [],
        clickPatterns: [],
        timeSpent: 100,
        scrollBehavior: {
          direction: 'down',
          distance: 500,
          velocity: 10,
          pauseDuration: 0,
          timestamp: Date.now()
        },
        hesitationIndicators: []
      },
      engagementScore: 0.8,
      contextualData: {
        currentUrl: '/onboarding/step-1',
        userAgent: 'test',
        screenResolution: { width: 1920, height: 1080 },
        viewportSize: { width: 1920, height: 1080 },
        deviceType: 'desktop',
        browserInfo: {
          name: 'Chrome',
          version: '120',
          language: 'en',
          timezone: 'UTC'
        }
      }
    };

    expectTypeOf(event.eventType).toMatchTypeOf<'click' | 'scroll' | 'hover' | 'focus' | 'blur' | 'keypress' | 'mouse_movement' | 'hesitation' | 'backtrack' | 'error' | 'help_request'>();
    expect(event.userId).toBe('user-1');
  });

  test('InteractionPattern type validation', () => {
    const pattern: InteractionPattern = {
      type: 'click_pattern',
      frequency: 5,
      confidence: 0.9,
      indicators: ['rapid-clicks', 'target-precision'],
      timeWindow: { start: new Date(), end: new Date() },
      significance: 'high'
    };

    expectTypeOf(pattern.type).toMatchTypeOf<'click_pattern' | 'scroll_pattern' | 'navigation_pattern' | 'hesitation_pattern' | 'engagement_pattern'>();
    expect(pattern.confidence).toBeGreaterThan(0);
  });

  test('OnboardingJourney structure', () => {
    const journey: Partial<OnboardingJourney> = {
      id: 'journey-1',
      userId: 'user-1',
      currentStep: {
        id: 'step-1',
        type: 'introduction',
        title: 'Welcome',
        description: 'Get started',
        content: {},
        estimatedDuration: 300,
        prerequisites: [],
        learningObjectives: [],
        adaptationRules: [],
        completionCriteria: {
          type: 'time_based',
          threshold: 60,
          conditions: []
        }
      },
      completedSteps: [],
      interventions: [],
      adaptationHistory: [],
      status: 'active'
    };

    expect(journey.status).toBe('active');
    expectTypeOf(journey.status).toMatchTypeOf<'active' | 'paused' | 'completed' | 'abandoned' | undefined>();
  });

  test('Performance types validation', () => {
    const metricPoint: MetricPoint = { ts: Date.now(), value: 0.85 };
    const realTimeMetrics: RealTimeMetrics = {
      activeUsers: 50,
      avgLatencyMs: 120,
      errorRate: 0.01
    };
    const trend: EngagementTrend = {
      name: 'daily-engagement',
      series: [metricPoint]
    };
    const summary: ProgressSummary = {
      completed: 10,
      inProgress: 5,
      blocked: 1
    };
    const alert: Alert = {
      code: 'HIGH_LATENCY',
      level: 'warn',
      message: 'Latency above threshold',
      ts: Date.now()
    };

    expect(realTimeMetrics.errorRate).toBeLessThanOrEqual(1);
    expect(alert.level).toMatch(/^(info|warn|error)$/);
    expectTypeOf(trend.series).toBeArray();
  });

  test('Adaptation type validation', () => {
    const adaptation: Adaptation = {
      ruleId: 'rule-1',
      reason: 'User struggling',
      ts: Date.now(),
      delta: { difficulty: -1 }
    };

    expectTypeOf(adaptation.delta).toMatchTypeOf<Record<string, unknown> | undefined>();
    expect(adaptation.ts).toBeGreaterThan(0);
  });
});
