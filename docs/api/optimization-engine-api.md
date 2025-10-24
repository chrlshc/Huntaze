# Optimization Engine API Documentation

## Overview

Le service Optimization Engine fournit des recommandations d'optimisation basées sur l'IA pour les prix, le timing et la détection d'anomalies de performance, avec une gestion robuste des erreurs, des mécanismes de retry et du caching.

## Configuration du Service

### Configuration des Retry
```typescript
interface RetryConfig {
  maxAttempts: number;      // Défaut: 3
  baseDelay: number;        // Défaut: 1000ms
  maxDelay: number;         // Défaut: 10000ms
  backoffMultiplier: number; // Défaut: 2
}
```

### Configuration du Cache
```typescript
interface CacheConfig {
  ttl: number;              // Défaut: 3600000ms (1 heure)
  maxSize: number;          // Défaut: 100 entrées
}
```

### Rate Limiting
- **Limite par défaut**: 100 requêtes par heure par opération
- **Fenêtre**: 3600000ms (1 heure)
- **Comportement**: Exponential backoff avec jitter

## Méthodes API

### optimizePricing

Génère des recommandations de prix optimisées avec gestion d'erreurs et retry automatique.

**Paramètres:**
```typescript
pricingData: PricingData
options?: {
  strategy?: 'revenue_max' | 'conversion_max' | 'balanced';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  testDuration?: number; // jours
}
```

**Retourne:**
```typescript
{
  contentId: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  expectedImpact: {
    revenueChange: number;
    conversionRateChange: number;
    demandChange: number;
  };
  confidence: number;
  reasoning: string[];
  testingStrategy: {
    duration: string;
    metrics: string[];
    successCriteria: string[];
  };
}
```

**Gestion d'erreurs:**
- Validation des données d'entrée avec Zod
- Retry automatique sur les erreurs réseau (429, 5xx)
- Fallback vers le prix actuel en cas d'échec
- Cache des résultats pour éviter les appels répétés

**Exemple d'utilisation:**
```typescript
const engine = getOptimizationEngine();

try {
  const recommendation = await engine.optimizePricing(pricingData, {
    strategy: 'balanced',
    riskTolerance: 'moderate'
  });
  
  console.log(`Recommended price: ${recommendation.recommendedPrice}`);
  console.log(`Expected revenue change: ${recommendation.expectedImpact.revenueChange}%`);
} catch (error) {
  console.error('Pricing optimization failed:', error.message);
}
```

### optimizeTiming

Analyse les patterns de timing et génère des recommandations de planification.

**Paramètres:**
```typescript
timingData: TimingData
options?: {
  lookAheadDays?: number;
  contentTypes?: string[];
  priorityMetric?: 'engagement' | 'revenue' | 'reach';
}
```

**Retourne:**
```typescript
{
  contentType: string;
  optimalTimes: Array<{
    dayOfWeek: string;
    timeRange: string;
    expectedEngagement: number;
    confidence: number;
  }>;
  avoidTimes: Array<{
    dayOfWeek: string;
    timeRange: string;
    reason: string;
  }>;
  seasonalInsights: {
    bestMonths: string[];
    worstMonths: string[];
    specialEvents: Array<{
      event: string;
      impact: 'positive' | 'negative';
      adjustment: string;
    }>;
  };
  personalizedSchedule: Array<{
    date: Date;
    timeSlot: string;
    contentType: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  }>;
}
```

### detectAnomalies

Détecte les anomalies de performance avec analyse statistique et IA.

**Paramètres:**
```typescript
performanceData: PerformanceMetric[]
options?: {
  sensitivity?: 'low' | 'medium' | 'high';
  lookbackDays?: number;
  minDataPoints?: number;
}
```

**Retourne:**
```typescript
PerformanceAnomaly[] // Triées par sévérité et récence
```

## Types d'Erreurs

### APIError
```typescript
interface APIError extends Error {
  code?: string;           // 'NETWORK_ERROR', 'TIMEOUT', etc.
  status?: number;         // Code de statut HTTP
  retryable?: boolean;     // Si l'erreur peut être retentée
  context?: Record<string, any>; // Contexte additionnel
}
```

### Erreurs Retryables
- Erreurs réseau (`NETWORK_ERROR`, `TIMEOUT`)
- Rate limiting (statut 429)
- Erreurs serveur (codes 5xx)
- Erreurs avec flag `retryable: true` explicite

### Erreurs Non-Retryables
- Erreurs d'authentification (401)
- Erreurs d'autorisation (403)
- Erreurs de validation (400)
- Erreurs avec flag `retryable: false` explicite

## Optimisations de Performance

### Stratégie de Cache
- **Données de pricing**: Cache pendant 1 heure par combinaison de paramètres
- **Insights de timing**: Cache pendant 2 heures
- **Clés de cache**: Déterministes basées sur les paramètres d'entrée
- **Invalidation**: TTL automatique + nettoyage LRU

### Suivi de l'Usage des Tokens
- Tracking de la consommation de tokens AI
- Métriques d'usage dans les métadonnées de réponse
- Aide au monitoring des coûts et à l'optimisation

### Stratégie de Retry
- Exponential backoff avec jitter
- Tentatives et délais configurables
- Classification intelligente des erreurs pour les décisions de retry

## Logging et Monitoring

### Logging de Debug
```typescript
// Activer le logging de debug en développement
process.env.NODE_ENV = 'development';
```

### Logging d'Erreurs
Toutes les erreurs sont loggées avec contexte:
```typescript
{
  error: string;           // Message d'erreur
  stack: string;           // Stack trace
  operation?: string;      // Opération en cours
  attempt?: number;        // Numéro de tentative
  tokensUsed?: number;     // Tokens consommés
  duration?: number;       // Durée de l'opération
  cacheHit?: boolean;      // Si le cache a été utilisé
}
```

## Health Check

### Vérification de Santé du Service
```typescript
const health = await engine.healthCheck();

console.log(`Status: ${health.status}`);
console.log(`AI Service: ${health.services.aiService ? 'OK' : 'FAIL'}`);
console.log(`Cache size: ${health.metrics.cacheSize}`);
console.log(`Cache hit rate: ${health.metrics.cacheHitRate}%`);
```

## Considérations de Rate Limiting

### Limites du Service AI
- Implémentation du rate limiting côté client
- Utilisation d'exponential backoff pour les réponses 429
- Monitoring de l'usage des tokens pour rester dans les quotas

### Limites Recommandées
- **Optimisation de prix**: 10 requêtes/heure par contenu
- **Optimisation de timing**: 5 requêtes/heure par type de contenu
- **Détection d'anomalies**: 20 requêtes/heure par dataset

## Meilleures Pratiques

### Gestion d'Erreurs
```typescript
try {
  const result = await engine.optimizePricing(data, options);
  // Traiter le succès
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Gérer le rate limiting
    const retryAfter = error.context?.resetIn || 60000;
    await delay(retryAfter);
    // Réessayer ou afficher un message à l'utilisateur
  } else if (error.code === 'VALIDATION_ERROR') {
    // Gérer les erreurs de validation
    console.error('Invalid input data:', error.context);
  } else {
    // Gérer les autres erreurs
    showErrorMessage('Optimization failed. Please try again.');
  }
}
```

### Optimisation des Performances
```typescript
// Utiliser les options appropriées pour de meilleures performances
const options = {
  strategy: 'balanced',        // Stratégie équilibrée plus rapide
  testDuration: 7,            // Durée de test plus courte
  lookAheadDays: 14,          // Moins de jours pour un traitement plus rapide
};
```

### Meilleures Pratiques de Cache
```typescript
// Vérifier le statut du cache et ajuster les requêtes en conséquence
const result = await engine.optimizePricing(data, options);

if (result.metadata?.cacheHit) {
  console.log('Used cached data - no additional API costs');
} else {
  console.log(`Fresh data generated - ${result.metadata?.tokensUsed} tokens used`);
}
```

## Exemples d'Intégration

### Intégration React Hook
```typescript
const useOptimization = (contentId: string) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const optimize = useCallback(async (data, options) => {
    setLoading(true);
    setError(null);
    
    try {
      const engine = getOptimizationEngine();
      const result = await engine.optimizePricing(data, options);
      setRecommendation(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendation, loading, error, optimize };
};
```

### Endpoint API Express.js
```typescript
app.post('/api/optimize/pricing', async (req, res) => {
  try {
    const { pricingData, options } = req.body;
    
    const engine = getOptimizationEngine();
    const result = await engine.optimizePricing(pricingData, options);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pricing optimization API error:', error);
    
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: 'Pricing optimization failed',
      message: error.message,
      code: error.code
    });
  }
});
```

## Métriques et Analytics

### Métriques Disponibles
- Nombre total de requêtes
- Taux de succès/échec
- Temps de réponse moyen
- Taux de cache hit
- Usage des tokens AI
- Fréquence des rate limits

### Monitoring Recommandé
- Alertes sur les taux d'erreur élevés
- Monitoring de la latence des API
- Suivi de l'usage des tokens pour le contrôle des coûts
- Alertes sur les rate limits fréquents