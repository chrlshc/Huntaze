import type { LinkDef, NodeDef } from '@/components/hz/ConnectorGraph';

export type ActionPriority = 'NOW' | 'Today' | 'This Week';

export interface DailyAction {
  id: string;
  fanId: string;
  fanName: string;
  reason: string;
  priority: ActionPriority;
  expectedValue: number;
  lastSpent: number;
  daysSinceLastPurchase: number;
  suggestion: string;
  segment?: string;
  confidence?: number;
}

export interface DashboardSummaryCard {
  id: string;
  title: string;
  status: 'active' | 'idle' | 'error';
  description: string;
  bullets: string[];
}

export interface DashboardActionList {
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  totalPotential: number;
  items: DailyAction[];
}

export interface DashboardSignalFeedItem {
  id: string;
  type: string;
  headline: string;
  payload: Record<string, unknown>;
  createdAt: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
}

export interface DashboardMessagingArchitecture {
  nodes: NodeDef[];
  links: LinkDef[];
}

export interface DashboardInsights {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export interface DashboardBestTimes {
  bestHours: number[];
  bestDays: string[];
}

export interface DashboardMetadata {
  generatedAt: string;
  accountId: string;
  source: 'fallback' | 'upstream' | 'ingest';
  version: number;
}

export interface DashboardSnapshot {
  summaryCards: DashboardSummaryCard[];
  actionList: DashboardActionList;
  signalFeed: DashboardSignalFeedItem[];
  messagingArchitecture: DashboardMessagingArchitecture;
  insights: DashboardInsights;
  bestTimes: DashboardBestTimes;
  metadata: DashboardMetadata;
}

export type DashboardStreamEvent =
  | { type: 'snapshot'; payload: DashboardSnapshot }
  | { type: 'summary'; payload: DashboardSummaryCard[] }
  | { type: 'actionList'; payload: DashboardActionList }
  | { type: 'signals'; payload: DashboardSignalFeedItem[] }
  | { type: 'insights'; payload: DashboardInsights }
  | { type: 'bestTimes'; payload: DashboardBestTimes };

