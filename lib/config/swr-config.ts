/**
 * SWR Configuration for Revenue Optimization
 * 
 * Centralized configuration for data fetching and caching
 */

import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  // Don't revalidate on window focus (can be annoying for users)
  revalidateOnFocus: false,
  
  // Revalidate when network reconnects
  revalidateOnReconnect: true,
  
  // Dedupe requests within 5 seconds
  dedupingInterval: 5000,
  
  // Retry failed requests
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  
  // Show stale data while revalidating
  revalidateIfStale: true,
  
  // Keep previous data while fetching new data
  keepPreviousData: true,
};

/**
 * Cache TTL configuration (in milliseconds)
 */
export const CACHE_TTL = {
  pricing: 5 * 60 * 1000,        // 5 minutes
  churn: 10 * 60 * 1000,         // 10 minutes
  upsells: 5 * 60 * 1000,        // 5 minutes
  forecast: 60 * 60 * 1000,      // 1 hour
  payouts: 30 * 60 * 1000,       // 30 minutes
  metrics: 5 * 60 * 1000,        // 5 minutes
} as const;

/**
 * SWR keys for revenue optimization
 */
export const SWR_KEYS = {
  pricing: (creatorId: string) => `/revenue/pricing/${creatorId}`,
  churn: (creatorId: string, riskLevel?: string) => 
    `/revenue/churn/${creatorId}${riskLevel ? `?level=${riskLevel}` : ''}`,
  upsells: (creatorId: string) => `/revenue/upsells/${creatorId}`,
  forecast: (creatorId: string, months?: number) => 
    `/revenue/forecast/${creatorId}${months ? `?months=${months}` : ''}`,
  payouts: (creatorId: string) => `/revenue/payouts/${creatorId}`,
  metrics: (creatorId: string) => `/revenue/metrics/${creatorId}`,
} as const;
