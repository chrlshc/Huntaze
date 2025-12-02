# Plan d'Action Tactique - Déploiement Azure AI Huntaze

**Date**: 1er décembre 2024  
**Objectif**: Déployer l'architecture Azure AI avec routage intelligent  
**Status**: Prêt pour exécution

---

## 🎯 SITUATION ACTUELLE

### Infrastructure Existante
- ✅ **AWS**: ECS Fargate + RDS + Redis + S3 (opérationnel)
- ✅ **Terraform Azure**: Configuré pour Azure OpenAI (GPT-4, GPT-3.5)
- ⚠️ **Modèles actuels**: Gemini + OpenAI direct (APIs externes)
- ❌ **DeepSeek/Llama/Mistral**: NON déployés (pas dans Terraform)

### Écart avec le Plan Proposé

Ton plan mentionne DeepSeek-R1, Llama 3.3 et Mistral Large, mais :
1. Ces modèles ne sont PAS dans ton `main.tf` actuel
2. Ton Terraform déploie uniquement Azure OpenAI (GPT-4, GPT-3.5)
3. DeepSeek/Llama/Mistral nécessitent Azure AI Studio (différent d'Azure OpenAI)

---

## 🔍 ANALYSE: Deux Stratégies Possibles

### Option A: Azure OpenAI Uniquement (RECOMMANDÉ)
**Avantages:**
- ✅ Infrastructure Terraform déjà prête
- ✅ Déploiement immédiat possible
- ✅ GPT-4o suffit pour tous les cas d'usage
- ✅ Moins de complexité
- ✅ Coûts prévisibles

**Modèles disponibles:**
- GPT-4 Turbo (premium)
- GPT-4 (standard)
- GPT-3.5 Turbo (économique)
- GPT-4 Vision (images)
- Text Embedding Ada-002 (embeddings)

### Option B: Multi-Provider avec Azure AI Studio
**Avantages:**
- ✅ Accès à DeepSeek, Llama, Mistral
- ✅ Optimisation coûts par cas d'usage
- ✅ Diversification des providers

**Inconvénients:**
- ❌ Terraform à réécrire complètement
- ❌ Marketplace subscriptions manuelles requises
- ❌ Complexité du routeur intelligent
- ❌ Gestion de 4+ endpoints différents
- ❌ Coûts de développement élevés

---

## 💡 RECOMMANDATION: Option A (Azure OpenAI)

Basé sur ton analyse des cas d'usage (`AI-MODELS-USAGE-ANALYSIS.md`), **Azure OpenAI suffit largement**.

### Mapping des Cas d'Usage

| Cas d'Usage | Modèle Actuel | Modèle Azure | Justification |
|-------------|---------------|--------------|---------------|
| **Chat rapide** | Gemini Flash | GPT-3.5 Turbo | Rapide, économique |
| **Captions** | GPT-4o-mini | GPT-3.5 Turbo | Créatif, optimisé |
| **Analytics** | Gemini Pro | GPT-4 Turbo | Analyse complexe |
| **Sales** | Gemini Pro | GPT-4 Turbo | Persuasion, nuances |
| **Suggestions** | GPT-4o-mini | GPT-3.5 Turbo | Rapide, contextuel |

**Conclusion:** GPT-4 Turbo + GPT-3.5 Turbo couvrent 100% de tes besoins.

---

## 📋 PLAN D'ACTION DÉTAILLÉ

### Phase 1: Préparation (15 min)

#### 1.1 Vérifier les Prérequis
```bash
# Vérifier Azure CLI
az --version

# Vérifier Terraform
terraform --version

# Se connecter à Azure
az login

# Vérifier la souscription active
az account show

# Lister les souscriptions disponibles
az account list --output table
```

#### 1.2 Vérifier les Quotas
```bash
# Vérifier les quotas Azure OpenAI dans East US
az cognitiveservices account list-skus \
  --kind OpenAI \
  --location eastus

# Vérifier les quotas actuels
az cognitiveservices account list \
  --resource-group huntaze-ai-production-rg \
  --output table
```

**⚠️ IMPORTANT:** Pas besoin de Marketplace subscriptions pour Azure OpenAI (contrairement à DeepSeek/Llama).

---

### Phase 2: Déploiement Infrastructure (30 min)

#### 2.1 Préparer Terraform
```bash
cd infra/terraform/azure-ai

# Initialiser Terraform
terraform init

# Vérifier la configuration
terraform validate

# Voir le plan de déploiement
terraform plan -out=tfplan
```

#### 2.2 Déployer l'Infrastructure
```bash
# Déployer (confirmer avec 'yes')
terraform apply tfplan

# Sauvegarder les outputs
terraform output > ../../../.azure-outputs.txt
```

**Ressources créées:**
- ✅ Resource Group: `huntaze-ai-production-rg`
- ✅ Azure OpenAI Service (East US)
- ✅ 5 Déploiements de modèles:
  - `gpt-4-turbo-prod` (100 TPU)
  - `gpt-4-standard-prod` (50 TPU)
  - `gpt-35-turbo-prod` (100 TPU)
  - `gpt-4-vision-prod` (30 TPU)
  - `text-embedding-ada-002-prod` (50 TPU)
- ✅ Key Vault pour les secrets
- ✅ Cognitive Search pour les vecteurs
- ✅ Application Insights pour le monitoring

#### 2.3 Récupérer les Credentials
```bash
# Endpoint Azure OpenAI
AZURE_ENDPOINT=$(terraform output -raw openai_primary_endpoint)

# Clé API (stockée dans Key Vault)
AZURE_KEY=$(az cognitiveservices account keys list \
  --name huntaze-ai-production-openai-primary \
  --resource-group huntaze-ai-production-rg \
  --query key1 -o tsv)

echo "Endpoint: $AZURE_ENDPOINT"
echo "Key: $AZURE_KEY"
```

---

### Phase 3: Configuration du Routeur Intelligent (45 min)

#### 3.1 Créer le Service Unifié Azure

Créer `lib/ai/azure/azure-unified.service.ts`:

```typescript
import { AzureOpenAI } from 'openai';

export type ModelTier = 'premium' | 'standard' | 'economy' | 'vision';

export interface AIRequest {
  tier: ModelTier;
  systemPrompt: string;
  userMessage: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  cost: number;
}

export class AzureUnifiedService {
  private client: AzureOpenAI;
  private deployments: Record<ModelTier, string>;
  private pricing: Record<string, { input: number; output: number }>;

  constructor() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const apiKey = process.env.AZURE_OPENAI_API_KEY!;
    const apiVersion = process.env.AZURE_API_VERSION || '2024-05-01-preview';

    if (!endpoint || !apiKey) {
      throw new Error('Azure OpenAI credentials not configured');
    }

    this.client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
    });

    // Mapping des tiers vers les déploiements
    this.deployments = {
      premium: 'gpt-4-turbo-prod',
      standard: 'gpt-4-standard-prod',
      economy: 'gpt-35-turbo-prod',
      vision: 'gpt-4-vision-prod',
    };

    // Pricing par 1K tokens (USD)
    this.pricing = {
      'gpt-4-turbo-prod': { input: 0.01, output: 0.03 },
      'gpt-4-standard-prod': { input: 0.03, output: 0.06 },
      'gpt-35-turbo-prod': { input: 0.0005, output: 0.0015 },
      'gpt-4-vision-prod': { input: 0.01, output: 0.03 },
    };
  }

  /**
   * Routage intelligent basé sur le cas d'usage
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const deployment = this.deployments[request.tier];

    try {
      const response = await this.client.chat.completions.create({
        model: deployment,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userMessage },
        ],
        temperature: request.temperature ?? this.getDefaultTemperature(request.tier),
        max_tokens: request.maxTokens ?? 1000,
        response_format: request.jsonMode ? { type: 'json_object' } : undefined,
      });

      const usage = response.usage!;
      const cost = this.calculateCost(deployment, usage);

      return {
        content: response.choices[0].message.content || '',
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        model: deployment,
        cost,
      };
    } catch (error) {
      console.error(`Azure AI Error on ${deployment}:`, error);
      throw new Error('Azure AI Service Unavailable');
    }
  }

  /**
   * Routage automatique basé sur le type de requête
   */
  async autoRoute(
    systemPrompt: string,
    userMessage: string,
    options?: {
      requiresAnalysis?: boolean;
      requiresCreativity?: boolean;
      requiresSpeed?: boolean;
      jsonMode?: boolean;
    }
  ): Promise<AIResponse> {
    let tier: ModelTier = 'standard';

    // Logique de routage intelligent
    if (options?.requiresSpeed) {
      tier = 'economy'; // GPT-3.5 Turbo
    } else if (options?.requiresAnalysis) {
      tier = 'premium'; // GPT-4 Turbo
    } else if (options?.requiresCreativity) {
      tier = 'standard'; // GPT-4
    }

    return this.generate({
      tier,
      systemPrompt,
      userMessage,
      jsonMode: options?.jsonMode,
    });
  }

  private getDefaultTemperature(tier: ModelTier): number {
    switch (tier) {
      case 'premium':
        return 0.7; // Plus créatif pour l'analyse
      case 'standard':
        return 0.6;
      case 'economy':
        return 0.5; // Plus déterministe pour le chat rapide
      case 'vision':
        return 0.7;
      default:
        return 0.6;
    }
  }

  private calculateCost(deployment: string, usage: any): number {
    const pricing = this.pricing[deployment];
    if (!pricing) return 0;

    const inputCost = (usage.prompt_tokens / 1000) * pricing.input;
    const outputCost = (usage.completion_tokens / 1000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.generate({
        tier: 'economy',
        systemPrompt: 'You are a health check bot.',
        userMessage: 'ping',
        maxTokens: 10,
      });
      return response.content.length > 0;
    } catch {
      return false;
    }
  }
}

// Singleton export
export const azureAI = new AzureUnifiedService();
```

#### 3.2 Mettre à Jour les Variables d'Environnement

Ajouter à `.env.production`:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-production-eastus.openai.azure.com/
AZURE_OPENAI_API_KEY=<votre-clé-depuis-terraform>
AZURE_API_VERSION=2024-05-01-preview

# Déploiements
AZURE_DEPLOYMENT_PREMIUM=gpt-4-turbo-prod
AZURE_DEPLOYMENT_STANDARD=gpt-4-standard-prod
AZURE_DEPLOYMENT_ECONOMY=gpt-35-turbo-prod
AZURE_DEPLOYMENT_VISION=gpt-4-vision-prod
```

---

### Phase 4: Migration des Agents (60 min)

#### 4.1 Migrer MessagingAgent

Mettre à jour `lib/ai/agents/messaging.azure.ts`:

```typescript
import { azureAI } from '../azure/azure-unified.service';

export class MessagingAgent {
  async generateResponse(
    fanMessage: string,
    context: {
      fanName: string;
      engagementLevel: 'low' | 'medium' | 'high';
      creatorStyle: string;
    }
  ) {
    const systemPrompt = `Tu es Emma, assistante IA pour créateurs de contenu.
Style du créateur: ${context.creatorStyle}
Niveau d'engagement du fan: ${context.engagementLevel}
Génère une réponse personnalisée, engageante et authentique.`;

    return await azureAI.autoRoute(systemPrompt, fanMessage, {
      requiresSpeed: true, // Chat rapide → GPT-3.5 Turbo
      requiresCreativity: context.engagementLevel === 'high',
    });
  }
}
```

#### 4.2 Migrer ContentAgent

Mettre à jour `lib/ai/agents/content.azure.ts`:

```typescript
import { azureAI } from '../azure/azure-unified.service';

export class ContentAgent {
  async generateCaption(
    platform: string,
    contentInfo: {
      type: string;
      description: string;
      mood: string;
      targetAudience: string;
    }
  ) {
    const systemPrompt = `Tu es un expert en création de contenu pour ${platform}.
Génère une caption optimisée avec hashtags pertinents.
Type: ${contentInfo.type}
Mood: ${contentInfo.mood}
Audience: ${contentInfo.targetAudience}`;

    return await azureAI.autoRoute(systemPrompt, contentInfo.description, {
      requiresCreativity: true, // Créativité → GPT-4
    });
  }
}
```

#### 4.3 Migrer AnalyticsAgent

Mettre à jour `lib/ai/agents/analytics.azure.ts`:

```typescript
import { azureAI } from '../azure/azure-unified.service';

export class AnalyticsAgent {
  async analyzePerformance(metrics: any) {
    const systemPrompt = `Tu es Alex, expert en analytics.
Analyse ces métriques et génère des insights actionnables.
Retourne un JSON structuré avec insights, recommendations, patterns et predictions.`;

    return await azureAI.autoRoute(
      systemPrompt,
      JSON.stringify(metrics),
      {
        requiresAnalysis: true, // Analyse complexe → GPT-4 Turbo
        jsonMode: true,
      }
    );
  }
}
```

#### 4.4 Migrer SalesAgent

Mettre à jour `lib/ai/agents/sales.azure.ts`:

```typescript
import { azureAI } from '../azure/azure-unified.service';

export class SalesAgent {
  async optimizeSalesMessage(
    currentMessage: string,
    fanProfile: any,
    context: any
  ) {
    const systemPrompt = `Tu es un expert en optimisation de conversion.
Analyse ce message de vente et optimise-le pour maximiser la conversion.
Profil du fan: ${JSON.stringify(fanProfile)}
Contexte: ${JSON.stringify(context)}`;

    return await azureAI.autoRoute(systemPrompt, currentMessage, {
      requiresAnalysis: true, // Persuasion complexe → GPT-4 Turbo
      requiresCreativity: true,
    });
  }
}
```

---

### Phase 5: Circuit Breaker & Fallback (30 min)

#### 5.1 Implémenter le Circuit Breaker

Créer `lib/ai/azure/circuit-breaker.ts`:

```typescript
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  private readonly threshold = 5; // 5 échecs consécutifs
  private readonly timeout = 60000; // 60 secondes
  private readonly resetTimeout = 30000; // 30 secondes

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      console.error('Circuit breaker opened after', this.failures, 'failures');
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
```

#### 5.2 Ajouter le Fallback vers OpenAI Direct

Mettre à jour `azure-unified.service.ts`:

```typescript
import OpenAI from 'openai';

export class AzureUnifiedService {
  private azureClient: AzureOpenAI;
  private fallbackClient: OpenAI;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    // Azure OpenAI (primaire)
    this.azureClient = new AzureOpenAI({...});
    
    // OpenAI direct (fallback)
    this.fallbackClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.circuitBreaker = new CircuitBreaker();
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    try {
      // Essayer Azure d'abord
      return await this.circuitBreaker.execute(() =>
        this.generateAzure(request)
      );
    } catch (error) {
      console.warn('Azure failed, falling back to OpenAI direct');
      return await this.generateFallback(request);
    }
  }

  private async generateFallback(request: AIRequest): Promise<AIResponse> {
    const modelMap = {
      premium: 'gpt-4-turbo-preview',
      standard: 'gpt-4',
      economy: 'gpt-3.5-turbo',
      vision: 'gpt-4-vision-preview',
    };

    const response = await this.fallbackClient.chat.completions.create({
      model: modelMap[request.tier],
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userMessage },
      ],
      temperature: request.temperature ?? 0.7,
    });

    // ... retourner la réponse formatée
  }
}
```

---

### Phase 6: Tests & Validation (30 min)

#### 6.1 Test de Santé

```bash
# Créer un script de test
cat > scripts/test-azure-ai.ts << 'EOF'
import { azureAI } from '../lib/ai/azure/azure-unified.service';

async function testAzureAI() {
  console.log('🧪 Testing Azure AI Service...\n');

  // Test 1: Health Check
  console.log('1. Health Check...');
  const healthy = await azureAI.healthCheck();
  console.log(healthy ? '✅ Service is healthy' : '❌ Service is down');

  // Test 2: Economy Tier (Chat rapide)
  console.log('\n2. Testing Economy Tier (GPT-3.5 Turbo)...');
  const chatResponse = await azureAI.generate({
    tier: 'economy',
    systemPrompt: 'Tu es un assistant amical.',
    userMessage: 'Bonjour, comment vas-tu?',
  });
  console.log('Response:', chatResponse.content);
  console.log('Cost:', chatResponse.cost.toFixed(6), 'USD');

  // Test 3: Premium Tier (Analyse complexe)
  console.log('\n3. Testing Premium Tier (GPT-4 Turbo)...');
  const analysisResponse = await azureAI.generate({
    tier: 'premium',
    systemPrompt: 'Tu es un expert en analyse de données.',
    userMessage: 'Analyse ces métriques: likes=1000, comments=50, shares=20',
    jsonMode: true,
  });
  console.log('Response:', analysisResponse.content);
  console.log('Cost:', analysisResponse.cost.toFixed(6), 'USD');

  // Test 4: Auto-routing
  console.log('\n4. Testing Auto-routing...');
  const autoResponse = await azureAI.autoRoute(
    'Tu es un créateur de contenu.',
    'Génère une caption Instagram pour une photo de coucher de soleil',
    { requiresCreativity: true }
  );
  console.log('Response:', autoResponse.content);
  console.log('Model used:', autoResponse.model);
  console.log('Cost:', autoResponse.cost.toFixed(6), 'USD');

  console.log('\n✅ All tests passed!');
}

testAzureAI().catch(console.error);
EOF

# Exécuter le test
npx tsx scripts/test-azure-ai.ts
```

#### 6.2 Test de Coûts

```typescript
// Comparer les coûts Azure vs Gemini
const testPrompt = 'Génère une caption Instagram pour une photo de plage';

// Test Gemini (ancien)
const geminiCost = 0.002; // Exemple

// Test Azure Economy
const azureResponse = await azureAI.generate({
  tier: 'economy',
  systemPrompt: 'Tu es un créateur de contenu.',
  userMessage: testPrompt,
});

console.log('Gemini cost:', geminiCost, 'USD');
console.log('Azure cost:', azureResponse.cost, 'USD');
console.log('Savings:', ((geminiCost - azureResponse.cost) / geminiCost * 100).toFixed(2), '%');
```

---

### Phase 7: Monitoring & Alerting (20 min)

#### 7.1 Configurer Application Insights

```typescript
import { ApplicationInsights } from '@azure/monitor-opentelemetry';

const appInsights = new ApplicationInsights({
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
});

appInsights.start();

// Logger les requêtes IA
export function logAIRequest(request: AIRequest, response: AIResponse) {
  appInsights.defaultClient.trackEvent({
    name: 'AI_Request',
    properties: {
      tier: request.tier,
      model: response.model,
      tokens: response.usage.totalTokens,
      cost: response.cost,
    },
  });
}
```

#### 7.2 Créer des Alertes

```bash
# Alerte si coût > $100/jour
az monitor metrics alert create \
  --name "AI-Cost-Alert" \
  --resource-group huntaze-ai-production-rg \
  --scopes /subscriptions/.../resourceGroups/huntaze-ai-production-rg \
  --condition "total cost > 100" \
  --description "AI costs exceeded $100/day"

# Alerte si taux d'erreur > 5%
az monitor metrics alert create \
  --name "AI-Error-Rate-Alert" \
  --resource-group huntaze-ai-production-rg \
  --condition "error rate > 5" \
  --description "AI error rate exceeded 5%"
```

---

## 📊 RÉSULTATS ATTENDUS

### Coûts Estimés (par 1M tokens)

| Modèle | Input | Output | Total (1M tokens) |
|--------|-------|--------|-------------------|
| GPT-4 Turbo | $10 | $30 | $40 |
| GPT-4 | $30 | $60 | $90 |
| GPT-3.5 Turbo | $0.50 | $1.50 | $2 |

### Économies Projetées

Basé sur ton usage actuel (14 endpoints IA):
- **Avant**: ~$500/mois (Gemini + OpenAI direct)
- **Après**: ~$300/mois (Azure OpenAI optimisé)
- **Économies**: ~40% ($200/mois)

### Performance

- **Latence**: < 500ms (vs 1-2s avec APIs externes)
- **Disponibilité**: 99.9% SLA (vs 99% APIs publiques)
- **Throughput**: 100K TPM (vs limites APIs publiques)

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### Avant le Déploiement
- [ ] Azure CLI installé et configuré
- [ ] Terraform installé (>= 1.0)
- [ ] Souscription Azure active
- [ ] Quotas vérifiés (East US)
- [ ] Variables d'environnement préparées

### Déploiement
- [ ] Terraform init
- [ ] Terraform plan vérifié
- [ ] Terraform apply exécuté
- [ ] Outputs sauvegardés
- [ ] Credentials récupérés

### Configuration
- [ ] Service unifié créé
- [ ] Agents migrés
- [ ] Circuit breaker implémenté
- [ ] Fallback configuré
- [ ] Tests exécutés

### Monitoring
- [ ] Application Insights configuré
- [ ] Alertes créées
- [ ] Dashboard créé
- [ ] Logs vérifiés

---

## 🚨 ROLLBACK PLAN

Si problème critique:

```bash
# 1. Revenir aux anciens providers
git checkout main -- lib/ai/

# 2. Restaurer les variables d'environnement
cp .env.production.backup .env.production

# 3. Redémarrer l'application
npm run build
pm2 restart huntaze

# 4. Détruire l'infrastructure Azure (optionnel)
cd infra/terraform/azure-ai
terraform destroy
```

---

## 📞 SUPPORT

En cas de problème:
1. Vérifier les logs Application Insights
2. Vérifier le status du circuit breaker
3. Tester le fallback OpenAI direct
4. Contacter le support Azure si nécessaire

---

**Prêt à déployer ?** Commence par la Phase 1 ! 🚀
