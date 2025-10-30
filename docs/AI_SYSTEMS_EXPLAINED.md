# 🤖 Systèmes IA de Huntaze - Explication complète

## Vue d'ensemble

Huntaze utilise **3 systèmes IA distincts** qui travaillent ensemble pour différentes fonctionnalités :

```
┌─────────────────────────────────────────────────────────────┐
│                    HUNTAZE - Systèmes IA                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1️⃣  CHATTING IA (Message Personalization)                  │
│      └─ Utilise → Azure OpenAI                              │
│                                                               │
│  2️⃣  AZURE OPENAI (Génération de texte)                     │
│      └─ Service de base pour génération                     │
│                                                               │
│  3️⃣  AZURE AI TEAM (Multi-Agents)                           │
│      └─ Orchestration & Planification                       │
│      └─ Utilise → Azure OpenAI                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 1️⃣ Chatting IA (Message Personalization)

### 🎯 À quoi ça sert ?

**Génération de messages personnalisés pour les fans**

Le système de chatting IA aide les créateurs à :
- Envoyer des messages personnalisés à leurs fans
- Adapter le ton selon le profil du fan
- Suggérer des messages d'upsell intelligents
- Réactiver les fans inactifs
- Remercier après un achat

### 📍 Où c'est dans le code ?

**Fichier** : `lib/services/message-personalization.ts`

**Service** : `MessagePersonalizationService`

### 💬 Exemples d'utilisation

#### Exemple 1 : Message de bienvenue

```typescript
import { getMessagePersonalizationService } from '@/lib/services/message-personalization';

const service = getMessagePersonalizationService();

const fanProfile = {
  id: 'fan-123',
  name: 'Sophie',
  subscriptionTier: 'vip',
  totalSpent: 150,
  lastActive: new Date(),
  // ... autres données
};

const result = await service.generatePersonalizedMessage(
  fanProfile,
  'greeting',  // Type de message
  {
    tone: 'friendly',
    includeEmojis: true
  }
);

console.log(result.message);
// "Hey Sophie! 👋 Welcome to my exclusive world! I'm so excited to have you here..."
```

#### Exemple 2 : Upsell VIP

```typescript
const result = await service.generatePersonalizedMessage(
  fanProfile,
  'upsell',  // Proposition d'upgrade
  {
    tone: 'flirty',
    callToAction: 'Upgrade to VIP for exclusive content'
  }
);

console.log(result.message);
// "Hi Sophie! I noticed you've been really enjoying my content 💕..."
```

#### Exemple 3 : Réactivation

```typescript
const inactiveFan = {
  ...fanProfile,
  lastActive: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 jours
};

const result = await service.generatePersonalizedMessage(
  inactiveFan,
  'reactivation',
  {
    tone: 'friendly'
  }
);

console.log(result.message);
// "Hi Sophie 💕 I haven't seen you around lately and I miss chatting with you!..."
```

### 🔧 Comment ça fonctionne ?

```
User demande un message
         ↓
MessagePersonalizationService
         ↓
    ┌────────┴────────┐
    │                 │
Template         AI Generation
(70%)            (30%)
    │                 │
    └────────┬────────┘
             ↓
    Azure OpenAI (GPT-4)
             ↓
    Message personnalisé
```

**Deux modes** :
1. **Templates** (70%) : Utilise des templates pré-définis + personnalisation
2. **AI Fresh** (30%) : Génère un message complètement nouveau avec l'IA

### 📊 Types de messages disponibles

| Type | Description | Exemple |
|------|-------------|---------|
| `greeting` | Bienvenue, check-in | "Hey Sophie! 👋 Welcome..." |
| `upsell` | Proposition d'upgrade | "I have something special for VIP..." |
| `ppv_offer` | Offre pay-per-view | "I just finished an amazing photoshoot..." |
| `reactivation` | Réengagement | "I haven't seen you around lately..." |
| `thank_you` | Remerciement | "Thank you so much Sophie! 🙏💕..." |
| `custom` | Message personnalisé | Selon contexte fourni |

### 🎨 Tons disponibles

- `friendly` : Chaleureux et amical
- `flirty` : Joueur et séducteur
- `professional` : Professionnel et poli
- `playful` : Amusant et énergique
- `intimate` : Personnel et intime

### 📈 Personnalisation intelligente

Le système analyse :
- **Profil du fan** : Tier, dépenses, activité
- **Historique** : Interactions passées
- **Comportement** : Taux de réponse, engagement
- **Préférences** : Types de contenu préférés
- **Loyauté** : Score de fidélité

## 2️⃣ Azure OpenAI (Service de base)

### 🎯 À quoi ça sert ?

**Moteur de génération de texte pour tous les systèmes**

C'est le "cerveau" qui génère le texte pour :
- Le chatting IA (messages personnalisés)
- Le système multi-agents (planification)
- Les suggestions de contenu
- Les idées créatives

### 📍 Où c'est dans le code ?

**Fichier** : `lib/services/ai-service.ts`

**Service** : `AIService`

### 💡 Exemples d'utilisation

#### Génération simple

```typescript
import { getAIService } from '@/lib/services/ai-service';

const aiService = getAIService();

const response = await aiService.generateText({
  prompt: 'Créer un message personnalisé pour un fan VIP',
  context: {
    userId: 'user-123',
    contentType: 'message'
  },
  options: {
    temperature: 0.7,
    maxTokens: 200
  }
});

console.log(response.content);
console.log(`Latence: ${response.latencyMs}ms`);
```

#### Avec différents types de contenu

```typescript
// Message personnalisé
await aiService.generateText({
  prompt: 'Message de bienvenue',
  context: { userId: 'user-123', contentType: 'message' }
});

// Légende Instagram
await aiService.generateText({
  prompt: 'Légende pour photo de voyage',
  context: { userId: 'user-123', contentType: 'caption' }
});

// Idée de contenu
await aiService.generateText({
  prompt: '3 idées de posts tendance',
  context: { userId: 'user-123', contentType: 'idea' }
});
```

### 🔧 Configuration

```bash
# Dans .env
AZURE_OPENAI_API_KEY=votre-cle
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-hub-eus2.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo
AZURE_OPENAI_API_VERSION=2024-05-01-preview
```

### ⚠️ Status actuel

**Erreur 401** : La clé API doit être vérifiée dans Azure Portal

## 3️⃣ Azure AI Team (Multi-Agents)

### 🎯 À quoi ça sert ?

**Orchestration intelligente de plusieurs agents IA**

Le système multi-agents coordonne plusieurs "agents" spécialisés :
- **PlannerAgent** : Planifie le contenu pour la semaine/mois
- **ContentAgent** : Génère des idées de contenu
- **PostSchedulerAgent** : Optimise le timing de publication
- **AnalyticsAgent** : Analyse les performances

### 📍 Où c'est dans le code ?

**Routes API** :
- `POST /api/ai-team/schedule/plan/azure`
- `POST /api/ai-team/publish`
- `GET /api/ai-team/plan/:id`

### 💡 Exemples d'utilisation

#### Planifier du contenu

```typescript
const response = await fetch('/api/ai-team/schedule/plan/azure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    correlation: 'user-123',
    period: 'next_week',
    platforms: ['instagram', 'tiktok'],
    preferences: {
      tone: 'friendly',
      topics: ['lifestyle', 'travel', 'fitness']
    }
  })
});

// Retourne un plan de contenu pour la semaine
// avec suggestions de posts, timing optimal, etc.
```

#### Publier du contenu

```typescript
const response = await fetch('/api/ai-team/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    correlation: 'user-123',
    contents: [
      {
        text: 'Mon super post du jour!',
        media: ['photo1.jpg'],
        caption: 'Journée incroyable ☀️'
      }
    ],
    platforms: ['instagram', 'tiktok']
  })
});
```

### 🔧 Configuration

```bash
# Dans .env
AZURE_SUBSCRIPTION_ID=50dd5632-01dc-4188-b338-0da5ddd8494b
AZURE_RESOURCE_GROUP=huntaze-ai
AZURE_PROJECT_NAME=huntaze-agents
AZURE_AI_PROJECT_ENDPOINT=https://eastus.api.azureml.ms
ENABLE_AZURE_AI_TEAM=1
```

### ✅ Status actuel

**Configuré** : Credentials trouvés et ajoutés à `.env`

## 🔗 Comment ils travaillent ensemble

### Scénario complet : Engagement d'un fan

```
1. User demande : "Envoyer un message à Sophie"
         ↓
2. MessagePersonalizationService
   - Analyse le profil de Sophie
   - Choisit le type de message (greeting/upsell/etc.)
         ↓
3. Azure OpenAI (GPT-4)
   - Génère le texte personnalisé
   - Adapte le ton
         ↓
4. Message envoyé à Sophie
         ↓
5. Azure AI Team (Analytics)
   - Enregistre l'interaction
   - Analyse la performance
   - Ajuste les futures suggestions
```

### Scénario : Planification de contenu

```
1. User demande : "Planifier ma semaine de contenu"
         ↓
2. Azure AI Team (PlannerAgent)
   - Analyse les performances passées
   - Identifie les meilleurs moments
         ↓
3. Azure AI Team (ContentAgent)
   - Génère des idées de posts
         ↓
4. Azure OpenAI (GPT-4)
   - Crée les légendes
   - Génère les descriptions
         ↓
5. Plan de contenu complet créé
   - 7 posts planifiés
   - Timing optimisé
   - Légendes prêtes
```

## 📊 Résumé des rôles

| Système | Rôle | Utilise | Status |
|---------|------|---------|--------|
| **Chatting IA** | Messages personnalisés aux fans | Azure OpenAI | ⚠️ Attend clé |
| **Azure OpenAI** | Génération de texte (moteur) | GPT-4 | ⚠️ Erreur 401 |
| **Azure AI Team** | Orchestration & Planification | Azure OpenAI | ✅ Configuré |

## 🎯 Pourquoi Azure OpenAI est important ?

### Sans Azure OpenAI ❌

- Pas de messages personnalisés automatiques
- Pas de suggestions de contenu IA
- Pas de génération de légendes
- Le système multi-agents ne peut pas générer de texte

### Avec Azure OpenAI ✅

- Messages personnalisés intelligents
- Suggestions de contenu créatives
- Légendes optimisées automatiquement
- Planification de contenu complète
- Analytics prédictifs

## 🔧 Action requise

### Pour activer le Chatting IA

1. **Corriger la clé Azure OpenAI**
   ```bash
   # Vérifier dans Azure Portal
   # Mettre à jour .env
   AZURE_OPENAI_API_KEY=nouvelle-cle
   ```

2. **Tester**
   ```bash
   node scripts/test-azure-connection.mjs --test-connection
   ```

3. **Utiliser**
   ```typescript
   const service = getMessagePersonalizationService();
   const message = await service.generatePersonalizedMessage(fanProfile, 'greeting');
   ```

## 📚 Documentation

- **Chatting IA** : `lib/services/message-personalization.ts`
- **Azure OpenAI** : `docs/AZURE_OPENAI_SETUP.md`
- **Multi-Agents** : `docs/AZURE_MULTI_AGENTS_SETUP.md`
- **Architecture** : `docs/HUNTAZE_ARCHITECTURE_OVERVIEW.md`

---

**En résumé** : Azure OpenAI est le moteur qui alimente le chatting IA et le système multi-agents. Sans lui, ces fonctionnalités ne peuvent pas générer de texte intelligent.
