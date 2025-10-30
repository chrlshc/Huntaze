# Fargate Cost Optimizer API Documentation

## Overview

Le Fargate Cost Optimizer est un service de production qui analyse automatiquement les métriques d'utilisation des tâches ECS Fargate et génère des recommandations d'optimisation pour réduire les coûts de 60-80%.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudWatch    │    │  ECS Task Def    │    │   Cost Calc     │
│   Metrics API   │───▶│   Analysis       │───▶│  & Recommendations │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Retry Logic    │    │   Cache Layer    │    │   Logging       │
│  & Error        │    │   (5min TTL)     │    │   & Monitoring  │
│  Handling       │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Classes et Interfaces

### FargateTaskOptimizer

Service principal d'optimisation des tâches Fargate.

#### Constructor

```typescript
constructor(
  cloudwatch: CloudWatch,
  ecs: ECS,
  logger?: Logger,
  cache?: CacheManager
)
```

**Paramètres:**
- `cloudwatch`: Client AWS CloudWatch SDK v3
- `ecs`: Client AWS ECS SDK v3  
- `logger`: Interface de logging (optionnel, utilise console par défaut)
- `cache`: Gestionnaire de cache (optionnel, utilise MemoryCache par défaut)

#### Méthodes

##### analyzeAndOptimize()

Analyse une task definition et génère un plan d'optimisation complet.

```typescript
async analyzeAndOptimize(taskDefinition: string): Promise<OptimizationPlan>
```

**Paramètres:**
- `taskDefinition`: Nom de la task definition ECS à analyser

**Retour:** `OptimizationPlan`

**Erreurs:**
- `CloudWatchError`: Erreur lors de la récupération des métriques
- `ECSError`: Erreur lors de l'analyse de la task definition
- `FargateOptimizerError`: Erreur générale d'optimisation

**Exemple:**
```typescript
const optimizer = new FargateTaskOptimizer(cloudwatch, ecs);

try {
  const plan = await optimizer.analyzeAndOptimize('huntaze-browser-worker');
  console.log(`Économies potentielles: $${plan.potentialSavings}/mois`);
} catch (error) {
  if (error instanceof CloudWatchError) {
    console.error('Erreur CloudWatch:', error.message);
  }
}
```

### AutoOptimizationService

Service d'optimisation en lot avec gestion de la concurrence.

#### Constructor

```typescript
constructor(
  optimizer: FargateTaskOptimizer,
  logger?: Logger
)
```

#### Méthodes

##### optimizeAllTasks()

Optimise plusieurs task definitions en parallèle avec concurrence contrôlée.

```typescript
async optimizeAllTasks(taskDefinitions?: string[]): Promise<OptimizationReport>
```

**Paramètres:**
- `taskDefinitions`: Liste des task definitions (optionnel, utilise une liste par défaut)

**Retour:** `OptimizationReport`

**Exemple:**
```typescript
const autoService = new AutoOptimizationService(optimizer);

const report = await autoService.optimizeAllTasks([
  'huntaze-browser-worker',
  'huntaze-ai-processor',
  'huntaze-content-generator'
]);

console.log(`${report.optimizedTasks} tâches optimisées`);
console.log(`Économies totales: $${report.totalMonthlySavings}/mois`);
```

##### optimizeSingleTask()

Optimise une seule task definition avec gestion d'erreurs détaillée.

```typescript
async optimizeSingleTask(taskDefinition: string): Promise<OptimizationResult>
```

## Types et Interfaces

### OptimizationPlan

Plan d'optimisation complet pour une task definition.

```typescript
interface OptimizationPlan {
  currentCost: number;                    // Coût mensuel actuel ($)
  recommendedConfig: TaskSizeRecommendation;
  spotStrategy: CapacityProviderStrategy;
  potentialSavings: number;               // Économies mensuelles ($)
  gravitonCompatible: boolean;            // Compatible ARM64/Graviton
}
```

### TaskSizeRecommendation

Recommandations de sizing pour CPU et mémoire.

```typescript
interface TaskSizeRecommendation {
  cpu: string;              // CPU en unités Fargate ('256', '512', '1024', '2048')
  memory: string;           // Mémoire en MB ('512', '1024', '2048', '4096')
  estimatedSavings: number; // Pourcentage d'économies (0.0-1.0)
  spotEligible: boolean;    // Éligible pour Fargate Spot
  reasoning: string;        // Explication de la recommandation
}
```

### CapacityProviderStrategy

Stratégie de répartition On-Demand/Spot.

```typescript
interface CapacityProviderStrategy {
  capacityProviderStrategy: Array<{
    capacityProvider: string;  // 'FARGATE' ou 'FARGATE_SPOT'
    weight: number;           // Poids relatif (1-1000)
    base: number;             // Nombre minimum de tâches
  }>;
}
```

### OptimizationReport

Rapport d'optimisation en lot.

```typescript
interface OptimizationReport {
  optimizedTasks: number;        // Nombre de tâches optimisées avec succès
  failedTasks: number;          // Nombre de tâches en échec
  totalMonthlySavings: number;  // Économies mensuelles totales ($)
  results: OptimizationResult[]; // Résultats détaillés par tâche
}
```

## Gestion des Erreurs

### Hiérarchie d'Erreurs

```
FargateOptimizerError (base)
├── CloudWatchError (erreurs API CloudWatch)
└── ECSError (erreurs API ECS)
```

### Types d'Erreurs

#### FargateOptimizerError

Erreur de base avec support du retry.

```typescript
class FargateOptimizerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryable = false
  )
}
```

**Codes d'erreur courants:**
- `ANALYSIS_FAILED`: Échec de l'analyse générale
- `BATCH_OPTIMIZATION_FAILED`: Échec de l'optimisation en lot
- `INVALID_PARAMS`: Paramètres invalides

#### CloudWatchError

Erreurs spécifiques à l'API CloudWatch.

```typescript
class CloudWatchError extends FargateOptimizerError {
  // Automatiquement retryable par défaut
}
```

#### ECSError

Erreurs spécifiques à l'API ECS.

```typescript
class ECSError extends FargateOptimizerError {
  // Automatiquement retryable par défaut
}
```

## Stratégie de Retry

### Configuration par Défaut

```typescript
interface RetryConfig {
  maxRetries: 3;           // Maximum 3 tentatives
  baseDelay: 1000;         // Délai initial: 1 seconde
  maxDelay: 10000;         // Délai maximum: 10 secondes
  backoffMultiplier: 2;    // Backoff exponentiel x2
}
```

### Logique de Retry

1. **Erreurs retryables**: Erreurs réseau, timeouts, erreurs 5xx
2. **Erreurs non-retryables**: Erreurs 4xx, erreurs de validation
3. **Backoff exponentiel**: Délai = baseDelay × (backoffMultiplier ^ attempt)
4. **Jitter**: Variation aléatoire pour éviter les thundering herds

## Cache et Performance

### Stratégie de Cache

| Type de Données | TTL | Clé de Cache |
|------------------|-----|--------------|
| Plan d'optimisation | 1 heure | `optimization:{taskDefinition}` |
| Métriques CloudWatch | 5 minutes | `metrics:{taskDefinition}` |
| Compatibilité Graviton | 1 heure | `graviton:{taskDefinition}` |

### Optimisations Performance

1. **Cache multi-niveaux**: Mémoire → Redis (optionnel)
2. **Concurrence contrôlée**: Maximum 3 optimisations simultanées
3. **Debouncing**: Évite les appels API redondants
4. **Compression**: Réduction de la taille des réponses API

## Logging et Monitoring

### Niveaux de Log

- **INFO**: Début/fin d'opérations, métriques de performance
- **DEBUG**: Détails des appels API, données intermédiaires
- **WARN**: Tentatives de retry, données manquantes
- **ERROR**: Échecs d'API, erreurs de validation

### Métriques Importantes

```typescript
// Exemple de logs structurés
{
  "level": "info",
  "message": "Optimization analysis completed",
  "taskDefinition": "huntaze-browser-worker",
  "duration": 2341,
  "potentialSavings": 45.67,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Monitoring Recommandé

1. **Latence API**: P50, P95, P99 des appels CloudWatch/ECS
2. **Taux d'erreur**: Pourcentage d'échecs par type d'erreur
3. **Cache hit ratio**: Efficacité du cache
4. **Économies générées**: Suivi des économies réelles vs prédites

## Exemples d'Usage

### Usage Basique

```typescript
import { CloudWatch } from '@aws-sdk/client-cloudwatch';
import { ECS } from '@aws-sdk/client-ecs';
import { FargateTaskOptimizer } from './fargate-cost-optimizer';

const cloudwatch = new CloudWatch({ region: 'eu-west-1' });
const ecs = new ECS({ region: 'eu-west-1' });

const optimizer = new FargateTaskOptimizer(cloudwatch, ecs);

// Analyser une tâche
const plan = await optimizer.analyzeAndOptimize('my-task-definition');

console.log(`Coût actuel: $${plan.currentCost}/mois`);
console.log(`Économies: $${plan.potentialSavings}/mois`);
console.log(`CPU recommandé: ${plan.recommendedConfig.cpu}`);
console.log(`Mémoire recommandée: ${plan.recommendedConfig.memory}`);
```

### Usage Avancé avec Logger Personnalisé

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'optimizer.log' })
  ]
});

const optimizer = new FargateTaskOptimizer(
  cloudwatch, 
  ecs, 
  logger
);
```

### Optimisation en Lot

```typescript
import { AutoOptimizationService } from './fargate-cost-optimizer';

const autoService = new AutoOptimizationService(optimizer);

const report = await autoService.optimizeAllTasks([
  'web-server',
  'background-worker',
  'data-processor'
]);

console.log(`Résultats:`);
console.log(`- Tâches optimisées: ${report.optimizedTasks}`);
console.log(`- Tâches en échec: ${report.failedTasks}`);
console.log(`- Économies totales: $${report.totalMonthlySavings}/mois`);

// Détails par tâche
report.results.forEach(result => {
  if (result.success) {
    console.log(`✅ ${result.taskDefinition}: $${result.plan?.potentialSavings}/mois`);
  } else {
    console.log(`❌ ${result.taskDefinition}: ${result.error}`);
  }
});
```

## Bonnes Pratiques

### Sécurité

1. **Permissions IAM minimales**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cloudwatch:GetMetricStatistics",
           "ecs:DescribeTaskDefinition"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

2. **Validation des entrées**: Toujours valider les noms de task definitions
3. **Rate limiting**: Respecter les limites d'API AWS

### Performance

1. **Cache approprié**: Utiliser Redis en production
2. **Monitoring**: Surveiller les métriques de performance
3. **Batch processing**: Traiter plusieurs tâches en parallèle
4. **Timeout appropriés**: Configurer des timeouts raisonnables

### Fiabilité

1. **Circuit breaker**: Implémenter un circuit breaker pour les APIs externes
2. **Graceful degradation**: Continuer à fonctionner même avec des données partielles
3. **Health checks**: Exposer des endpoints de santé
4. **Alerting**: Configurer des alertes sur les métriques critiques

## Troubleshooting

### Erreurs Communes

#### "No datapoints found in metrics"

**Cause**: La task definition n'a pas de métriques CloudWatch
**Solution**: 
- Vérifier que Container Insights est activé
- Attendre que des métriques soient générées (24-48h)
- Vérifier le nom de la task definition

#### "CloudWatch service unavailable"

**Cause**: Problème temporaire avec l'API CloudWatch
**Solution**:
- Le retry automatique devrait résoudre le problème
- Vérifier les permissions IAM
- Vérifier la connectivité réseau

#### "Task definition not found"

**Cause**: La task definition n'existe pas ou n'est pas accessible
**Solution**:
- Vérifier l'orthographe du nom
- Vérifier les permissions ECS
- Vérifier que la task definition est dans la bonne région

### Debug

Activer les logs debug pour plus d'informations:

```typescript
const logger = {
  debug: (msg, meta) => console.debug(`[DEBUG] ${msg}`, meta),
  info: (msg, meta) => console.info(`[INFO] ${msg}`, meta),
  warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
  error: (msg, err, meta) => console.error(`[ERROR] ${msg}`, err, meta)
};
```