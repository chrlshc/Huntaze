// Unified internal API client (handles base URL, auth cookies, timeouts, errors)
import { apiClient, type InternalApiRequestOptions } from '@/lib/api/client/internal-api-client';

class ApiClient {
  request<T = any>(path: string, options: InternalApiRequestOptions<T> = {}) {
    return apiClient.request<T>(path, options);
  }

  get<T = any>(path: string, options?: InternalApiRequestOptions<T>) {
    return apiClient.get<T>(path, options);
  }

  post<T = any>(path: string, data?: any, options?: InternalApiRequestOptions<T>) {
    return apiClient.post<T>(path, data, options);
  }

  put<T = any>(path: string, data?: any, options?: InternalApiRequestOptions<T>) {
    return apiClient.put<T>(path, data, options);
  }

  patch<T = any>(path: string, data?: any, options?: InternalApiRequestOptions<T>) {
    return apiClient.patch<T>(path, data, options);
  }

  delete<T = any>(path: string, options?: InternalApiRequestOptions<T>) {
    return apiClient.delete<T>(path, options);
  }
}

export const api = new ApiClient();

export const onlyFansApi = {
  // Import endpoints
  importCSV: (data: FormData) => api.post('/onlyfans/import', data),
  
  previewCSV: (type: string, csvContent: string) =>
    api.post('/onlyfans/preview', { type, csvContent }),
  
  // Templates
  getTemplates: () => 
    api.get('/onlyfans/templates'),
  
  // Sources
  getSources: () => 
    api.get('/onlyfans/sources'),
  
  createSource: (data: { externalHandle: string; currency: string }) =>
    api.post('/onlyfans/sources', data),
  
  // Analytics
  getEngagementAnalytics: () =>
    api.get('/onlyfans/analytics/engagement'),
};

export const ledgerApi = {
  getMonthlyEarnings: (month: string) =>
    api.get(`/ledger/earnings/monthly/${month}`),
  
  getCommissionSummary: () =>
    api.get('/ledger/commission/summary'),
};

export const pricingApi = {
  getCurrentPlan: () =>
    api.get('/pricing/current-plan'),
  
  simulatePricing: (monthlyNetCents: number) =>
    api.post('/pricing/simulate', { monthlyNetCents }),
  
  getPlanAdvice: () =>
    api.get('/pricing/advice'),
};

// Subscriptions
// Note: Stripe checkout removed
export const subscriptionApi = {};

// Platforms
export const platformsApi = {
  list: () => api.get('/platforms'),
  connectOnlyFans: (data: { username: string; apiKey: string }) =>
    api.post('/platforms/onlyfans/connect', data),
};

// AI Config
export const aiApi = {
  getConfig: () => api.get('/ai/config'),
  updateConfig: (
    data: Partial<{
      personality: any;
      responseStyle: string;
      pricing: any;
      customResponses: any;
    }>
  ) => api.put('/ai/config', data as any),
};

// OnlyFans Integration (read-only)
export const ofIntegrationApi = {
  connect: (data: { username: string; password: string; totp?: string }) =>
    api.post('/integrations/onlyfans/connect', data),
  sync: (scopes?: string[]) =>
    api.post('/integrations/onlyfans/sync', { scopes }),
  analytics: (period: '7d'|'30d'|'90d' = '30d') =>
    api.get(`/integrations/onlyfans/analytics?period=${period}`),
  messages: (cursor?: string, limit: number = 50) =>
    api.get(`/integrations/onlyfans/messages${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`),
  status: () =>
    api.get('/integrations/onlyfans/status'),
};

// OnlyFans AI (suggestions only)
export const ofAiApi = {
  suggest: (data: { conversationId?: string; messageId?: string; messageText?: string; context?: any }) =>
    api.post('/integrations/onlyfans/ai/suggest', data),
  getSettings: () => api.get('/integrations/onlyfans/ai/settings'),
  updateSettings: (settings: any) => api.post('/integrations/onlyfans/ai/settings', settings),
};

// OFM Agent Pro (new)
export const ofmApi = {
  aiDraft: (data: any) => api.post('/ofm/ai/draft', data),
  rfmRecompute: () => api.post('/ofm/rfm/recompute'),
};

// AI Team (scheduler & orchestration)
export const aiTeamApi = {
  // Content Scheduler
  schedulePlan: (data: {
    modelId: string;
    platforms: string[];
    window?: { startDate: string; endDate: string };
    timezone?: string;
    perPlatform?: Record<string, number>;
    constraints?: { maxPerDay?: number; minGapMinutes?: number };
  }) => api.post('/ai-team/schedule/plan', data),

  scheduleApply: (plan: any) => api.post('/ai-team/schedule/apply', { plan }),

  // Optional helpers for orchestration
  initializeTeam: (modelId: string, modelData: any) =>
    api.post('/ai-team/initialize', { modelId, modelData }),

  assignTask: (agentId: string, taskType: string, taskData?: any, priority?: number) =>
    api.post('/ai-team/assign-task', { agentId, taskType, taskData, priority }),

  status: (modelId: string) => api.get(`/ai-team/status/${modelId}`),
  dailyContent: (modelId: string) => api.post(`/ai-team/daily-content/${modelId}`),
};
