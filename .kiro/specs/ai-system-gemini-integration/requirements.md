# Requirements Document

## Introduction

Ce document définit les exigences pour l'implémentation d'un système AI multi-agents optimisé pour la plateforme Huntaze. Le système utilise Google Gemini comme moteur d'IA générative et fournit des capacités d'assistance intelligente aux créateurs OnlyFans à travers quatre agents spécialisés : messaging, sales, analytics, et compliance. Le système inclut un tracking complet des coûts, des quotas par plan, et un réseau de connaissances partagé pour l'apprentissage collectif.

## Glossary

- **AI_System**: Le système complet d'intelligence artificielle multi-agents
- **Agent**: Un composant AI spécialisé avec un rôle spécifique (messaging, sales, analytics, compliance)
- **Coordinator**: Le composant orchestrateur qui route les requêtes vers les agents appropriés
- **Knowledge_Network**: Le système de mémoire partagée permettant aux agents d'apprendre collectivement
- **Gemini_Service**: Le service d'intégration avec l'API Google Gemini
- **Billing_Service**: Le service de tracking et calcul des coûts d'utilisation AI
- **Creator**: Un utilisateur de la plateforme Huntaze (créateur OnlyFans)
- **Usage_Log**: Enregistrement d'une utilisation AI avec tokens et coûts
- **Monthly_Quota**: Limite mensuelle de coûts AI par plan d'abonnement
- **Rate_Limiter**: Système de limitation du nombre de requêtes AI par créateur

## Requirements

### Requirement 1

**User Story:** En tant que créateur, je veux que le système AI génère des réponses intelligentes aux messages de mes fans, afin d'augmenter l'engagement et les conversions sans effort manuel.

#### Acceptance Criteria

1. WHEN un créateur reçoit un message d'un fan THEN THE AI_System SHALL générer une réponse contextuelle basée sur l'historique du fan
2. WHEN le système génère une réponse THEN THE AI_System SHALL intégrer des insights de vente et d'analytics pour optimiser la conversion
3. WHEN une réponse est générée THEN THE AI_System SHALL vérifier la conformité du contenu avant de la retourner
4. WHEN le système traite un message THEN THE AI_System SHALL enregistrer l'utilisation et les coûts associés
5. WHEN un agent génère une réponse réussie THEN THE AI_System SHALL partager les insights avec le Knowledge_Network

### Requirement 2

**User Story:** En tant qu'administrateur système, je veux migrer du SDK legacy @google/generative-ai vers @google/genai, afin d'utiliser les dernières fonctionnalités de Gemini 2.5 et 3.0.

#### Acceptance Criteria

1. WHEN le système initialise THEN THE Gemini_Service SHALL utiliser le SDK @google/genai
2. WHEN une requête AI est effectuée THEN THE Gemini_Service SHALL utiliser le modèle gemini-2.5-pro par défaut
3. WHEN le système appelle Gemini THEN THE Gemini_Service SHALL retourner les métadonnées d'utilisation (tokens input/output)
4. WHEN la configuration spécifie un modèle alternatif THEN THE Gemini_Service SHALL utiliser ce modèle (gemini-2.5-flash, gemini-2.5-flash-lite)
5. WHEN l'API key est manquante THEN THE Gemini_Service SHALL lever une erreur explicite au démarrage

### Requirement 3

**User Story:** En tant qu'administrateur financier, je veux tracker précisément tous les coûts d'utilisation AI par créateur et par feature, afin de gérer la rentabilité et facturer correctement.

#### Acceptance Criteria

1. WHEN un appel AI est effectué THEN THE Billing_Service SHALL calculer le coût en USD basé sur les tokens input/output
2. WHEN un coût est calculé THEN THE Billing_Service SHALL enregistrer un Usage_Log avec creatorId, feature, agentId, model, tokens, et coût
3. WHEN le système calcule un coût THEN THE Billing_Service SHALL utiliser les tarifs corrects par modèle (Pro: $1.25/$10, Flash: $0.30/$2.50 par million tokens)
4. WHEN un mois se termine THEN THE Billing_Service SHALL agréger les coûts mensuels par créateur
5. WHEN un créateur consulte son usage THEN THE Billing_Service SHALL retourner les statistiques détaillées par feature et agent

### Requirement 4

**User Story:** En tant que créateur avec un plan Starter, je veux être limité à un quota mensuel de coûts AI, afin que le système reste rentable pour la plateforme.

#### Acceptance Criteria

1. WHEN un créateur effectue une requête AI THEN THE AI_System SHALL vérifier que le quota mensuel n'est pas dépassé
2. WHEN un quota est dépassé THEN THE AI_System SHALL rejeter la requête avec un message explicite
3. WHEN le système vérifie un quota THEN THE AI_System SHALL utiliser les limites par plan (Starter: $10, Pro: $50, Business: illimité)
4. WHEN un nouveau mois commence THEN THE AI_System SHALL réinitialiser les compteurs de quota
5. WHEN un créateur upgrade son plan THEN THE AI_System SHALL appliquer immédiatement le nouveau quota

### Requirement 5

**User Story:** En tant que créateur, je veux être protégé contre les abus via rate limiting, afin d'éviter une consommation excessive accidentelle ou malveillante.

#### Acceptance Criteria

1. WHEN un créateur effectue des requêtes AI THEN THE Rate_Limiter SHALL limiter à 100 requêtes par heure
2. WHEN la limite est atteinte THEN THE Rate_Limiter SHALL retourner une erreur HTTP 429
3. WHEN le rate limit est dépassé THEN THE Rate_Limiter SHALL suggérer un upgrade de plan
4. WHEN une heure s'écoule THEN THE Rate_Limiter SHALL réinitialiser le compteur via sliding window
5. WHEN le système vérifie le rate limit THEN THE Rate_Limiter SHALL utiliser Redis (Upstash) pour le tracking distribué

### Requirement 6

**User Story:** En tant que développeur, je veux un Coordinator centralisé qui route intelligemment les requêtes vers les agents appropriés, afin de simplifier l'architecture API.

#### Acceptance Criteria

1. WHEN une requête AI arrive THEN THE Coordinator SHALL identifier le type de requête (fan_message, generate_caption, analyze_performance)
2. WHEN le type est identifié THEN THE Coordinator SHALL router vers les agents appropriés dans le bon ordre
3. WHEN plusieurs agents sont nécessaires THEN THE Coordinator SHALL orchestrer les appels séquentiels et combiner les résultats
4. WHEN un agent échoue THEN THE Coordinator SHALL gérer l'erreur gracieusement sans bloquer les autres agents
5. WHEN une réponse est prête THEN THE Coordinator SHALL retourner un résultat unifié avec les contributions de chaque agent

### Requirement 7

**User Story:** En tant qu'agent AI, je veux accéder à un Knowledge_Network partagé, afin d'apprendre des expériences des autres agents et améliorer mes réponses.

#### Acceptance Criteria

1. WHEN un agent génère un insight THEN THE Knowledge_Network SHALL stocker l'insight avec source, type, confidence, et données
2. WHEN un agent a besoin de contexte THEN THE Knowledge_Network SHALL retourner les insights pertinents par creatorId et type
3. WHEN plusieurs insights existent THEN THE Knowledge_Network SHALL prioriser par score de confidence
4. WHEN un insight est ancien THEN THE Knowledge_Network SHALL appliquer un decay temporel au score
5. WHEN le réseau atteint sa capacité THEN THE Knowledge_Network SHALL évincer les insights les moins pertinents

### Requirement 8

**User Story:** En tant qu'administrateur, je veux un dashboard de monitoring des coûts AI, afin de surveiller la consommation et identifier les anomalies.

#### Acceptance Criteria

1. WHEN un admin accède au dashboard THEN THE AI_System SHALL afficher les coûts totaux par période
2. WHEN les données sont affichées THEN THE AI_System SHALL grouper par créateur, feature, et agent
3. WHEN une anomalie est détectée THEN THE AI_System SHALL alerter sur les consommations inhabituelles
4. WHEN l'admin filtre les données THEN THE AI_System SHALL permettre le filtrage par date, créateur, et feature
5. WHEN les données sont exportées THEN THE AI_System SHALL fournir un export CSV avec tous les détails

### Requirement 9

**User Story:** En tant que développeur, je veux que tous les agents utilisent une interface commune pour appeler Gemini, afin de garantir la cohérence du billing et du logging.

#### Acceptance Criteria

1. WHEN un agent appelle Gemini THEN THE Agent SHALL utiliser la fonction generateTextWithBilling
2. WHEN generateTextWithBilling est appelée THEN THE Billing_Service SHALL automatiquement logger l'usage
3. WHEN un appel échoue THEN THE Billing_Service SHALL ne pas créer de log d'usage
4. WHEN un agent spécifie des paramètres THEN THE Billing_Service SHALL respecter temperature, maxOutputTokens, et model
5. WHEN la réponse est retournée THEN THE Billing_Service SHALL inclure les métadonnées d'usage (tokens, coût)

### Requirement 10

**User Story:** En tant que créateur, je veux que le système supporte les structured outputs JSON natifs de Gemini, afin d'obtenir des réponses formatées de manière fiable.

#### Acceptance Criteria

1. WHEN une structured output est demandée THEN THE Gemini_Service SHALL utiliser response_mime_type: 'application/json'
2. WHEN un schema est fourni THEN THE Gemini_Service SHALL utiliser response_json_schema pour valider la structure
3. WHEN la réponse est reçue THEN THE Gemini_Service SHALL parser le JSON automatiquement
4. WHEN le parsing échoue THEN THE Gemini_Service SHALL lever une erreur explicite
5. WHEN structured output est utilisée THEN THE Billing_Service SHALL logger l'usage normalement

### Requirement 11

**User Story:** En tant que développeur, je veux que le schéma de base de données supporte le tracking complet des usages et charges mensuelles, afin de maintenir un historique précis.

#### Acceptance Criteria

1. WHEN le système démarre THEN THE AI_System SHALL avoir les tables UsageLog et MonthlyCharge créées
2. WHEN un usage est loggé THEN THE UsageLog SHALL contenir creatorId, feature, agentId, model, tokensInput, tokensOutput, costUsd, createdAt
3. WHEN un mois se termine THEN THE MonthlyCharge SHALL contenir l'agrégation par creatorId avec totalTokensInput, totalTokensOutput, totalCostUsd
4. WHEN un créateur est supprimé THEN THE AI_System SHALL supprimer en cascade tous ses UsageLog et MonthlyCharge
5. WHEN une requête d'historique est faite THEN THE AI_System SHALL utiliser les index sur (creatorId, createdAt) pour performance

### Requirement 12

**User Story:** En tant que développeur, je veux que les routes API soient simplifiées en déléguant au Coordinator, afin de réduire la duplication de code.

#### Acceptance Criteria

1. WHEN une route API reçoit une requête THEN THE API SHALL valider l'authentification du créateur
2. WHEN l'authentification réussit THEN THE API SHALL vérifier le rate limit
3. WHEN le rate limit passe THEN THE API SHALL appeler coordinator.route() avec le type de requête approprié
4. WHEN le Coordinator retourne THEN THE API SHALL formater la réponse en JSON
5. WHEN une erreur survient THEN THE API SHALL retourner le code HTTP approprié (401, 429, 500)
