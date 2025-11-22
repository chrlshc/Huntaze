# Service AI Gemini - Huntaze

## Vue d'Ensemble

Service d'intelligence artificielle utilisant Google Gemini pour générer du contenu, analyser les performances et assister les créateurs de contenu.

## Migration d'OpenAI vers Gemini

### Pourquoi Gemini?

- ✅ **Performance:** Modèles puissants (Gemini 1.5 Pro)
- ✅ **Coût:** Plus économique qu'OpenAI
- ✅ **Multimodal:** Support natif texte, image, vidéo
- ✅ **Context Window:** Jusqu'à 2M tokens (Gemini 1.5 Pro)
- ✅ **Gratuit:** Quota gratuit généreux pour débuter

### Modèles Disponibles

| Modèle | Description | Use Case |
|--------|-------------|----------|
| `gemini-1.5-pro` | Le plus puissant | Tâches complexes, analyse approfondie |
| `gemini-1.5-flash` | Rapide et économique | Génération rapide, chatbots |
| `gemini-1.0-pro` | Stable et fiable | Production, tâches standard |

## Installation

### 1. Installer le Package

```bash
npm install @google/generative-ai
```

### 2. Configurer les Variables d'Environnement

Ajouter dans `.env`:

```bash
# Google Gemini API
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-1.5-pro
```

### 3. Obtenir une Clé API

1. Aller sur: https://makersuite.google.com/app/apikey
2. Créer une nouvelle clé API
3. Copier la clé dans `.env`

## Utilisation

### Génération de Texte Simple

```typescript
import { generateText } from '@/lib/ai/gemini.service';

const text = await generateText(
  'Écris une description pour une plateforme de créateurs',
  {
    temperature: 0.7,
    maxOutputTokens: 200,
  }
);

console.log(text);
```

### Chat avec Historique

```typescript
import { chat } from '@/lib/ai/gemini.service';

const messages = [
  {
    role: 'user',
    parts: 'Bonjour! Je suis un créateur de contenu.',
  },
  {
    role: 'model',
    parts: 'Bonjour! Comment puis-je vous aider?',
  },
  {
    role: 'user',
    parts: 'Donne-moi 3 idées de posts Instagram.',
  },
];

const response = await chat(messages, {
  temperature: 0.8,
  maxOutputTokens: 500,
});

console.log(response);
```

### Streaming

```typescript
import { generateTextStream } from '@/lib/ai/gemini.service';

for await (const chunk of generateTextStream(
  'Écris un guide pour TikTok',
  { maxOutputTokens: 1000 }
)) {
  process.stdout.write(chunk);
}
```

### Service Complet

```typescript
import { geminiService } from '@/lib/ai/gemini.service';

// Générer du texte
const result = await geminiService.generateText('Hello!');
console.log(result.text);

// Compter les tokens
const tokenCount = await geminiService.countTokens('Mon texte');
console.log(`Tokens: ${tokenCount}`);

// Changer de modèle
geminiService.setModel('gemini-1.5-flash');
```

## Exemples d'Utilisation

### 1. Génération de Contenu pour Créateurs

```typescript
import { generateCreatorContent } from '@/lib/ai/gemini.examples';

const post = await generateCreatorContent(
  'Instagram',
  'Conseils pour augmenter l\'engagement',
  'casual'
);

console.log(post);
```

### 2. Analyse de Performance

```typescript
import { analyzeContentPerformance } from '@/lib/ai/gemini.examples';

const analysis = await analyzeContentPerformance('post Instagram', {
  views: 10000,
  likes: 500,
  comments: 50,
  shares: 20,
});

console.log(analysis);
```

### 3. Génération d'Idées

```typescript
import { generateContentIdeas } from '@/lib/ai/gemini.examples';

const ideas = await generateContentIdeas('fitness', 5);
console.log(ideas);
```

### 4. Optimisation de Bio

```typescript
import { optimizeBio } from '@/lib/ai/gemini.examples';

const optimized = await optimizeBio(
  'Créateur de contenu fitness 💪',
  'Instagram',
  'Jeunes adultes 18-35 ans'
);

console.log(optimized);
```

### 5. Légendes pour Images

```typescript
import { generateImageCaption } from '@/lib/ai/gemini.examples';

const caption = await generateImageCaption(
  'Coucher de soleil sur la plage',
  'inspirant',
  true
);

console.log(caption);
```

## Configuration Avancée

### Options de Génération

```typescript
interface GeminiGenerateOptions {
  temperature?: number;        // 0.0 - 1.0 (défaut: 0.7)
  maxOutputTokens?: number;    // Max tokens (défaut: 2048)
  topP?: number;               // 0.0 - 1.0 (défaut: 0.95)
  topK?: number;               // Nombre de tokens (défaut: 40)
  stopSequences?: string[];    // Séquences d'arrêt
}
```

### Paramètres Recommandés

**Contenu Créatif:**
```typescript
{
  temperature: 0.8-0.9,
  maxOutputTokens: 500-1000,
  topP: 0.95,
}
```

**Analyse/Factuel:**
```typescript
{
  temperature: 0.3-0.5,
  maxOutputTokens: 300-600,
  topP: 0.9,
}
```

**Chat/Conversation:**
```typescript
{
  temperature: 0.7,
  maxOutputTokens: 400-800,
  topP: 0.95,
}
```

## Intégration dans l'Application

### Route API

Créer `app/api/ai/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/gemini.service';

export async function POST(request: NextRequest) {
  try {
    const { prompt, options } = await request.json();
    
    const text = await generateText(prompt, options);
    
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    );
  }
}
```

### Hook React

Créer `hooks/useGemini.ts`:

```typescript
import { useState } from 'react';

export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (prompt: string, options?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, options }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate');
      }

      const data = await response.json();
      return data.text;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
}
```

## Comparaison OpenAI vs Gemini

| Fonctionnalité | OpenAI | Gemini |
|----------------|--------|--------|
| Prix (1M tokens) | $10-30 | $0.50-7 |
| Context Window | 128K | 2M |
| Multimodal | Limité | Natif |
| Streaming | ✅ | ✅ |
| Function Calling | ✅ | ✅ |
| Quota Gratuit | Limité | Généreux |

## Limites et Quotas

### Quota Gratuit (par minute)

- **Gemini 1.5 Pro:** 2 requêtes/min
- **Gemini 1.5 Flash:** 15 requêtes/min
- **Gemini 1.0 Pro:** 15 requêtes/min

### Quota Payant

- Voir: https://ai.google.dev/pricing

## Sécurité

### Filtres de Sécurité

Gemini inclut des filtres automatiques pour:
- Contenu haineux
- Harcèlement
- Contenu sexuel
- Contenu dangereux

### Bonnes Pratiques

1. ✅ Ne jamais exposer la clé API côté client
2. ✅ Utiliser des routes API Next.js
3. ✅ Valider les entrées utilisateur
4. ✅ Implémenter un rate limiting
5. ✅ Logger les erreurs

## Dépannage

### Erreur: API Key Invalid

```bash
# Vérifier que la clé est bien configurée
echo $GEMINI_API_KEY

# Régénérer une nouvelle clé si nécessaire
```

### Erreur: Quota Exceeded

```bash
# Attendre 1 minute ou upgrader vers un plan payant
# Implémenter un système de queue pour les requêtes
```

### Erreur: Safety Filters

```bash
# Le contenu a été bloqué par les filtres de sécurité
# Reformuler le prompt ou ajuster les paramètres
```

## Ressources

- **Documentation:** https://ai.google.dev/docs
- **Pricing:** https://ai.google.dev/pricing
- **API Key:** https://makersuite.google.com/app/apikey
- **Examples:** https://ai.google.dev/examples

## Support

Pour toute question:
- Consulter la documentation officielle
- Vérifier les exemples dans `gemini.examples.ts`
- Contacter l'équipe de développement

## Rate Limiting avec ElastiCache Redis

### Migration Upstash → ElastiCache

Le système de rate limiting a été migré vers AWS ElastiCache Redis pour:
- ✅ Réduire les coûts de 45% ($80 → $44/mois)
- ✅ Améliorer les performances (latence 10-20x plus rapide)
- ✅ Renforcer la sécurité (VPC privé)

### Documentation

- **Guide de déploiement**: `docs/ELASTICACHE_DEPLOYMENT_GUIDE.md`
- **État de la migration**: `lib/ai/ELASTICACHE_MIGRATION_STATUS.md`
- **Prochaines étapes**: `ELASTICACHE_NEXT_STEPS.md`

### Configuration

```bash
# Variables d'environnement
ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379
```

### Test de Connectivité

```bash
# Vérifier la configuration
./scripts/verify-elasticache-setup.sh

# Tester la connexion
curl https://votre-app.amplifyapp.com/api/test-redis
```

### Utilisation

```typescript
import { checkCreatorRateLimit } from '@/lib/ai/rate-limit';

// Vérifier le rate limit
try {
  await checkCreatorRateLimit('creator-123', 'pro');
  // Requête autorisée
} catch (error) {
  if (error instanceof RateLimitError) {
    // Rate limit dépassé
    console.log(`Retry after: ${error.retryAfter}s`);
  }
}
```

---

**Version:** 2.0  
**Date:** 2025-01-21  
**Statut:** ✅ Prêt pour Production  
**Rate Limiting:** ✅ ElastiCache Redis
