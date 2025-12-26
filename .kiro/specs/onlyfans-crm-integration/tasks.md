# Implementation Plan - OnlyFans CRM Integration

## Phase 1: AWS Rate Limiter Service (Priority 1)

- [x] 1. Créer OnlyFansRateLimiterService
  - Créer le fichier `lib/services/onlyfans-rate-limiter.service.ts`
  - Implémenter la classe avec SQSClient (@aws-sdk/client-sqs)
  - Ajouter méthode `sendMessage()` avec validation Zod
  - Ajouter méthode `sendBatch()` pour bulk messaging
  - Ajouter méthode `getQueueStatus()` pour monitoring
  - Implémenter retry logic avec exponential backoff (3 tentatives)
  - Ajouter logging structuré avec `lib/utils/logger.ts`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Implémenter validation de payload
  - Créer Zod schema pour `OnlyFansMessage`
  - Valider userId, recipientId, content (required)
  - Valider mediaUrls (optional, array of URLs)
  - Valider priority (optional, 1-10)
  - Throw descriptive errors pour validation failures
  - _Requirements: 1.3_

- [x] 1.2 Implémenter envoi SQS
  - Créer SQSClient avec region us-east-1
  - Construire SendMessageCommand avec payload JSON
  - Ajouter MessageAttributes (userId, messageType, priority)
  - Gérer erreurs AWS SDK (throttling, permissions, network)
  - Retourner SendResult avec messageId et status
  - _Requirements: 1.2, 1.4_

- [x] 1.3 Implémenter batch sending
  - Créer SendMessageBatchCommand pour jusqu'à 10 messages
  - Mapper chaque message au format SQS batch entry
  - Gérer partial failures (certains messages réussissent, d'autres échouent)
  - Retourner array de SendResult avec status individuel
  - _Requirements: 1.5_

- [x] 1.4 Implémenter getQueueStatus
  - Appeler GetQueueAttributesCommand pour queue depth
  - Appeler GetQueueAttributesCommand pour DLQ count
  - Calculer messages in flight (ApproximateNumberOfMessagesNotVisible)
  - Retourner QueueStatus avec toutes les métriques
  - _Requirements: 3.3, 3.4_

- [x] 1.5 Configurer variables d'environnement
  - Ajouter AWS_REGION, SQS_RATE_LIMITER_QUEUE_URL dans .env
  - Ajouter RATE_LIMITER_ENABLED feature flag
  - Valider variables au startup du service
  - Logger warning si variables manquantes
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

## Phase 2: API Routes OnlyFans (Priority 1)

- [x] 2. Créer API route /api/onlyfans/messages/send
  - Créer fichier `app/api/onlyfans/messages/send/route.ts`
  - Implémenter POST handler avec authentication JWT
  - Valider request body avec Zod schema
  - Appeler `OnlyFansRateLimiterService.sendMessage()`
  - Retourner HTTP 202 avec messageId et queuedAt
  - Gérer erreurs (401, 400, 500, 503)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Implémenter authentication
  - Appeler `getUserFromRequest()` pour JWT validation
  - Retourner HTTP 401 si user non authentifié
  - Extraire userId du JWT token
  - _Requirements: 2.2_

- [x] 2.2 Implémenter validation request body
  - Créer Zod schema `SendMessageSchema`
  - Parser request.json() avec schema
  - Retourner HTTP 400 si validation échoue
  - _Requirements: 2.3_

- [x] 2.3 Implémenter envoi via service
  - Instancier `OnlyFansRateLimiterService`
  - Construire OnlyFansMessage avec userId + body
  - Appeler `service.sendMessage()`
  - Gérer erreurs service (SQS unavailable, validation)
  - _Requirements: 2.4_

- [x] 3. Créer API route /api/onlyfans/messages/status
  - Créer fichier `app/api/onlyfans/messages/status/route.ts`
  - Implémenter GET handler avec authentication
  - Appeler `OnlyFansRateLimiterService.getQueueStatus()`
  - Ajouter métriques CloudWatch si disponibles
  - Retourner HTTP 200 avec queue status
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 3: API Routes CRM Complets (Priority 2)

- [x] 4. Compléter API routes /api/crm/fans
  - Créer fichier `app/api/crm/fans/[id]/route.ts`
  - Implémenter GET handler pour récupérer un fan
  - Implémenter PUT handler pour update fan
  - Implémenter DELETE handler pour supprimer fan
  - Vérifier ownership (user owns fan) pour toutes les opérations
  - Retourner HTTP 404 si fan not found
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.1 Implémenter GET /api/crm/fans/[id]
  - Extraire fanId des params
  - Appeler `FansRepository.getFan(userId, fanId)`
  - Retourner HTTP 404 si fan null
  - Retourner HTTP 200 avec fan data
  - _Requirements: 4.1, 4.4, 4.5_

- [x] 4.2 Implémenter PUT /api/crm/fans/[id]
  - Parser request body (name, tags, notes, valueCents)
  - Appeler `FansRepository.updateFan(userId, fanId, data)`
  - Retourner HTTP 404 si fan null
  - Retourner HTTP 200 avec updated fan
  - _Requirements: 4.2, 4.4, 4.5_

- [x] 4.3 Implémenter DELETE /api/crm/fans/[id]
  - Appeler `FansRepository.deleteFan(userId, fanId)`
  - Retourner HTTP 404 si fan not found
  - Retourner HTTP 204 (No Content) si success
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 5. Créer API routes /api/crm/conversations
  - Créer fichier `app/api/crm/conversations/route.ts`
  - Implémenter GET handler pour lister conversations
  - Appeler `ConversationsRepository.listConversations(userId)`
  - Joindre fan data pour chaque conversation
  - Retourner HTTP 200 avec conversations array
  - _Requirements: 5.1_

- [x] 6. Créer API routes /api/crm/conversations/[id]/messages
  - Créer fichier `app/api/crm/conversations/[id]/messages/route.ts`
  - Implémenter GET handler pour lister messages
  - Implémenter POST handler pour envoyer message
  - Vérifier ownership de la conversation
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 6.1 Implémenter GET messages
  - Extraire conversationId des params
  - Appeler `MessagesRepository.listMessages(userId, conversationId)`
  - Retourner HTTP 200 avec messages array
  - Supporter pagination (query params: limit, offset)
  - _Requirements: 5.2_

- [x] 6.2 Implémenter POST message
  - Parser request body (text, priceCents, attachments)
  - Appeler `MessagesRepository.createMessage()`
  - Appeler `OnlyFansRateLimiterService.sendMessage()` pour rate limiting
  - Mettre à jour `conversations.last_message_at`
  - Retourner HTTP 202 avec message data
  - _Requirements: 5.3, 5.4, 5.5_

## Phase 4: CSV Import Backend (Priority 2)

- [x] 7. Créer API route /api/onlyfans/import/csv
  - Créer fichier `app/api/onlyfans/import/csv/route.ts`
  - Implémenter POST handler avec multipart/form-data
  - Parser CSV avec `csv-parse` library
  - Mapper colonnes CSV vers fan data
  - Bulk insert avec `FansRepository.createFan()`
  - Retourner summary (total, success, errors)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.1 Implémenter CSV parsing
  - Extraire file du FormData
  - Lire file content avec `file.text()`
  - Parser avec `csv-parse` (columns: true, skip_empty_lines: true)
  - Valider format CSV (colonnes requises présentes)
  - _Requirements: 6.2_

- [x] 7.2 Implémenter mapping CSV → Fan
  - Mapper "Username" → handle
  - Mapper "Display Name" → name
  - Mapper "Email" → email
  - Mapper "Total Spent" → valueCents (parse $ et convertir en cents)
  - Mapper "Last Seen" → lastSeenAt (parse date)
  - Ajouter platform: 'onlyfans' par défaut
  - _Requirements: 6.3_

- [x] 7.3 Implémenter bulk insert
  - Loop sur chaque row du CSV
  - Try/catch pour chaque insert
  - Appeler `FansRepository.createFan(userId, fanData)`
  - Incrémenter counters (success, skipped, errors)
  - Collecter erreurs avec row number
  - _Requirements: 6.4_

- [x] 7.4 Implémenter response summary
  - Construire summary object (totalRows, successfulInserts, skipped, errors)
  - Inclure array d'erreurs avec row number et message
  - Retourner HTTP 200 avec summary
  - _Requirements: 6.5_

## Phase 5: Bulk Messaging Backend (Priority 3)

- [x] 8. Créer API route /api/messages/bulk
  - Créer fichier `app/api/messages/bulk/route.ts`
  - Implémenter POST handler avec authentication
  - Valider recipients list (max 100)
  - Créer campaign record dans `campaigns` table
  - Appeler `OnlyFansRateLimiterService.sendBatch()`
  - Retourner HTTP 202 avec campaignId
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.1 Implémenter validation bulk request
  - Parser request body (recipientIds, content, mediaUrls, campaignName)
  - Valider recipientIds array (min 1, max 100)
  - Valider content (min 1, max 5000 chars)
  - Retourner HTTP 400 si validation échoue
  - _Requirements: 7.2_

- [x] 8.2 Implémenter création campaign
  - Construire campaign data (name, type: 'bulk_message', status: 'active')
  - Ajouter template (content, mediaUrls)
  - Ajouter target_audience (recipientIds)
  - Initialiser metrics (sent: 0, delivered: 0, failed: 0)
  - Insérer dans `campaigns` table
  - _Requirements: 7.4_

- [x] 8.3 Implémenter batch sending
  - Construire array de OnlyFansMessage pour chaque recipient
  - Appeler `OnlyFansRateLimiterService.sendBatch(messages)`
  - Gérer partial failures
  - Mettre à jour campaign metrics
  - _Requirements: 7.3_

## Phase 6: UI Conversations OnlyFans (Priority 2)

- [x] 9. Créer page /messages/onlyfans
  - Créer fichier `app/messages/onlyfans/page.tsx`
  - Implémenter layout 2-colonnes (conversations list + messages)
  - Fetch conversations via GET `/api/crm/conversations`
  - Afficher conversations list avec avatar, nom, dernier message
  - Gérer click sur conversation pour charger messages
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9.1 Implémenter conversations list
  - Créer component `ConversationsList`
  - Fetch conversations avec `useSWR`
  - Afficher chaque conversation avec avatar, nom, lastMessageAt
  - Afficher unread count badge
  - Gérer click pour sélectionner conversation
  - _Requirements: 8.2, 8.3_

- [x] 9.2 Implémenter messages thread
  - Créer component `MessagesThread`
  - Fetch messages via GET `/api/crm/conversations/[id]/messages`
  - Afficher messages avec direction (in/out)
  - Scroll automatique vers le bas
  - Supporter pagination (load more)
  - _Requirements: 8.4_

- [x] 9.3 Implémenter message input
  - Créer component `MessageInput`
  - Input textarea avec auto-resize
  - Button "Send" avec loading state
  - POST vers `/api/crm/conversations/[id]/messages`
  - Optimistic update (ajouter message immédiatement)
  - _Requirements: 8.5_

- [x] 9.4 Implémenter real-time updates
  - Polling avec `useSWR` (refreshInterval: 5000ms)
  - Revalider conversations list toutes les 5s
  - Revalider messages thread toutes les 5s
  - Afficher notification pour nouveaux messages
  - _Requirements: 8.2, 8.4_

## Phase 7: UI Analytics OnlyFans (Priority 3)

- [x] 10. Créer page /platforms/onlyfans/analytics
  - Créer fichier `app/platforms/onlyfans/analytics/page.tsx`
  - Implémenter dashboard layout avec KPIs
  - Fetch analytics data depuis CRM database
  - Afficher total fans, active fans, lifetime value
  - Afficher top 10 fans chart
  - Afficher revenue trends chart
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10.1 Implémenter KPIs cards
  - Créer component `AnalyticsKPIs`
  - Fetch fans count via GET `/api/crm/fans`
  - Calculer active fans (lastSeenAt < 30 days)
  - Calculer lifetime value (sum valueCents)
  - Afficher dans cards avec icons
  - _Requirements: 9.3_

- [x] 10.2 Implémenter top fans chart
  - Créer component `TopFansChart`
  - Fetch top fans via GET `/api/crm/fans?sort=valueCents&limit=10`
  - Utiliser Recharts pour bar chart
  - Afficher nom + valueCents pour chaque fan
  - _Requirements: 9.4_

- [x] 10.3 Implémenter revenue trends chart
  - Créer component `RevenueTrendsChart`
  - Fetch messages avec priceCents groupés par date
  - Calculer revenue par jour/semaine/mois
  - Utiliser Recharts pour line chart
  - Supporter filtres date range
  - _Requirements: 9.5_

- [x] 10.4 Implémenter export CSV
  - Ajouter button "Export CSV"
  - Générer CSV avec fans data
  - Télécharger via browser download
  - _Requirements: 9.1_

## Phase 8: Monitoring et Observabilité (Priority 3)

- [x] 11. Implémenter CloudWatch metrics
  - Ajouter `putMetricData` dans `OnlyFansRateLimiterService`
  - Envoyer metric `OnlyFansMessagesQueued` après chaque send
  - Envoyer metric `OnlyFansQueueDepth` dans getQueueStatus
  - Configurer namespace `Huntaze/OnlyFans`
  - _Requirements: 11.1, 11.2, 11.5_

- [x] 12. Implémenter structured logging
  - Utiliser `lib/utils/logger.ts` dans tous les services
  - Logger toutes les opérations SQS (send, batch, status)
  - Inclure messageId, userId, timestamp dans logs
  - Logger erreurs avec stack traces
  - _Requirements: 11.1, 11.3_

- [x] 13. Créer API route /api/monitoring/onlyfans
  - Créer fichier `app/api/monitoring/onlyfans/route.ts`
  - Implémenter GET handler pour health metrics
  - Appeler `OnlyFansRateLimiterService.getQueueStatus()`
  - Ajouter database health check (ping PostgreSQL)
  - Retourner HTTP 200 avec system health
  - _Requirements: 11.4_

## Phase 9: Error Handling et Retry (Priority 2)

- [x] 14. Implémenter retry logic dans service
  - Ajouter exponential backoff (1s, 2s, 4s)
  - Retry jusqu'à 3 fois pour SQS errors
  - Logger chaque retry attempt
  - Throw error après 3 échecs
  - _Requirements: 12.1, 12.3_

- [x] 15. Implémenter fallback storage
  - Créer méthode `storeFailed Message()` dans service
  - Insérer message dans `messages` table avec status 'failed'
  - Appeler après tous les retries échoués
  - _Requirements: 12.2_

- [x] 16. Créer API route /api/onlyfans/messages/failed
  - Créer fichier `app/api/onlyfans/messages/failed/route.ts`
  - Implémenter GET handler pour lister failed messages
  - Query `messages` table WHERE status = 'failed'
  - Retourner HTTP 200 avec failed messages array
  - _Requirements: 12.5_

- [x] 17. Implémenter manual retry
  - Ajouter POST `/api/onlyfans/messages/[id]/retry`
  - Récupérer message depuis database
  - Appeler `OnlyFansRateLimiterService.sendMessage()`
  - Mettre à jour status si success
  - _Requirements: 12.5_

## Phase 10: Tests (Priority 3)

- [ ] 18. Créer tests unitaires OnlyFansRateLimiterService
  - Créer fichier `tests/unit/services/onlyfans-rate-limiter.test.ts`
  - Mock SQSClient avec jest
  - Tester sendMessage() success case
  - Tester sendMessage() avec SQS error
  - Tester sendBatch() avec partial failures
  - Tester getQueueStatus()
  - _Requirements: 13.1_

- [ ] 19. Créer tests API endpoints
  - Créer fichier `tests/integration/api/onlyfans-endpoints.test.ts`
  - Tester POST `/api/onlyfans/messages/send`
  - Tester GET `/api/onlyfans/messages/status`
  - Tester POST `/api/onlyfans/import/csv`
  - Tester POST `/api/messages/bulk`
  - Tester tous les endpoints CRM
  - _Requirements: 13.2_

- [ ] 20. Créer tests CSV import
  - Créer fichier `tests/integration/onlyfans/csv-import.test.ts`
  - Créer sample CSV file
  - Tester import success case
  - Tester import avec erreurs (invalid format)
  - Vérifier fans insérés dans database
  - _Requirements: 13.3_

- [ ] 21. Créer tests bulk messaging
  - Créer fichier `tests/integration/onlyfans/bulk-messaging.test.ts`
  - Tester envoi à 10 recipients
  - Tester envoi à 100 recipients (max)
  - Tester erreur si > 100 recipients
  - Vérifier campaign créé dans database
  - _Requirements: 13.4_

- [ ] 22. Créer tests error scenarios
  - Tester SQS unavailable (mock network error)
  - Tester invalid AWS credentials
  - Tester rate limit exceeded
  - Tester retry logic
  - Tester fallback storage
  - _Requirements: 13.5_

## Phase 11: Documentation et Deployment (Priority 3)

- [x] 23. Mettre à jour .env.example
  - Ajouter AWS_REGION
  - Ajouter SQS_RATE_LIMITER_QUEUE_URL
  - Ajouter REDIS_ENDPOINT
  - Ajouter RATE_LIMITER_ENABLED
  - Ajouter CLOUDWATCH_NAMESPACE
  - _Requirements: 10.1, 10.2_

- [ ] 24. Configurer variables Amplify
  - Aller dans Amplify Console
  - Ajouter toutes les variables d'environnement
  - Tester connectivity avec test message SQS
  - _Requirements: 10.1, 10.2, 10.4_

- [x] 25. Créer documentation utilisateur
  - Créer fichier `docs/ONLYFANS_USER_GUIDE.md`
  - Documenter CSV import process
  - Documenter bulk messaging
  - Documenter conversations UI
  - Documenter analytics dashboard

- [x] 26. Créer documentation développeur
  - Créer fichier `docs/ONLYFANS_DEVELOPER_GUIDE.md`
  - Documenter architecture
  - Documenter API endpoints
  - Documenter OnlyFansRateLimiterService
  - Documenter deployment process

- [ ] 27. Déployer en production
  - Commit et push code
  - Vérifier Amplify auto-deploy
  - Tester endpoints en production
  - Monitorer CloudWatch metrics
  - Vérifier logs

