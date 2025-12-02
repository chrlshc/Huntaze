# Stratégie de Migration vers Azure US East 2

## Résumé Exécutif

Ce document décrit la réorientation de l'infrastructure IA de Huntaze vers la région Microsoft Azure **"East US 2"** aux États-Unis. Ce changement stratégique vise à accéder aux technologies de pointe 2025 déployées en priorité dans cette région "Hero" de Microsoft.

## Motivations du Changement

### Pourquoi US East 2 ?

| Critère | West Europe (Ancien) | East US 2 (Nouveau) |
|---------|---------------------|---------------------|
| Disponibilité modèles 2025 | Retardée | Prioritaire |
| GPT-4o Realtime | ❌ Non disponible | ✅ Disponible |
| Prompt Caching | ❌ Limité | ✅ Complet |
| API Batch | ❌ Non disponible | ✅ Disponible |
| Saturation | Élevée | Faible |
| Statut région | Standard | **Hero Region** |

### Avantages Clés

1. **Accès prioritaire** aux nouvelles fonctionnalités Azure OpenAI
2. **Latence réduite** grâce au mode Global Standard
3. **Coûts optimisés** avec Prompt Caching et API Batch
4. **Capacité garantie** dans une région moins saturée

---

## 1. Nouveaux Modèles 2025

### GPT-4o (Omni) - Modèle Principal

**Remplace:** GPT-4 Turbo

```typescript
const GPT4O_CONFIG = {
  deployment: 'gpt-4o-2024-11-20',
  mode: 'GlobalStandard',
  contextWindow: 128000,
  pricing: {
    input: 0.0025,   // $2.50/1M tokens
    output: 0.01,    // $10/1M tokens
    cached: 0.00125, // 50% réduction avec cache
  },
  features: [
    'multimodal',
    'structured-output',
    'function-calling',
    'vision',
  ],
};
```

**Cas d'usage:**
- AnalyticsAI (analyses complexes)
- MessagingAI (conversations personnalisées)
- Content Generation (captions multimodales)

### GPT-4o Mini - Modèle Économique

**Remplace:** GPT-3.5 Turbo

```typescript
const GPT4O_MINI_CONFIG = {
  deployment: 'gpt-4o-mini-2024-07-18',
  mode: 'GlobalStandard',
  contextWindow: 128000,
  pricing: {
    input: 0.00015,  // $0.15/1M tokens (60% moins cher que GPT-3.5)
    output: 0.0006,  // $0.60/1M tokens
    cached: 0.000075, // 50% réduction avec cache
  },
  features: [
    'fast-inference',
    'structured-output',
    'function-calling',
  ],
};
```

**Cas d'usage:**
- SalesAI (optimisation messages)
- ComplianceAI (vérification contenu)
- Tâches à haut volume

### GPT-4o Realtime - Conversations Vocales

**Nouveau:** Disponible uniquement US East 2 et Suède

```typescript
const GPT4O_REALTIME_CONFIG = {
  deployment: 'gpt-4o-realtime-preview',
  mode: 'GlobalStandard',
  latency: '<200ms', // Latence humaine
  pricing: {
    audio_input: 0.06,   // $60/1M tokens
    audio_output: 0.24,  // $240/1M tokens
    text_input: 0.005,
    text_output: 0.02,
  },
  features: [
    'voice-to-voice',
    'real-time-streaming',
    'emotion-detection',
    'interruption-handling',
  ],
};
```

**Cas d'usage futurs:**
- Agents vocaux Huntaze
- Support client en temps réel
- Coaching vocal pour créateurs

### Text-Embedding-3-Large - Nouveaux Embeddings

**Remplace:** text-embedding-ada-002

```typescript
const EMBEDDING_V3_CONFIG = {
  deployment: 'text-embedding-3-large',
  dimensions: 3072, // Configurable: 256, 1024, 3072
  pricing: 0.00013, // $0.13/1M tokens
  features: [
    'dimension-reduction',
    'improved-accuracy',
    'multilingual',
  ],
};
```

**Avantages:**
- Précision améliorée de 15%
- Compression possible (3072 → 1024) sans perte significative
- Meilleur support multilingue

---

## 2. Optimisations de Coûts 2025

### Prompt Caching

Mise en cache automatique des instructions répétitives.

```typescript
interface PromptCachingConfig {
  enabled: true;
  minTokensForCache: 1024; // Minimum pour activer le cache
  cacheTTL: 3600; // 1 heure
  costReduction: 0.5; // 50% de réduction
  latencyReduction: 0.2; // 20% plus rapide
}

// Exemple d'utilisation
const response = await azure.chat([
  {
    role: 'system',
    content: AGENT_SYSTEM_PROMPT, // ~2000 tokens - sera caché
    cache_control: { type: 'ephemeral' },
  },
  {
    role: 'user',
    content: userMessage,
  },
]);
```

**Économies estimées:**
- Prompts système agents: -50% coûts
- Contextes de personnalité: -50% coûts
- Documents de référence: -50% coûts

### API Batch

Traitement asynchrone à moitié prix (délai 24h max).

```typescript
interface BatchAPIConfig {
  enabled: true;
  maxWaitTime: 86400; // 24 heures
  costReduction: 0.5; // 50% de réduction
  useCases: [
    'nightly-analytics',
    'daily-summaries',
    'bulk-content-generation',
    'log-analysis',
  ];
}

// Exemple d'utilisation
const batchJob = await azure.createBatch({
  requests: analyticsRequests,
  completionWindow: '24h',
  metadata: { type: 'nightly-analytics' },
});

// Récupération des résultats
const results = await azure.getBatchResults(batchJob.id);
```

**Cas d'usage:**
- Analyses nocturnes des performances
- Résumés quotidiens pour créateurs
- Génération de contenu en masse
- Analyse de logs et métriques

---

## 3. Configuration Infrastructure

### Terraform - Région US East 2

```hcl
# infra/terraform/azure-ai-useast2/main.tf

locals {
  location = "eastus2"
  resource_prefix = "huntaze-ai"
}

resource "azurerm_cognitive_account" "openai" {
  name                = "${local.resource_prefix}-openai"
  location            = local.location
  resource_group_name = azurerm_resource_group.main.name
  kind                = "OpenAI"
  sku_name            = "S0"

  network_acls {
    default_action = "Deny"
    ip_rules       = []
    virtual_network_rules {
      subnet_id = azurerm_subnet.private.id
    }
  }
}

# GPT-4o Deployment
resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = "gpt-4o-prod"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  
  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = "2024-11-20" # Version figée
  }
  
  sku {
    name     = "GlobalStandard"
    capacity = 100 # PTU
  }
}

# GPT-4o Mini Deployment
resource "azurerm_cognitive_deployment" "gpt4o_mini" {
  name                 = "gpt-4o-mini-prod"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  
  model {
    format  = "OpenAI"
    name    = "gpt-4o-mini"
    version = "2024-07-18"
  }
  
  sku {
    name     = "GlobalStandard"
    capacity = 200
  }
}

# GPT-4o Realtime Deployment
resource "azurerm_cognitive_deployment" "gpt4o_realtime" {
  name                 = "gpt-4o-realtime-prod"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  
  model {
    format  = "OpenAI"
    name    = "gpt-4o-realtime-preview"
    version = "2024-10-01"
  }
  
  sku {
    name     = "GlobalStandard"
    capacity = 50
  }
}

# Embeddings V3 Deployment
resource "azurerm_cognitive_deployment" "embedding_v3" {
  name                 = "text-embedding-3-large-prod"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  
  model {
    format  = "OpenAI"
    name    = "text-embedding-3-large"
    version = "1"
  }
  
  sku {
    name     = "Standard"
    capacity = 100
  }
}

# Private Endpoint
resource "azurerm_private_endpoint" "openai" {
  name                = "${local.resource_prefix}-openai-pe"
  location            = local.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private.id

  private_service_connection {
    name                           = "openai-connection"
    private_connection_resource_id = azurerm_cognitive_account.openai.id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }
}
```

### Variables d'Environnement

```env
# .env.azure.useast2

# Azure OpenAI - US East 2
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-openai.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-10-01-preview

# Deployments 2025
AZURE_OPENAI_DEPLOYMENT_GPT4O=gpt-4o-prod
AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI=gpt-4o-mini-prod
AZURE_OPENAI_DEPLOYMENT_GPT4O_REALTIME=gpt-4o-realtime-prod
AZURE_OPENAI_DEPLOYMENT_EMBEDDING_V3=text-embedding-3-large-prod

# Feature Flags
AZURE_ENABLE_PROMPT_CACHING=true
AZURE_ENABLE_BATCH_API=true
AZURE_ENABLE_REALTIME=false  # Activer quand prêt

# Embedding Configuration
AZURE_EMBEDDING_DIMENSIONS=3072
```

---

## 4. Recherche Vectorielle (RAG) Mise à Jour

### Nouveau Schéma d'Index

```json
{
  "name": "huntaze-memory-index-v3",
  "fields": [
    {
      "name": "id",
      "type": "Edm.String",
      "key": true
    },
    {
      "name": "content",
      "type": "Edm.String",
      "searchable": true
    },
    {
      "name": "contentVector",
      "type": "Collection(Edm.Single)",
      "dimensions": 3072,
      "vectorSearchProfile": "huntaze-vector-profile"
    },
    {
      "name": "metadata",
      "type": "Edm.ComplexType",
      "fields": [
        { "name": "fanId", "type": "Edm.String", "filterable": true },
        { "name": "creatorId", "type": "Edm.String", "filterable": true },
        { "name": "timestamp", "type": "Edm.DateTimeOffset", "filterable": true }
      ]
    }
  ],
  "vectorSearch": {
    "profiles": [
      {
        "name": "huntaze-vector-profile",
        "algorithm": "huntaze-hnsw-config",
        "vectorizer": "huntaze-vectorizer"
      }
    ],
    "algorithms": [
      {
        "name": "huntaze-hnsw-config",
        "kind": "hnsw",
        "hnswParameters": {
          "m": 4,
          "efConstruction": 400,
          "efSearch": 500,
          "metric": "cosine"
        }
      }
    ],
    "vectorizers": [
      {
        "name": "huntaze-vectorizer",
        "kind": "azureOpenAI",
        "azureOpenAIParameters": {
          "resourceUri": "https://huntaze-ai-openai.openai.azure.com",
          "deploymentId": "text-embedding-3-large-prod",
          "modelName": "text-embedding-3-large"
        }
      }
    ]
  }
}
```

### Migration des Embeddings

```typescript
// Script de migration ada-002 → embedding-3-large
async function migrateEmbeddings() {
  const oldIndex = 'huntaze-memory-index';
  const newIndex = 'huntaze-memory-index-v3';
  
  // 1. Récupérer tous les documents
  const documents = await searchClient.search('*', {
    select: ['id', 'content', 'metadata'],
    top: 1000,
  });
  
  // 2. Régénérer les embeddings avec le nouveau modèle
  for (const batch of chunk(documents, 16)) {
    const texts = batch.map(d => d.content);
    const newEmbeddings = await embeddingService.generateEmbeddings(texts, {
      model: 'text-embedding-3-large',
      dimensions: 3072,
    });
    
    // 3. Indexer dans le nouvel index
    await newSearchClient.uploadDocuments(
      batch.map((doc, i) => ({
        ...doc,
        contentVector: newEmbeddings[i],
      }))
    );
  }
}
```

---

## 5. Stratégie de Résilience Hybride

### Circuit Breaker avec Fallback Batch

```typescript
class HybridCircuitBreaker {
  private globalStandardBreaker: CircuitBreaker;
  private batchQueue: BatchQueue;
  
  async execute<T>(request: AIRequest): Promise<T> {
    // 1. Essayer Global Standard (rapide)
    if (this.globalStandardBreaker.isAvailable()) {
      try {
        return await this.executeGlobalStandard(request);
      } catch (error) {
        this.globalStandardBreaker.recordFailure();
      }
    }
    
    // 2. Si saturé et non-urgent, basculer vers Batch
    if (!request.urgent && this.batchQueue.isAvailable()) {
      return await this.queueForBatch(request);
    }
    
    // 3. Fallback vers région secondaire
    return await this.executeFallback(request);
  }
  
  private async queueForBatch<T>(request: AIRequest): Promise<T> {
    const job = await this.batchQueue.add(request);
    
    // Retourner une promesse qui se résout quand le batch est traité
    return new Promise((resolve) => {
      this.batchQueue.onComplete(job.id, resolve);
    });
  }
}
```

### Priorités de Routage

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTING PRIORITY                              │
│                                                                  │
│  1. Global Standard (US East 2)                                 │
│     └── Latence: <500ms, Coût: Standard                         │
│                                                                  │
│  2. Batch API (si non-urgent)                                   │
│     └── Latence: <24h, Coût: -50%                               │
│                                                                  │
│  3. Région Secondaire (Sweden Central)                          │
│     └── Latence: ~800ms, Coût: Standard                         │
│                                                                  │
│  4. Fallback OpenAI Direct                                      │
│     └── Latence: Variable, Coût: Premium                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Mapping des Agents

### Avant (West Europe)

| Agent | Modèle | Tier |
|-------|--------|------|
| MessagingAI | GPT-4 | Standard |
| AnalyticsAI | GPT-4 Turbo | Premium |
| SalesAI | GPT-3.5 Turbo | Economy |
| ComplianceAI | GPT-3.5 Turbo | Economy |

### Après (US East 2)

| Agent | Modèle | Tier | Économie |
|-------|--------|------|----------|
| MessagingAI | GPT-4o | Premium | +20% qualité |
| AnalyticsAI | GPT-4o | Premium | +15% vitesse |
| SalesAI | GPT-4o Mini | Economy | -60% coût |
| ComplianceAI | GPT-4o Mini | Economy | -60% coût |
| VoiceAI (futur) | GPT-4o Realtime | Realtime | Nouveau |

---

## 7. Plan de Migration

### Phase 1: Infrastructure (Semaine 1)
- [ ] Créer ressources Azure US East 2
- [ ] Déployer modèles GPT-4o et GPT-4o Mini
- [ ] Configurer Private Endpoints
- [ ] Mettre à jour variables d'environnement

### Phase 2: Embeddings (Semaine 2)
- [ ] Créer nouvel index Cognitive Search
- [ ] Migrer embeddings vers text-embedding-3-large
- [ ] Valider recherche sémantique
- [ ] Basculer le trafic

### Phase 3: Agents (Semaine 3)
- [ ] Migrer MessagingAI vers GPT-4o
- [ ] Migrer AnalyticsAI vers GPT-4o
- [ ] Migrer SalesAI vers GPT-4o Mini
- [ ] Migrer ComplianceAI vers GPT-4o Mini

### Phase 4: Optimisations (Semaine 4)
- [ ] Activer Prompt Caching
- [ ] Configurer API Batch pour tâches nocturnes
- [ ] Implémenter Circuit Breaker hybride
- [ ] Valider économies de coûts

### Phase 5: Realtime (Futur)
- [ ] Évaluer cas d'usage vocaux
- [ ] Prototyper agents vocaux
- [ ] Déployer GPT-4o Realtime

---

## 8. Économies Projetées

### Comparaison Mensuelle (100M tokens/mois)

| Poste | Avant (West EU) | Après (US East 2) | Économie |
|-------|-----------------|-------------------|----------|
| GPT-4 Turbo → GPT-4o | $1,000 | $250 | -75% |
| GPT-3.5 → GPT-4o Mini | $50 | $15 | -70% |
| Embeddings | $10 | $13 | +30% |
| Prompt Caching | - | -$100 | -$100 |
| Batch API | - | -$50 | -$50 |
| **Total** | **$1,060** | **$128** | **-88%** |

---

## Conclusion

La migration vers US East 2 représente une modernisation majeure de l'infrastructure IA de Huntaze:

1. **Accès aux technologies 2025** (GPT-4o, Realtime, Embeddings V3)
2. **Réduction des coûts de 88%** grâce aux nouveaux modèles et optimisations
3. **Amélioration des performances** avec Global Standard et Prompt Caching
4. **Préparation pour le futur** avec GPT-4o Realtime pour les agents vocaux

Cette stratégie positionne Huntaze à la pointe de l'innovation IA tout en optimisant significativement les coûts opérationnels.
