/**
 * Client helper for Admin AI Cost Monitoring Dashboard
 */

import type { AICostQueryParams, AICostResponse } from './types';

/**
 * Fetch AI cost data from the admin dashboard
 */
export async function fetchAICosts(
  params: AICostQueryParams = {}
): Promise<AICostResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.creatorId) searchParams.set('creatorId', params.creatorId);
  if (params.feature) searchParams.set('feature', params.feature);
  if (params.format) searchParams.set('format', params.format);
  if (params.limit) searchParams.set('limit', params.limit);

  const url = `/api/admin/ai-costs?${searchParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch AI costs: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Download AI cost data as CSV
 */
export async function downloadAICostsCSV(
  params: Omit<AICostQueryParams, 'format'> = {}
): Promise<void> {
  const searchParams = new URLSearchParams();
  
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.creatorId) searchParams.set('creatorId', params.creatorId);
  if (params.feature) searchParams.set('feature', params.feature);
  if (params.limit) searchParams.set('limit', params.limit);
  
  searchParams.set('format', 'csv');

  const url = `/api/admin/ai-costs?${searchParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download CSV: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `ai-costs-${new Date().toISOString()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Get high-cost creators
 */
export async function getHighCostCreators(
  limit: number = 10,
  params: Omit<AICostQueryParams, 'limit'> = {}
): Promise<AICostResponse['highCostCreators']> {
  const data = await fetchAICosts({ ...params, limit: limit.toString() });
  return data.highCostCreators;
}

/**
 * Get anomalies
 */
export async function getAnomalies(
  params: AICostQueryParams = {}
): Promise<AICostResponse['anomalies']> {
  const data = await fetchAICosts(params);
  return data.anomalies;
}

/**
 * Get total spending for a period
 */
export async function getTotalSpending(
  startDate?: string,
  endDate?: string
): Promise<AICostResponse['totalSpending']> {
  const data = await fetchAICosts({ startDate, endDate });
  return data.totalSpending;
}

/**
 * Get spending breakdown for a specific creator
 */
export async function getCreatorSpending(
  creatorId: number,
  startDate?: string,
  endDate?: string
): Promise<AICostResponse['perCreatorBreakdown'][0] | null> {
  const data = await fetchAICosts({
    creatorId: creatorId.toString(),
    startDate,
    endDate,
  });
  
  return data.perCreatorBreakdown[0] || null;
}
