/**
 * API Integration Service
 * Service centralisé pour optimiser toutes les intégrations API avec gestion d'erreurs,
 * retry strategies, caching, authentification et monitoring
 */

import { 
  APIError, 
  RateLimitError, 
  NetworkError, 
  AuthenticationError,
  isRetryableError,
  getRetryDelay,
  enhanceErrorWithContext,
  formatErrorForLogging,
  shouldLogError 
} from '@/lib/types/api-errors';
import { getAPIMonitoringService } from './api-monitoring-service';

// Configuration des retry strategies
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

// Configuration du cache
export interface CacheConfig {
  ttl: number;
  maxSize: number;
  keyPrefix: string;
}

// Configuration de l'authentification
export interface AuthConfig {
  apiKey?: string;
  bearerToken?: string;
  refreshToken?: string;
  tokenEndpoint?: string;
}

// Types pour les réponses API
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    duration: number;
    tokensUsed?: number;
    cacheHit?: boolean;
    rateLimitRemaining?: number;
  };
}

// Options pour les requêtes API
export interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
  cacheKey?: string;
  cacheTTL?: number;
  skipCache?: boolean;
  skipAuth?: boolean;
  skipRetry?: boolean;
  debounceKey?: string;
  debounceDelay?: number;
}

// Interface pour les logs de debug
interface DebugLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: any;
  requestId?: string;
}

export class APIIntegrationService {
  private static instance: APIIntegrationService;
  
  // Configuration par défaut
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  };

  private defaultCacheConfig: CacheConfig = {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    keyPrefix: 'api_cache',
  };

  // Stockage interne
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private authTokens: Map<string, { token: string; expiresAt: number }> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();
  private debugLogs: DebugLog[] = [];
  
  // Services
  private monitoring = getAPIMonitoringService();

  static getInstance(): APIIntegrationService {
    if (!APIIntegrationService.instance) {
      APIIntegrationService.instance = new APIIntegrationService();
    }
    return APIIntegrationService.instance;
  }

  /**
   * Méthode principale pour effectuer des requêtes API optimisées
   */
  async request<T = any>(
    url: string, 
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    this.logDebug('API request started', { url, method: options.method, requestId });

    try {
      // Gestion du debouncing
      if (options.debounceKey) {
        const debouncedResult = await this.handleDebounce(url, options, requestId);
        if (debouncedResult) return debouncedResult;
      }

      // Vérification du cache
      if (!options.skipCache && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
        const cachedResult = this.getFromCache<T>(options.cacheKey || url);
        if (cachedResult) {
          this.logDebug('Cache hit', { url, requestId });
          return this.formatResponse(cachedResult, { cacheHit: true, requestId, duration: Date.now() - startTime });
        }
      }

      // Authentification
      const authHeaders = await this.getAuthHeaders(options);

      // Exécution avec retry
      const result = await this.executeWithRetry(
        () => this.performRequest<T>(url, { ...options, headers: { ...options.headers, ...authHeaders } }),
        options.retryConfig || this.defaultRetryConfig,
        requestId
      );

      // Mise en cache si applicable
      if (!options.skipCache && result.success && (options.method === 'GET' || !options.method)) {
        this.setCache(
          options.cacheKey || url, 
          result.data, 
          options.cacheTTL || this.defaultCacheConfig.ttl
        );
      }

      const duration = Date.now() - startTime;
      this.logDebug('API request completed', { url, duration, success: result.success, requestId });

      // Enregistrement des métriques
      this.monitoring.recordMetric({
        endpoint: url,
        method: options.method || 'GET',
        statusCode: result.success ? 200 : 500,
        responseTime: duration,
        tokensUsed: result.meta?.tokensUsed,
        cacheHit: false,
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError('API request failed', error as Error, { url, duration, requestId });

      // Enregistrement des métriques d'erreur
      this.monitoring.recordMetric({
        endpoint: url,
        method: options.method || 'GET',
        statusCode: this.getStatusCodeFromError(error as Error),
        responseTime: duration,
        errorType: (error as Error).constructor.name,
      });

      return this.formatErrorResponse<T>(error as Error, requestId, duration);
    }
  }

  /**
   * Gestion du debouncing pour éviter les requêtes en double
   */
  private async handleDebounce<T>(
    url: string, 
    options: APIRequestOptions, 
    requestId: string
  ): Promise<APIResponse<T> | null> {
    const debounceKey = options.debounceKey!;
    const delay = options.debounceDelay || 300;

    // Annuler le timer précédent
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey)!);
    }

    // Vérifier si une requête similaire est en cours
    if (this.requestQueue.has(debounceKey)) {
      this.logDebug('Request debounced - using existing promise', { debounceKey, requestId });
      return await this.requestQueue.get(debounceKey);
    }

    // Créer une nouvelle promesse avec délai
    const debouncedPromise = new Promise<APIResponse<T>>((resolve) => {
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(debounceKey);
        this.requestQueue.delete(debounceKey);
        
        try {
          const result = await this.request<T>(url, { ...options, debounceKey: undefined });
          resolve(result);
        } catch (error) {
          resolve(this.formatErrorResponse<T>(error as Error, requestId, 0));
        }
      }, delay);

      this.debounceTimers.set(debounceKey, timer);
    });

    this.requestQueue.set(debounceKey, debouncedPromise);
    return null; // Indique que la requête est en attente
  }

  /**
   * Exécution d'une requête avec retry automatique
   */
  private async executeWithRetry<T>(
    operation: () => Promise<APIResponse<T>>,
    retryConfig: RetryConfig,
    requestId: string
  ): Promise<APIResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        this.logDebug('Executing request attempt', { attempt, maxAttempts: retryConfig.maxAttempts, requestId });
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Vérifier si l'erreur est retryable
        if (!isRetryableError(lastError as APIError) || attempt === retryConfig.maxAttempts) {
          throw lastError;
        }

        // Calculer le délai avec jitter
        const baseDelay = getRetryDelay(lastError as APIError, attempt);
        const jitter = baseDelay * retryConfig.jitterFactor * (Math.random() * 2 - 1);
        const delay = Math.min(baseDelay + jitter, retryConfig.maxDelay);

        this.logDebug('Retrying after delay', { 
          attempt, 
          delay, 
          error: lastError.message, 
          requestId 
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Exécution de la requête HTTP
   */
  private async performRequest<T>(url: string, options: APIRequestOptions): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeout = options.timeout || 30000;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createErrorFromResponse(response);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId(),
          duration: 0, // Sera calculé par l'appelant
          rateLimitRemaining: this.parseRateLimitHeader(response),
        },
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout', 408, { timeout });
      }
      
      throw error;
    }
  }

  /**
   * Gestion de l'authentification
   */
  private async getAuthHeaders(options: APIRequestOptions): Promise<Record<string, string>> {
    if (options.skipAuth) return {};

    const headers: Record<string, string> = {};

    // Token Bearer (JWT, API Key, etc.)
    const token = await this.getValidToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Récupération d'un token valide avec refresh automatique
   */
  private async getValidToken(): Promise<string | null> {
    const tokenKey = 'default';
    const cached = this.authTokens.get(tokenKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    // Ici, on implémenterait la logique de refresh du token
    // Pour l'exemple, on retourne null
    return null;
  }

  /**
   * Gestion du cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    // Nettoyage si le cache est plein
    if (this.cache.size >= this.defaultCacheConfig.maxSize) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Supprimer les entrées expirées
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    });

    // Si encore trop d'entrées, supprimer les plus anciennes
    if (this.cache.size >= this.defaultCacheConfig.maxSize) {
      const sortedEntries = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(this.defaultCacheConfig.maxSize * 0.2));

      sortedEntries.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Utilitaires de formatage des réponses
   */
  private formatResponse<T>(
    data: T, 
    meta: Partial<APIResponse<T>['meta']> = {}
  ): APIResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        duration: 0,
        ...meta,
      },
    };
  }

  private formatErrorResponse<T>(
    error: Error, 
    requestId: string, 
    duration: number
  ): APIResponse<T> {
    const apiError = error as APIError;
    
    return {
      success: false,
      error: {
        type: error.constructor.name,
        message: error.message,
        code: apiError.code,
        details: apiError.context,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        duration,
      },
    };
  }

  /**
   * Utilitaires d'erreur
   */
  private createErrorFromResponse(response: Response): APIError {
    const status = response.status;
    const statusText = response.statusText;

    switch (status) {
      case 401:
        return new AuthenticationError(`Authentication failed: ${statusText}`);
      case 429:
        const retryAfter = response.headers.get('retry-after');
        return new RateLimitError(
          `Rate limit exceeded: ${statusText}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      default:
        return new NetworkError(`HTTP ${status}: ${statusText}`, status);
    }
  }

  private getStatusCodeFromError(error: Error): number {
    const apiError = error as APIError;
    return apiError.status || 500;
  }

  private parseRateLimitHeader(response: Response): number | undefined {
    const remaining = response.headers.get('x-ratelimit-remaining');
    return remaining ? parseInt(remaining, 10) : undefined;
  }

  /**
   * Logging et debugging
   */
  private logDebug(message: string, context?: any): void {
    const log: DebugLog = {
      timestamp: new Date(),
      level: 'debug',
      message,
      context,
      requestId: context?.requestId,
    };

    this.debugLogs.push(log);
    
    // Garder seulement les 1000 derniers logs
    if (this.debugLogs.length > 1000) {
      this.debugLogs = this.debugLogs.slice(-1000);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[APIIntegration] ${message}`, context || '');
    }
  }

  private logError(message: string, error: Error, context?: any): void {
    const log: DebugLog = {
      timestamp: new Date(),
      level: 'error',
      message,
      context: {
        error: error.message,
        stack: error.stack,
        ...context,
      },
      requestId: context?.requestId,
    };

    this.debugLogs.push(log);

    if (shouldLogError(error as APIError)) {
      console.error(`[APIIntegration] ${message}`, {
        ...formatErrorForLogging(error as APIError),
        ...context,
      });
    }
  }

  /**
   * Méthodes utilitaires
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Méthodes publiques pour la gestion
   */
  
  // Nettoyage du cache
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Statistiques du cache
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: now - value.timestamp,
      ttl: value.ttl,
    }));

    return {
      size: this.cache.size,
      maxSize: this.defaultCacheConfig.maxSize,
      hitRate: 0, // Serait calculé avec des métriques réelles
      entries,
    };
  }

  // Récupération des logs de debug
  getDebugLogs(level?: DebugLog['level'], limit?: number): DebugLog[] {
    let logs = this.debugLogs;
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    if (limit) {
      logs = logs.slice(-limit);
    }
    
    return logs;
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      cache: boolean;
      auth: boolean;
      network: boolean;
    };
    metrics: {
      cacheSize: number;
      activeRequests: number;
      errorRate: number;
    };
  }> {
    const checks = {
      cache: this.cache.size < this.defaultCacheConfig.maxSize,
      auth: true, // Serait vérifié avec un ping auth
      network: true, // Serait vérifié avec un ping réseau
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      metrics: {
        cacheSize: this.cache.size,
        activeRequests: this.requestQueue.size,
        errorRate: 0, // Serait calculé avec des métriques réelles
      },
    };
  }
}

// Export de l'instance singleton
export const apiIntegration = APIIntegrationService.getInstance();

// Fonctions utilitaires pour l'usage courant
export async function apiRequest<T = any>(
  url: string, 
  options?: APIRequestOptions
): Promise<APIResponse<T>> {
  return apiIntegration.request<T>(url, options);
}

export async function apiGet<T = any>(
  url: string, 
  options?: Omit<APIRequestOptions, 'method'>
): Promise<APIResponse<T>> {
  return apiIntegration.request<T>(url, { ...options, method: 'GET' });
}

export async function apiPost<T = any>(
  url: string, 
  data?: any, 
  options?: Omit<APIRequestOptions, 'method' | 'body'>
): Promise<APIResponse<T>> {
  return apiIntegration.request<T>(url, { ...options, method: 'POST', body: data });
}

export async function apiPut<T = any>(
  url: string, 
  data?: any, 
  options?: Omit<APIRequestOptions, 'method' | 'body'>
): Promise<APIResponse<T>> {
  return apiIntegration.request<T>(url, { ...options, method: 'PUT', body: data });
}

export async function apiDelete<T = any>(
  url: string, 
  options?: Omit<APIRequestOptions, 'method'>
): Promise<APIResponse<T>> {
  return apiIntegration.request<T>(url, { ...options, method: 'DELETE' });
}