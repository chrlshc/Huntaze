/**
 * Dashboard API Client
 * 
 * Fetch functions for dashboard data with loading and error state handling.
 * Feature: creator-analytics-dashboard
 * Requirements: 12.1, 12.2, 12.4
 */

import type {
  OverviewResponse,
  FinanceResponse,
  AcquisitionResponse,
  DateRange
} from './types';

/**
 * API Error class for dashboard fetch errors
 */
export class DashboardAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'DashboardAPIError';
  }
}

/**
 * Convert DateRange to query parameters
 */
function dateRangeToParams(range: DateRange): URLSearchParams {
  const params = new URLSearchParams();
  
  if (range.type === 'custom') {
    params.set('from', range.from);
    params.set('to', range.to);
  } else {
    // Calculate dates for preset ranges
    const to = new Date();
    const from = new Date();
    
    switch (range.preset) {
      case 'today':
        // Today only
        break;
      case '7d':
        from.setDate(from.getDate() - 7);
        break;
      case '30d':
        from.setDate(from.getDate() - 30);
        break;
      case '12m':
        from.setMonth(from.getMonth() - 12);
        break;
    }
    
    params.set('from', from.toISOString().split('T')[0]);
    params.set('to', to.toISOString().split('T')[0]);
  }
  
  return params;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchDashboardData<T>(
  endpoint: string,
  params?: URLSearchParams
): Promise<T> {
  const url = params 
    ? `/api/dashboard/${endpoint}?${params.toString()}`
    : `/api/dashboard/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Disable caching for real-time data
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DashboardAPIError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        endpoint
      );
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof DashboardAPIError) {
      throw error;
    }
    
    // Network or parsing errors
    throw new DashboardAPIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      endpoint
    );
  }
}

/**
 * Fetch overview page data
 * 
 * @param range - Date range for filtering data
 * @returns Overview data including KPIs, revenue chart, and live feed
 * @throws {DashboardAPIError} If the request fails
 * 
 * Requirements: 12.1, 12.2
 */
export async function fetchOverviewData(
  range: DateRange
): Promise<OverviewResponse> {
  const params = dateRangeToParams(range);
  return fetchDashboardData<OverviewResponse>('overview', params);
}

/**
 * Fetch finance page data
 * 
 * @param range - Date range for filtering data
 * @returns Finance data including revenue breakdown, whales, and AI metrics
 * @throws {DashboardAPIError} If the request fails
 * 
 * Requirements: 12.1, 12.2
 */
export async function fetchFinanceData(
  range: DateRange
): Promise<FinanceResponse> {
  const params = dateRangeToParams(range);
  return fetchDashboardData<FinanceResponse>('finance', params);
}

/**
 * Fetch acquisition page data
 * 
 * @param range - Date range for filtering data
 * @returns Acquisition data including funnel, platform metrics, and top content
 * @throws {DashboardAPIError} If the request fails
 * 
 * Requirements: 12.1, 12.2
 */
export async function fetchAcquisitionData(
  range: DateRange
): Promise<AcquisitionResponse> {
  const params = dateRangeToParams(range);
  return fetchDashboardData<AcquisitionResponse>('acquisition', params);
}

/**
 * Type guard to check if error is a DashboardAPIError
 */
export function isDashboardAPIError(error: unknown): error is DashboardAPIError {
  return error instanceof DashboardAPIError;
}

/**
 * Get user-friendly error message from error
 */
export function getErrorMessage(error: unknown): string {
  if (isDashboardAPIError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
