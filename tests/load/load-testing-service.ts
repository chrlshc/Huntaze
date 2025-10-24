/**
 * Load Testing Service
 * Service pour tester les performances sous charge
 */

interface LoadTestConfig {
  targetUrl: string;
  concurrentUsers: number;
  duration: number; // en secondes
  rampUpTime: number; // temps pour atteindre le pic d'utilisateurs
  requestsPerSecond?: number;
  headers?: Record<string, string>;
  scenarios: LoadTestScenario[];
}

interface LoadTestScenario {
  name: string;
  weight: number; // pourcentage du trafic (0-100)
  requests: LoadTestRequest[];
}

interface LoadTestRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: any;
  expectedStatus?: number;
  timeout?: number;
}

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorsPerSecond: number;
  throughput: number; // bytes per second
  concurrentUsers: number;
  errorRate: number;
  timeouts: number;
}

interface LoadTestResult {
  config: LoadTestConfig;
  metrics: LoadTestMetrics;
  errors: Array<{
    timestamp: number;
    error: string;
    request: LoadTestRequest;
    responseTime: number;
  }>;
  timeline: Array<{
    timestamp: number;
    activeUsers: number;
    rps: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  recommendations: string[];
}

/**
 * Service de test de charge
 */
export class LoadTestingService {
  private isRunning = false;
  private startTime = 0;
  private responseTimes: number[] = [];
  private errors: Array<any> = [];
  private timeline: Array<any> = [];
  private activeRequests = 0;

  /**
   * Execute un test de charge
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }

    console.log(`[LoadTest] Starting load test with ${config.concurrentUsers} users for ${config.duration}s`);
    
    this.reset();
    this.isRunning = true;
    this.startTime = Date.now();

    try {
      // Démarrer le monitoring des métriques
      const metricsInterval = setInterval(() => {
        this.captureMetrics();
      }, 1000);

      // Exécuter le test
      await this.executeLoadTest(config);

      // Arrêter le monitoring
      clearInterval(metricsInterval);

      // Calculer les métriques finales
      const metrics = this.calculateFinalMetrics(config);
      
      // Générer des recommandations
      const recommendations = this.generateRecommendations(metrics);

      const result: LoadTestResult = {
        config,
        metrics,
        errors: this.errors,
        timeline: this.timeline,
        recommendations,
      };

      console.log(`[LoadTest] Completed. Success rate: ${(100 - metrics.errorRate).toFixed(2)}%`);
      
      return result;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Exécute le test de charge principal
   */
  private async executeLoadTest(config: LoadTestConfig): Promise<void> {
    const promises: Promise<void>[] = [];
    const userStartInterval = (config.rampUpTime * 1000) / config.concurrentUsers;

    // Démarrer les utilisateurs progressivement
    for (let i = 0; i < config.concurrentUsers; i++) {
      const userPromise = new Promise<void>((resolve) => {
        setTimeout(async () => {
          await this.simulateUser(config, i);
          resolve();
        }, i * userStartInterval);
      });

      promises.push(userPromise);
    }

    // Attendre la fin du test ou le timeout
    const testTimeout = (config.duration + config.rampUpTime) * 1000;
    await Promise.race([
      Promise.all(promises),
      new Promise(resolve => setTimeout(resolve, testTimeout))
    ]);
  }

  /**
   * Simule un utilisateur pendant la durée du test
   */
  private async simulateUser(config: LoadTestConfig, userId: number): Promise<void> {
    const endTime = this.startTime + (config.duration * 1000);
    
    while (Date.now() < endTime && this.isRunning) {
      try {
        // Sélectionner un scénario basé sur les poids
        const scenario = this.selectScenario(config.scenarios);
        
        // Exécuter les requêtes du scénario
        for (const request of scenario.requests) {
          if (Date.now() >= endTime) break;
          
          await this.executeRequest(config.targetUrl, request, userId);
          
          // Pause entre les requêtes (simule le comportement utilisateur)
          await this.sleep(Math.random() * 1000 + 500); // 0.5-1.5s
        }
        
      } catch (error) {
        console.error(`[LoadTest] User ${userId} error:`, error);
      }
    }
  }

  /**
   * Sélectionne un scénario basé sur les poids
   */
  private selectScenario(scenarios: LoadTestScenario[]): LoadTestScenario {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        return scenario;
      }
    }
    
    return scenarios[0]; // Fallback
  }

  /**
   * Exécute une requête HTTP
   */
  private async executeRequest(
    baseUrl: string, 
    request: LoadTestRequest, 
    userId: number
  ): Promise<void> {
    const startTime = Date.now();
    this.activeRequests++;

    try {
      const url = `${baseUrl}${request.path}`;
      const timeout = request.timeout || 30000;

      const fetchPromise = fetch(url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `LoadTest-User-${userId}`,
          ...this.getAuthHeaders(),
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const responseTime = Date.now() - startTime;
      
      this.responseTimes.push(responseTime);

      // Vérifier le statut de réponse
      const expectedStatus = request.expectedStatus || 200;
      if (response.status !== expectedStatus) {
        this.errors.push({
          timestamp: Date.now(),
          error: `Unexpected status: ${response.status}`,
          request,
          responseTime,
        });
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.errors.push({
        timestamp: Date.now(),
        error: (error as Error).message,
        request,
        responseTime,
      });

    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Capture les métriques à un instant donné
   */
  private captureMetrics(): void {
    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000;
    
    const recentResponses = this.responseTimes.slice(-100); // 100 dernières réponses
    const recentErrors = this.errors.filter(e => now - e.timestamp < 1000); // Erreurs de la dernière seconde
    
    const avgResponseTime = recentResponses.length > 0 
      ? recentResponses.reduce((sum, time) => sum + time, 0) / recentResponses.length 
      : 0;

    const rps = recentResponses.length; // Approximation
    const errorRate = recentErrors.length / Math.max(recentResponses.length, 1) * 100;

    this.timeline.push({
      timestamp: now,
      activeUsers: this.activeRequests,
      rps,
      avgResponseTime,
      errorRate,
    });
  }

  /**
   * Calcule les métriques finales
   */
  private calculateFinalMetrics(config: LoadTestConfig): LoadTestMetrics {
    const totalRequests = this.responseTimes.length;
    const failedRequests = this.errors.length;
    const successfulRequests = totalRequests - failedRequests;
    
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    
    const p50Index = Math.floor(sortedTimes.length * 0.5);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    const totalTime = (Date.now() - this.startTime) / 1000;
    const requestsPerSecond = totalRequests / totalTime;
    const errorsPerSecond = failedRequests / totalTime;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: totalRequests > 0 
        ? this.responseTimes.reduce((sum, time) => sum + time, 0) / totalRequests 
        : 0,
      p50ResponseTime: sortedTimes[p50Index] || 0,
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      minResponseTime: Math.min(...sortedTimes) || 0,
      maxResponseTime: Math.max(...sortedTimes) || 0,
      requestsPerSecond,
      errorsPerSecond,
      throughput: 0, // À implémenter si nécessaire
      concurrentUsers: config.concurrentUsers,
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
      timeouts: this.errors.filter(e => e.error.includes('timeout')).length,
    };
  }

  /**
   * Génère des recommandations basées sur les métriques
   */
  private generateRecommendations(metrics: LoadTestMetrics): string[] {
    const recommendations: string[] = [];

    // Analyse du taux d'erreur
    if (metrics.errorRate > 5) {
      recommendations.push(`High error rate (${metrics.errorRate.toFixed(2)}%). Consider scaling up or optimizing error handling.`);
    }

    // Analyse de la latence
    if (metrics.p95ResponseTime > 2000) {
      recommendations.push(`High P95 latency (${metrics.p95ResponseTime}ms). Consider caching, database optimization, or CDN.`);
    }

    if (metrics.averageResponseTime > 1000) {
      recommendations.push(`High average response time (${metrics.averageResponseTime.toFixed(0)}ms). Optimize slow endpoints.`);
    }

    // Analyse du throughput
    if (metrics.requestsPerSecond < 10) {
      recommendations.push(`Low throughput (${metrics.requestsPerSecond.toFixed(2)} RPS). Consider horizontal scaling.`);
    }

    // Analyse des timeouts
    if (metrics.timeouts > metrics.totalRequests * 0.01) {
      recommendations.push(`High timeout rate. Increase timeout values or optimize long-running operations.`);
    }

    // Recommandations positives
    if (metrics.errorRate < 1 && metrics.p95ResponseTime < 500) {
      recommendations.push('Excellent performance! System handles load well.');
    }

    return recommendations;
  }

  /**
   * Obtient les headers d'authentification pour les tests
   */
  private getAuthHeaders(): Record<string, string> {
    // En production, utiliser des tokens de test dédiés
    const testToken = process.env.LOAD_TEST_API_KEY || 'test-api-key';
    
    return {
      'Authorization': `Bearer ${testToken}`,
    };
  }

  /**
   * Utilitaire sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset des métriques
   */
  private reset(): void {
    this.responseTimes = [];
    this.errors = [];
    this.timeline = [];
    this.activeRequests = 0;
  }

  /**
   * Arrêt forcé du test
   */
  stop(): void {
    this.isRunning = false;
  }
}

/**
 * Configurations de test prédéfinies
 */
export class LoadTestConfigs {
  /**
   * Test de smoke (vérification basique)
   */
  static smokeTest(baseUrl: string): LoadTestConfig {
    return {
      targetUrl: baseUrl,
      concurrentUsers: 5,
      duration: 30,
      rampUpTime: 10,
      scenarios: [
        {
          name: 'basic_endpoints',
          weight: 100,
          requests: [
            { method: 'GET', path: '/api/health' },
            { method: 'POST', path: '/api/content-ideas/generate', body: this.getSampleContentRequest() },
          ],
        },
      ],
    };
  }

  /**
   * Test de charge normale
   */
  static loadTest(baseUrl: string): LoadTestConfig {
    return {
      targetUrl: baseUrl,
      concurrentUsers: 50,
      duration: 300, // 5 minutes
      rampUpTime: 60,
      scenarios: [
        {
          name: 'content_generation',
          weight: 40,
          requests: [
            { method: 'POST', path: '/api/content-ideas/generate', body: this.getSampleContentRequest() },
          ],
        },
        {
          name: 'optimization',
          weight: 30,
          requests: [
            { method: 'POST', path: '/api/optimize/pricing', body: this.getSamplePricingRequest() },
          ],
        },
        {
          name: 'analytics',
          weight: 20,
          requests: [
            { method: 'GET', path: '/api/analytics/dashboard' },
          ],
        },
        {
          name: 'health_check',
          weight: 10,
          requests: [
            { method: 'GET', path: '/api/health' },
          ],
        },
      ],
    };
  }

  /**
   * Test de stress (charge élevée)
   */
  static stressTest(baseUrl: string): LoadTestConfig {
    return {
      targetUrl: baseUrl,
      concurrentUsers: 200,
      duration: 600, // 10 minutes
      rampUpTime: 120,
      scenarios: [
        {
          name: 'heavy_content_generation',
          weight: 60,
          requests: [
            { method: 'POST', path: '/api/content-ideas/generate', body: this.getSampleContentRequest() },
            { method: 'POST', path: '/api/content/generate', body: this.getSampleContentGenerationRequest() },
          ],
        },
        {
          name: 'optimization_burst',
          weight: 40,
          requests: [
            { method: 'POST', path: '/api/optimize/pricing', body: this.getSamplePricingRequest() },
            { method: 'POST', path: '/api/optimize/timing', body: this.getSampleTimingRequest() },
          ],
        },
      ],
    };
  }

  /**
   * Test de spike (pic soudain)
   */
  static spikeTest(baseUrl: string): LoadTestConfig {
    return {
      targetUrl: baseUrl,
      concurrentUsers: 500,
      duration: 120, // 2 minutes
      rampUpTime: 10, // Montée très rapide
      scenarios: [
        {
          name: 'spike_scenario',
          weight: 100,
          requests: [
            { method: 'GET', path: '/api/health' },
            { method: 'POST', path: '/api/content-ideas/generate', body: this.getSampleContentRequest() },
          ],
        },
      ],
    };
  }

  // Données de test
  private static getSampleContentRequest() {
    return {
      creatorProfile: {
        id: 'test-user',
        niche: ['fitness', 'lifestyle'],
        contentTypes: ['photo', 'video'],
        audiencePreferences: ['morning_content', 'workout_tips'],
        performanceHistory: {
          topPerformingContent: [],
          engagementPatterns: {},
          revenueByCategory: {},
        },
        currentGoals: ['increase_engagement'],
        constraints: {
          equipment: ['smartphone'],
          location: ['home'],
          timeAvailability: 'evenings',
        },
      },
      options: {
        count: 5,
        focusArea: 'trending',
      },
    };
  }

  private static getSamplePricingRequest() {
    return {
      contentId: 'test-content-123',
      currentPrice: 9.99,
      contentType: 'photo',
      historicalPerformance: {
        views: 1000,
        purchases: 50,
        revenue: 499.50,
        conversionRate: 5.0,
      },
      audienceData: {
        averageSpending: 25.00,
        priceElasticity: -1.2,
        segmentSize: 5000,
      },
    };
  }

  private static getSampleTimingRequest() {
    return {
      contentId: 'test-content-123',
      contentType: 'photo',
      historicalEngagement: [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          engagement: 150,
          reach: 1000,
          revenue: 25.00,
        },
      ],
      audienceTimezone: 'UTC',
    };
  }

  private static getSampleContentGenerationRequest() {
    return {
      type: 'caption',
      context: {
        contentType: 'photo',
        theme: 'fitness motivation',
        tone: 'energetic',
        length: 'medium',
      },
    };
  }
}

// Export de l'instance
export const loadTesting = new LoadTestingService();