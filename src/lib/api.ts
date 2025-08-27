// Using native fetch instead of axios
// Expect NEXT_PUBLIC_API_URL to be the API origin (e.g., http://localhost:4000 or https://api.huntaze.com)
// We append '/api' here to target the Express API prefix consistently.
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const API_BASE_URL = `${apiOrigin}/api`;

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(path: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    } as Record<string, string>;

    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  get(path: string) {
    return this.request(path, { method: 'GET' });
  }

  post(path: string, data?: any, options?: RequestInit) {
    return this.request(path, {
      method: 'POST',
      body: data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  put(path: string, data?: any, options?: RequestInit) {
    return this.request(path, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  delete(path: string, options?: RequestInit) {
    return this.request(path, {
      method: 'DELETE',
      ...options,
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

export const onlyFansApi = {
  // Import endpoints
  importCSV: (data: FormData) => 
    api.post('/onlyfans/import', data, {
      headers: { 'Content-Type': undefined } as any // Let browser set boundary for FormData
    }),
  
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
export const subscriptionApi = {
  createCheckout: (priceId: string) =>
    api.post('/subscriptions/create-checkout', { priceId }),
};

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
