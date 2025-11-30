// Route all client requests through our Next.js Route Handlers
const API_URL = '/api';

class ApiClient {
  constructor() {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers as HeadersInit);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    // Auth is handled by HttpOnly cookies; no client-side token header

    const response = await fetch(`${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // User endpoints
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Subscription endpoints
  async getSubscription() {
    return this.request('/subscriptions');
  }

  // Note: Stripe checkout removed
  // async createCheckoutSession(priceId: string) {
  //   return this.request('/subscriptions/create-checkout', {
  //     method: 'POST',
  //     body: JSON.stringify({ priceId }),
  //   });
  // }

  // Platform endpoints
  async getPlatforms() {
    return this.request('/platforms');
  }

  async connectPlatform(type: string, data: any) {
    return this.request(`/platforms/${type}/connect`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI endpoints
  async getAIConfig() {
    return this.request('/ai/config');
  }

  async updateAIConfig(data: any) {
    return this.request('/ai/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
