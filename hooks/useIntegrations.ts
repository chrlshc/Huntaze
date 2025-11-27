'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry, fetchMultiAccountWithRetry } from '@/lib/utils/fetch-with-retry';

export interface Integration {
  id?: number;
  provider: string;
  providerAccountId: string;
  isConnected: boolean;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UseIntegrationsReturn {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  connect: (provider: string) => Promise<void>;
  disconnect: (provider: string, accountId: string) => Promise<void>;
  reconnect: (provider: string, accountId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Get user-friendly error message based on error type
 */
function getUserFriendlyErrorMessage(error: any, operation: string): string {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Connection failed. Please check your internet connection.';
  }
  
  // HTTP status errors
  if (error.status) {
    switch (error.status) {
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 429:
        return 'Too many attempts. Please try again in a few minutes.';
      case 500:
      case 502:
      case 503:
        return 'Server error. Please try again later.';
      default:
        return `Failed to ${operation}. Please try again.`;
    }
  }
  
  // Default message
  return error.message || `Failed to ${operation}. Please try again.`;
}

// Poll interval for real-time status updates (5 minutes)
const POLL_INTERVAL = 5 * 60 * 1000;

export function useIntegrations(): UseIntegrationsReturn {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use fetchWithRetry for automatic retry logic (fail fast to avoid long skeletons)
      const data = await fetchWithRetry('/api/integrations/status', {}, { timeout: 8000, maxRetries: 1 });
      
      // Handle both old and new response formats
      const integrationsData = data.data?.integrations || data.integrations || [];
      
      // Convert date strings to Date objects and map API format to hook format
      const parsedIntegrations = integrationsData.map((integration: any) => ({
        id: integration.id,
        provider: integration.provider,
        providerAccountId: integration.accountId || integration.providerAccountId,
        isConnected: integration.status === 'connected' || integration.isConnected,
        expiresAt: integration.expiresAt ? new Date(integration.expiresAt) : undefined,
        metadata: integration.metadata || { username: integration.accountName },
        createdAt: new Date(integration.createdAt),
        updatedAt: new Date(integration.updatedAt),
      }));
      
      setIntegrations(parsedIntegrations);
    } catch (err: any) {
      const friendlyMessage = getUserFriendlyErrorMessage(err, 'fetch integrations');
      setError(friendlyMessage);
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async (provider: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/integrations/connect/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUrl: `${window.location.origin}/integrations`,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(
          errorData.error?.message || `Failed to initiate connection: ${response.statusText}`
        );
        error.status = response.status;
        throw error;
      }
      
      const data = await response.json();
      
      // Redirect to OAuth URL
      if (data.data?.authUrl || data.authUrl) {
        window.location.href = data.data?.authUrl || data.authUrl;
      } else {
        throw new Error('No authorization URL received from server');
      }
    } catch (err: any) {
      const friendlyMessage = getUserFriendlyErrorMessage(err, 'connect integration');
      setError(friendlyMessage);
      console.error('Error connecting integration:', err);
      throw new Error(friendlyMessage);
    }
  }, []);

  const disconnect = useCallback(async (provider: string, accountId: string) => {
    try {
      setError(null);
      
      // Use fetchMultiAccountWithRetry for better logging and retry logic
      await fetchMultiAccountWithRetry(
        `/api/integrations/disconnect/${provider}/${accountId}`,
        provider,
        accountId,
        { method: 'DELETE' }
      );
      
      // Refresh integrations list
      await fetchIntegrations();
    } catch (err: any) {
      const friendlyMessage = getUserFriendlyErrorMessage(err, 'disconnect integration');
      setError(friendlyMessage);
      console.error('Error disconnecting integration:', err);
      throw new Error(friendlyMessage);
    }
  }, [fetchIntegrations]);

  const reconnect = useCallback(async (provider: string, _accountId: string) => {
    // Reconnect is the same as connect - initiates OAuth flow
    await connect(provider);
  }, [connect]);

  const refresh = useCallback(async () => {
    await fetchIntegrations();
  }, [fetchIntegrations]);

  // Initial fetch and setup polling for real-time status updates
  useEffect(() => {
    let isMounted = true;
    
    // Only fetch if component is still mounted
    const safeFetch = async () => {
      if (isMounted) {
        await fetchIntegrations();
      }
    };
    
    safeFetch();

    // Set up polling for real-time status updates
    pollIntervalRef.current = setInterval(() => {
      if (isMounted) {
        safeFetch();
      }
    }, POLL_INTERVAL);

    // Cleanup on unmount - cancel pending requests
    return () => {
      isMounted = false;
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [fetchIntegrations]);

  return {
    integrations,
    loading,
    error,
    connect,
    disconnect,
    reconnect,
    refresh,
  };
}
