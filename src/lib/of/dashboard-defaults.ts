import { DashboardSnapshot, DailyAction } from './dashboard-types';

const DEFAULT_ACTIONS: DailyAction[] = [
  {
    id: 'action_vip_whale',
    fanId: 'fan_vip_001',
    fanName: 'Luna SZN',
    reason: 'Top 1% whale silent for 7 days',
    priority: 'NOW',
    expectedValue: 1240,
    lastSpent: 860,
    daysSinceLastPurchase: 7,
    suggestion: 'Send a personal voice note with a 20% VIP PPV follow-up.',
    segment: 'VIP',
    confidence: 0.86,
  },
  {
    id: 'action_ppv_followup',
    fanId: 'fan_vip_014',
    fanName: 'NeonNova',
    reason: 'Opened payday campaign but did not convert',
    priority: 'NOW',
    expectedValue: 480,
    lastSpent: 320,
    daysSinceLastPurchase: 3,
    suggestion: 'Trigger the 48h post-preview automation with a bundle add-on.',
    segment: 'High intent',
    confidence: 0.78,
  },
  {
    id: 'action_new_subscribers',
    fanId: 'fan_new_031',
    fanName: 'Harmony Heat',
    reason: 'Welcome new subscriber cohort (24h)',
    priority: 'Today',
    expectedValue: 210,
    lastSpent: 0,
    daysSinceLastPurchase: 0,
    suggestion: 'Send the Day 1 welcome sequence with AI-personalised opener.',
    segment: 'New',
    confidence: 0.74,
  },
  {
    id: 'action_ppv_preview',
    fanId: 'fan_ppv_067',
    fanName: 'GoldenDusk',
    reason: 'Viewed PPV preview but skipped unlock',
    priority: 'Today',
    expectedValue: 190,
    lastSpent: 65,
    daysSinceLastPurchase: 2,
    suggestion: 'Offer a limited-time upgrade with behind-the-scenes bundle.',
    segment: 'PPV warm',
    confidence: 0.69,
  },
  {
    id: 'action_compliance_review',
    fanId: 'fan_compliance_009',
    fanName: 'Compliance Queue',
    reason: 'AI flagged 2 outbound assets',
    priority: 'This Week',
    expectedValue: 0,
    lastSpent: 0,
    daysSinceLastPurchase: 0,
    suggestion: 'Review queued assets to release campaign sequences.',
    segment: 'Compliance',
    confidence: 0.92,
  },
];

export function calculateTotalPotential(actions: DailyAction[]) {
  return actions.filter((action) => action.expectedValue > 0).reduce((sum, action) => sum + action.expectedValue, 0);
}

export function getDefaultSnapshot(accountId: string): DashboardSnapshot {
  const generatedAt = new Date().toISOString();

  return {
    summaryCards: [
      {
        id: 'smart-reply',
        title: 'Smart reply engine',
        status: 'active',
        description:
          '94% of incoming messages are resolved automatically with creator-specific tone profiles.',
        bullets: [
          '38 conversations live in the last hour',
          '12 escalations waiting for human review',
          'GPT-4o + Claude ensemble for VIP tiers',
        ],
      },
      {
        id: 'campaign-automation',
        title: 'Campaign automation',
        status: 'active',
        description: 'Segment drops, dynamic pricing tiers, and multi-day sequences across PPV and DMs.',
        bullets: [
          'Payday push running for 1,987 active fans',
          'A/B pricing test winner at $39.99 (+18%)',
          'Auto-sync segments from analytics cohorts',
        ],
      },
      {
        id: 'compliance-guardrails',
        title: 'Compliance guardrails',
        status: 'idle',
        description: 'Every asset and outbound message runs through AI policy checks before delivery.',
        bullets: [
          '2 assets awaiting manual unlock',
          '100% sessions proxied via Bright Data',
          'Captcha & 2FA handled via secure workers',
        ],
      },
    ],
    actionList: {
      currency: 'USD',
      totalPotential: calculateTotalPotential(DEFAULT_ACTIONS),
      items: [...DEFAULT_ACTIONS],
    },
    signalFeed: [
      {
        id: 'evt_payday_push',
        type: 'CampaignPerformance',
        headline: 'Payday push conversion up +18%',
        payload: {
          campaign: 'Payday push',
          uplift: 0.18,
          sampleSize: 1987,
        },
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        severity: 'success',
      },
      {
        id: 'evt_vip_automation',
        type: 'AutomationFired',
        headline: 'VIP fallbacks rerouted to human desk',
        payload: {
          escalations: 4,
          etaMinutes: 12,
        },
        createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        severity: 'warning',
      },
      {
        id: 'evt_guardrail',
        type: 'ComplianceAlert',
        headline: 'Compliance flagged 2 new assets',
        payload: {
          queue: 'Outbound campaign assets',
          requiresReview: true,
        },
        createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        severity: 'warning',
      },
    ],
    messagingArchitecture: {
      nodes: [
        { id: 'hub', title: 'Huntaze Core', x: 50, y: 45 },
        { id: 'ai', title: 'AI Replies', x: 20, y: 22 },
        { id: 'campaign', title: 'Campaign Engine', x: 80, y: 22 },
        { id: 'compliance', title: 'Compliance Review', x: 20, y: 75 },
        { id: 'humans', title: 'Human Team', x: 80, y: 75 },
      ],
      links: [
        { from: 'hub', to: 'ai' },
        { from: 'hub', to: 'campaign' },
        { from: 'hub', to: 'compliance' },
        { from: 'hub', to: 'humans' },
        { from: 'compliance', to: 'humans' },
        { from: 'campaign', to: 'ai' },
      ],
    },
    insights: {
      title: 'Scale without breaking trust',
      description:
        'OnlyFans Assisted combines AI tone modelling, compliance guardrails, and human-in-the-loop handoffs so agencies can run thousands of conversations without risking creator accounts.',
      actionLabel: 'Configure assistant',
      actionHref: '/dashboard/onlyfans/settings',
    },
    bestTimes: {
      bestHours: [20, 21, 22],
      bestDays: ['Fri', 'Sat', 'Sun'],
    },
    metadata: {
      generatedAt,
      accountId,
      source: 'fallback',
      version: 1,
    },
  };
}

