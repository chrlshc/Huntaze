# Requirements Document - AWS Rate Limiter Backend Integration

## Introduction

Intégrer le système de rate limiting AWS (Lambda + SQS + Redis) avec l'application backend Huntaze déployée sur AWS Amplify. L'objectif est de permettre à l'application Next.js d'envoyer des messages OnlyFans via la queue SQS pour bénéficier du rate limiting automatique (10 messages/minute) géré par la Lambda.

## Glossary

- **Backend Application**: Application Next.js déployée sur AWS Amplify (App ID: d33l77zi1h78ce)
- **Rate Limiter Lambda**: Fonction AWS Lambda `huntaze-rate-limiter` qui implémente l'algorithme token bucket
- **SQS Queue**: Queue Amazon SQS `huntaze-rate-limiter-queue` qui reçoit les messages à envoyer
- **Redis Cluster**: Cluster ElastiCache Redis chiffré qui stocke l'état du token bucket
- **OnlyFans API**: API externe pour envoyer des messages aux fans
- **Message Payload**: Structure de données JSON contenant les informations du message à envoyer
- **IAM Role**: Rôle AWS permettant à l'application d'accéder aux services AWS
- **Environment Variables**: Variables d'environnement configurées dans Amplify pour l'accès AWS

## Requirements

### Requirement 1: Configuration AWS dans Amplify

**User Story:** En tant que développeur, je veux configurer les credentials AWS dans Amplify, afin que l'application puisse accéder à SQS et DynamoDB de manière sécurisée.

#### Acceptance Criteria

1. WHEN the Backend Application starts, THE Backend Application SHALL load AWS credentials from environment variables
2. WHEN AWS credentials are missing, THE Backend Application SHALL log a warning and disable rate limiting features
3. THE Backend Application SHALL use IAM roles or access keys to authenticate with AWS services
4. THE Backend Application SHALL configure the AWS SDK with the us-east-1 region
5. WHERE environment variables are set, THE Backend Application SHALL validate AWS connectivity on startup

### Requirement 2: Service SQS pour l'envoi de messages

**User Story:** En tant que développeur backend, je veux un service TypeScript pour envoyer des messages à la SQS Queue, afin de déclencher le rate limiting automatique.

#### Acceptance Criteria

1. THE Backend Application SHALL provide a TypeScript service class for SQS message operations
2. WHEN a message is queued, THE Backend Application SHALL send the message to `huntaze-rate-limiter-queue` with proper payload structure
3. THE Backend Application SHALL include message attributes (userId, messageType, timestamp, priority)
4. WHEN SQS send fails, THE Backend Application SHALL log the error and return a failure status
5. THE Backend Application SHALL support batch message sending (up to 10 messages per batch)

### Requirement 3: Structure du payload des messages

**User Story:** En tant que développeur, je veux une structure de payload standardisée, afin que la Lambda puisse traiter les messages correctement.

#### Acceptance Criteria

1. THE Message Payload SHALL include required fields: messageId, userId, recipientId, content, timestamp
2. THE Message Payload SHALL include optional fields: mediaUrls, metadata, priority
3. WHEN creating a payload, THE Backend Application SHALL validate all required fields are present
4. THE Backend Application SHALL generate a unique messageId using UUID v4
5. THE Backend Application SHALL serialize the payload to JSON before sending to SQS

### Requirement 4: API Route pour envoyer des messages OnlyFans

**User Story:** En tant qu'utilisateur de l'application, je veux envoyer des messages à mes fans via l'interface, afin que les messages soient rate-limited automatiquement.

#### Acceptance Criteria

1. THE Backend Application SHALL provide a POST endpoint `/api/onlyfans/messages/send`
2. WHEN a message send request is received, THE Backend Application SHALL validate the request body
3. WHEN validation passes, THE Backend Application SHALL queue the message to SQS
4. THE Backend Application SHALL return HTTP 202 (Accepted) when message is queued successfully
5. WHEN rate limiting is disabled, THE Backend Application SHALL return HTTP 503 (Service Unavailable)

### Requirement 5: Monitoring et observabilité

**User Story:** En tant qu'opérateur, je veux monitorer l'état de la queue SQS et les métriques d'envoi, afin de détecter les problèmes rapidement.

#### Acceptance Criteria

1. THE Backend Application SHALL log all SQS send operations with messageId and timestamp
2. WHEN a message is queued, THE Backend Application SHALL increment a CloudWatch custom metric
3. THE Backend Application SHALL provide a GET endpoint `/api/onlyfans/messages/status` to check queue health
4. THE Backend Application SHALL track success/failure rates in application logs
5. WHERE CloudWatch is configured, THE Backend Application SHALL send custom metrics for message queue depth

### Requirement 6: Gestion des erreurs et retry

**User Story:** En tant que développeur, je veux une gestion robuste des erreurs, afin que les messages ne soient pas perdus en cas de problème.

#### Acceptance Criteria

1. WHEN SQS is unavailable, THE Backend Application SHALL retry the send operation up to 3 times with exponential backoff
2. WHEN all retries fail, THE Backend Application SHALL log the error and return HTTP 500
3. THE Backend Application SHALL handle AWS SDK errors gracefully (throttling, permissions, network)
4. WHEN a message fails to queue, THE Backend Application SHALL store it in a local fallback queue (DynamoDB or database)
5. THE Backend Application SHALL provide a mechanism to replay failed messages from the fallback queue

### Requirement 7: Feature flag pour activer/désactiver le rate limiting

**User Story:** En tant qu'administrateur, je veux pouvoir activer ou désactiver le rate limiting via une variable d'environnement, afin de contrôler le comportement en production.

#### Acceptance Criteria

1. THE Backend Application SHALL read a `RATE_LIMITER_ENABLED` environment variable
2. WHEN `RATE_LIMITER_ENABLED` is false, THE Backend Application SHALL bypass SQS and send messages directly
3. WHEN `RATE_LIMITER_ENABLED` is true, THE Backend Application SHALL use the SQS queue for all messages
4. THE Backend Application SHALL log the rate limiter status on startup
5. WHERE the feature flag changes, THE Backend Application SHALL apply the new behavior without restart (via runtime config)

### Requirement 8: Tests d'intégration

**User Story:** En tant que développeur, je veux des tests automatisés pour valider l'intégration SQS, afin de garantir la fiabilité du système.

#### Acceptance Criteria

1. THE Backend Application SHALL include integration tests for the SQS service
2. WHEN tests run, THE Backend Application SHALL use a test SQS queue or mock AWS SDK
3. THE Backend Application SHALL test successful message sending scenarios
4. THE Backend Application SHALL test error handling scenarios (network failure, invalid credentials)
5. THE Backend Application SHALL test payload validation and serialization
