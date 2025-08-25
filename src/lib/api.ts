import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const onlyFansApi = {
  // Import endpoints
  importCSV: (data: FormData) => 
    api.post('/onlyfans/import', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
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