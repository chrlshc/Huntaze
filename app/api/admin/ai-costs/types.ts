/**
 * Type definitions for Admin AI Cost Monitoring Dashboard
 */

export type AICostQueryParams = {
  startDate?: string;
  endDate?: string;
  creatorId?: string;
  feature?: string;
  format?: 'json' | 'csv';
  limit?: string;
};

export type TotalSpending = {
  costUsd: number;
  tokensInput: number;
  tokensOutput: number;
};

export type FeatureStats = {
  cost: number;
  tokens: number;
};

export type CreatorBreakdown = {
  creatorId: number;
  email: string;
  name: string | null;
  totalCost: number;
  totalTokens: number;
  byFeature: Record<string, FeatureStats>;
  byAgent: Record<string, FeatureStats>;
};

export type Anomaly = {
  type: 'high_spending' | 'feature_concentration';
  creatorId: number;
  email: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
};

// Success response type
export type AICostSuccessResponse = {
  success: true;
  data: {
    totalSpending: TotalSpending;
    perCreatorBreakdown: CreatorBreakdown[];
    highCostCreators: CreatorBreakdown[];
    anomalies: Anomaly[];
  };
  metadata: {
    period: {
      start: string;
      end: string;
    };
    filters: {
      creatorId: string;
      feature: string;
    };
    recordCount: number;
  };
  duration: number;
};

// Error response type
export type AICostErrorResponse = {
  success: false;
  error: string;
  code: string;
  correlationId: string;
  retryable?: boolean;
};

// Union type for API responses
export type AICostResponse = AICostSuccessResponse | AICostErrorResponse;
