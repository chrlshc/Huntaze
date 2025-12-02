# Analyse Complète des Cas d'Usage IA - Huntaze

**Date**: 1er décembre 2024  
**Objectif**: Documenter tous les cas d'usage de l'IA dans l'application Huntaze

---

## 📊 Vue d'Ensemble

### Modèles IA Utilisés

1. **OpenAI GPT-4o-mini** (via OpenAI SDK)
   - Utilisé pour: Chat, génération de captions, suggestions OnlyFans
   - Coût: ~$0.001-$0.05 par requête

2. **Google Gemini 2.0 Flash Exp** (via @google/generative-ai)
   - Utilisé pour: Tous les autres cas d'usage
   - Coût: ~$0.001-$0.05 par requête

3. **Azure OpenAI** (infrastructure prête mais non utilisée actuellement)
   - Modèles configurés: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo, GPT-4 Vision
   - Status: Infrastructure déployée, en attente de migration

---

## 🎯 Cas d'Usage par Catégorie

### 1. **Messaging & Communication** 💬

#### 1.1 AI Chat (`/api/ai/chat`)
- **Modèle**: OpenAI GPT-4o-mini
- **Fonction**: Générer des réponses IA aux messages des fans
- **Entrées**:
  - `fanId`: Identifiant du fan
  - `message`: Message du fan
  - `context`: Niveau d'engagement, historique d'achat
- **Sorties**:
  - Réponse personnalisée
  - Suggestions d'upsell
  - Tactiques de vente
  - Score de confiance
- **Agents impliqués**: MessagingAgent, SalesAgent
- **Rate Limit**: 50-500 req/h selon le plan
- **Coût moyen**: $0.001-$0.05 par requête

#### 1.2 Quick Replies (`/api/ai/quick-replies`)
- **Modèle**: Aucun (stockage de templates)
- **Fonction**: Gérer les réponses rapides pré-configurées
- **Entrées**: Templates de messages
- **Sorties**: Liste de templates sauvegardés
- **Note**: Pas d'IA, juste du CRUD

#### 1.3 AI Suggestions (`/api/ai/suggestions`)
- **Modèle**: OnlyFans AI Assistant Enhanced (multi-provider)
- **Fonction**: Générer des suggestions de messages personnalisées
- **Entrées**:
  - `fanId`, `creatorId`
  - `lastMessage`: Dernier message
  - `messageCount`: Nombre de messages
  - `fanValueCents`: Valeur du fan
- **Sorties**:
  - Liste de suggestions de messages
  - Métadonnées (durée, correlation ID)
- **Features**:
  - Circuit breaker pour la résilience
  - Retry automatique
  - Health check endpoint
- **Rate Limit**: Basé sur le plan
- **Coût moyen**: Variable selon le provider

#### 1.4 OnlyFans AI Suggestions (`/api/onlyfans/ai/suggestions`)
- **Modèle**: OpenAI GPT-4o-mini
- **Fonction**: Suggestions spécifiques OnlyFans
- **Entrées**: Contexte OnlyFans (fan, messages, engagement)
- **Sorties**: Suggestions optimisées pour OnlyFans
- **Spécificité**: Optimisé pour la plateforme OnlyFans

---

### 2. **Content Creation** ✍️

#### 2.1 Generate Caption (`/api/ai/generate-caption`)
- **Modèle**: OpenAI GPT-4o-mini
- **Fonction**: Générer des captions et hashtags optimisés
- **Entrées**:
  - `platform`: instagram, tiktok, twitter, onlyfans, facebook
  - `contentInfo`:
    - `type`: photo, video, story
    - `description`: Description du contenu
    - `mood`: fun, serious, relaxed
    - `targetAudience`: Audience cible
    - `analyticsInsights`: Données de performance (optionnel)
- **Sorties**:
  - Caption optimisée
  - Liste de hashtags
  - Score de confiance
  - Insights de performance
- **Agents impliqués**: ContentAgent, AnalyticsAgent
- **Optimisations par plateforme**:
  - **Instagram**: Storytelling visuel, 3-5 hashtags, emojis
  - **TikTok**: Hashtags tendance, call-to-action, hooks viraux
  - **Twitter**: Concis, 1-2 hashtags
  - **OnlyFans**: Teasers exclusifs, prompts d'engagement
  - **Facebook**: Long-form, focus communauté
- **Rate Limit**: 50-500 req/h
- **Coût moyen**: $0.001-$0.02 par requête

#### 2.2 Content AI Suggestions (`/api/content/ai/suggestions`)
- **Modèle**: AI Content Service (provider non spécifié)
- **Fonction**: Suggestions de contenu basées sur l'historique
- **Entrées**:
  - `type`: Type de suggestion
  - `context`: Contexte additionnel
  - `userId`: Identifiant utilisateur
- **Sorties**:
  - Suggestions de contenu
  - Insights utilisateur:
    - Top performing content
    - Recommended topics
- **Features**:
  - Analyse de l'historique utilisateur
  - Recommandations personnalisées

---

### 3. **Analytics & Performance** 📈

#### 3.1 Analyze Performance (`/api/ai/analyze-performance`)
- **Modèle**: Google Gemini (via AnalyticsAgent)
- **Fonction**: Analyser les métriques avec insights IA
- **Entrées**:
  - `metrics`:
    - `platforms`: Liste de plateformes
    - `contentTypes`: Types de contenu
    - `timeframe`: Période d'analyse
    - `engagementData`: Likes, comments, shares, views
    - `revenueData`: Revenus par plateforme
    - `audienceData`: Followers, démographie
- **Sorties**:
  - **Insights**: Découvertes clés avec impact (high/medium/low)
  - **Recommendations**: Actions recommandées avec priorité
  - **Patterns**: Motifs identifiés avec fréquence
  - **Predictions**: Prédictions futures avec confiance
  - Score de confiance global
- **Agents impliqués**: AnalyticsAgent
- **Types d'analyse**:
  - Engagement analysis
  - Content performance
  - Audience behavior
  - Revenue trends
  - Competitive positioning
  - Growth opportunities
- **Rate Limit**: 50-500 req/h
- **Coût moyen**: $0.002-$0.05 par requête

#### 3.2 Analytics AI Summary (`/api/analytics/ai/summary`)
- **Modèle**: Aucun (récupération de données)
- **Fonction**: Récupérer le dernier résumé d'insights
- **Entrées**:
  - `account_id`: ID du compte
  - `period`: Période (optionnel)
- **Sorties**: Résumé d'insights pré-généré
- **Note**: Pas de génération IA en temps réel, juste récupération

---

### 4. **Sales Optimization** 💰

#### 4.1 Optimize Sales (`/api/ai/optimize-sales`)
- **Modèle**: Google Gemini (via SalesAgent)
- **Fonction**: Optimiser les messages de vente pour la conversion
- **Entrées**:
  - `fanId`: Identifiant du fan
  - `context`:
    - `currentMessage`: Message actuel à optimiser
    - `fanProfile`: Nom, tier, lifetime value
    - `purchaseHistory`: Dépenses, dernière commande, AOV
    - `engagementLevel`: low, medium, high
    - `contentType`: Type de contenu à vendre
    - `pricePoint`: Prix proposé
- **Sorties**:
  - Message optimisé
  - **Tactics**: Tactiques utilisées avec rationale
  - `suggestedPrice`: Prix recommandé par l'IA
  - `expectedConversionRate`: Taux de conversion estimé
  - `alternativeMessages`: Approches alternatives
- **Agents impliqués**: SalesAgent
- **Tactiques psychologiques**:
  1. Personalization (utilisation du nom)
  2. Scarcity (disponibilité limitée)
  3. Social Proof (popularité, exclusivité)
  4. Reciprocity (offrir de la valeur d'abord)
  5. Authority (expertise, statut)
  6. Urgency (opportunités limitées dans le temps)
  7. Exclusivity (avantages VIP/premium)
  8. Emotional Appeal (désir, connexion)
- **Optimisation de prix**:
  - Historique d'achat du fan
  - Type de contenu et effort de production
  - Taux du marché
  - Niveau d'engagement et fidélité
  - Tendances saisonnières
  - Prix des concurrents
- **Rate Limit**: 50-500 req/h
- **Coût moyen**: $0.001-$0.03 par requête

---

### 5. **Onboarding & Configuration** 🚀

#### 5.1 Apply Onboarding Config (`/api/ai/apply-onboarding-config`)
- **Modèle**: À déterminer
- **Fonction**: Appliquer la configuration IA lors de l'onboarding
- **Status**: Endpoint existant, détails à documenter

#### 5.2 AI Config (`/api/ai/config`)
- **Modèle**: Aucun (configuration)
- **Fonction**: Gérer la configuration IA de l'utilisateur
- **Status**: Endpoint existant, détails à documenter

---

### 6. **Testing & Development** 🧪

#### 6.1 AI Test (`/api/ai/test`)
- **Modèle**: Google Gemini 1.5 Flash
- **Fonction**: Endpoint de test pour la génération de texte
- **Entrées**:
  - `creatorId`: Identifiant créateur
  - `prompt`: Prompt de test (max 10,000 chars)
  - `temperature`: 0-2 (optionnel, défaut: 0.7)
  - `maxOutputTokens`: 1-8192 (optionnel, défaut: 512)
- **Sorties**:
  - Texte généré
  - Usage (tokens, coût)
  - Métadonnées (durée, request ID)
- **Features**:
  - Retry automatique avec exponential backoff (3 tentatives max)
  - Rate limiting: 100 req/h
  - Billing automatique
  - Timeout: 30 secondes
  - Structured error handling
  - Correlation ID tracking
- **Rate Limit**: 100 req/h
- **Coût moyen**: $0.001-$0.05 par requête

#### 6.2 AI Hooks (`/api/ai/hooks`)
- **Modèle**: À déterminer
- **Fonction**: Webhooks/hooks pour événements IA
- **Status**: Endpoint existant, détails à documenter

---

### 7. **Quota & Monitoring** 📊

#### 7.1 AI Quota (`/api/ai/quota`)
- **Modèle**: Aucun (gestion de quota)
- **Fonction**: Vérifier et gérer les quotas IA
- **Quotas par plan**:
  - **Starter**: $10/mois
  - **Pro**: $50/mois
  - **Business**: Illimité
- **Features**:
  - Vérification en temps réel
  - Enforcement automatique
  - Retour 429 si dépassé

#### 7.2 Admin AI Costs (`/api/admin/ai-costs`)
- **Modèle**: Aucun (reporting)
- **Fonction**: Dashboard admin des coûts IA
- **Données**:
  - Coûts par créateur
  - Coûts par feature
  - Coûts par modèle
  - Tendances temporelles
- **Access**: Admin uniquement

---

## 🏗️ Architecture Multi-Agent

### Agents IA Disponibles

1. **MessagingAgent**
   - Génération de réponses contextuelles
   - Adaptation au ton et style
   - Gestion de conversations

2. **ContentAgent**
   - Génération de captions
   - Optimisation de hashtags
   - Adaptation par plateforme

3. **AnalyticsAgent**
   - Analyse de performance
   - Identification de patterns
   - Génération de recommandations
   - Prédictions futures

4. **SalesAgent**
   - Optimisation de messages de vente
   - Suggestions d'upsell
   - Optimisation de prix
   - Tactiques de conversion

### AITeamCoordinator

- **Rôle**: Orchestration des agents
- **Features**:
  - Routing intelligent des requêtes
  - Combinaison multi-agent
  - Gestion des échecs gracieuse
  - Fallback automatique

### AIKnowledgeNetwork

- **Rôle**: Mémoire partagée entre agents
- **Features**:
  - Stockage d'insights cross-agent
  - Contexte pour les agents
  - Apprentissage collectif
  - Amélioration continue

---

## 💰 Gestion des Coûts

### Tracking Automatique

Toutes les requêtes IA sont automatiquement trackées:

```sql
-- Table: usage_logs
- creatorId
- feature (chat, caption, analysis, sales)
- model (gpt-4o-mini, gemini-2.0-flash-exp)
- inputTokens
- outputTokens
- costUsd
- timestamp
- correlationId

-- Table: monthly_charges
- creatorId
- month
- totalCostUsd
- requestCount
- plan
```

### Optimisation des Coûts

1. **Cache Responses**: Cache 5 minutes pour requêtes communes
2. **Batch Requests**: Combiner opérations quand possible
3. **Use Flash Model**: Gemini Flash pour tâches high-volume
4. **Optimize Prompts**: Prompts courts = coûts réduits
5. **Monitor Usage**: Tracking par feature/créateur

---

## 🔒 Sécurité & Rate Limiting

### Rate Limits par Plan

| Plan | Requêtes/Heure | Quota Mensuel |
|------|----------------|---------------|
| Starter | 50 | $10 |
| Pro | 100 | $50 |
| Business | 500 | Illimité |

### Sécurité

- ✅ Authentication requise (NextAuth session)
- ✅ Rate limiting (Redis-based)
- ✅ Quota enforcement (Database-based)
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ CORS configuré
- ✅ Error messages sanitized
- ✅ Correlation IDs pour tracking

---

## 📈 Performance

### Métriques Cibles

- **Response Time**: < 3s (p95)
- **Token Usage**: 100-1000 tokens/requête
- **Cost**: $0.001-$0.05/requête
- **Throughput**: 100+ req/s (avec scaling)
- **Timeout**: 30 secondes

### Monitoring

- Correlation IDs pour request tracking
- Execution time dans response metadata
- Error logging avec stack traces
- Usage metrics en database
- CloudWatch logs

---

## 🔄 Résilience & Reliability

### Circuit Breaker

- Implémenté dans OnlyFans AI Assistant Enhanced
- Protection contre les cascading failures
- Retry automatique avec exponential backoff
- Health check endpoints

### Error Handling

Tous les endpoints retournent des erreurs structurées:

```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'User-friendly message',
    retryable: boolean,
    metadata?: { ... }
  },
  meta: {
    timestamp: string,
    requestId: string,
    duration?: number
  }
}
```

### Retry Logic

- **Max Retries**: 3 tentatives
- **Initial Delay**: 1000ms
- **Max Delay**: 5000ms
- **Backoff Factor**: 2x
- **Retryable Errors**: Network, 5xx, timeout

---

## 🚀 Prochaines Étapes

### Migrations Planifiées

1. **Migration vers Azure OpenAI**
   - Infrastructure déjà déployée
   - Modèles configurés
   - En attente de migration du code

2. **Migration vers GCP (Gemini)**
   - Spec créée: `.kiro/specs/huntaze-ai-gcp-migration/`
   - Design documenté
   - Prêt pour implémentation

### Améliorations Futures

- [ ] Streaming responses pour chat temps réel
- [ ] Support multi-langue
- [ ] Transcription de messages vocaux
- [ ] Analyse d'images pour contenu
- [ ] A/B testing pour messages de vente
- [ ] Rapports de performance automatisés
- [ ] Training d'agents personnalisés par créateur

---

## 📚 Documentation Associée

- [AI System Architecture](./docs/AI_FULL_ARCHITECTURE.md)
- [Azure AI Migration](./kiro/specs/huntaze-ai-azure-migration/)
- [GCP Migration Design](./kiro/specs/huntaze-ai-gcp-migration/)
- [Gemini Billing Service](./lib/ai/gemini-billing.service.ts)
- [Rate Limiting](./lib/ai/rate-limit.ts)
- [AI Integration Guide](./lib/ai/INTEGRATION_GUIDE.md)

---

## 🎯 Résumé Exécutif

### Cas d'Usage Principaux

1. **Messaging** (4 endpoints): Chat, suggestions, quick replies
2. **Content** (2 endpoints): Captions, suggestions de contenu
3. **Analytics** (2 endpoints): Performance analysis, summaries
4. **Sales** (1 endpoint): Optimisation de conversion
5. **Admin** (3 endpoints): Config, quota, monitoring
6. **Testing** (2 endpoints): Test, hooks

### Total: 14 endpoints IA actifs

### Modèles Utilisés

- **OpenAI GPT-4o-mini**: 3 endpoints (chat, caption, OnlyFans suggestions)
- **Google Gemini 2.0 Flash**: Tous les autres cas d'usage
- **Azure OpenAI**: Infrastructure prête, non utilisée

### Coûts Estimés

- **Par requête**: $0.001 - $0.05
- **Quotas mensuels**: $10 (Starter) → $50 (Pro) → Illimité (Business)
- **Tracking**: Automatique via database

### Points Forts

✅ Architecture multi-agent sophistiquée  
✅ Rate limiting et quota management robustes  
✅ Retry automatique et circuit breakers  
✅ Tracking complet des coûts  
✅ Documentation exhaustive  
✅ Error handling structuré  

### Points d'Amélioration

⚠️ Migration Azure OpenAI à finaliser  
⚠️ Certains endpoints manquent de documentation  
⚠️ Consolidation possible des providers  
⚠️ Monitoring à améliorer (métriques Prometheus)  

---

**Dernière mise à jour**: 1er décembre 2024  
**Auteur**: Analyse automatisée Kiro
