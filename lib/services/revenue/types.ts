/**
 * Revenue Optimization - Shared TypeScript Types
 * 
 * Core data models for revenue optimization features
 */

// ============================================================================
// Pricing Types
// ============================================================================

export interface PricingRecommendation {
  subscription: {
    current: number;
    recommended: number;
    revenueImpact: number; // percentage
    reasoning: string;
    confidence: number; // 0-1
  };
  ppv: PPVPricingRecommendation[];
  metadata: {
    lastUpdated: string;
    dataPoints: number;
  };
}

export interface PPVPricingRecommendation {
  contentId: string;
  contentType: 'photo' | 'video' | 'bundle';
  recommendedRange: { min: number; max: number };
  expectedRevenue: { min: number; max: number };
}

export interface ApplyPricingRequest {
  creatorId: string;
  priceType: 'subscription' | 'ppv';
  contentId?: string;
  newPrice: number;
}

// ============================================================================
// Churn Risk Types
// ============================================================================

export interface ChurnRiskResponse {
  summary: {
    totalAtRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  fans: ChurnRiskFan[];
  metadata: {
    lastCalculated: string;
    modelVersion: string;
  };
}

export interface ChurnRiskFan {
  id: string;
  name: string;
  avatar?: string;
  churnProbability: number; // 0-1
  daysSinceLastActivity: number;
  riskLevel: 'high' | 'medium' | 'low';
  lifetimeValue: number;
  lastMessage?: string;
}

export interface EngagementDataPoint {
  date: Date;
  messageCount: number;
  purchaseAmount: number;
  engagementScore: number;
}

export interface ReEngageRequest {
  creatorId: string;
  fanId: string;
  messageTemplate?: string;
}

// ============================================================================
// Upsell Types
// ============================================================================

export interface UpsellOpportunitiesResponse {
  opportunities: UpsellOpportunity[];
  stats: {
    totalOpportunities: number;
    expectedRevenue: number;
    averageBuyRate: number;
  };
  metadata: {
    lastUpdated: string;
  };
}

export interface UpsellOpportunity {
  id: string;
  fanId: string;
  fanName: string;
  triggerPurchase: {
    item: string;
    amount: number;
    date: Date;
  };
  suggestedProduct: {
    name: string;
    price: number;
    description: string;
  };
  buyRate: number; // 0-1
  expectedRevenue: number;
  confidence: number;
  messagePreview: string;
}

export interface SendUpsellRequest {
  creatorId: string;
  opportunityId: string;
  customMessage?: string;
}

export interface AutomationSettings {
  enabled: boolean;
  autoSendThreshold: number; // confidence threshold
  maxDailyUpsells: number;
  excludedFans: string[];
  customRules: UpsellRule[];
}

export interface UpsellRule {
  id: string;
  name: string;
  condition: string;
  action: string;
}

// ============================================================================
// Revenue Forecast Types
// ============================================================================

export interface RevenueForecastResponse {
  historical: RevenueDataPoint[];
  forecast: ForecastDataPoint[];
  currentMonth: MonthForecast;
  nextMonth: MonthForecast;
  recommendations: GoalRecommendation[];
  metadata: {
    modelAccuracy: number;
    lastUpdated: string;
  };
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  growth: number; // percentage
}

export interface ForecastDataPoint {
  month: string;
  predicted: number;
  confidence: { min: number; max: number };
}

export interface MonthForecast {
  projected: number;
  actual: number;
  completion: number; // percentage
  onTrack: boolean;
}

export interface GoalRecommendation {
  action: string;
  impact: number; // revenue impact
  effort: 'low' | 'medium' | 'high';
  description: string;
}

// ============================================================================
// Payout Types
// ============================================================================

export interface PayoutScheduleResponse {
  payouts: Payout[];
  summary: {
    totalExpected: number;
    taxEstimate: number;
    netIncome: number;
  };
  platforms: PlatformConnection[];
}

export interface Payout {
  id: string;
  platform: 'onlyfans' | 'fansly' | 'patreon';
  amount: number;
  date: Date;
  status: 'pending' | 'processing' | 'completed';
  period: { start: Date; end: Date };
}

export interface PlatformConnection {
  platform: string;
  connected: boolean;
  lastSync: string;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface RevenueMetrics {
  arpu: number;
  ltv: number;
  churnRate: number;
  activeSubscribers: number;
  totalRevenue: number;
  momGrowth: number;
}

export interface MetricTrends {
  arpu: TrendDirection;
  ltv: TrendDirection;
  churnRate: TrendDirection;
  activeSubscribers: TrendDirection;
  totalRevenue: TrendDirection;
}

export type TrendDirection = 'up' | 'down' | 'stable';

// ============================================================================
// Error Types
// ============================================================================

export enum RevenueErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

export interface RevenueError {
  type: RevenueErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  correlationId?: string;
}
