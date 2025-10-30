# Implementation Plan - AWS Rate Limiter Backend Integration

## Overview

Ce plan d'implémentation transforme le design en tâches concrètes de développement. Chaque tâche est incrémentale et peut être testée indépendamment. L'implémentation suit une approche bottom-up: services → API → tests → monitoring.

---

## Tasks

- [x] 1. Configuration et setup initial
  - Ajouter les variables d'environnement dans Amplify
  - Créer le fichier de configuration TypeScript pour les constantes
  - Mettre à jour le schéma Prisma avec le modèle `OnlyFansMessage`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Ajouter variables d'environnement Amplify
  - Utiliser AWS CLI pour ajouter `SQS_RATE_LIMITER_QUEUE` et `RATE_LIMITER_ENABLED`
  - Mettre à jour `amplify.yml` avec les nouvelles variables
  - Documenter les variables dans `.env.example`
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Créer fichier de configuration TypeScript
  - Créer `lib/config/rate-limiter.config.ts` avec les constantes (queue URL, timeouts, retry config)
  - Ajouter validation des variables d'environnement au démarrage
  - Exporter les types TypeScript pour la configuration
  - _Requirements: 1.4_

- [x] 1.3 Mettre à jour schéma Prisma
  - Ajouter le modèle `OnlyFansMessage` dans `prisma/schema.prisma`
  - Créer la migration Prisma
  - Générer le client Prisma
  - _Requirements: 1.1_

- [x] 2. Créer le service OnlyFansRateLimiterService
  - Implémenter la classe `OnlyFansRateLimiterService` dans `lib/services/onlyfans-rate-limiter.service.ts`
  - Ajouter les méthodes `sendMessage()`, `sendBatch()`, `getQueueStatus()`
  - Implémenter la validation de payload avec Zod
  - Ajouter la génération de messageId avec UUID v4
  - Intégrer avec `IntelligentQueueManager` existant
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.1 Implémenter la classe de base
  - Créer la classe avec constructor et propriétés privées
  - Implémenter la logique de feature flag (`RATE_LIMITER_ENABLED`)
  - Ajouter le logger structuré
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2.2 Implémenter sendMessage()
  - Valider le payload avec Zod schema
  - Générer messageId unique
  - Mapper vers format `QueuedMessage` pour `IntelligentQueueManager`
  - Appeler `queueManager.sendToRateLimiterQueue()`
  - Gérer les erreurs et retourner `SendResult`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.3 Implémenter sendBatch()
  - Valider chaque message du batch
  - Utiliser `Promise.allSettled()` pour envoyer en parallèle
  - Retourner un tableau de `SendResult` avec succès/échecs
  - _Requirements: 2.5_

- [x] 2.4 Implémenter getQueueStatus()
  - Interroger SQS pour obtenir les métriques de queue
  - Retourner le nombre de messages en attente, en traitement, échoués
  - _Requirements: 5.3_

- [x] 3. Étendre IntelligentQueueManager
  - Ajouter la méthode `sendToRateLimiterQueue()` dans `lib/services/intelligent-queue-manager.ts`
  - Ajouter la configuration de la queue `RATE_LIMITER` dans `QUEUES`
  - Mapper le format `QueuedMessage` vers `RateLimiterPayload` attendu par Lambda
  - Réutiliser la logique de retry et circuit breaker existante
  - _Requirements: 2.1, 2.2, 6.1, 6.2, 6.3_

- [x] 3.1 Ajouter configuration queue
  - Ajouter `RATE_LIMITER` dans l'objet `QUEUES` avec l'URL depuis env
  - _Requirements: 1.1_

- [x] 3.2 Implémenter sendToRateLimiterQueue()
  - Créer la méthode qui envoie à la queue rate limiter
  - Mapper `QueuedMessage` vers `RateLimiterPayload` (format Lambda)
  - Utiliser `SendMessageCommand` du SDK AWS
  - Retourner `{ messageId, success }`
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3.3 Intégrer retry et circuit breaker
  - Réutiliser la logique de retry existante avec exponential backoff
  - Appliquer le circuit breaker sur les appels SQS
  - Logger les tentatives et échecs
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Créer l'API route /api/onlyfans/messages/send
  - Créer le fichier `app/api/onlyfans/messages/send/route.ts`
  - Implémenter le handler POST avec authentification NextAuth
  - Valider le body de la requête avec Zod
  - Appeler `OnlyFansRateLimiterService.sendMessage()`
  - Retourner les réponses HTTP appropriées (202, 400, 500, 503)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.1 Créer le fichier route
  - Créer la structure de base avec export `POST`
  - Ajouter l'authentification avec `getServerSession()`
  - _Requirements: 4.1_

- [x] 4.2 Implémenter validation du body
  - Créer le Zod schema pour `OnlyFansMessageRequest`
  - Parser et valider le body de la requête
  - Retourner HTTP 400 si validation échoue
  - _Requirements: 4.2_

- [x] 4.3 Implémenter la logique d'envoi
  - Instancier `OnlyFansRateLimiterService`
  - Appeler `sendMessage()` avec le payload validé
  - Gérer les cas de succès (HTTP 202) et erreurs (HTTP 500, 503)
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 4.4 Ajouter logging et monitoring
  - Logger chaque requête avec userId, messageId, timestamp
  - Envoyer métriques CloudWatch custom (`MessagesQueued`, `QueueLatency`)
  - _Requirements: 5.1, 5.2_

- [x] 5. Créer l'API route /api/onlyfans/messages/status
  - Créer le fichier `app/api/onlyfans/messages/status/route.ts`
  - Implémenter le handler GET avec authentification
  - Appeler `OnlyFansRateLimiterService.getQueueStatus()`
  - Retourner les métriques de queue (depth, processing, failed)
  - _Requirements: 5.3_

- [x] 6. Implémenter le Circuit Breaker
  - Créer la classe `CircuitBreaker` dans `lib/utils/circuit-breaker.ts`
  - Implémenter les états CLOSED, OPEN, HALF_OPEN
  - Ajouter la logique de threshold (5 erreurs) et timeout (60s)
  - Intégrer dans `IntelligentQueueManager` pour protéger les appels SQS
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. Ajouter le fallback vers base de données
  - Créer la méthode `saveToDatabaseFallback()` dans `OnlyFansRateLimiterService`
  - Utiliser Prisma pour sauvegarder les messages échoués dans `OnlyFansMessage`
  - Marquer le status comme `failed` avec `lastError`
  - Créer une tâche cron pour rejouer les messages échoués
  - _Requirements: 6.4, 6.5_

- [x] 8. Ajouter monitoring CloudWatch
  - Créer le service `CloudWatchMetricsService` dans `lib/services/cloudwatch-metrics.service.ts`
  - Implémenter `putMetric()` pour envoyer des métriques custom
  - Ajouter les métriques: `MessagesQueued`, `MessagesSent`, `MessagesFailed`, `RateLimitedMessages`, `QueueLatency`
  - Intégrer dans `OnlyFansRateLimiterService` pour tracker chaque opération
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 9. Créer les alarmes CloudWatch
  - Créer le script Terraform `infra/terraform/production-hardening/onlyfans-rate-limiter-alarms.tf`
  - Ajouter l'alarme `HighErrorRate` (MessagesFailed / MessagesQueued > 5%)
  - Ajouter l'alarme `QueueDepthHigh` (ApproximateNumberOfMessagesVisible > 100)
  - Configurer les actions SNS pour notifications
  - _Requirements: 5.1, 5.2_

- [x] 10. Créer le dashboard CloudWatch
  - Créer le script Terraform `infra/terraform/production-hardening/onlyfans-rate-limiter-dashboard.tf`
  - Ajouter les widgets: Messages Queued, Sent vs Failed, Rate Limited, Queue Depth, Lambda Duration, Error Rate
  - Configurer les périodes et statistiques appropriées
  - _Requirements: 5.1, 5.2_

- [x] 11. Écrire les tests unitaires
  - Créer `tests/unit/services/onlyfans-rate-limiter.service.test.ts`
  - Tester la validation de payload (valide/invalide)
  - Tester la génération de messageId unique
  - Tester le feature flag enabled/disabled
  - Tester la gestion d'erreurs (SQS unavailable, validation errors)
  - Mocker `IntelligentQueueManager` avec Vitest
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11.1 Tests de validation
  - Tester payload valide → succès
  - Tester payload invalide (champs manquants) → erreur
  - Tester payload invalide (types incorrects) → erreur
  - _Requirements: 8.1, 8.5_

- [x] 11.2 Tests de feature flag
  - Tester `RATE_LIMITER_ENABLED=true` → utilise SQS
  - Tester `RATE_LIMITER_ENABLED=false` → bypass SQS
  - _Requirements: 8.1_

- [x] 11.3 Tests de gestion d'erreurs
  - Tester SQS unavailable → retry → fallback database
  - Tester circuit breaker activation après 5 erreurs
  - _Requirements: 8.1, 8.4_

- [x] 12. Écrire les tests d'intégration
  - Créer `tests/integration/api/onlyfans-messages.test.ts`
  - Tester POST `/api/onlyfans/messages/send` avec payload valide → HTTP 202
  - Tester POST sans authentification → HTTP 401
  - Tester POST avec payload invalide → HTTP 400
  - Tester GET `/api/onlyfans/messages/status` → retourne métriques
  - Utiliser LocalStack pour mocker SQS
  - _Requirements: 8.2_

- [x] 13. Écrire les tests E2E
  - Créer `tests/e2e/onlyfans-rate-limiter.spec.ts` avec Playwright
  - Tester le flux complet: UI → API → SQS → Lambda → Redis
  - Vérifier que le rate limiting fonctionne (envoyer 15 messages, vérifier que seuls 10 passent)
  - Vérifier les métriques CloudWatch après envoi
  - _Requirements: 8.3_

- [x] 14. Documentation
  - Créer `docs/onlyfans-rate-limiter-integration.md` avec guide d'utilisation
  - Documenter les variables d'environnement requises
  - Ajouter des exemples de code pour utiliser le service
  - Documenter les endpoints API avec exemples de requêtes/réponses
  - Créer un runbook pour le troubleshooting
  - _Requirements: Toutes_

- [x] 15. Déploiement en staging
  - Créer une branche `feature/rate-limiter-integration`
  - Déployer sur environnement de staging Amplify
  - Configurer les variables d'environnement staging
  - Exécuter les smoke tests
  - Valider les métriques CloudWatch
  - _Requirements: Toutes_

- [x] 16. Déploiement en production
  - Merger la branche dans `main`
  - Déployer sur production avec feature flag `RATE_LIMITER_ENABLED=false`
  - Activer progressivement: 10% → 50% → 100% du trafic
  - Monitorer les alarmes CloudWatch pendant 24h
  - Documenter le rollback plan si nécessaire
  - _Requirements: Toutes_

---

## Notes d'Implémentation

### Ordre d'Exécution Recommandé

1. **Tasks 1.x** (Configuration) - Prérequis pour tout le reste
2. **Tasks 2.x** (Service OnlyFans) - Couche métier
3. **Task 3** (IntelligentQueueManager) - Intégration SQS
4. **Tasks 4-5** (API Routes) - Exposition HTTP
5. **Tasks 6-7** (Resilience) - Gestion d'erreurs
6. **Tasks 8-10** (Monitoring) - Observabilité
7. **Tasks 11-13** (Tests) - Validation
8. **Tasks 14-16** (Déploiement) - Mise en production

### Dépendances Entre Tasks

- Task 2 dépend de Task 1 (config)
- Task 3 dépend de Task 1 (config)
- Task 4 dépend de Task 2 (service)
- Task 5 dépend de Task 2 (service)
- Task 6 dépend de Task 3 (queue manager)
- Task 7 dépend de Task 2 (service)
- Task 8 dépend de Tasks 2-5 (services et API)
- Tasks 11-13 dépendent de Tasks 2-7 (code à tester)
- Task 15 dépend de Tasks 1-14 (tout le code)
- Task 16 dépend de Task 15 (validation staging)

### Estimation de Temps

- **Tasks 1.x:** 2 heures
- **Tasks 2.x:** 4 heures
- **Task 3:** 2 heures
- **Tasks 4-5:** 3 heures
- **Tasks 6-7:** 3 heures
- **Tasks 8-10:** 4 heures
- **Tasks 11-13:** 6 heures (optionnel)
- **Tasks 14-16:** 3 heures

**Total:** ~27 heures (tous les tests inclus)

### Points d'Attention

1. **Sécurité:** Toujours valider les inputs utilisateur avec Zod
2. **Monitoring:** Logger chaque opération critique pour debugging
3. **Resilience:** Implémenter retry et fallback dès le début
4. **Tests:** Mocker AWS SDK pour éviter les coûts en tests
5. **Déploiement:** Utiliser feature flags pour rollout progressif

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-29  
**Status:** Ready for Implementation
