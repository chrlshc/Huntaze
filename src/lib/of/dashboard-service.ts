import type { LinkDef, NodeDef } from '@/components/hz/ConnectorGraph';

import {
  DashboardSnapshot,
  DashboardStreamEvent,
  DashboardActionList,
  DashboardSignalFeedItem,
  DashboardSummaryCard,
  DashboardInsights,
  DashboardMessagingArchitecture,
  DashboardBestTimes,
  DailyAction,
} from './dashboard-types';
import { getDefaultSnapshot, calculateTotalPotential } from './dashboard-defaults';

type SnapshotSource = DashboardSnapshot['metadata']['source'];

const snapshots = new Map<string, DashboardSnapshot>();
const listeners = new Map<string, Set<(event: DashboardStreamEvent) => void>>();

const MAX_SIGNAL_FEED = 50;

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function withMetadata(
  snapshot: DashboardSnapshot,
  accountId: string,
  source: SnapshotSource,
): DashboardSnapshot {
  return {
    ...snapshot,
    metadata: {
      generatedAt: new Date().toISOString(),
      accountId,
      source,
      version: snapshot.metadata?.version ? snapshot.metadata.version + 1 : 1,
    },
  };
}

function broadcast(accountId: string, event: DashboardStreamEvent) {
  const listenersForAccount = listeners.get(accountId);
  if (!listenersForAccount?.size) return;
  const payload = clone(event.payload);
  for (const listener of listenersForAccount) {
    try {
      listener({ ...event, payload });
    } catch (error) {
      console.error('onlyfans.dashboard.broadcast.error', error);
    }
  }
}

async function fetchUpstreamSnapshot(accountId: string): Promise<DashboardSnapshot | null> {
  const base =
    process.env.ONLYFANS_DASHBOARD_API_URL ||
    process.env.HUNTAZE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;

  const upstreamPath = process.env.ONLYFANS_DASHBOARD_PATH || '/onlyfans/dashboard/snapshot';
  let url: URL;
  try {
    url = new URL(upstreamPath, base);
    url.searchParams.set('accountId', accountId);
  } catch (error) {
    console.warn('onlyfans.dashboard.upstream.invalid_url', error);
    return null;
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const authToken =
    process.env.ONLYFANS_DASHBOARD_TOKEN ||
    process.env.HUNTAZE_SERVICE_TOKEN ||
    process.env.HUNTAZE_API_TOKEN;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  } else if (process.env.ONLYFANS_DASHBOARD_API_KEY) {
    headers['x-api-key'] = process.env.ONLYFANS_DASHBOARD_API_KEY;
  }

  try {
    const response = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn('onlyfans.dashboard.upstream.non_ok', {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = await response.json().catch(() => null);
    if (!data) return null;

    const normalized = normalizeSnapshot(data, accountId);
    return normalized ? withMetadata(normalized, accountId, 'upstream') : null;
  } catch (error) {
    console.warn('onlyfans.dashboard.upstream.fetch_failed', error);
    return null;
  }
}

function normalizeSnapshot(candidate: any, accountId: string): DashboardSnapshot | null {
  if (!candidate || typeof candidate !== 'object') return null;

  if (isDashboardSnapshot(candidate)) {
    const snapshot: DashboardSnapshot = clone(candidate);
    snapshot.metadata = {
      generatedAt: new Date().toISOString(),
      accountId,
      source: 'upstream',
      version: candidate.metadata?.version ?? 1,
    };
    return snapshot;
  }

  if (looksLikePublicPayload(candidate)) {
    const actionItems = (candidate.actionList?.items ?? []).map((item: any, index: number): DailyAction => ({
      id: item.id ?? `action_${index}`,
      fanId: item.fanId ?? item.id ?? `fan_${index}`,
      fanName: item.fanName ?? item.title ?? 'Fan',
      reason: item.title ?? item.reason ?? 'Action required',
      priority: ['NOW', 'Today', 'This Week'].includes(item.priority)
        ? (item.priority as DailyAction['priority'])
        : 'Today',
      expectedValue:
        typeof item.expectedValue === 'number'
          ? item.expectedValue
          : parseExpectedValue(item.valueLabel),
      lastSpent: typeof item.lastSpent === 'number' ? item.lastSpent : 0,
      daysSinceLastPurchase:
        typeof item.daysSinceLastPurchase === 'number' ? item.daysSinceLastPurchase : 0,
      suggestion: item.detail ?? item.suggestion ?? '',
      segment: item.segment,
      confidence: typeof item.confidence === 'number' ? item.confidence : undefined,
    }));

    const snapshot: DashboardSnapshot = {
      summaryCards: (candidate.summaryCards ?? []).map((card: any, index: number) => ({
        id: card.id ?? `summary_${index}`,
        title: card.title ?? 'Untitled',
        status: ['active', 'idle', 'error'].includes(card.status)
          ? (card.status as DashboardSummaryCard['status'])
          : 'active',
        description: card.description ?? '',
        bullets: Array.isArray(card.bullets) ? card.bullets : [],
      })),
      actionList: {
        currency: candidate.actionList?.currency ?? 'USD',
        totalPotential:
          candidate.actionList?.totalPotential ??
          calculateTotalPotential(actionItems),
        items: actionItems,
      },
      signalFeed: Array.isArray(candidate.signalFeed)
        ? candidate.signalFeed
            .filter((item: any) => item && item.id && item.createdAt)
            .map((item: any) => ({
              id: item.id,
              type: item.type ?? 'Signal',
              headline: item.headline ?? 'Update',
              payload: item.payload ?? {},
              createdAt: item.createdAt,
              severity: item.severity ?? 'info',
            }))
        : [],
      messagingArchitecture: {
        nodes: Array.isArray(candidate.messagingArchitecture?.nodes)
          ? candidate.messagingArchitecture.nodes
          : [],
        links: Array.isArray(candidate.messagingArchitecture?.links)
          ? candidate.messagingArchitecture.links
          : [],
      },
      insights: candidate.insights ?? {
        title: 'Scale without breaking trust',
        description: '',
        actionLabel: 'Open settings',
        actionHref: '/dashboard/onlyfans/settings',
      },
      bestTimes: candidate.bestTimes ?? {
        bestHours: [20, 21, 22],
        bestDays: ['Fri', 'Sat', 'Sun'],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        accountId,
        source: 'upstream',
        version: 1,
      },
    };

    if (!snapshot.messagingArchitecture.nodes.length) {
      snapshot.messagingArchitecture = getDefaultSnapshot(accountId).messagingArchitecture;
    }

    if (!snapshot.summaryCards.length) {
      snapshot.summaryCards = getDefaultSnapshot(accountId).summaryCards;
    }

    return snapshot;
  }

  return null;
}

function looksLikePublicPayload(candidate: any): boolean {
  return (
    candidate &&
    typeof candidate === 'object' &&
    Array.isArray(candidate.summaryCards) &&
    candidate.actionList &&
    Array.isArray(candidate.actionList.items)
  );
}

function isDashboardSnapshot(candidate: any): candidate is DashboardSnapshot {
  return (
    candidate &&
    Array.isArray(candidate.summaryCards) &&
    candidate.actionList &&
    Array.isArray(candidate.actionList.items) &&
    Array.isArray(candidate.signalFeed) &&
    candidate.metadata
  );
}

function parseExpectedValue(label: string | undefined): number {
  if (!label || typeof label !== 'string') return 0;
  const match = label.replace(/[, ]/g, '').match(/([\d.]+)/);
  if (!match) return 0;
  return Number.parseFloat(match[1] ?? '0') || 0;
}

export async function getDashboardSnapshot(
  accountId: string,
  options: { refresh?: boolean } = {},
): Promise<DashboardSnapshot> {
  if (options.refresh) {
    const refreshed = await fetchUpstreamSnapshot(accountId);
    if (refreshed) {
      snapshots.set(accountId, refreshed);
      broadcast(accountId, { type: 'snapshot', payload: refreshed });
      return clone(refreshed);
    }
  }

  let snapshot = snapshots.get(accountId);
  if (!snapshot) {
    snapshot = (await fetchUpstreamSnapshot(accountId)) ?? getDefaultSnapshot(accountId);
    snapshots.set(accountId, snapshot);
  }

  return clone(snapshot);
}

export function subscribeToDashboard(
  accountId: string,
  handler: (event: DashboardStreamEvent) => void,
): () => void {
  const listenersForAccount = listeners.get(accountId) ?? new Set();
  listenersForAccount.add(handler);
  listeners.set(accountId, listenersForAccount);

  return () => {
    const setForAccount = listeners.get(accountId);
    if (!setForAccount) return;
    setForAccount.delete(handler);
    if (!setForAccount.size) listeners.delete(accountId);
  };
}

function updateSnapshot(
  accountId: string,
  updater: (snapshot: DashboardSnapshot) => DashboardSnapshot,
  source?: SnapshotSource,
) {
  const current = snapshots.get(accountId) ?? getDefaultSnapshot(accountId);
  const updated = withMetadata(updater(current), accountId, source ?? current.metadata.source);
  snapshots.set(accountId, updated);
  return updated;
}

export function replaceSummaryCards(accountId: string, cards: DashboardSummaryCard[]) {
  const updated = updateSnapshot(
    accountId,
    (snapshot) => ({
      ...snapshot,
      summaryCards: cards,
    }),
    'ingest',
  );
  broadcast(accountId, { type: 'summary', payload: updated.summaryCards });
  return clone(updated);
}

export function setInsights(accountId: string, insights: DashboardInsights) {
  const updated = updateSnapshot(
    accountId,
    (snapshot) => ({
      ...snapshot,
      insights,
    }),
    'ingest',
  );
  broadcast(accountId, { type: 'insights', payload: updated.insights });
  return clone(updated);
}

export function setMessagingArchitecture(accountId: string, architecture: DashboardMessagingArchitecture) {
  const updated = updateSnapshot(
    accountId,
    (snapshot) => ({
      ...snapshot,
      messagingArchitecture: architecture,
    }),
    'ingest',
  );
  // Messaging graph updates are considered part of snapshot – emit full snapshot for now
  broadcast(accountId, { type: 'snapshot', payload: updated });
  return clone(updated);
}

export function setBestTimes(accountId: string, bestTimes: DashboardBestTimes) {
  const updated = updateSnapshot(
    accountId,
    (snapshot) => ({
      ...snapshot,
      bestTimes,
    }),
    'ingest',
  );
  broadcast(accountId, { type: 'bestTimes', payload: updated.bestTimes });
  return clone(updated);
}

export function upsertDailyActions(accountId: string, actions: DailyAction[], currency?: DashboardActionList['currency']) {
  const updated = updateSnapshot(
    accountId,
    (snapshot) => {
      const map = new Map(snapshot.actionList.items.map((item) => [item.id, item]));
      for (const action of actions) {
        map.set(action.id, action);
      }
      const items = Array.from(map.values());

      return {
        ...snapshot,
        actionList: {
          currency: currency ?? snapshot.actionList.currency,
          items,
          totalPotential: calculateTotalPotential(items),
        },
      };
    },
    'ingest',
  );

  broadcast(accountId, { type: 'actionList', payload: updated.actionList });
  return clone(updated);
}

export function replaceActionList(accountId: string, actionList: DashboardActionList) {
  const updated = updateSnapshot(
    accountId,
    (snapshot) => ({
      ...snapshot,
      actionList: {
        currency: actionList.currency,
        items: actionList.items,
        totalPotential: actionList.totalPotential ?? calculateTotalPotential(actionList.items),
      },
    }),
    'ingest',
  );

  broadcast(accountId, { type: 'actionList', payload: updated.actionList });
  return clone(updated);
}

export function appendSignals(
  accountId: string,
  signals: DashboardSignalFeedItem[],
  { replace = false }: { replace?: boolean } = {},
) {
  const updated = updateSnapshot(
    accountId,
    (snapshot) => {
      const existing = replace ? [] : snapshot.signalFeed;
      const combined = [...signals, ...existing];
      const deduped = new Map<string, DashboardSignalFeedItem>();
      for (const signal of combined) {
        deduped.set(signal.id, signal);
      }
      const ordered = Array.from(deduped.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return {
        ...snapshot,
        signalFeed: ordered.slice(0, MAX_SIGNAL_FEED),
      };
    },
    'ingest',
  );

  broadcast(accountId, { type: 'signals', payload: updated.signalFeed });
  return clone(updated);
}

export function resetDashboard(accountId: string) {
  const snapshot = getDefaultSnapshot(accountId);
  snapshots.set(accountId, snapshot);
  broadcast(accountId, { type: 'snapshot', payload: snapshot });
  return clone(snapshot);
}

export function getKnownAccounts(): string[] {
  return Array.from(snapshots.keys());
}

export function invalidateCache(accountId: string) {
  snapshots.delete(accountId);
}

export function getSnapshotDirect(accountId: string): DashboardSnapshot | undefined {
  return snapshots.get(accountId);
}
