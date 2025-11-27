'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
}

interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

export function useAutoSave<T>({
  onSave,
  delay = 30000, // 30 seconds default
  enabled = true,
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>({ status: 'idle' });
  const [data, setData] = useState<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isSavingRef = useRef(false);

  const save = useCallback(async (dataToSave: T) => {
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setStatus({ status: 'saving' });
      
      await onSave(dataToSave);
      
      setStatus({
        status: 'saved',
        lastSaved: new Date(),
      });

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setStatus(prev => prev.status === 'saved' ? { ...prev, status: 'idle' } : prev);
      }, 2000);

    } catch (error: any) {
      console.error('Auto-save error:', error);
      setStatus({
        status: 'error',
        error: error.message || 'Failed to save',
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  const triggerSave = useCallback((newData: T) => {
    if (!enabled) return;

    setData(newData);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save(newData);
    }, delay);
  }, [enabled, delay, save]);

  const saveNow = useCallback(() => {
    if (data && !isSavingRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      save(data);
    }
  }, [data, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    triggerSave,
    saveNow,
  };
}
