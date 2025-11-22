# 🏗️ Architecture Complète du Système AI - Huntaze

**Date:** 2024-11-21  
**Version:** 1.0  
**Statut:** Documentation Technique Complète

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Globale](#architecture-globale)
3. [Couches du Système](#couches-du-système)
4. [Flux de Données](#flux-de-données)
5. [Composants Détaillés](#composants-détaillés)
6. [Intégration Gemini](#intégration-gemini)
7. [Patterns de Communication](#patterns-de-communication)
8. [Scalabilité et Performance](#scalabilité-et-performance)

---

## 🎯 Vue d'Ensemble

### Philosophie du Système

Le système AI de Huntaze est basé sur une **architecture multi-agents** où:
- Chaque agent est **spécialisé** dans un domaine
- Les agents **collaborent** et partagent leurs connaissances
- Le système **apprend** et **évolue** continuellement
- L'intelligence est **distribuée** plutôt que centralisée

### Principes de Design

1. **Séparation des Responsabilités**
   - Chaque IA a un rôle clair et défini
   - Pas de chevauchement de fonctionnalités

2. **Communication Asynchrone**
   - Les IA communiquent via un réseau d'événements
   - Pas de couplage fort entre les agents

3. **Apprentissage Collectif**
   - Les découvertes sont partagées automatiquement
   - Le système devient plus intelligent avec le temps

4. **Résilience**
   - Si une IA échoue, les autres continuent
   - Fallback automatique sur des stratégies simples

---

## 🏛️ Architecture Globale


```
┌─────────────────────────────────────────────────────────────────────┐
│                         COUCHE PRÉSENTATION                          │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Dashboard  │  │   Content    │  │   Analytics  │             │
│  │      UI      │  │   Editor     │  │   Dashboard  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────────┐
│                          COUCHE API                                  │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ /api/ai/     │  │ /api/content │  │ /api/analytics│            │
│  │  chat        │  │  /generate   │  │  /insights   │             │
│  │  /generate   │  │  /optimize   │  │  /predict    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    COUCHE ORCHESTRATION                              │
│                                                                      │
│              ┌────────────────────────────┐                         │
│              │   AITeamCoordinator        │                         │
│              │  (Coordinateur Principal)  │                         │
│              └────────────────────────────┘                         │
│                          ↓                                           │
│              ┌────────────────────────────┐                         │
│              │   AIKnowledgeNetwork       │                         │
│              │  (Réseau de Connaissances) │                         │
│              └────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      COUCHE AGENTS AI                                │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Emma    │  │  Alex    │  │  Sarah   │  │  Claire  │           │
│  │ 💬       │  │ 📊       │  │ 💰       │  │ ⚖️       │           │
│  │Messaging │  │Analytics │  │  Sales   │  │Compliance│           │
│  │   AI     │  │    AI    │  │    AI    │  │    AI    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    COUCHE SERVICES EXTERNES                          │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Gemini     │  │   Database   │  │    Cache     │             │
│  │   Service    │  │  (Postgres)  │  │   (Redis)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Couches du Système

### 1. Couche Présentation

**Responsabilité:** Interface utilisateur et interaction

**Composants:**
- Dashboard principal
- Éditeur de contenu
- Dashboard analytics
- Chat assistant

**Technologies:**
- Next.js 15
- React 19
- TailwindCSS
- Framer Motion

---

### 2. Couche API

**Responsabilité:** Endpoints REST pour les fonctionnalités AI

**Structure:**
```
app/api/ai/
├── chat/
│   └── route.ts              # Chat conversationnel
├── generate-caption/
│   └── route.ts              # Génération de captions
├── suggest-hashtags/
│   └── route.ts              # Suggestions de hashtags
├── optimize-content/
│   └── route.ts              # Optimisation de contenu
├── analyze-performance/
│   └── route.ts              # Analyse de performance
└── predict-performance/
    └── route.ts              # Prédictions
```

**Middleware:**
- Authentication (NextAuth)
- Rate Limiting (Upstash)
- CSRF Protection
- Error Handling

---

### 3. Couche Orchestration

**Responsabilité:** Coordination des agents et gestion des connaissances

#### AITeamCoordinator

**Rôle:** Chef d'orchestre du système

**Responsabilités:**
- Initialiser les agents
- Router les requêtes
- Combiner les résultats
- Gérer les erreurs

**Code:**
```typescript
class AITeamCoordinator {
  private network: AIKnowledgeNetwork;
  private team: Map<string, AITeamMember>;
  
  constructor() {
    this.network = new AIKnowledgeNetwork();
    this.team = new Map();
    
    // Initialiser les agents
    this.team.set('messaging', new MessagingAI(this.network));
    this.team.set('analytics', new AnalyticsAI(this.network));
    this.team.set('sales', new SalesAI(this.network));
    this.team.set('compliance', new ComplianceAI(this.network));
  }
  
  async handleFanMessage(creatorId, fanId, message) {
    // 1. Compliance check
    const compliance = await this.team.get('compliance').checkContent(message);
    if (!compliance.safe) return { error: 'Unsafe content' };
    
    // 2. Generate response
    const messaging = await this.team.get('messaging').generateResponse(message);
    
    // 3. Optimize for sales
    const sales = await this.team.get('sales').optimizeSalesMessage(fanData);
    
    // 4. Get analytics insights
    const analytics = await this.team.get('analytics').analyzeCreatorMetrics(creatorId);
    
    // 5. Combine results
    return this.combineIntelligence(messaging, sales, analytics);
  }
}
```

#### AIKnowledgeNetwork

**Rôle:** Réseau de partage de connaissances

**Responsabilités:**
- Stocker les insights
- Broadcaster les découvertes
- Filtrer par pertinence
- Maintenir les patterns globaux

**Code:**
```typescript
class AIKnowledgeNetwork extends EventEmitter {
  private insights: Map<string, AIInsight[]>;
  private globalPatterns: Map<string, any>;
  
  // Partager un insight
  broadcastInsight(creatorId: string, insight: AIInsight) {
    // Stocker
    const creatorInsights = this.insights.get(creatorId) || [];
    creatorInsights.push(insight);
    this.insights.set(creatorId, creatorInsights);
    
    // Notifier tous les agents
    this.emit('new_insight', { creatorId, insight });
    
    // Si haute confiance, devenir pattern global
    if (insight.confidence > 0.8) {
      this.updateGlobalPatterns(insight);
    }
  }
  
  // Récupérer insights pertinents
  getRelevantInsights(creatorId: string, context: string): AIInsight[] {
    const allInsights = this.insights.get(creatorId) || [];
    return allInsights
      .filter(i => this.isRelevant(i, context))
      .sort((a, b) => b.confidence - a.confidence);
  }
}
```

---

### 4. Couche Agents AI

**Responsabilité:** IA spécialisées avec expertise

#### Structure d'un Agent

```typescript
interface AITeamMember {
  id: string;                    // Identifiant unique
  name: string;                  // Nom humain
  role: string;                  // Rôle spécifique
  model: string;                 // Modèle AI utilisé
  specialties: string[];         // Domaines d'expertise
  learningRate: number;          // Taux d'apprentissage
  sharedKnowledge: Map<string, any>;  // Connaissances acquises
}
```

#### Les 4 Agents

**1. MessagingAI (Emma)**
```typescript
class MessagingAI implements AITeamMember {
  id = 'messaging_ai';
  name = 'Emma';
  role = 'messaging';
  model = 'Gemini 1.5 Pro';
  specialties = ['conversation', 'personality_matching', 'upsell_timing'];
  learningRate = 0.85;
  
  async generateResponse(message: string, fanData: any) {
    // 1. Récupérer insights des autres IA
    const analyticsInsights = this.network.getRelevantInsights(
      fanData.creatorId, 
      'fan_behavior'
    );
    const salesInsights = this.network.getRelevantInsights(
      fanData.creatorId,
      'conversion_patterns'
    );
    
    // 2. Construire prompt enrichi
    const prompt = this.buildPromptWithInsights(
      message, 
      fanData, 
      [...analyticsInsights, ...salesInsights]
    );
    
    // 3. Générer avec Gemini
    const response = await geminiService.generateText(prompt);
    
    // 4. Partager si succès
    if (response.confidence > 0.8) {
      this.network.broadcastInsight(fanData.creatorId, {
        source: this.id,
        type: 'pattern',
        confidence: response.confidence,
        data: { strategy: 'personal_connection', worked: true }
      });
    }
    
    return response;
  }
}
```

**2. AnalyticsAI (Alex)**
```typescript
class AnalyticsAI implements AITeamMember {
  id = 'analytics_ai';
  name = 'Alex';
  role = 'analytics';
  model = 'Gemini 1.5 Pro';
  specialties = ['pattern_recognition', 'prediction', 'anomaly_detection'];
  learningRate = 0.90;
  
  async analyzeCreatorMetrics(creatorId: string, data: any) {
    // 1. Détecter patterns
    const patterns = this.detectPatterns(data);
    
    // 2. Récupérer insights des autres IA
    const messagingInsights = this.network.getRelevantInsights(
      creatorId, 
      'messaging_effectiveness'
    );
    const salesInsights = this.network.getRelevantInsights(
      creatorId, 
      'sales_performance'
    );
    
    // 3. Corréler les données
    const crossInsights = this.correlateInsights(
      patterns, 
      [...messagingInsights, ...salesInsights]
    );
    
    // 4. Générer recommandations avec Gemini
    const prompt = `Analyze these patterns: ${JSON.stringify(crossInsights)}
                    Provide insights and recommendations.`;
    const analysis = await geminiService.generateStructuredOutput(prompt, {
      insights: 'array',
      predictions: 'object',
      recommendations: 'array'
    });
    
    // 5. Partager découvertes
    crossInsights.forEach(insight => {
      this.network.broadcastInsight(creatorId, {
        source: this.id,
        type: 'pattern',
        confidence: 0.85,
        data: insight
      });
    });
    
    return analysis;
  }
}
```

**3. SalesAI (Sarah)**
```typescript
class SalesAI implements AITeamMember {
  id = 'sales_ai';
  name = 'Sarah';
  role = 'sales';
  model = 'Gemini 1.5 Pro';
  specialties = ['psychological_tactics', 'pricing_optimization', 'urgency_creation'];
  learningRate = 0.88;
  
  async optimizeSalesMessage(fanData: any, contentType: string) {
    // 1. Récupérer intelligence de l'équipe
    const messagingStyle = this.network.getRelevantInsights(
      fanData.creatorId, 
      'effective_styles'
    );
    const analyticsData = this.network.getRelevantInsights(
      fanData.creatorId, 
      'fan_patterns'
    );
    
    // 2. Formuler stratégie
    const strategy = this.formulateStrategy(
      fanData, 
      [...messagingStyle, ...analyticsData]
    );
    
    // 3. Générer message optimisé avec Gemini
    const prompt = `Create a sales message for ${contentType}
                    Fan profile: ${JSON.stringify(fanData)}
                    Strategy: ${JSON.stringify(strategy)}
                    Use tactics: ${strategy.tactics.join(', ')}`;
    
    const message = await geminiService.generateText(prompt);
    
    // 4. Partager tactiques réussies
    this.network.broadcastInsight(fanData.creatorId, {
      source: this.id,
      type: 'optimization',
      confidence: 0.9,
      data: { category: 'sales_tactics', strategy }
    });
    
    return {
      message,
      tactics: strategy.tactics,
      predictedConversion: strategy.conversionProbability
    };
  }
}
```

**4. ComplianceAI (Claire)**
```typescript
class ComplianceAI implements AITeamMember {
  id = 'compliance_ai';
  name = 'Claire';
  role = 'compliance';
  model = 'Gemini 1.5 Pro';
  specialties = ['platform_rules', 'risk_assessment', 'content_filtering'];
  learningRate = 0.95;
  
  async checkContent(platform: string, content: string) {
    // 1. Récupérer règles actuelles
    const rules = await this.getCurrentRules(platform);
    
    // 2. Scanner avec règles locales
    const localIssues = this.scanContent(content, rules);
    
    // 3. Vérifier avec Gemini pour nuances
    const prompt = `Check this ${platform} content for compliance:
                    "${content}"
                    Platform rules: ${JSON.stringify(rules)}
                    Identify any violations or risks.`;
    
    const aiCheck = await geminiService.generateStructuredOutput(prompt, {
      safe: 'boolean',
      issues: 'array',
      riskLevel: 'string',
      suggestions: 'array'
    });
    
    // 4. Combiner résultats
    const allIssues = [...localIssues, ...aiCheck.issues];
    
    // 5. Si nouveau risque, alerter l'équipe
    if (aiCheck.riskLevel === 'high') {
      this.network.broadcastInsight('global', {
        source: this.id,
        type: 'warning',
        confidence: 0.95,
        data: { platform, riskType: aiCheck.riskLevel, pattern: content },
        impact: 'critical'
      });
    }
    
    return {
      safe: allIssues.length === 0,
      issues: allIssues,
      suggestions: aiCheck.suggestions
    };
  }
}
```

---

## 🔄 Flux de Données

### Flux 1: Message d'un Fan

```
1. Fan envoie message
   ↓
2. API /api/ai/chat reçoit
   ↓
3. AITeamCoordinator.handleFanMessage()
   ↓
4. ComplianceAI vérifie sécurité
   ├─ Safe → Continue
   └─ Unsafe → Retourne erreur
   ↓
5. MessagingAI génère réponse
   ├─ Demande insights à AIKnowledgeNetwork
   ├─ Construit prompt enrichi
   ├─ Appelle Gemini
   └─ Partage résultat si succès
   ↓
6. SalesAI optimise pour vente
   ├─ Récupère patterns de vente
   ├─ Formule stratégie
   └─ Génère message optimisé
   ↓
7. AnalyticsAI analyse contexte
   ├─ Détecte patterns
   ├─ Fait prédictions
   └─ Génère recommandations
   ↓
8. AITeamCoordinator combine résultats
   ↓
9. Retourne à l'API
   ↓
10. API retourne au client
```

### Flux 2: Génération de Contenu

```
1. Utilisateur demande caption
   ↓
2. API /api/ai/generate-caption
   ↓
3. MessagingAI.generateCaption()
   ├─ Récupère style préféré (Analytics)
   ├─ Récupère hashtags tendance (Analytics)
   └─ Récupère tactiques de vente (Sales)
   ↓
4. Construit prompt enrichi
   ↓
5. Appelle Gemini
   ↓
6. Post-traite résultat
   ├─ Ajoute hashtags
   ├─ Vérifie compliance
   └─ Optimise pour plateforme
   ↓
7. Partage pattern si succès
   ↓
8. Retourne caption
```

### Flux 3: Apprentissage Collectif

```
1. Emma découvre pattern efficace
   ↓
2. Emma.broadcastInsight()
   ↓
3. AIKnowledgeNetwork stocke
   ├─ Ajoute à insights du créateur
   └─ Si confidence > 0.8 → pattern global
   ↓
4. AIKnowledgeNetwork.emit('new_insight')
   ↓
5. Tous les agents reçoivent
   ├─ Sarah (Sales) → Ajoute à tactiques
   ├─ Alex (Analytics) → Corrèle avec données
   └─ Claire (Compliance) → Vérifie risques
   ↓
6. Chaque agent met à jour learningRate
   ↓
7. Système devient plus intelligent
```

---

## 🔌 Intégration Gemini

### Service Gemini

**Fichier:** `lib/ai/gemini.service.ts`

```typescript
class GeminiService {
  private model: GenerativeModel;
  
  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }
  
  async generateText(prompt: string, options?: GenerationOptions): Promise<string> {
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 1024,
      }
    });
    
    return result.response.text();
  }
  
  async chat(messages: Message[]): Promise<string> {
    const chat = this.model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
    });
    
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    
    return result.response.text();
  }
  
  async generateStructuredOutput(prompt: string, schema: any): Promise<any> {
    const enhancedPrompt = `${prompt}

Return your response as JSON matching this schema:
${JSON.stringify(schema, null, 2)}`;
    
    const text = await this.generateText(enhancedPrompt);
    return JSON.parse(text);
  }
}

export const geminiService = new GeminiService();
```

### Patterns d'Utilisation

**1. Génération Simple**
```typescript
const caption = await geminiService.generateText(
  'Generate an Instagram caption about fitness'
);
```

**2. Chat Conversationnel**
```typescript
const response = await geminiService.chat([
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi! How can I help?' },
  { role: 'user', content: 'Suggest content ideas' }
]);
```

**3. Sortie Structurée**
```typescript
const analysis = await geminiService.generateStructuredOutput(
  'Analyze this post performance',
  {
    engagement: 'number',
    sentiment: 'string',
    recommendations: 'array'
  }
);
```

---

## 📡 Patterns de Communication

### Pattern 1: Event-Driven

Les agents communiquent via événements:

```typescript
// Agent émet un événement
this.network.emit('new_insight', { creatorId, insight });

// Autres agents écoutent
this.network.on('new_insight', ({ creatorId, insight }) => {
  this.processInsight(insight);
});
```

### Pattern 2: Request-Response

Pour les requêtes synchrones:

```typescript
// Demander des insights
const insights = this.network.getRelevantInsights(creatorId, context);

// Utiliser immédiatement
const response = this.buildResponse(message, insights);
```

### Pattern 3: Pub-Sub

Pour la diffusion large:

```typescript
// Publisher
this.network.broadcastInsight(creatorId, insight);

// Subscribers (tous les agents)
agents.forEach(agent => {
  agent.on('new_insight', handleInsight);
});
```

---

## ⚡ Scalabilité et Performance

### Caching

**Stratégie:** Cache multi-niveaux

```typescript
// 1. Cache mémoire (Redis)
const cached = await redis.get(`insight:${creatorId}:${context}`);
if (cached) return JSON.parse(cached);

// 2. Générer si pas en cache
const insights = await this.generateInsights(creatorId, context);

// 3. Mettre en cache (1 heure)
await redis.setex(
  `insight:${creatorId}:${context}`,
  3600,
  JSON.stringify(insights)
);
```

### Rate Limiting

**Par utilisateur:**
```typescript
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/min
});

const { success } = await ratelimit.limit(userId);
if (!success) throw new Error('Rate limit exceeded');
```

### Optimisation des Prompts

**Techniques:**
1. **Prompt Caching** - Réutiliser les prompts similaires
2. **Batch Processing** - Grouper les requêtes
3. **Streaming** - Réponses progressives
4. **Compression** - Réduire la taille des prompts

### Monitoring

**Métriques clés:**
```typescript
// Latence par agent
metrics.histogram('agent.latency', duration, { agent: 'messaging_ai' });

// Taux de succès
metrics.increment('agent.success', { agent: 'messaging_ai' });

// Coûts API
metrics.gauge('gemini.tokens_used', tokensUsed);

// Learning rate
metrics.gauge('agent.learning_rate', this.learningRate);
```

---

## 📊 Diagrammes de Séquence

### Séquence Complète: Traitement d'un Message

```
User          API           Coordinator    Compliance    Messaging    Sales    Analytics    Gemini
 │             │                 │              │            │          │          │           │
 │─Message────>│                 │              │            │          │          │           │
 │             │─handleMessage──>│              │            │          │          │           │
 │             │                 │─checkContent>│            │          │          │           │
 │             │                 │              │─verify────>│          │          │           │
 │             │                 │              │<─safe──────│          │          │           │
 │             │                 │<─safe────────│            │          │          │           │
 │             │                 │─generateResp─────────────>│          │          │           │
 │             │                 │              │            │─getInsights────────>│           │
 │             │                 │              │            │<─insights───────────│           │
 │             │                 │              │            │─generate───────────────────────>│
 │             │                 │              │            │<─response───────────────────────│
 │             │                 │<─response────────────────│          │          │           │
 │             │                 │─optimizeSales────────────────────>│          │           │
 │             │                 │              │            │          │─getPatterns────────>│
 │             │                 │              │            │          │<─patterns───────────│
 │             │                 │<─optimized───────────────────────│          │           │
 │             │                 │─analyze──────────────────────────────────────>│           │
 │             │                 │              │            │          │          │─predict─>│
 │             │                 │              │            │          │          │<─result──│
 │             │                 │<─insights────────────────────────────────────│           │
 │             │<─combined───────│              │            │          │          │           │
 │<─response───│                 │              │            │          │          │           │
```

---

## 🎯 Résumé de l'Architecture

### Points Clés

1. **Multi-Agents Spécialisés**
   - 4 IA avec expertise unique
   - Communication via réseau d'événements
   - Apprentissage collectif

2. **Orchestration Centralisée**
   - AITeamCoordinator gère le flux
   - AIKnowledgeNetwork partage les connaissances
   - Résultats combinés intelligemment

3. **Intégration Gemini**
   - Service unifié pour toutes les IA
   - Prompts enrichis avec contexte
   - Sortie structurée et validée

4. **Scalabilité**
   - Caching multi-niveaux
   - Rate limiting
   - Monitoring complet

5. **Résilience**
   - Fallback automatique
   - Gestion d'erreurs
   - Isolation des agents

---

**Fichiers Clés:**
- `src/lib/of/ai-team-system.ts` - Système multi-agents
- `src/lib/of/ai-learning-network.ts` - Réseau d'apprentissage
- `lib/ai/gemini.service.ts` - Service Gemini
- `docs/AI_MULTI_AGENT_EXPLAINED.md` - Explication simplifiée
- `docs/AI_INTEGRATION_PLAN.md` - Plan d'intégration

