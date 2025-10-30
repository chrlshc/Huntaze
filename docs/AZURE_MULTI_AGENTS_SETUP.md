# Configuration Azure Multi-Agents - Huntaze

## 🎯 Deux systèmes Azure distincts

Huntaze utilise **deux systèmes Azure différents** qui travaillent ensemble :

### 1. Azure OpenAI (Génération de texte)
**Ce qu'on vient de configurer** ✅

- **Usage** : Génération de texte, suggestions, idées
- **API** : Azure OpenAI Chat Completions
- **Variables** :
  ```bash
  AZURE_OPENAI_API_KEY=...
  AZURE_OPENAI_ENDPOINT=https://huntaze-ai-hub-eus2.openai.azure.com
  AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo
  AZURE_OPENAI_API_VERSION=2024-05-01-preview
  ```

### 2. Azure AI Team (Multi-Agents Planner)
**Votre système multi-agents existant** 🤖

- **Usage** : Planification de contenu, orchestration d'agents, publication
- **API** : Azure AI Project / Agents API
- **Variables** :
  ```bash
  AZURE_SUBSCRIPTION_ID=votre-subscription-id
  AZURE_RESOURCE_GROUP=votre-resource-group
  AZURE_PROJECT_NAME=votre-project-name
  AZURE_AI_PROJECT_ENDPOINT=https://...
  ENABLE_AZURE_AI_TEAM=1
  ```

## 🔗 Comment ils fonctionnent ensemble

```
┌─────────────────────────────────────────────────────┐
│                   HUNTAZE                            │
├─────────────────────────────────────────────────────┤
│                                                       │
│  User Request                                        │
│       ↓                                              │
│  ┌─────────────────┐                                │
│  │  AI Team        │ ← Planification & Orchestration│
│  │  (Multi-Agents) │                                │
│  └────────┬────────┘                                │
│           │                                          │
│           ↓                                          │
│  ┌─────────────────┐                                │
│  │  Azure OpenAI   │ ← Génération de texte         │
│  │  (GPT-4)        │                                │
│  └────────┬────────┘                                │
│           │                                          │
│           ↓                                          │
│  Content Published                                   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## 📋 Configuration complète

### Étape 1 : Vérifier votre système multi-agents Azure

1. **Portail Azure** → Cherchez votre projet AI
2. **Notez** :
   - Subscription ID
   - Resource Group
   - Project Name
   - Project Endpoint

### Étape 2 : Mettre à jour `.env`

Ajoutez ces variables à votre `.env` existant :

```bash
# ============================================
# AZURE OPENAI (Génération de texte)
# ============================================
AZURE_OPENAI_API_KEY=4spL9UZ273N38AxyhlbdcpAxgkXNqbbvweUw5Sr3BHJfcNAL3D4NJQQJ99BHACYeBjFXJ3w3AAABACOG95jj
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-hub-eus2.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-05-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo
DEFAULT_AI_MODEL=gpt-4-turbo
DEFAULT_AI_PROVIDER=openai

# ============================================
# AZURE AI TEAM (Multi-Agents)
# ============================================
AZURE_SUBSCRIPTION_ID=votre-subscription-id
AZURE_RESOURCE_GROUP=votre-resource-group
AZURE_PROJECT_NAME=votre-project-name
AZURE_AI_PROJECT_ENDPOINT=https://votre-project.cognitiveservices.azure.com

# Enable multi-agents
ENABLE_AZURE_AI_TEAM=1
ENABLE_AZURE_AI=1
USE_AZURE_RESPONSES=1

# ============================================
# LLM PROVIDER
# ============================================
LLM_PROVIDER=azure

# ============================================
# OPTIONAL: EventBridge & Agents Proxy
# ============================================
ENABLE_EVENTBRIDGE_HOOKS=0
ENABLE_AGENTS_PROXY=0
# AGENTS_API_URL=
# AGENTS_PROXY_TOKEN=

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=development
```

### Étape 3 : Trouver vos valeurs Azure AI Team

#### Option A : Via Azure Portal

1. **Azure Portal** → Recherchez "AI Studio" ou "Azure AI"
2. Trouvez votre projet (probablement lié à `huntaze-ai-hub-eus2`)
3. **Overview** → Notez :
   - Subscription ID
   - Resource Group
   - Project Name
4. **Keys and Endpoint** → Notez l'endpoint

#### Option B : Via Azure CLI

```bash
# Lister vos subscriptions
az account list --output table

# Lister vos resource groups
az group list --output table

# Lister vos projets AI
az cognitiveservices account list --output table
```

#### Option C : Vérifier dans votre ancien .env

Si vous aviez déjà configuré cela, cherchez dans :
- Anciens fichiers `.env`
- `env_cur.json` (si vous l'avez)
- Documentation de votre projet

### Étape 4 : Tester la configuration

```bash
# Test Azure OpenAI
node scripts/test-azure-connection.mjs --test-connection

# Test complet de l'app
npm run dev

# Test des endpoints AI Team
curl http://localhost:3000/api/ai/azure/smoke
curl http://localhost:3000/api/ai-team/plan/123
```

## 🎨 Utilisation du système multi-agents

### Planifier du contenu

```typescript
// POST /api/ai-team/schedule/plan/azure
const response = await fetch('/api/ai-team/schedule/plan/azure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    correlation: 'user-123',
    period: 'next_week',
    platforms: ['instagram', 'tiktok'],
    preferences: {
      tone: 'friendly',
      topics: ['lifestyle', 'travel']
    }
  })
});
```

### Publier du contenu

```typescript
// POST /api/ai-team/publish
const response = await fetch('/api/ai-team/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    correlation: 'user-123',
    contents: [
      { text: 'Mon super post', media: [...] }
    ],
    platforms: ['instagram', 'tiktok']
  })
});
```

### Obtenir un plan

```typescript
// GET /api/ai-team/plan/:id
const plan = await fetch('/api/ai-team/plan/123');
const data = await plan.json();
```

## 🔧 Dépannage

### Erreur : "AI Team not enabled"

**Solution** : Vérifiez que `ENABLE_AZURE_AI_TEAM=1` dans `.env`

### Erreur : "Azure AI Project not configured"

**Solution** : Vérifiez que toutes les variables `AZURE_*` sont définies

### Erreur : "Invalid subscription"

**Solution** : Vérifiez votre `AZURE_SUBSCRIPTION_ID` dans Azure Portal

### Le système multi-agents ne trouve pas Azure OpenAI

**Solution** : Vérifiez que `LLM_PROVIDER=azure` et que les variables `AZURE_OPENAI_*` sont correctes

## 📊 Architecture complète

```
User Request
     ↓
┌────────────────────────────────────────┐
│  Frontend (Next.js)                    │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│  API Routes                            │
│  - /api/ai-team/schedule/plan/azure    │
│  - /api/ai-team/publish                │
│  - /api/ai-team/plan/:id               │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│  Azure AI Team (Multi-Agents)          │
│  - PlannerAgent                        │
│  - ContentAgent                        │
│  - PostSchedulerAgent                  │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│  Azure OpenAI (GPT-4)                  │
│  - Text Generation                     │
│  - Content Suggestions                 │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│  Database & Storage                    │
│  - ai_plan                             │
│  - ai_plan_item                        │
│  - content                             │
└────────────────────────────────────────┘
```

## ✅ Checklist

- [ ] Azure OpenAI configuré (AZURE_OPENAI_*)
- [ ] Azure AI Team configuré (AZURE_SUBSCRIPTION_ID, etc.)
- [ ] ENABLE_AZURE_AI_TEAM=1
- [ ] LLM_PROVIDER=azure
- [ ] Test de connexion Azure OpenAI réussi
- [ ] Test des endpoints AI Team réussi
- [ ] Planification de contenu fonctionne
- [ ] Publication de contenu fonctionne

## 📞 Support

- **Azure OpenAI** : `docs/AZURE_OPENAI_SETUP.md`
- **Dépannage** : `docs/AZURE_OPENAI_TROUBLESHOOTING.md`
- **Architecture** : `docs/HUNTAZE_ARCHITECTURE_OVERVIEW.md`
- **OPS AI Team** : `docs/OPS-AI-TEAM.md`

---

**Important** : Les deux systèmes peuvent fonctionner indépendamment. Si Azure AI Team n'est pas configuré, Azure OpenAI fonctionne quand même pour la génération de texte basique.
