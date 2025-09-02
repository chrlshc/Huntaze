"use client";
import { useCallback, useState } from 'react';
import { ofmApi } from '@/src/lib/api';

export function useAiDrafts() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestDraft = useCallback(async (payload: any) => {
    setPending(true);
    setError(null);
    try {
      const res = await ofmApi.aiDraft(payload);
      return res;
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch draft');
      throw e;
    } finally {
      setPending(false);
    }
  }, []);

  return { requestDraft, pending, error };
}

