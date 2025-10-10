'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  DashboardActionListDTO,
  DashboardActionListItemDTO,
  DashboardSummaryCardDTO,
  OnlyFansDashboardPayload,
  DashboardSignalFeedItem,
} from '@/lib/of/dashboard-public-types';

export type {
  OnlyFansDashboardPayload,
  DashboardActionListItemDTO as DashboardActionListItem,
  DashboardSummaryCardDTO as DashboardSummaryCard,
  DashboardSignalFeedItem,
} from '@/lib/of/dashboard-public-types';

interface UseOnlyFansDashboardOptions {
  accountId?: string;
  fetchOnMount?: boolean;
}

interface OnlyFansDashboardState {
  data: OnlyFansDashboardPayload | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

const DASHBOARD_ENDPOINT = '/api/onlyfans/dashboard';
const DASHBOARD_STREAM_ENDPOINT = '/api/onlyfans/dashboard/stream';
const DEFAULT_RETRY_INTERVAL = 4000;

export function useOnlyFansDashboard({
  accountId,
  fetchOnMount = true,
}: UseOnlyFansDashboardOptions = {}) {
  const [state, setState] = useState<OnlyFansDashboardState>({
    data: null,
    loading: fetchOnMount,
    refreshing: false,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback(
    (opts?: { refresh?: boolean }) => {
      if (typeof window === 'undefined') return DASHBOARD_ENDPOINT;
      const url = new URL(DASHBOARD_ENDPOINT, window.location.origin);
      if (accountId) {
        url.searchParams.set('accountId', accountId);
      }
      if (opts?.refresh) {
        url.searchParams.set('refresh', '1');
      }
      return url.toString();
    },
    [accountId],
  );

  const buildStreamUrl = useCallback(() => {
    if (typeof window === 'undefined') return DASHBOARD_STREAM_ENDPOINT;
    const url = new URL(DASHBOARD_STREAM_ENDPOINT, window.location.origin);
    if (accountId) {
      url.searchParams.set('accountId', accountId);
    }
    return url.toString();
  }, [accountId]);

  const fetchDashboard = useCallback(async ({ refresh }: { refresh?: boolean } = {}) => {
    setState((prev) => ({
      ...prev,
      loading: !prev.data,
      refreshing: !!prev.data,
      error: null,
    }));

    try {
      const endpoint = buildUrl({ refresh });
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Dashboard request failed with status ${response.status}`);
      }
      const payload: OnlyFansDashboardPayload = await response.json();
      setState({
        data: payload,
        loading: false,
        refreshing: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected error fetching dashboard data';
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: message,
      }));
    }
  }, [buildUrl]);

  useEffect(() => {
    if (!fetchOnMount) return;
    void fetchDashboard();
  }, [fetchOnMount, fetchDashboard]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const connect = () => {
      if (cancelled) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const source = new EventSource(buildStreamUrl());
      eventSourceRef.current = source;

      source.addEventListener('snapshot', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as OnlyFansDashboardPayload;
          setState({
            data: payload,
            loading: false,
            refreshing: false,
            error: null,
          });
        } catch (error) {
          console.error('onlyfans.dashboard.stream.snapshot.parse_error', error);
        }
      });

      source.addEventListener('actionList', (event) => {
        try {
          const actionList = JSON.parse(
            (event as MessageEvent<string>).data,
          ) as DashboardActionListDTO;
          setState((prev) =>
            prev.data
              ? {
                  ...prev,
                  data: {
                    ...prev.data,
                    actionList,
                    metadata: {
                      ...prev.data.metadata,
                      generatedAt: new Date().toISOString(),
                    },
                  },
                }
              : prev,
          );
        } catch (error) {
          console.error('onlyfans.dashboard.stream.action_list.parse_error', error);
        }
      });

      source.addEventListener('summary', (event) => {
        try {
          const summaryCards = JSON.parse(
            (event as MessageEvent<string>).data,
          ) as DashboardSummaryCardDTO[];
          setState((prev) =>
            prev.data
              ? {
                  ...prev,
                  data: {
                    ...prev.data,
                    summaryCards,
                  },
                }
              : prev,
          );
        } catch (error) {
          console.error('onlyfans.dashboard.stream.summary.parse_error', error);
        }
      });

      source.addEventListener('signals', (event) => {
        try {
          const signals = JSON.parse(
            (event as MessageEvent<string>).data,
          ) as DashboardSignalFeedItem[];
          setState((prev) =>
            prev.data
              ? {
                  ...prev,
                  data: {
                    ...prev.data,
                    signalFeed: signals,
                  },
                }
              : prev,
          );
        } catch (error) {
          console.error('onlyfans.dashboard.stream.signals.parse_error', error);
        }
      });

      source.addEventListener('insights', (event) => {
        try {
          const insights = JSON.parse((event as MessageEvent<string>).data) as OnlyFansDashboardPayload['insights'];
          setState((prev) =>
            prev.data
              ? {
                  ...prev,
                  data: {
                    ...prev.data,
                    insights,
                  },
                }
              : prev,
          );
        } catch (error) {
          console.error('onlyfans.dashboard.stream.insights.parse_error', error);
        }
      });

      source.onerror = () => {
        source.close();
        eventSourceRef.current = null;
        setState((prev) => ({
          ...prev,
          error: prev.error ?? 'Realtime stream disconnected. Attempting to reconnect…',
        }));
        if (!retryTimeoutRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            connect();
          }, DEFAULT_RETRY_INTERVAL);
        }
      };

      source.onopen = () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        setState((prev) => ({
          ...prev,
          error: prev.error && prev.error.startsWith('Realtime stream') ? null : prev.error,
        }));
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [buildStreamUrl]);

  return {
    data: state.data,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    refresh: () => fetchDashboard({ refresh: true }),
    signalFeed: state.data?.signalFeed ?? [],
  };
}
