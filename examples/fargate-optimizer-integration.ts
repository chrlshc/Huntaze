/**
 * Exemple d'intégration complète du Fargate Cost Optimizer
 * Démontre l'utilisation de tous les composants avec gestion d'erreurs,
 * retry, cache, logging et monitoring
 */

import { 
  FargateTaskOptimizer, 
  AutoOptimizationService,
  FargateOptimizerError,
  CloudWatchError,
  ECSError
} from '../lib/services/fargate-cost-optimizer';
import { 
  FargateOptimizerClient,
  FargateOptimizerClientFactory,
  DebouncedOptimizer
} from '../lib/services/fargate-optimizer-client';
import { 
  FargateOptimizerConfigFactory,
  createLogger,
  createAWSClients
} from '../config/fargate-optimizer.config';

/**
 * Exemple 1: Usage basique avec configuration automatique
 */
async function basicUsageExample() {
  console.log('=== Exemple 1: Usage Basique ===');
  
  try {
    // Créer la configuration depuis l'environnement
    const config = FargateOptimizerConfigFactory.fromEnvironment();
    
    // Créer le logger configuré
    const logger = createLogger(config);
    
    // Créer les clients AWS
    const { cloudwatch, ecs } = createAWSClients(config);
    
    // Créer l'optimiseur
    const optimizer = new FargateTaskOptimizer(cloudwatch, ecs, logger);
    
    // Analyser une tâche
    const plan = await optimizer.analyzeAndOptimize('huntaze-browser-worker');
    
    console.log('Plan d\'optimisation:');
    console.log(`- Coût actuel: $${plan.currentCost}/mois`);
    console.log(`- Économies: $${plan.potentialSavings}/mois`);
    console.log(`- CPU recommandé: ${plan.recommendedConfig.cpu}`);
    console.log(`- Mémoire recommandée: ${plan.recommendedConfig.memory}`);
    console.log(`- Spot éligible: ${plan.recommendedConfig.spotEligible}`);
    console.log(`- Graviton compatible: ${plan.gravitonCompatible}`);
    
  } catch (error) {
    if (error instanceof CloudWatchError) {
      console.error('Erreur CloudWatch:', error.message);
    } else if (error instanceof ECSError) {
      console.error('Erreur ECS:', error.message);
    } else {
      console.error('Erreur générale:', error);
    }
  }
}

/**
 * Exemple 2: Optimisation en lot avec monitoring
 */
async function batchOptimizationExample() {
  console.log('\n=== Exemple 2: Optimisation en Lot ===');
  
  try {
    const config = FargateOptimizerConfigFactory.create('production');
    const logger = createLogger(config);
    const { cloudwatch, ecs } = createAWSClients(config);
    
    // Mock du système de monitoring unifié
    const mockMonitoring = {
      async trackCrossStackMetrics(event: any) {
        logger.info('Monitoring event', event);
      }
    };
    
    const optimizer = new FargateTaskOptimizer(cloudwatch, ecs, logger);
    const autoService = new AutoOptimizationService(optimizer, logger, mockMonitoring);
    
    // Optimiser toutes les tâches par défaut
    const report = await autoService.optimizeAllTasks();
    
    console.log('Rapport d\'optimisation:');
    console.log(`- Tâches optimisées: ${report.optimizedTasks}`);
    console.log(`- Tâches en échec: ${report.failedTasks}`);
    console.log(`- Économies totales: $${report.totalMonthlySavings}/mois`);
    
    // Détails par tâche
    report.results.forEach(result => {
      if (result.success) {
        console.log(`  ✅ ${result.taskDefinition}: $${result.plan?.potentialSavings}/mois`);
      } else {
        console.log(`  ❌ ${result.taskDefinition}: ${result.error}`);
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'optimisation en lot:', error);
  }
}

/**
 * Exemple 3: Client HTTP avec authentification
 */
async function httpClientExample() {
  console.log('\n=== Exemple 3: Client HTTP ===');
  
  try {
    // Créer un client pour l'environnement de production
    const client = FargateOptimizerClientFactory.createProductionClient(
      process.env.FARGATE_OPTIMIZER_API_KEY || 'demo-key'
    );
    
    // Utiliser le debouncing pour éviter les appels redondants
    const debouncedClient = new DebouncedOptimizer(client, 2000);
    
    // Analyser plusieurs tâches (les appels redondants seront debouncés)
    const tasks = ['task-1', 'task-1', 'task-2', 'task-1']; // task-1 répétée
    
    const results = await Promise.allSettled(
      tasks.map(task => debouncedClient.analyzeTask(task))
    );
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const plan = result.value;
        console.log(`Tâche ${tasks[index]}: $${plan.potentialSavings}/mois d'économies`);
      } else {
        console.error(`Erreur pour ${tasks[index]}:`, result.reason.message);
      }
    });
    
  } catch (error) {
    console.error('Erreur du client HTTP:', error);
  }
}

/**
 * Exemple 4: Gestion avancée des erreurs et retry
 */
async function errorHandlingExample() {
  console.log('\n=== Exemple 4: Gestion d\'Erreurs ===');
  
  const config = FargateOptimizerConfigFactory.createCustom({
    api: {
      timeout: 5000,
      retryConfig: {
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 2000,
        backoffMultiplier: 2
      }
    },
    logging: {
      level: 'debug',
      format: 'text',
      outputs: ['console']
    }
  });
  
  const logger = createLogger(config);
  
  // Simuler des clients AWS qui échouent
  const mockCloudWatch = {
    send: async () => {
      throw new Error('CloudWatch temporarily unavailable');
    }
  };
  
  const mockECS = {
    send: async () => {
      return {
        taskDefinition: {
          containerDefinitions: [{ image: 'node:18' }]
        }
      };
    }
  };
  
  const optimizer = new FargateTaskOptimizer(
    mockCloudWatch as any, 
    mockECS as any, 
    logger
  );
  
  try {
    await optimizer.analyzeAndOptimize('failing-task');
  } catch (error) {
    if (error instanceof FargateOptimizerError) {
      console.log(`Erreur capturée: ${error.code} - ${error.message}`);
      console.log(`Retryable: ${error.retryable}`);
      console.log(`Status: ${error.statusCode}`);
    }
  }
}

/**
 * Exemple 5: Monitoring et métriques personnalisées
 */
async function monitoringExample() {
  console.log('\n=== Exemple 5: Monitoring Personnalisé ===');
  
  const config = FargateOptimizerConfigFactory.create('production');
  const logger = createLogger(config);
  
  // Système de métriques personnalisé
  class CustomMetrics {
    private metrics: Array<{
      name: string;
      value: number;
      timestamp: Date;
      tags: Record<string, string>;
    }> = [];
    
    async recordMetric(name: string, value: number, tags: Record<string, string> = {}) {
      this.metrics.push({
        name,
        value,
        timestamp: new Date(),
        tags
      });
      
      logger.info('Custom metric recorded', { name, value, tags });
    }
    
    getMetrics() {
      return this.metrics;
    }
  }
  
  const customMetrics = new CustomMetrics();
  
  // Monitoring wrapper
  const monitoringWrapper = {
    async trackCrossStackMetrics(event: any) {
      await customMetrics.recordMetric('fargate_optimizer_event', event.performance, {
        stack: event.stack,
        action: event.action
      });
    }
  };
  
  // Mock des clients AWS qui réussissent
  const mockCloudWatch = {
    send: async () => ({
      Datapoints: [
        { Average: 50, ExtendedStatistics: { p99: 80, p95: 70, p90: 60 } }
      ]
    })
  };
  
  const mockECS = {
    send: async () => ({
      taskDefinition: {
        containerDefinitions: [{ image: 'node:18' }]
      }
    })
  };
  
  const optimizer = new FargateTaskOptimizer(
    mockCloudWatch as any,
    mockECS as any,
    logger
  );
  
  const autoService = new AutoOptimizationService(
    optimizer,
    logger,
    monitoringWrapper
  );
  
  // Exécuter l'optimisation avec monitoring
  await autoService.optimizeAllTasks(['monitored-task']);
  
  // Afficher les métriques collectées
  const metrics = customMetrics.getMetrics();
  console.log(`Métriques collectées: ${metrics.length}`);
  metrics.forEach(metric => {
    console.log(`- ${metric.name}: ${metric.value} (${JSON.stringify(metric.tags)})`);
  });
}

/**
 * Exemple 6: Configuration par environnement
 */
async function environmentConfigExample() {
  console.log('\n=== Exemple 6: Configuration par Environnement ===');
  
  const environments = ['development', 'test', 'production'];
  
  environments.forEach(env => {
    const config = FargateOptimizerConfigFactory.create(env);
    
    console.log(`Configuration ${env}:`);
    console.log(`- Région AWS: ${config.aws.region}`);
    console.log(`- Timeout API: ${config.api.timeout}ms`);
    console.log(`- Max retries: ${config.api.retryConfig.maxRetries}`);
    console.log(`- Cache type: ${config.cache.type}`);
    console.log(`- Log level: ${config.logging.level}`);
    console.log(`- Concurrence: ${config.optimization.concurrency}`);
    console.log('');
  });
}

/**
 * Exemple 7: Intégration avec cache Redis
 */
async function redisCacheExample() {
  console.log('\n=== Exemple 7: Cache Redis ===');
  
  // Mock du client Redis
  class MockRedisCache {
    private cache = new Map<string, { value: any; expires: number }>();
    
    async get<T>(key: string): Promise<T | null> {
      const item = this.cache.get(key);
      if (!item || Date.now() > item.expires) {
        return null;
      }
      console.log(`Cache HIT: ${key}`);
      return item.value as T;
    }
    
    async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
      this.cache.set(key, {
        value,
        expires: Date.now() + (ttlSeconds * 1000)
      });
      console.log(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    }
    
    async delete(key: string): Promise<void> {
      this.cache.delete(key);
      console.log(`Cache DELETE: ${key}`);
    }
  }
  
  const config = FargateOptimizerConfigFactory.createCustom({
    cache: {
      type: 'redis',
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0
      }
    }
  });
  
  const logger = createLogger(config);
  const redisCache = new MockRedisCache();
  
  // Mock des clients AWS
  const mockCloudWatch = {
    send: async () => {
      console.log('Appel CloudWatch API (coûteux)');
      return {
        Datapoints: [
          { Average: 50, ExtendedStatistics: { p99: 80, p95: 70, p90: 60 } }
        ]
      };
    }
  };
  
  const mockECS = {
    send: async () => {
      console.log('Appel ECS API (coûteux)');
      return {
        taskDefinition: {
          containerDefinitions: [{ image: 'node:18' }]
        }
      };
    }
  };
  
  const optimizer = new FargateTaskOptimizer(
    mockCloudWatch as any,
    mockECS as any,
    logger,
    redisCache
  );
  
  // Premier appel (cache miss)
  console.log('Premier appel:');
  await optimizer.analyzeAndOptimize('cached-task');
  
  // Deuxième appel (cache hit)
  console.log('\nDeuxième appel:');
  await optimizer.analyzeAndOptimize('cached-task');
}

/**
 * Fonction principale pour exécuter tous les exemples
 */
async function runAllExamples() {
  console.log('🚀 Exemples d\'intégration Fargate Cost Optimizer\n');
  
  try {
    await basicUsageExample();
    await batchOptimizationExample();
    await httpClientExample();
    await errorHandlingExample();
    await monitoringExample();
    await environmentConfigExample();
    await redisCacheExample();
    
    console.log('\n✅ Tous les exemples ont été exécutés avec succès!');
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution des exemples:', error);
  }
}

// Exporter les exemples pour utilisation individuelle
export {
  basicUsageExample,
  batchOptimizationExample,
  httpClientExample,
  errorHandlingExample,
  monitoringExample,
  environmentConfigExample,
  redisCacheExample,
  runAllExamples
};

// Exécuter si appelé directement
if (require.main === module) {
  runAllExamples();
}