import type { DashboardInsights, DashboardMessagingArchitecture, DashboardSignalFeedItem } from './dashboard-types';

export type DashboardSummaryCardDTO = {
  id: string;
  title: string;
  status: 'active' | 'idle' | 'error';
  description: string;
  bullets: string[];
};

export type DashboardActionListItemDTO = {
  id: string;
  title: string;
  detail: string;
  valueLabel: string;
  priority: 'NOW' | 'Today' | 'This Week';
};

export type DashboardActionListDTO = {
  totalPotential: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  items: DashboardActionListItemDTO[];
};

export type OnlyFansDashboardPayload = {
  summaryCards: DashboardSummaryCardDTO[];
  actionList: DashboardActionListDTO;
  signalFeed: DashboardSignalFeedItem[];
  messagingArchitecture: DashboardMessagingArchitecture;
  insights: DashboardInsights;
  metadata: {
    generatedAt: string;
    accountId: string;
    source: 'fallback' | 'upstream' | 'ingest';
    version: number;
  };
};

export type { DashboardSignalFeedItem } from './dashboard-types';
