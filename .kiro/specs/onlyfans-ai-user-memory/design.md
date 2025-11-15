# Design Document

## Overview

Le système de mémoire utilisateur IA OnlyFans est conçu pour transformer l'assistant IA actuel (qui a une mémoire volatile) en un système intelligent avec mémoire persistante et apprentissage continu. L'architecture s'appuie sur l'infrastructure existante (HuntazeAIAssistant, PostgreSQL, Redis) tout en ajoutant une couche de persistance et d'intelligence contextuelle.

### Objectifs Clés
- Mémoire persistante par fan avec contexte conversationnel complet
- Calibration automatique de la personnalité basée sur l'historique
- Apprentissage des préférences et patterns comportementaux
- Performance élevée (p95 < 300ms) avec scalabilité horizontale
- Conformité GDPR avec chiffrement et droit à l'oubli

## Architecture

### Vue d'Ensemble du Système

```
┌─────────────────────────────────────────────────────────────────┐
│                     OnlyFans Messaging Layer                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HuntazeAIAssistant (Enhanced)                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Message Handler  │  │ Response Builder │  │ Personality   │ │
│  │                  │  │                  │  │ Calibrator    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    User Memory Service Layer                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Memory Manager   │  │ Preference       │  │ Emotion       │ │
│  │                  │  │ Learning Engine  │  │ Analyzer      │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Cache Layer (Redis)                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Hot Memory Cache │  │ Personality      │  │ Preference    │ │
│  │ (Recent 50 msgs) │  │ Profile Cache    │  │ Cache         │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Persistence Layer (PostgreSQL)                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ fan_memories     │  │ fan_preferences  │  │ personality   │ │
│  │ (conversations)  │  │ (learned prefs)  │  │ _profiles     │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de Données Principal

1. **Message Entrant** → HuntazeAIAssistant reçoit un message fan
2. **Memory Retrieval** → UserMemoryService récupère le contexte (cache → DB)
3. **Context Building** → Agrégation de l'historique, préférences, personnalité
4. **Response Generation** → AI génère une réponse calibrée
5. **Memory Update** → Nouveau message + métadonnées persistés
6. **Learning** → PreferenceLearningEngine met à jour les patterns

## Components and Interfaces

### 1. UserMemoryService

Service principal gérant toutes les opérations de mémoire.

```typescript
interface UserMemoryService {
  // Core memory operations
  getMemoryContext(fanId: string, creatorId: string): Promise<MemoryContext>;
  saveInteraction(interaction: InteractionEvent): Promise<void>;
  clearMemory(fanId: string, creatorId: string): Promise<void>;
  
  // Bulk operations
  getMemoriesForFans(fanIds: string[], creatorId: string): Promise<Map<string, MemoryContext>>;
  
  // Analytics
  getEngagementScore(fanId: string, creatorId: string): Promise<number>;
  getMemoryStats(creatorId: string): Promise<MemoryStats>;
}

interface MemoryContext {
  fanId: string;
  creatorId: string;
  recentMessages: ConversationMessage[];
  personalityProfile: PersonalityProfile;
  preferences: FanPreferences;
  emotionalState: EmotionalState;
  engagementMetrics: EngagementMetrics;
  lastInteraction: Date;
}

interface ConversationMessage {
  id: string;
  content: string;
  sender: 'fan' | 'creator' | 'ai';
  timestamp: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  metadata: Record<string, any>;
}
```

### 2. PersonalityCalibrator

Ajuste automatiquement la personnalité de l'IA pour chaque fan.

```typescript
interface PersonalityCalibrator {
  calibratePersonality(
    fanId: string,
    interactionHistory: InteractionEvent[]
  ): Promise<PersonalityProfile>;
  
  adjustTone(
    currentProfile: PersonalityProfile,
    feedback: InteractionFeedback
  ): PersonalityProfile;
  
  getOptimalResponseStyle(
    fanId: string,
    context: MemoryContext
  ): ResponseStyle;
}

interface PersonalityProfile {
  fanId: string;
  tone: 'flirty' | 'friendly' | 'professional' | 'playful' | 'dominant';
  emojiFrequency: number; // 0-1
  messageLengthPreference: 'short' | 'medium' | 'long';
  punctuationStyle: 'casual' | 'proper';
  preferredEmojis: string[];
  responseSpeed: 'immediate' | 'delayed' | 'variable';
  confidenceScore: number; // 0-1
  lastCalibrated: Date;
  interactionCount: number;
}

interface ResponseStyle {
  maxLength: number;
  emojiCount: number;
  tone: string;
  topics: string[];
  avoidTopics: string[];
}
```

### 3. PreferenceLearningEngine

Apprend et prédit les préférences de contenu.

```typescript
interface PreferenceLearningEngine {
  learnFromInteraction(interaction: InteractionEvent): Promise<void>;
  
  getPredictedPreferences(
    fanId: string,
    creatorId: string
  ): Promise<FanPreferences>;
  
  updatePreferenceScore(
    fanId: string,
    category: string,
    delta: number
  ): Promise<void>;
  
  getContentRecommendations(
    fanId: string,
    availableContent: ContentItem[]
  ): Promise<ContentRecommendation[]>;
}

interface FanPreferences {
  fanId: string;
  contentPreferences: Map<string, PreferenceScore>;
  topicInterests: Map<string, number>;
  purchasePatterns: PurchasePattern[];
  communicationPreferences: CommunicationPreference;
  lastUpdated: Date;
}

interface PreferenceScore {
  category: string;
  score: number; // 0-1
  confidence: number; // 0-1
  evidenceCount: number;
  lastInteraction: Date;
}

interface PurchasePattern {
  contentType: 'ppv' | 'tip' | 'custom';
  averageAmount: number;
  frequency: number; // purchases per month
  preferredDays: number[]; // 0-6 (Sunday-Saturday)
  preferredHours: number[]; // 0-23
}
```

### 4. EmotionAnalyzer

Détecte et suit les états émotionnels des fans.

```typescript
interface EmotionAnalyzer {
  analyzeMessage(message: string): Promise<EmotionalAnalysis>;
  
  getEmotionalState(
    fanId: string,
    recentMessages: ConversationMessage[]
  ): Promise<EmotionalState>;
  
  detectDisengagement(
    fanId: string,
    context: MemoryContext
  ): Promise<DisengagementSignal | null>;
}

interface EmotionalAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: Map<string, number>; // joy: 0.8, excitement: 0.6, etc.
  intensity: number; // 0-1
}

interface EmotionalState {
  currentSentiment: 'positive' | 'negative' | 'neutral';
  sentimentHistory: SentimentDataPoint[];
  dominantEmotions: string[];
  engagementLevel: 'high' | 'medium' | 'low';
  lastPositiveInteraction: Date;
  lastNegativeInteraction: Date;
}

interface DisengagementSignal {
  type: 'short_responses' | 'long_delays' | 'negative_sentiment' | 'reduced_frequency';
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  suggestedAction: string;
}
```

### 5. MemoryRepository

Couche d'accès aux données avec cache.

```typescript
interface MemoryRepository {
  // Fan memories
  saveFanMemory(memory: FanMemory): Promise<void>;
  getFanMemory(fanId: string, creatorId: string): Promise<FanMemory | null>;
  getRecentMessages(fanId: string, limit: number): Promise<ConversationMessage[]>;
  
  // Preferences
  savePreferences(preferences: FanPreferences): Promise<void>;
  getPreferences(fanId: string, creatorId: string): Promise<FanPreferences | null>;
  
  // Personality profiles
  savePersonalityProfile(profile: PersonalityProfile): Promise<void>;
  getPersonalityProfile(fanId: string, creatorId: string): Promise<PersonalityProfile | null>;
  
  // Bulk operations
  bulkGetMemories(fanIds: string[], creatorId: string): Promise<Map<string, FanMemory>>;
  
  // Cleanup
  deleteMemory(fanId: string, creatorId: string): Promise<void>;
  cleanupOldMemories(olderThan: Date): Promise<number>;
}
```

## Data Models

### Database Schema (PostgreSQL)

```sql
-- Fan memories table (main conversation storage)
CREATE TABLE fan_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  message_content TEXT NOT NULL,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('fan', 'creator', 'ai')),
  sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  topics TEXT[], -- Array of extracted topics
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT fan_memories_fan_creator_idx UNIQUE (fan_id, creator_id, created_at)
);

CREATE INDEX idx_fan_memories_fan_creator ON fan_memories(fan_id, creator_id);
CREATE INDEX idx_fan_memories_created_at ON fan_memories(created_at DESC);
CREATE INDEX idx_fan_memories_sentiment ON fan_memories(sentiment) WHERE sentiment IS NOT NULL;

-- Fan preferences table
CREATE TABLE fan_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  content_preferences JSONB NOT NULL DEFAULT '{}',
  topic_interests JSONB NOT NULL DEFAULT '{}',
  purchase_patterns JSONB NOT NULL DEFAULT '[]',
  communication_preferences JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fan_preferences_unique UNIQUE (fan_id, creator_id)
);

CREATE INDEX idx_fan_preferences_fan_creator ON fan_preferences(fan_id, creator_id);

-- Personality profiles table
CREATE TABLE personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  tone VARCHAR(20) NOT NULL,
  emoji_frequency DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  message_length_preference VARCHAR(10) NOT NULL,
  punctuation_style VARCHAR(10) NOT NULL,
  preferred_emojis TEXT[] DEFAULT '{}',
  response_speed VARCHAR(20) NOT NULL DEFAULT 'variable',
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  last_calibrated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT personality_profiles_unique UNIQUE (fan_id, creator_id)
);

CREATE INDEX idx_personality_profiles_fan_creator ON personality_profiles(fan_id, creator_id);

-- Engagement metrics table
CREATE TABLE engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  engagement_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_purchases INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  avg_response_time_seconds INTEGER,
  last_interaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT engagement_metrics_unique UNIQUE (fan_id, creator_id)
);

CREATE INDEX idx_engagement_metrics_fan_creator ON engagement_metrics(fan_id, creator_id);
CREATE INDEX idx_engagement_metrics_score ON engagement_metrics(engagement_score DESC);

-- Emotional state tracking
CREATE TABLE emotional_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  current_sentiment VARCHAR(10) NOT NULL,
  sentiment_history JSONB NOT NULL DEFAULT '[]',
  dominant_emotions TEXT[] DEFAULT '{}',
  engagement_level VARCHAR(10) NOT NULL,
  last_positive_interaction TIMESTAMP WITH TIME ZONE,
  last_negative_interaction TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT emotional_states_unique UNIQUE (fan_id, creator_id)
);

CREATE INDEX idx_emotional_states_fan_creator ON emotional_states(fan_id, creator_id);
```

### Redis Cache Structure

```
# Hot memory cache (recent messages)
Key: memory:fan:{fanId}:creator:{creatorId}:messages
Type: LIST
TTL: 3600 seconds (1 hour)
Value: JSON array of last 50 messages

# Personality profile cache
Key: memory:fan:{fanId}:creator:{creatorId}:personality
Type: STRING
TTL: 7200 seconds (2 hours)
Value: JSON PersonalityProfile

# Preferences cache
Key: memory:fan:{fanId}:creator:{creatorId}:preferences
Type: STRING
TTL: 7200 seconds (2 hours)
Value: JSON FanPreferences

# Engagement score cache
Key: memory:fan:{fanId}:creator:{creatorId}:engagement
Type: STRING
TTL: 3600 seconds (1 hour)
Value: Number (0-1)

# Emotional state cache
Key: memory:fan:{fanId}:creator:{creatorId}:emotion
Type: STRING
TTL: 1800 seconds (30 minutes)
Value: JSON EmotionalState
```

## Error Handling

### Error Types et Stratégies

```typescript
enum MemoryErrorType {
  MEMORY_NOT_FOUND = 'MEMORY_NOT_FOUND',
  CACHE_UNAVAILABLE = 'CACHE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CALIBRATION_FAILED = 'CALIBRATION_FAILED',
  INVALID_DATA = 'INVALID_DATA',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

class MemoryError extends Error {
  constructor(
    public type: MemoryErrorType,
    public message: string,
    public recoverable: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
  }
}
```

### Stratégies de Récupération

1. **Cache Miss** → Fallback vers DB, puis reconstruire le cache
2. **DB Unavailable** → Utiliser cache uniquement, mode dégradé
3. **Calibration Failed** → Utiliser profil par défaut, logger pour analyse
4. **Invalid Data** → Sanitize et retry, ou utiliser valeurs par défaut
5. **Rate Limit** → Queue la requête, retry avec backoff exponentiel

### Circuit Breaker Pattern

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number; // 5 failures
  resetTimeout: number; // 60 seconds
  monitoringPeriod: number; // 10 seconds
}

// Appliqué sur:
// - Database connections
// - Redis connections
// - External AI API calls
```

## Testing Strategy

### 1. Unit Tests

**Couverture cible: 85%**

- `UserMemoryService`: Toutes les méthodes publiques
- `PersonalityCalibrator`: Algorithmes de calibration
- `PreferenceLearningEngine`: Logique d'apprentissage
- `EmotionAnalyzer`: Détection de sentiment
- `MemoryRepository`: Opérations CRUD

### 2. Integration Tests

**Scénarios critiques:**

```typescript
describe('Memory System Integration', () => {
  it('should persist and retrieve full conversation context', async () => {
    // Test end-to-end flow: save → retrieve → verify
  });
  
  it('should calibrate personality after 5 interactions', async () => {
    // Test personality evolution over multiple messages
  });
  
  it('should learn preferences from purchase history', async () => {
    // Test preference learning from PPV purchases
  });
  
  it('should detect disengagement signals', async () => {
    // Test disengagement detection algorithm
  });
  
  it('should handle cache failures gracefully', async () => {
    // Test fallback to DB when Redis is down
  });
});
```

### 3. Performance Tests

**Benchmarks:**

- Memory retrieval: p95 < 200ms
- Memory save: p95 < 100ms
- Bulk operations (100 fans): p95 < 2s
- Cache hit rate: > 90%
- Concurrent requests: 1000 req/s sustained

### 4. Load Tests

```typescript
// Simulate realistic OnlyFans traffic
const loadTestScenario = {
  virtualUsers: 500,
  duration: '10m',
  scenarios: {
    messageFlow: {
      weight: 70, // 70% of traffic
      exec: 'sendMessageAndGetResponse'
    },
    bulkRetrieval: {
      weight: 20, // 20% of traffic
      exec: 'getBulkMemories'
    },
    calibration: {
      weight: 10, // 10% of traffic
      exec: 'recalibratePersonality'
    }
  }
};
```

## Security Considerations

### 1. Data Encryption

- **At Rest**: AES-256 encryption pour toutes les colonnes sensibles
- **In Transit**: TLS 1.3 pour toutes les connexions
- **Key Management**: AWS KMS ou HashiCorp Vault

### 2. Access Control

```typescript
interface MemoryAccessControl {
  // Only creator can access their fans' memories
  canAccessMemory(userId: string, fanId: string, creatorId: string): boolean;
  
  // Admin access for support/debugging
  canAdminAccess(userId: string, role: string): boolean;
  
  // Audit logging
  logAccess(userId: string, action: string, fanId: string): void;
}
```

### 3. GDPR Compliance

- **Right to Access**: API endpoint pour exporter toutes les données d'un fan
- **Right to Erasure**: Suppression complète dans les 72h
- **Data Minimization**: Rétention automatique de 24 mois
- **Consent Management**: Tracking du consentement utilisateur

### 4. Rate Limiting

```typescript
const rateLimits = {
  memoryRetrieval: {
    perCreator: 1000, // requests per minute
    perFan: 100 // requests per minute
  },
  memorySave: {
    perCreator: 500, // requests per minute
    perFan: 50 // requests per minute
  },
  bulkOperations: {
    perCreator: 10, // requests per minute
    maxFansPerRequest: 100
  }
};
```

## Monitoring and Observability

### Key Metrics

```typescript
const memoryMetrics = {
  // Performance
  'memory.retrieval.latency.p95': 'histogram',
  'memory.save.latency.p95': 'histogram',
  'memory.cache.hit_rate': 'gauge',
  
  // Business
  'memory.total_fans_with_memory': 'gauge',
  'memory.avg_interactions_per_fan': 'gauge',
  'memory.personality_calibrations_per_hour': 'counter',
  
  // Errors
  'memory.errors.cache_miss': 'counter',
  'memory.errors.db_timeout': 'counter',
  'memory.errors.calibration_failed': 'counter',
  
  // Resources
  'memory.db.connection_pool.active': 'gauge',
  'memory.redis.memory_usage': 'gauge'
};
```

### Alerting Rules

```yaml
alerts:
  - name: HighMemoryRetrievalLatency
    condition: memory.retrieval.latency.p95 > 300ms
    severity: warning
    
  - name: LowCacheHitRate
    condition: memory.cache.hit_rate < 0.85
    severity: warning
    
  - name: DatabaseConnectionPoolExhausted
    condition: memory.db.connection_pool.active > 90%
    severity: critical
    
  - name: HighErrorRate
    condition: memory.errors.total > 100 per minute
    severity: critical
```

## Migration Strategy

### Phase 1: Infrastructure Setup (Week 1)
- Créer les tables PostgreSQL
- Configurer Redis cache
- Déployer UserMemoryService (read-only mode)

### Phase 2: Parallel Run (Week 2-3)
- Activer l'écriture des mémoires en parallèle
- Monitorer les performances
- Ajuster les configurations

### Phase 3: Integration (Week 4)
- Intégrer avec HuntazeAIAssistant
- Activer la calibration de personnalité
- Tests A/B sur 10% du trafic

### Phase 4: Full Rollout (Week 5-6)
- Rollout progressif à 100%
- Monitoring intensif
- Optimisations basées sur les métriques

## Future Enhancements

1. **Multi-Model AI**: Support pour GPT-4, Claude, et modèles custom
2. **Voice Memory**: Intégration avec messages vocaux
3. **Cross-Platform Memory**: Synchronisation avec Instagram, TikTok
4. **Predictive Analytics**: ML pour prédire les achats futurs
5. **Memory Sharing**: Partage de mémoires entre créateurs (avec consentement)
