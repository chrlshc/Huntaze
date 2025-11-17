'use client';

import { useCallback, useRef, useState } from 'react';
import { aiTeamApi } from '@/src/lib/api';

type PlanParams = {
  modelId: string;
  platforms: string[];
  window?: { startDate: string; endDate: string };
  timezone?: string;
  perPlatform?: Record<string, number>;
  constraints?: { maxPerDay?: number; minGapMinutes?: number };
};

export function useAiScheduler() {
  const [loading, setLoading] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const planSchedule = useCallback(async (params: PlanParams) => {
    setLoading(true);
    try {
      const res = await aiTeamApi.schedulePlan(params);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const applySchedule = useCallback(async (plan: any) => {
    setLoading(true);
    try {
      const res = await aiTeamApi.scheduleApply(plan);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureJwtCookie = () => {
    // Note: EventSource now uses NextAuth session cookies automatically
    // No need to manually set cookies from localStorage
    // This function is kept for backward compatibility but does nothing
  };

  const connectStream = useCallback((modelId: string, handlers?: {
    onReady?: (data: any) => void;
    onUpdate?: (payload: any) => void;
    onCanceled?: (payload: any) => void;
    onError?: (err: any) => void;
  }) => {
    try {
      ensureJwtCookie();
      const es = new EventSource(`/api/ai-team/stream/${modelId}`);
      esRef.current = es;
      es.addEventListener('ready', (e: any) => handlers?.onReady?.(safeParse((e as MessageEvent).data)));
      es.addEventListener('task_update', (e: any) => handlers?.onUpdate?.(safeParse((e as MessageEvent).data)));
      es.addEventListener('task_canceled', (e: any) => handlers?.onCanceled?.(safeParse((e as MessageEvent).data)));
      es.onerror = (err) => handlers?.onError?.(err);
      return () => {
        es.close();
        esRef.current = null;
      };
    } catch (e) {
      handlers?.onError?.(e);
      return () => {};
    }
  }, []);

  return {
    loading,
    planSchedule,
    applySchedule,
    connectStream,
  };
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}

