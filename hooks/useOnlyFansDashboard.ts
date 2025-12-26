'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { integrationsStatusResponseSchema } from '@/lib/schemas/api-responses';

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
  requireRealConnection?: boolean; // New option to require real OAuth connection
}

interface OnlyFansDashboardState {
  data: OnlyFansDashboardPayload | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  isConnected: boolean; // Track if using real OAuth connection
}

const DASHBOARD_ENDPOINT = '/api/onlyfans/dashboard';
const DASHBOARD_STREAM_ENDPOINT = '/api/onlyfans/dashboard/stream';
const DEFAULT_RETRY_INTERVAL = 4000;

export function useOnlyFansDashboard({
  accountId,
  fetchOnMount = true,
  requireRealConnection = false,
}: UseOnlyFansDashboardOptions = {}) {
  const { data: session } = useSession();
  const [state, setState] = useState<OnlyFansDashboardState>({
    data: null,
    loading: fetchOnMount,
    refreshing: false,
    error: null,
    isConnected: false,
  });
  
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback(
    (opts?: { refresh?: boolean }) => {
      const params = new URLSearchParams();
      if (accountId) params.set('accountId', accountId);
      if (opts?.refresh) params.set('refresh', '1');
      const query = params.toString();
      return query ? `${DASHBOARD_ENDPOINT}?${query}` : DASHBOARD_ENDPOINT;
    },
    [accountId],
  );

  const buildStreamUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    const query = params.toString();
    return query ? `${DASHBOARD_STREAM_ENDPOINT}?${query}` : DASHBOARD_STREAM_ENDPOINT;
  }, [accountId]);

  // Check if user has a real OnlyFans OAuth connection
  const checkConnection = useCallback(async () => {
    if (!session?.user?.id) {
      setHasCheckedConnection(true);
      return false;
    }

    try {
      const data = await internalApiFetch<{
        success?: boolean;
        data?: { integrations?: any[] };
        integrations?: any[];
      }>('/api/integrations/status', { schema: integrationsStatusResponseSchema });
      const integrations = data.data?.integrations || data.integrations || [];
      const onlyFansIntegration = integrations.find(
        (int: any) => int.provider === 'onlyfans' && int.isConnected
      );
      
      const isConnected = !!onlyFansIntegration;
      setState(prev => ({ ...prev, isConnected }));
      setHasCheckedConnection(true);
      return isConnected;
    } catch (error) {
      console.error('Failed to check OnlyFans connection:', error);
      setHasCheckedConnection(true);
      return false;
    }
  }, [session?.user?.id]);

  const fetchDashboard = useCallback(async ({ refresh }: { refresh?: boolean } = {}) => {
    // Check connection status first if we haven't already
    if (!hasCheckedConnection) {
      const isConnected = await checkConnection();
      
      // If real connection is required but not available, show error
      if (requireRealConnection && !isConnected) {
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: 'Please connect your OnlyFans account to view real data',
          isConnected: false,
        }));
        return;
      }
    }

    setState((prev) => ({
      ...prev,
      loading: !prev.data,
      refreshing: !!prev.data,
      error: null,
    }));

    try {
      const endpoint = buildUrl({ refresh });
      const payload = await internalApiFetch<OnlyFansDashboardPayload>(endpoint, { cache: 'no-store' });
      
      // Check if the data source indicates real vs mock data
      const isRealData = payload.metadata?.source === 'upstream' || payload.metadata?.source === 'api';
      
      setState((prev) => ({
        data: payload,
        loading: false,
        refreshing: false,
        error: null,
        isConnected: prev.isConnected || isRealData,
      }));
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
  }, [buildUrl, hasCheckedConnection, checkConnection, requireRealConnection]);

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
          const isRealData = payload.metadata?.source === 'upstream' || payload.metadata?.source === 'api';
          setState((prev) => ({
            data: payload,
            loading: false,
            refreshing: false,
            error: null,
            isConnected: prev.isConnected || isRealData,
          }));
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
    isConnected: state.isConnected,
    refresh: () => fetchDashboard({ refresh: true }),
    signalFeed: state.data?.signalFeed ?? [],
  };
}
