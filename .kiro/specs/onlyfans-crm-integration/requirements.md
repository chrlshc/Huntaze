# Requirements Document - OnlyFans CRM Integration

## Introduction

Connecter l'infrastructure AWS existante (Lambda rate limiter + SQS + Redis) avec le système CRM OnlyFans déjà en place (database + repositories) pour créer une plateforme complète de gestion des fans et messages OnlyFans. L'objectif est d'utiliser l'infrastructure AWS déployée (~$50-90/mois) et de compléter les API endpoints et UI manquants pour avoir un système OnlyFans CRM fonctionnel à 90%.

## Glossary

- **Backend Application**: Application Next.js Huntaze déployée sur AWS Amplify
- **Rate Limiter Lambda**: Lambda AWS `huntaze-rate-limiter` (Node.js 20.x, 256MB) qui implémente le token bucket
- **SQS Queue**: Queue `huntaze-rate-limiter-queue` pour rate limiting des messages OnlyFans
- **Redis Cluster**: Cluster ElastiCache `huntaze-redis-production` pour l'état du token bucket
- **CRM Database**: Tables PostgreSQL existantes (fans, conversations, messages, campaigns)
- **CRM Repositories**: Classes TypeScript existantes (FansRepository, ConversationsRepository, MessagesRepository)
- **OnlyFans Message**: Message envoyé à un fan via l'API OnlyFans (rate limited à 10 msg/min)
- **Fan**: Subscriber OnlyFans stocké dans la table `fans`
- **Conversation**: Thread de messages avec un fan stocké dans `conversations`
- **CSV Import**: Import de données OnlyFans via fichier CSV exporté depuis OnlyFans

## Requirements

### Requirement 1: Service Rate Limiter OnlyFans

**User Story:** En tant que développeur backend, je veux un service TypeScript pour envoyer des messages OnlyFans via SQS avec rate limiting automatique, afin d'éviter de dépasser la limite de 10 messages/minute de l'API OnlyFans.

#### Acceptance Criteria

1. THE Backend Application SHALL provide a TypeScript service class `OnlyFansRateLimiterService` in `lib/services/onlyfans-rate-limiter.service.ts`
2. WHEN a message is sent, THE OnlyFansRateLimiterService SHALL queue the message to `huntaze-rate-limiter-queue` with proper payload structure
3. THE OnlyFansRateLimiterService SHALL validate message payload (userId, recipientId, content) before sending to SQS
4. WHEN SQS send fails, THE OnlyFansRateLimiterService SHALL log the error and throw a descriptive exception
5. THE OnlyFansRateLimiterService SHALL support batch message sending (up to 10 messages per batch)

### Requirement 2: API Endpoint pour Envoyer Messages

**User Story:** En tant qu'utilisateur de l'application, je veux envoyer des messages à mes fans OnlyFans via l'interface, afin que les messages soient automatiquement rate-limited et envoyés via l'infrastructure AWS.

#### Acceptance Criteria

1. THE Backend Application SHALL provide a POST endpoint `/api/onlyfans/messages/send`
2. WHEN a message send request is received, THE Backend Application SHALL authenticate the user via JWT
3. WHEN authentication succeeds, THE Backend Application SHALL validate the request body (recipientId, content, mediaUrls)
4. THE Backend Application SHALL call `OnlyFansRateLimiterService.sendMessage()` to queue the message
5. THE Backend Application SHALL return HTTP 202 (Accepted) with messageId when message is queued successfully

### Requirement 3: API Endpoint pour Status Queue

**User Story:** En tant qu'administrateur, je veux consulter l'état de la queue SQS et les métriques d'envoi, afin de monitorer le système et détecter les problèmes rapidement.

#### Acceptance Criteria

1. THE Backend Application SHALL provide a GET endpoint `/api/onlyfans/messages/status`
2. WHEN status is requested, THE Backend Application SHALL authenticate the user
3. THE Backend Application SHALL call `OnlyFansRateLimiterService.getQueueStatus()` to retrieve queue metrics
4. THE Backend Application SHALL return queue depth, messages in flight, and DLQ count
5. WHERE CloudWatch is configured, THE Backend Application SHALL include custom metrics in the response

### Requirement 4: API Endpoints CRM Fans Complets

**User Story:** En tant que développeur frontend, je veux des API endpoints complets pour gérer les fans, afin de pouvoir construire l'interface utilisateur de gestion des fans.

#### Acceptance Criteria

1. THE Backend Application SHALL provide GET `/api/crm/fans/[id]` to retrieve a single fan by ID
2. THE Backend Application SHALL provide PUT `/api/crm/fans/[id]` to update fan data (name, tags, notes, valueCents)
3. THE Backend Application SHALL provide DELETE `/api/crm/fans/[id]` to delete a fan
4. WHEN any CRM endpoint is called, THE Backend Application SHALL authenticate the user and verify ownership
5. THE Backend Application SHALL return HTTP 404 when fan is not found or user doesn't own the fan

### Requirement 5: API Endpoints Conversations

**User Story:** En tant qu'utilisateur, je veux consulter mes conversations avec mes fans et envoyer des messages, afin de gérer ma communication OnlyFans depuis l'application.

#### Acceptance Criteria

1. THE Backend Application SHALL provide GET `/api/crm/conversations` to list all conversations for authenticated user
2. THE Backend Application SHALL provide GET `/api/crm/conversations/[id]/messages` to retrieve messages in a conversation
3. THE Backend Application SHALL provide POST `/api/crm/conversations/[id]/messages` to send a message in a conversation
4. WHEN a message is sent via POST, THE Backend Application SHALL use `OnlyFansRateLimiterService` for rate limiting
5. THE Backend Application SHALL update `last_message_at` and `unread_count` in conversations table when messages are sent/received

### Requirement 6: CSV Import Backend

**User Story:** En tant qu'utilisateur OnlyFans, je veux importer mes données fans depuis un CSV exporté d'OnlyFans, afin de peupler ma base de données CRM sans saisie manuelle.

#### Acceptance Criteria

1. THE Backend Application SHALL provide POST `/api/onlyfans/import/csv` to handle CSV file uploads
2. WHEN a CSV is uploaded, THE Backend Application SHALL parse the file and validate the format
3. THE Backend Application SHALL map CSV columns to fan data (name, handle, email, platform_id, value_cents)
4. THE Backend Application SHALL use `FansRepository.createFan()` to bulk insert fans into database
5. THE Backend Application SHALL return import summary (total rows, successful inserts, errors) in response

### Requirement 7: Bulk Messaging Backend

**User Story:** En tant qu'utilisateur, je veux envoyer un message à plusieurs fans en même temps, afin de faire des campagnes marketing ou des annonces groupées.

#### Acceptance Criteria

1. THE Backend Application SHALL provide POST `/api/messages/bulk` to send messages to multiple recipients
2. WHEN bulk send is requested, THE Backend Application SHALL validate recipients list (max 100 recipients)
3. THE Backend Application SHALL call `OnlyFansRateLimiterService.sendBatch()` to queue all messages
4. THE Backend Application SHALL create campaign record in `campaigns` table with metrics tracking
5. THE Backend Application SHALL return HTTP 202 with campaignId and estimated completion time

### Requirement 8: UI Page Conversations OnlyFans

**User Story:** En tant qu'utilisateur, je veux voir mes conversations OnlyFans dans une interface web, afin de gérer mes messages sans aller sur OnlyFans.

#### Acceptance Criteria

1. THE Backend Application SHALL provide a page `/messages/onlyfans` with conversations list
2. WHEN page loads, THE Backend Application SHALL fetch conversations via GET `/api/crm/conversations`
3. THE Backend Application SHALL display conversations sorted by `last_message_at` DESC
4. WHEN a conversation is clicked, THE Backend Application SHALL load messages via GET `/api/crm/conversations/[id]/messages`
5. THE Backend Application SHALL provide a message input to send new messages via POST endpoint

### Requirement 9: UI Page Analytics OnlyFans

**User Story:** En tant qu'utilisateur OnlyFans, je veux voir des analytics sur mes fans et revenus, afin de comprendre ma performance et optimiser ma stratégie.

#### Acceptance Criteria

1. THE Backend Application SHALL provide a page `/platforms/onlyfans/analytics` with dashboard
2. WHEN page loads, THE Backend Application SHALL fetch analytics data from CRM database
3. THE Backend Application SHALL display total fans count, active fans, and total lifetime value
4. THE Backend Application SHALL display top 10 fans by value_cents with charts
5. THE Backend Application SHALL display revenue trends over time (daily, weekly, monthly)

### Requirement 10: Configuration AWS Variables d'Environnement

**User Story:** En tant que développeur, je veux configurer les credentials AWS dans les variables d'environnement, afin que l'application puisse accéder à SQS et Redis de manière sécurisée.

#### Acceptance Criteria

1. THE Backend Application SHALL read AWS configuration from environment variables on startup
2. THE Backend Application SHALL require `AWS_REGION`, `SQS_RATE_LIMITER_QUEUE_URL`, `REDIS_ENDPOINT` variables
3. WHEN AWS variables are missing, THE Backend Application SHALL log a warning and disable rate limiting features
4. THE Backend Application SHALL validate AWS connectivity on startup by sending a test message to SQS
5. WHERE `RATE_LIMITER_ENABLED=false`, THE Backend Application SHALL bypass SQS and log messages locally

### Requirement 11: Monitoring et Observabilité

**User Story:** En tant qu'opérateur, je veux monitorer l'état du système OnlyFans et les métriques d'envoi, afin de détecter les problèmes rapidement et optimiser les coûts AWS.

#### Acceptance Criteria

1. THE Backend Application SHALL log all SQS send operations with messageId, userId, and timestamp
2. WHEN a message is queued, THE Backend Application SHALL increment a CloudWatch custom metric `OnlyFansMessagesQueued`
3. THE Backend Application SHALL track success/failure rates in application logs with structured logging
4. THE Backend Application SHALL provide GET `/api/monitoring/onlyfans` endpoint with system health metrics
5. WHERE CloudWatch is configured, THE Backend Application SHALL send custom metrics for queue depth and processing time

### Requirement 12: Gestion des Erreurs et Retry

**User Story:** En tant que développeur, je veux une gestion robuste des erreurs pour les messages OnlyFans, afin que les messages ne soient pas perdus en cas de problème AWS.

#### Acceptance Criteria

1. WHEN SQS is unavailable, THE OnlyFansRateLimiterService SHALL retry the send operation up to 3 times with exponential backoff
2. WHEN all retries fail, THE OnlyFansRateLimiterService SHALL log the error and store the message in `messages` table with status 'failed'
3. THE Backend Application SHALL handle AWS SDK errors gracefully (throttling, permissions, network errors)
4. WHEN Lambda processing fails, THE Backend Application SHALL move messages to DLQ `huntaze-rate-limiter-queue-dlq`
5. THE Backend Application SHALL provide GET `/api/onlyfans/messages/failed` to list failed messages for manual retry

### Requirement 13: Tests d'Intégration

**User Story:** En tant que développeur, je veux des tests automatisés pour valider l'intégration OnlyFans complète, afin de garantir la fiabilité du système en production.

#### Acceptance Criteria

1. THE Backend Application SHALL include integration tests for `OnlyFansRateLimiterService` with mock SQS
2. THE Backend Application SHALL include API endpoint tests for all `/api/onlyfans/*` and `/api/crm/*` routes
3. THE Backend Application SHALL test CSV import with sample OnlyFans CSV file
4. THE Backend Application SHALL test bulk messaging with multiple recipients
5. THE Backend Application SHALL test error scenarios (SQS unavailable, invalid credentials, rate limit exceeded)

