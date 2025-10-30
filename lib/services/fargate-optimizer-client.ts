/**
 * Client HTTP pour l'API Fargate Cost Optimizer
 * Gère l'authentification, les tokens, et les appels API REST
 */

import { 
  OptimizationPlan, 
  OptimizationReport, 
  FargateOptimizerError 
} from './fargate-cost-optimizer';

// Configuration du client
export interface FargateOptimizerClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    baseDelay: number;
  };
}

// Interface pour l'authentification
export interface AuthProvider {
  getToken(): Promise<string>;
  refreshToken(): Promise<string>;
  isTokenValid(token: string): boolean;
}

// Implémentation d'authentification AWS Cognito
export class CognitoAuthProvider implements AuthProvider {
  private currentToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private clientId: string,
    private userPoolId: string,
    private region: string
  ) {}

  async getToken(): Promise<string> {
    if (this.currentToken && this.isTokenValid(this.currentToken)) {
      return this.currentToken;
    }
    
    return this.refreshToken();
  }

  async refreshToken(): Promise<string> {
    // Implémentation simplifiée - en production, utiliser AWS Cognito SDK
    const response = await fetch(`https://cognito-idp.${this.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        'Content-Type': 'application/x-amz-json-1.1'
      },
      body: JSON.stringify({
        ClientId: this.clientId,
        AuthFlow: 'USER_SRP_AUTH',
        // ... autres paramètres d'auth
      })
    });

    if (!response.ok) {
      throw new FargateOptimizerError(
        'Failed to authenticate with Cognito',
        'AUTH_FAILED',
        response.status
      );
    }

    const data = await response.json();
    this.currentToken = data.AuthenticationResult.AccessToken;
    this.tokenExpiry = Date.now() + (data.AuthenticationResult.ExpiresIn * 1000);
    
    return this.currentToken!;
  }

  isTokenValid(token: string): boolean {
    return token === this.currentToken && Date.now() < this.tokenExpiry;
  }
}

// Client HTTP avec gestion des erreurs et retry
export class FargateOptimizerClient {
  private readonly config: Required<FargateOptimizerClientConfig>;
  private authProvider?: AuthProvider;

  constructor(
    config: FargateOptimizerClientConfig,
    authProvider?: AuthProvider
  ) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      retryConfig: {
        maxRetries: config.retryConfig?.maxRetries || 3,
        baseDelay: config.retryConfig?.baseDelay || 1000
      }
    };
    this.authProvider = authProvider;
  }

  /**
   * Analyse une task definition via l'API REST
   */
  async analyzeTask(taskDefinition: string): Promise<OptimizationPlan> {
    const url = `${this.config.baseUrl}/api/v1/optimize/${encodeURIComponent(taskDefinition)}`;
    
    return this.makeRequest<OptimizationPlan>('GET', url);
  }

  /**
   * Optimise plusieurs tâches en lot
   */
  async optimizeBatch(taskDefinitions: string[]): Promise<OptimizationReport> {
    const url = `${this.config.baseUrl}/api/v1/optimize/batch`;
    
    return this.makeRequest<OptimizationReport>('POST', url, {
      taskDefinitions
    });
  }

  /**
   * Récupère le statut d'une optimisation en cours
   */
  async getOptimizationStatus(jobId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    result?: OptimizationReport;
    error?: string;
  }> {
    const url = `${this.config.baseUrl}/api/v1/jobs/${encodeURIComponent(jobId)}`;
    
    return this.makeRequest('GET', url);
  }

  /**
   * Lance une optimisation asynchrone
   */
  async startAsyncOptimization(taskDefinitions: string[]): Promise<{
    jobId: string;
    estimatedDuration: number;
  }> {
    const url = `${this.config.baseUrl}/api/v1/optimize/async`;
    
    return this.makeRequest('POST', url, {
      taskDefinitions
    });
  }

  /**
   * Récupère les métriques de coût historiques
   */
  async getCostMetrics(
    taskDefinition: string,
    timeRange: { from: Date; to: Date }
  ): Promise<{
    actualCosts: Array<{ date: string; cost: number }>;
    projectedSavings: Array<{ date: string; savings: number }>;
  }> {
    const url = `${this.config.baseUrl}/api/v1/metrics/${encodeURIComponent(taskDefinition)}`;
    const params = new URLSearchParams({
      from: timeRange.from.toISOString(),
      to: timeRange.to.toISOString()
    });
    
    return this.makeRequest('GET', `${url}?${params}`);
  }

  /**
   * Effectue une requête HTTP avec retry et gestion d'erreurs
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    body?: any
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.retryConfig.maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'FargateOptimizerClient/1.0'
        };

        // Ajouter l'authentification
        if (this.authProvider) {
          const token = await this.authProvider.getToken();
          headers['Authorization'] = `Bearer ${token}`;
        } else if (this.config.apiKey) {
          headers['X-API-Key'] = this.config.apiKey;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            // Ignore JSON parse errors
          }

          const error = new FargateOptimizerError(
            errorMessage,
            this.getErrorCode(response.status),
            response.status,
            this.isRetryableStatus(response.status)
          );

          // Handle authentication errors
          if (response.status === 401 && this.authProvider) {
            await this.authProvider.refreshToken();
            // Don't count auth refresh as a retry attempt
            attempt--;
            continue;
          }

          throw error;
        }

        const result = await response.json();
        return result as T;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on non-retryable errors
        if (error instanceof FargateOptimizerError && !error.retryable) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === this.config.retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.config.retryConfig.baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Détermine le code d'erreur basé sur le status HTTP
   */
  private getErrorCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 429: return 'RATE_LIMITED';
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'HTTP_ERROR';
    }
  }

  /**
   * Détermine si un status HTTP est retryable
   */
  private isRetryableStatus(status: number): boolean {
    // Retry sur les erreurs serveur et certaines erreurs client
    return status >= 500 || status === 429 || status === 408;
  }

  /**
   * Utilitaire pour attendre un délai
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory pour créer des clients configurés
export class FargateOptimizerClientFactory {
  /**
   * Crée un client pour l'environnement de développement
   */
  static createDevelopmentClient(): FargateOptimizerClient {
    return new FargateOptimizerClient({
      baseUrl: 'http://localhost:3000',
      timeout: 10000,
      retryConfig: {
        maxRetries: 2,
        baseDelay: 500
      }
    });
  }

  /**
   * Crée un client pour l'environnement de production
   */
  static createProductionClient(
    apiKey: string,
    region = 'eu-west-1'
  ): FargateOptimizerClient {
    return new FargateOptimizerClient({
      baseUrl: `https://api.huntaze.com`,
      apiKey,
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000
      }
    });
  }

  /**
   * Crée un client avec authentification Cognito
   */
  static createCognitoClient(
    baseUrl: string,
    cognitoConfig: {
      clientId: string;
      userPoolId: string;
      region: string;
    }
  ): FargateOptimizerClient {
    const authProvider = new CognitoAuthProvider(
      cognitoConfig.clientId,
      cognitoConfig.userPoolId,
      cognitoConfig.region
    );

    return new FargateOptimizerClient({
      baseUrl,
      timeout: 30000
    }, authProvider);
  }
}

// Utilitaires pour le debouncing des appels API
export class DebouncedOptimizer {
  private pendingRequests = new Map<string, Promise<OptimizationPlan>>();
  private debounceDelay: number;

  constructor(
    private client: FargateOptimizerClient,
    debounceDelay = 1000
  ) {
    this.debounceDelay = debounceDelay;
  }

  /**
   * Analyse une tâche avec debouncing pour éviter les appels redondants
   */
  async analyzeTask(taskDefinition: string): Promise<OptimizationPlan> {
    // Si une requête est déjà en cours pour cette tâche, la retourner
    const existing = this.pendingRequests.get(taskDefinition);
    if (existing) {
      return existing;
    }

    // Créer une nouvelle requête avec debouncing
    const request = new Promise<OptimizationPlan>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await this.client.analyzeTask(taskDefinition);
          this.pendingRequests.delete(taskDefinition);
          resolve(result);
        } catch (error) {
          this.pendingRequests.delete(taskDefinition);
          reject(error);
        }
      }, this.debounceDelay);
    });

    this.pendingRequests.set(taskDefinition, request);
    return request;
  }

  /**
   * Annule toutes les requêtes en attente
   */
  cancelPendingRequests(): void {
    this.pendingRequests.clear();
  }
}

// Exemple d'usage
export const createOptimizedClient = () => {
  const client = FargateOptimizerClientFactory.createProductionClient(
    process.env.FARGATE_OPTIMIZER_API_KEY!
  );

  return new DebouncedOptimizer(client, 2000);
};