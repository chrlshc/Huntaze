// Route all client requests through our Next.js Route Handlers
const API_URL = '/api';

import { getErrorCodeFromStatus, shouldRetry, getRetryDelay, type AppError } from './errors';
import { enqueueOffline, isOnline } from './offline-queue';

type RequestOpts = RequestInit & { retry?: number; offlineQueue?: boolean };

class ApiClient {
  private base = API_URL;

  private async doFetch(endpoint: string, options: RequestInit) {
    const headers = new Headers(options.headers as HeadersInit);
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${this.base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
    return res;
  }

  private async request(endpoint: string, options: RequestOpts = {}) {
    // Offline: optionally enqueue action and short-circuit
    if (options.offlineQueue && typeof window !== 'undefined' && !isOnline()) {
      await enqueueOffline({ endpoint, options: { ...options, body: options.body as any } });
      // mimic an accepted response for optimistic UX
      return { ok: true, offline: true } as any;
    }

    const maxRetry = Math.max(0, options.retry ?? 0);
    let lastErr: AppError | null = null;
    for (let attempt = 0; attempt <= maxRetry; attempt++) {
      try {
        const response = await this.doFetch(endpoint, options);
        if (!response.ok) {
          const bodyText = await response.text().catch(() => '');
          const body = bodyText ? JSON.parse(bodyText).catch(() => ({})) : {};
          const code = getErrorCodeFromStatus(response.status);
          const err: AppError = { code, message: body?.message || 'API request failed', details: body, statusCode: response.status };
          if (attempt < maxRetry && shouldRetry(err)) {
            await new Promise((r) => setTimeout(r, getRetryDelay(attempt)));
            continue;
          }
          throw err;
        }
        // JSON or empty
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) return response.json();
        return null;
      } catch (e: any) {
        // Network / thrown AppError path
        lastErr = e?.code ? (e as AppError) : { code: 'NETWORK_ERROR', message: e?.message || 'Network error', statusCode: 0 } as AppError;
        if (attempt < maxRetry && shouldRetry(lastErr)) {
          await new Promise((r) => setTimeout(r, getRetryDelay(attempt)));
          continue;
        }
        throw lastErr;
      }
    }
    // Should not reach
    throw lastErr || { code: 'SERVER_ERROR', message: 'Unknown error', statusCode: 0 } as AppError;
  }

  // Upload with progress (browser-only). Fallback silently to fetch when XHR not available.
  async upload(endpoint: string, file: File | Blob, onProgress?: (pct: number) => void) {
    if (typeof window !== 'undefined' && 'XMLHttpRequest' in window) {
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${this.base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);
        xhr.withCredentials = true;
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { resolve(JSON.parse(xhr.responseText)); } catch { resolve(null); }
            } else {
              reject({ code: getErrorCodeFromStatus(xhr.status), message: 'Upload failed', statusCode: xhr.status });
            }
          }
        };
        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) onProgress(Math.round((evt.loaded / evt.total) * 100));
          };
        }
        const form = new FormData();
        form.append('file', file);
        xhr.send(form);
      });
    }
    const form = new FormData();
    form.append('file', file);
    return this.request(endpoint, { method: 'POST', body: form });
  }

  // Auth endpoints
  async getMe() { return this.request('/auth/me', { retry: 1 }); }
  async logout() { return this.request('/auth/logout', { method: 'POST' }); }

  // User endpoints
  async getProfile() { return this.request('/users/profile', { retry: 1 }); }
  async updateProfile(data: any) { return this.request('/users/profile', { method: 'PUT', body: JSON.stringify(data), retry: 1 }); }

  // Subscription endpoints
  async getSubscription() { return this.request('/subscriptions', { retry: 1 }); }
  async createCheckoutSession(priceId: string) {
    return this.request('/subscriptions/create-checkout', { method: 'POST', body: JSON.stringify({ priceId }), retry: 2 });
  }

  // Platform endpoints
  async getPlatforms() { return this.request('/platforms', { retry: 1 }); }
  async connectPlatform(type: string, data: any) { return this.request(`/platforms/${type}/connect`, { method: 'POST', body: JSON.stringify(data), retry: 2 }); }

  // AI endpoints
  async getAIConfig() { return this.request('/ai/config', { retry: 1 }); }
  async updateAIConfig(data: any) { return this.request('/ai/config', { method: 'PUT', body: JSON.stringify(data), retry: 1 }); }
}

export const api = new ApiClient();
