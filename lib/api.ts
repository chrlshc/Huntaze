const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers as HeadersInit);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
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

  async createCheckoutSession(priceId: string) {
    return this.request('/subscriptions/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
  }

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
