# 🔄 Flux des systèmes IA - Huntaze

## Diagramme complet

```
┌─────────────────────────────────────────────────────────────────┐
│                         HUNTAZE PLATFORM                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    FRONTEND (Next.js)                       │ │
│  │  - Interface créateur                                       │ │
│  │  - Chat avec fans                                           │ │
│  │  - Planification de contenu                                 │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                         │
│                         ↓                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      API ROUTES                              ││
│  │  /api/messages/personalize                                   ││
│  │  /api/ai-team/schedule/plan                                  ││
│  │  /api/ai/generate                                            ││
│  └──────────────────────┬──────────────────────────────────────┘│
│                         │                                         │
│         ┌───────────────┼───────────────┐                        │
│         │               │               │                        │
│         ↓               ↓               ↓                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │  Chatting   │ │  AI Team    │ │  Content    │               │
│  │  Service    │ │  Service    │ │  Service    │               │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘               │
│         │               │               │                        │
│         └───────────────┼───────────────┘                        │
│                         │                                         │
│                         ↓                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              AZURE OPENAI (GPT-4)                            ││
│  │  Endpoint: huntaze-ai-hub-eus2.openai.azure.com             ││
│  │  Deployment: gpt-4-turbo                                     ││
│  │  Status: ⚠️ Erreur 401 (clé à vérifier)                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              AZURE AI TEAM (Multi-Agents)                    ││
│  │  Project: huntaze-agents                                     ││
│  │  Resource Group: huntaze-ai                                  ││
│  │  Status: ✅ Configuré                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Flux 1 : Message personnalisé à un fan

```
Créateur clique "Envoyer message à Sophie"
              ↓
    Frontend (Next.js)
              ↓
    POST /api/messages/personalize
    {
      fanId: "sophie-123",
      messageType: "greeting",
      tone: "friendly"
    }
              ↓
    MessagePersonalizationService
    - Charge le profil de Sophie
    - Analyse son historique
    - Choisit template ou génération fresh
              ↓
    Azure OpenAI (GPT-4) ⚠️
    Prompt: "Créer un message pour Sophie,
             VIP subscriber, 150€ dépensés,
             active, tone: friendly"
              ↓
    Réponse: "Hey Sophie! 👋 Welcome to my
              exclusive world! I'm so excited..."
              ↓
    Message affiché au créateur
              ↓
    Créateur envoie à Sophie
```

## Flux 2 : Planification de contenu

```
Créateur demande "Planifier ma semaine"
              ↓
    Frontend (Next.js)
              ↓
    POST /api/ai-team/schedule/plan/azure
    {
      period: "next_week",
      platforms: ["instagram", "tiktok"],
      preferences: { topics: ["lifestyle"] }
    }
              ↓
    Azure AI Team (Multi-Agents) ✅
    - PlannerAgent analyse les performances
    - Identifie les meilleurs moments
    - ContentAgent génère des idées
              ↓
    Azure OpenAI (GPT-4) ⚠️
    - Génère les légendes
    - Crée les descriptions
    - Optimise les hashtags
              ↓
    Plan de contenu créé:
    - Lundi 10h: Post lifestyle + légende
    - Mercredi 14h: Story + texte
    - Vendredi 18h: Reel + description
    - etc.
              ↓
    Plan affiché au créateur
```

## Flux 3 : Génération simple de texte

```
Créateur demande "Idée de légende"
              ↓
    Frontend (Next.js)
              ↓
    POST /api/ai/generate
    {
      prompt: "Légende pour photo de voyage",
      contentType: "caption"
    }
              ↓
    AIService
              ↓
    Azure OpenAI (GPT-4) ⚠️
    System: "You create compelling captions
             for social media posts..."
    User: "Légende pour photo de voyage"
              ↓
    Réponse: "Wanderlust vibes ✈️ 
              Exploring new horizons..."
              ↓
    Légende affichée au créateur
```

## Dépendances

### Chatting IA dépend de :
- ✅ MessagePersonalizationService (code)
- ⚠️ Azure OpenAI (génération de texte)
- ✅ Database (profils fans)

### Azure AI Team dépend de :
- ✅ Azure AI Project (orchestration)
- ⚠️ Azure OpenAI (génération de texte)
- ✅ Database (historique, analytics)

### Azure OpenAI dépend de :
- ⚠️ Clé API valide
- ✅ Endpoint configuré
- ✅ Déploiement GPT-4

## Impact de l'erreur 401

### Ce qui ne fonctionne PAS ❌
- Messages personnalisés automatiques
- Génération de légendes IA
- Suggestions de contenu IA
- Idées créatives IA
- Génération de texte dans le système multi-agents

### Ce qui fonctionne QUAND MÊME ✅
- Orchestration du système multi-agents (planification)
- Gestion des utilisateurs
- Facturation
- Upload de contenu
- Messaging manuel avec fans
- Analytics de base
- Tous les services non-IA

## Solution

### Corriger Azure OpenAI

```bash
# 1. Vérifier la clé dans Azure Portal
https://portal.azure.com
→ huntaze-ai-hub-eus2
→ Keys and Endpoint
→ Copier KEY 1

# 2. Mettre à jour .env
AZURE_OPENAI_API_KEY=nouvelle-cle-depuis-azure

# 3. Tester
node scripts/test-azure-connection.mjs --test-connection

# 4. Résultat attendu
✅ Connexion réussie !
📝 Réponse: Hello from Huntaze!
📊 Tokens utilisés: XX
```

### Tout redevient fonctionnel ✅
- Chatting IA ✅
- Génération de texte ✅
- Système multi-agents complet ✅
- Suggestions IA ✅

---

**Résumé** : Azure OpenAI est le moteur central. Sans lui, pas de génération de texte IA. Avec lui, tout fonctionne.
