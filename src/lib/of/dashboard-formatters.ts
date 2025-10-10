import { DashboardSnapshot, DashboardActionList, DailyAction } from './dashboard-types';
import type {
  DashboardActionListDTO,
  DashboardActionListItemDTO,
  OnlyFansDashboardPayload,
} from './dashboard-public-types';

const PRIORITY_WEIGHT: Record<DailyAction['priority'], number> = {
  NOW: 0,
  Today: 1,
  'This Week': 2,
};

export function formatCurrency(value: number, currency: DashboardActionList['currency']) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function toDashboardActionItem(
  action: DailyAction,
  currency: DashboardActionList['currency'],
): DashboardActionListItemDTO {
  const valueLabel =
    action.expectedValue > 0 ? `${formatCurrency(action.expectedValue, currency)} potential` : 'Review required';

  const detailParts = [
    action.suggestion,
    `Last spent ${formatCurrency(action.lastSpent, currency)}`,
    `${action.daysSinceLastPurchase} days since purchase`,
  ];

  return {
    id: action.id,
    title: action.reason,
    detail: detailParts.filter(Boolean).join(' • '),
    valueLabel,
    priority: action.priority,
  };
}

export function toDashboardActionListDTO(actionList: DashboardActionList): DashboardActionListDTO {
  const dedupedMap = new Map<string, DailyAction>();
  for (const action of actionList.items) {
    dedupedMap.set(action.id, action);
  }

  const sorted = Array.from(dedupedMap.values()).sort((a, b) => {
    const weight = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (weight !== 0) return weight;
    return b.expectedValue - a.expectedValue;
  });

  return {
    totalPotential:
      actionList.totalPotential ||
      sorted.filter((item) => item.expectedValue > 0).reduce((sum, item) => sum + item.expectedValue, 0),
    currency: actionList.currency,
    items: sorted.map((action) => toDashboardActionItem(action, actionList.currency)),
  };
}

export function toDashboardPayload(snapshot: DashboardSnapshot): OnlyFansDashboardPayload {
  return {
    summaryCards: snapshot.summaryCards.map((card) => ({
      id: card.id,
      title: card.title,
      status: card.status,
      description: card.description,
      bullets: [...card.bullets],
    })),
    actionList: toDashboardActionListDTO(snapshot.actionList),
    signalFeed: [...snapshot.signalFeed].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    messagingArchitecture: {
      nodes: snapshot.messagingArchitecture.nodes.map((node) => ({ ...node })),
      links: snapshot.messagingArchitecture.links.map((link) => ({ ...link })),
    },
    insights: { ...snapshot.insights },
    metadata: { ...snapshot.metadata },
  };
}

