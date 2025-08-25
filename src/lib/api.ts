// Using native fetch instead of axios

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(path: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        ...options,
        headers,
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
      body: data instanceof FormData ? data : JSON.stringify(data),
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