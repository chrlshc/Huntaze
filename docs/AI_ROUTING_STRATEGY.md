# Stratégie de Routage AI pour Huntaze

## Vue d'ensemble

Système de routage intelligent qui optimise les coûts en utilisant GPT-4o-mini pour 80-95% des requêtes et GPT-4o pour les tâches complexes.

## Règles de Routage

### GPT-4o-mini (80-95% des requêtes)

**Cas d'usage:**
- Chatbot & Support client
- Modération de contenu (NSFW, compliance basique)
- Génération de contenu marketing simple
- Analytics basiques
- Analyse de sentiment

**Coût estimé:** $2-3 pour 1000 requêtes

### GPT-4o (5-20% des requêtes)

**Cas d'usage:**
- Stratégie & planification complexe
- Analyses avancées et prédictions
- Compliance & légal (zéro tolérance)
- Documentation technique détaillée
- Code generation

**Coût estimé:** $25-100 pour 1000 requêtes

## Optimisations Techniques

### 1. Prompt Caching
Structure: contenu statique en début, dynamique en fin
Économie: 90% sur tokens répétés

### 2. Streaming
Améliore la perception de latence sans coût additionnel

### 3. Fallback Automatique
GPT-4o → GPT-4o-mini en cas d'erreur

### 4. Monitoring
Track tokens, latence, coûts par type de tâche


## Utilisation

```typescript
import { aiService } from '@/lib/services/ai-service-optimized';

// Exemple: Chatbot (utilisera gpt-4o-mini)
const response = await aiService.processRequest({
  taskType: 'chatbot',
  prompt: 'Comment augmenter mon engagement?',
  context: { creatorId: '123', tier: 'premium' },
  options: { stream: true }
});

// Exemple: Stratégie (utilisera gpt-4o)
const strategy = await aiService.processRequest({
  taskType: 'strategy',
  prompt: 'Créer une campagne marketing multi-canal',
  context: { budget: 5000, audience: 'fans-premium' },
  options: { maxTokens: 1000 }
});

// Voir les statistiques
const stats = aiService.getStats();
console.log(`Mini: ${stats.miniPercentage}%`);
console.log(`Cache hit: ${stats.cacheHitRate}%`);
```

## Estimation des Coûts

Pour 100,000 requêtes/mois avec 90% mini:

```typescript
import { estimateMonthlyCost } from '@/lib/services/ai-router';

const cost = estimateMonthlyCost({
  requestsPerDay: 3333,
  avgInputTokens: 500,
  avgOutputTokens: 200,
  miniPercentage: 90
});

// Résultat:
// miniCost: $180
// fullCost: $250
// totalCost: $430
// savings: $2070 (vs 100% GPT-4o)
```

## Modèles Disponibles

| Modèle | Input ($/1M) | Output ($/1M) | Cached ($/1M) |
|--------|--------------|---------------|---------------|
| gpt-4o | $2.50 | $10.00 | $0.25 |
| gpt-4o-mini | $0.15 | $0.60 | $0.015 |

## Métriques de Performance

- Latence moyenne mini: 200-500ms
- Latence moyenne full: 500-1500ms
- Cache hit rate cible: >80%
- Mini usage cible: 80-95%
