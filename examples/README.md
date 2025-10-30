# 📚 Exemples d'Utilisation du Système de Routage AI

Ce dossier contient des exemples pratiques d'utilisation du système de routage AI intelligent de Huntaze.

## 📁 Fichiers

### `ai-routing-examples.ts`
10 exemples complets couvrant tous les cas d'usage:

1. **Chatbot Support Client** - Réponses aux fans (gpt-4o-mini)
2. **Modération de Contenu** - NSFW detection (gpt-4o-mini)
3. **Génération Marketing** - Instagram captions (gpt-4o-mini)
4. **Analytics Basiques** - Métriques d'engagement (gpt-4o-mini)
5. **Stratégie Marketing** - Campagnes complexes (gpt-4o)
6. **Analyse Avancée** - Prédictions revenus (gpt-4o)
7. **Compliance Check** - Validation légale (gpt-4o)
8. **Routage Manuel** - Vérifier décisions sans appel
9. **Estimation Coûts** - Calculer coûts mensuels
10. **Monitoring** - Tracker usage et stats

## 🚀 Utilisation Rapide

```typescript
import { aiService } from '@/lib/services/ai-service-optimized';

// Exemple simple: Chatbot
const response = await aiService.processRequest({
  taskType: 'chatbot',
  prompt: 'Comment augmenter mon engagement?',
  context: { creatorId: '123' },
  options: { stream: true }
});

console.log(response.content);
console.log(`Coût: $${response.cost}`);
console.log(`Modèle: ${response.model}`);
```

## 📊 Exemples par Catégorie

### Tâches Simples (gpt-4o-mini)
- `handleFanMessage()` - Chatbot
- `moderateContent()` - Modération
- `generateInstagramCaption()` - Marketing
- `analyzeEngagement()` - Analytics

### Tâches Complexes (gpt-4o)
- `createMarketingStrategy()` - Stratégie
- `predictRevenue()` - Prédictions
- `checkCompliance()` - Compliance

### Utilitaires
- `demonstrateManualRouting()` - Test routage
- `estimateHuntazeCosts()` - Calcul coûts
- `monitorUsage()` - Stats temps réel

## 💡 Tips

### 1. Toujours spécifier le taskType
```typescript
// ✅ Bon
taskType: 'chatbot'

// ❌ Mauvais
taskType: 'general' // Pas assez spécifique
```

### 2. Utiliser le streaming pour l'UX
```typescript
options: { stream: true }
// Améliore perception de latence
```

### 3. Limiter maxTokens approprié
```typescript
// Chatbot simple
options: { maxTokens: 150 }

// Stratégie complexe
options: { maxTokens: 1500 }
```

### 4. Monitorer les coûts
```typescript
const stats = aiService.getStats();
console.log(`Mini: ${stats.miniPercentage}%`);
console.log(`Coût total: $${stats.totalCost}`);
```

## 🧪 Tester les Exemples

```bash
# Importer et tester
import * as examples from './examples/ai-routing-examples';

# Tester chatbot
await examples.handleFanMessage('Hi!', 'creator123');

# Tester stratégie
await examples.createMarketingStrategy({
  budget: 5000,
  duration: '3 months',
  goals: ['engagement'],
  audience: 'premium'
});

# Voir les stats
await examples.monitorUsage();
```

## 📖 Documentation Complète

- [AI Routing Strategy](../docs/AI_ROUTING_STRATEGY.md)
- [Cost Comparison](../docs/AI_COST_COMPARISON.md)
- [Best Practices](../docs/AI_BEST_PRACTICES.md)
- [Implementation Guide](../AI_ROUTING_IMPLEMENTATION_COMPLETE.md)

## 🎯 Cas d'Usage Recommandés

| Cas d'Usage | taskType | Modèle | Coût |
|-------------|----------|--------|------|
| Chat support | `chatbot` | mini | $0.002 |
| Modération | `moderation` | mini | $0.001 |
| Marketing | `marketing_template` | mini | $0.002 |
| Analytics | `basic_analytics` | mini | $0.002 |
| Stratégie | `strategy` | full | $0.05 |
| Prédictions | `advanced_analytics` | full | $0.03 |
| Compliance | `compliance` | full | $0.02 |

## ⚠️ Important

- Les tâches `compliance` et `legal` utilisent **TOUJOURS** gpt-4o
- Le streaming n'a **pas de coût additionnel**
- Le cache peut réduire les coûts de **90%**
- Monitorer régulièrement le ratio mini/full (cible: 80-95%)

## 🤝 Contribution

Pour ajouter un nouvel exemple:

1. Ajouter la fonction dans `ai-routing-examples.ts`
2. Documenter le cas d'usage
3. Spécifier le coût estimé
4. Ajouter un test dans `scripts/test-ai-routing.mjs`

## 📞 Support

Questions? Consultez:
- [Documentation complète](../docs/)
- [Tests de validation](../scripts/test-ai-routing.mjs)
- [Guide d'implémentation](../AI_ROUTING_IMPLEMENTATION_COMPLETE.md)
