import { useState, useEffect, useCallback } from 'react';

// Types
interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria: string;
  createdAt: string;
  _count: {
    subscribers: number;
  };
}

interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  actions: string;
  isActive: boolean;
  priority?: number;
  createdAt: string;
  _count: {
    executions: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Hook: useSegments
export function useSegments() {
  const [data, setData] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSegments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/marketing/segments');
      const result: ApiResponse<Segment[]> = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch segments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const createSegment = async (segment: {
    name: string;
    description?: string;
    criteria: any;
  }) => {
    try {
      const response = await fetch('/api/marketing/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segment),
      });

      const result: ApiResponse<Segment> = await response.json();

      if (result.success) {
        await fetchSegments(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create segment');
      }
    } catch (err) {
      throw err;
    }
  };

  return {
    segments: data,
    loading,
    error,
    refetch: fetchSegments,
    createSegment,
  };
}

// Hook: useAutomations
export function useAutomations() {
  const [data, setData] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/marketing/automation');
      const result: ApiResponse<Automation[]> = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch automations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const createAutomation = async (automation: {
    name: string;
    description?: string;
    trigger: any;
    actions: any;
    isActive?: boolean;
    priority?: number;
  }) => {
    try {
      const response = await fetch('/api/marketing/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automation),
      });

      const result: ApiResponse<Automation> = await response.json();

      if (result.success) {
        await fetchAutomations(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create automation');
      }
    } catch (err) {
      throw err;
    }
  };

  return {
    automations: data,
    loading,
    error,
    refetch: fetchAutomations,
    createAutomation,
  };
}
