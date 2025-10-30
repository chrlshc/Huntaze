# Configuration Azure OpenAI pour Huntaze

Ce guide explique comment configurer le service AI de Huntaze pour utiliser Azure OpenAI avec votre système multi-agents.

## Prérequis

- Un compte Azure avec accès à Azure OpenAI Service
- Un déploiement Azure OpenAI configuré
- Les clés API et l'endpoint de votre ressource Azure OpenAI

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=votre-cle-api-azure
AZURE_OPENAI_ENDPOINT=https://votre-ressource.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Nom du déploiement (le nom que vous avez donné à votre modèle dans Azure)
DEFAULT_AI_MODEL=gpt-4o-mini

# Provider par défaut (toujours 'openai' pour Azure)
DEFAULT_AI_PROVIDER=openai

# Configuration du cache
NODE_ENV=production
```

### 2. Trouver vos informations Azure

#### Clé API
1. Allez sur le portail Azure
2. Naviguez vers votre ressource Azure OpenAI
3. Dans le menu de gauche, cliquez sur "Keys and Endpoint"
4. Copiez "KEY 1" ou "KEY 2"

#### Endpoint
Sur la même page "Keys and Endpoint", copiez l'URL de l'endpoint.
Format : `https://votre-ressource.openai.azure.com`

#### Nom du déploiement
1. Dans votre ressource Azure OpenAI, allez dans "Model deployments"
2. Cliquez sur "Manage Deployments"
3. Notez le nom de votre déploiement (par exemple : `gpt-4`, `gpt-4o-mini`, `gpt-35-turbo`)

### 3. Utilisation dans le code

Le service AI détecte automatiquement si vous utilisez Azure OpenAI :

```typescript
import { getAIService } from '@/lib/services/ai-service';

const aiService = getAIService();

// Générer du texte
const response = await aiService.generateText({
  prompt: 'Créer un message personnalisé pour un fan',
  context: {
    userId: 'user-123',
    contentType: 'message',
  },
  options: {
    temperature: 0.7,
    maxTokens: 500,
    model: 'gpt-4o-mini', // Nom de votre déploiement Azure
  },
});

console.log(response.content);
```

## Système Multi-Agents

Le service AI est compatible avec les systèmes multi-agents Azure OpenAI. Chaque agent peut utiliser le même service avec des prompts système différents selon le type de contenu :

- **Message** : Messages personnalisés pour les fans
- **Caption** : Légendes pour les réseaux sociaux
- **Idea** : Idées de contenu créatif
- **Pricing** : Optimisation des prix
- **Timing** : Analyse du timing optimal

### Exemple avec différents agents

```typescript
// Agent pour les messages
const messageResponse = await aiService.generateText({
  prompt: 'Créer un message de bienvenue chaleureux',
  context: {
    userId: 'user-123',
    contentType: 'message',
  },
});

// Agent pour les légendes
const captionResponse = await aiService.generateText({
  prompt: 'Créer une légende engageante pour une photo',
  context: {
    userId: 'user-123',
    contentType: 'caption',
  },
});

// Agent pour les idées
const ideaResponse = await aiService.generateText({
  prompt: 'Suggérer 3 idées de contenu tendance',
  context: {
    userId: 'user-123',
    contentType: 'idea',
  },
});
```

## Fonctionnalités

### Cache
Le service inclut un système de cache pour réduire les coûts et améliorer les performances :
- TTL par défaut : 5 minutes
- Taille maximale : 1000 entrées
- Activé automatiquement en production

### Rate Limiting
Protection contre les dépassements de quota :
- 60 requêtes par minute
- 3000 requêtes par heure
- 10000 requêtes par jour

### Gestion des erreurs
Le service gère automatiquement :
- Erreurs réseau
- Erreurs d'authentification
- Dépassements de quota
- Timeouts

## Tests

Les tests sont configurés pour Azure OpenAI. Pour exécuter les tests :

```bash
npm test tests/unit/ai-service.test.ts
```

Les tests Claude et les tests de fallback sont désactivés car non pertinents pour votre configuration Azure.

## Dépannage

### Erreur d'authentification
- Vérifiez que `AZURE_OPENAI_API_KEY` est correcte
- Vérifiez que la clé n'a pas expiré dans Azure

### Erreur 404
- Vérifiez que `AZURE_OPENAI_ENDPOINT` est correct
- Vérifiez que le nom du modèle correspond à votre déploiement Azure

### Erreur de quota
- Vérifiez vos limites dans Azure Portal
- Augmentez les limites si nécessaire
- Le rate limiting local vous protège des dépassements

## Support

Pour plus d'informations sur Azure OpenAI :
- [Documentation Azure OpenAI](https://learn.microsoft.com/azure/ai-services/openai/)
- [Guide de démarrage rapide](https://learn.microsoft.com/azure/ai-services/openai/quickstart)
