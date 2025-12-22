/**
 * Creator Analytics Dashboard Types
 * 
 * Types TypeScript pour le dashboard analytics créateurs.
 * Feature: creator-analytics-dashboard
 */

// ============================================
// KPI Types
// ============================================

export interface Kpi {
  value: number;
  deltaPct: number;
  label: string;
  tooltip: string;
}

export interface OverviewKpis {
  netRevenue: Kpi;
  activeFans: Kpi;
  conversionRate: Kpi;
  ltv: Kpi;
}

// ============================================
// Retention KPIs (P0 Creator-specific)
// ============================================

export interface RetentionKpis {
  rebillRate: Kpi;           // % subscriptions renewed at expiry
  netNewSubs: Kpi;           // New subs - Churned subs
  avgTenure: Kpi;            // Average subscriber tenure in days
  churnedSubs: number;       // Absolute number of churned subs
  newSubs: number;           // Absolute number of new subs
}

// ============================================
// Expansion Revenue KPIs (P0 Creator-specific)
// ============================================

export interface ExpansionKpis {
  arppu: Kpi;                // Average Revenue Per Paying User
  ppvAttachRate: Kpi;        // % active fans who bought PPV
  tipConversionRate: Kpi;    // % active fans who tipped
  payersRatio: Kpi;          // % fans with at least 1 transaction beyond sub
}

// ============================================
// Risk/Payment KPIs (P0)
// ============================================

export interface RiskKpis {
  chargebackRate: Kpi;       // # disputed / # transactions
  chargebackAmount: number;  // Total disputed amount
  refundAmount: number;      // Total refunded amount
  netRevenueImpact: number;  // Gross - chargebacks - refunds
}

// ============================================
// Messaging KPIs (P0 if monetizing via DM/PPV)
// ============================================

export interface MessagingKpis {
  broadcastOpenRate: Kpi;    // % opened mass messages
  unlockRate: Kpi;           // PPV purchases / recipients
  revenuePerBroadcast: Kpi;  // Avg revenue per broadcast message
  replyRate: Kpi;            // Conversations with reply / total
  medianResponseTime: Kpi;   // Median response time in minutes
}

// ============================================
// Time Series
// ============================================

export interface TimeSeriesPoint {
  date: string; // ISO date YYYY-MM-DD
  value: number;
}

// ============================================
// Live Events
// ============================================

export type EventType = 'NEW_SUB' | 'AI_MESSAGE' | 'TIP' | 'PPV_PURCHASE' | 'CUSTOM_ORDER';

export interface LiveEvent {
  id: string;
  timestamp: string; // ISO datetime
  type: EventType;
  amount?: number;
  source?: 'Instagram' | 'TikTok' | 'Twitter' | 'OnlyFans';
  fanHandle?: string;
}

// ============================================
// Revenue Breakdown
// ============================================

export interface RevenueBreakdown {
  subscriptions: number;
  ppv: number;
  tips: number;
  customs: number;
  total: number;
  // Attach rates for expansion revenue
  ppvAttachRate?: number;    // % fans who bought PPV
  tipAttachRate?: number;    // % fans who tipped
  customsAttachRate?: number; // % fans who ordered customs
}

// ============================================
// Whale (Top Spender)
// ============================================

export interface Whale {
  fanId: string;
  name: string;
  totalSpent: number;
  lastPurchaseAt: string; // ISO datetime
  isOnline: boolean;
  aiPriority: 'normal' | 'high';
}

// ============================================
// AI Metrics
// ============================================

export interface AIMetrics {
  rpm: Kpi; // Revenue Per Message
  avgResponseTime: Kpi; // in seconds
}

// ============================================
// Funnel
// ============================================

export interface FunnelData {
  views: number | null;
  profileClicks: number | null;
  linkTaps: number | null;
  newSubs: number;
}

// ============================================
// Platform Metrics
// ============================================

export type Platform = 'TikTok' | 'Instagram' | 'Twitter';

export interface PlatformMetrics {
  platform: Platform;
  views: number;
  profileClicks: number;
  linkTaps: number;
  newSubs: number;
}

// ============================================
// Top Content
// ============================================

export interface TopContent {
  contentId: string;
  platform: Platform;
  title: string;
  thumbnailUrl?: string;
  publishedAt: string; // ISO datetime
  views: number;
  linkTaps: number;
  newSubs: number;
}

// ============================================
// Date Range
// ============================================

export type DateRangePreset = 'today' | '7d' | '30d' | '12m';

export type DateRange = 
  | { type: 'preset'; preset: DateRangePreset }
  | { type: 'custom'; from: string; to: string }; // ISO dates

// ============================================
// API Responses
// ============================================

export interface OverviewResponse {
  kpis: OverviewKpis;
  retention: RetentionKpis;
  revenueDaily: TimeSeriesPoint[];
  revenueDailyPrev: TimeSeriesPoint[];
  liveFeed: LiveEvent[];
  lastSyncAt: string;
}

export interface FinanceResponse {
  breakdown: RevenueBreakdown;
  expansion: ExpansionKpis;
  risk: RiskKpis;
  whales: Whale[];
  aiMetrics: AIMetrics;
  messaging?: MessagingKpis;
}

export interface AcquisitionResponse {
  funnel: FunnelData;
  platformMetrics: PlatformMetrics[];
  topContent: TopContent[];
  insight?: string;
}

// ============================================
// Component Props
// ============================================

export interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export interface RevenueChartProps {
  data: TimeSeriesPoint[];
  comparisonData?: TimeSeriesPoint[];
  mode: 'daily' | 'cumulative';
  onModeChange: (mode: 'daily' | 'cumulative') => void;
  isLoading?: boolean;
}

export interface LiveFeedProps {
  events: LiveEvent[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export interface WhaleTableProps {
  whales: Whale[];
  onTarget: (fanId: string) => void;
  onUndoTarget: (fanId: string) => void;
  sortBy: 'totalSpent' | 'lastPurchase' | 'name';
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: 'totalSpent' | 'lastPurchase' | 'name') => void;
  isLoading?: boolean;
}

export interface ConversionFunnelProps {
  funnel: FunnelData;
  isLoading?: boolean;
}

export interface PlatformBattleProps {
  platforms: PlatformMetrics[];
  metric: 'views' | 'linkTaps' | 'newSubs';
  onMetricChange: (metric: 'views' | 'linkTaps' | 'newSubs') => void;
  insight?: string;
  isLoading?: boolean;
}

export interface TopContentProps {
  content: TopContent[];
  isLoading?: boolean;
}
