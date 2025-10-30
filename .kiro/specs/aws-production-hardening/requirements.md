# Requirements Document - AWS Production Hardening

## Introduction

Ce document définit les exigences pour sécuriser, observer et optimiser l'infrastructure AWS Huntaze en production. Le système actuel est à 80% complet mais présente des lacunes critiques en sécurité (Redis non chiffré), observabilité (pas de Container Insights) et gestion des coûts (incohérences $25/jour vs $64/mois).

## Glossary

- **System**: L'infrastructure AWS Huntaze (compte 317805897534, région us-east-1)
- **ElastiCache**: Service AWS Redis managé utilisé pour rate limiting et cache
- **Container Insights**: Service CloudWatch pour monitoring ECS/Fargate
- **FSBP**: AWS Foundational Security Best Practices (Security Hub)
- **DLQ**: Dead Letter Queue pour messages SQS non traités
- **TTL**: Time To Live pour purge automatique DynamoDB
- **FIFO Queue**: File SQS avec ordre garanti et exactly-once delivery
- **Token Bucket**: Algorithme de rate limiting avec bursts contrôlés
- **VPC Endpoint**: Connexion privée aux services AWS sans NAT Gateway

## Requirements

### Requirement 1: Sécurité Infrastructure

**User Story:** En tant qu'administrateur système, je veux que toutes les données au repos et en transit soient chiffrées, afin de respecter les standards de sécurité et protéger les données sensibles.

#### Acceptance Criteria

1. WHEN THE System détecte un cluster ElastiCache non chiffré, THE System SHALL recréer le cluster avec chiffrement au repos et en transit activé
2. WHEN THE System configure ElastiCache, THE System SHALL activer l'authentification AUTH avec rotation planifiée du token
3. WHEN THE System stocke des objets dans S3, THE System SHALL appliquer Block Public Access au niveau compte et chiffrement par défaut SSE-S3
4. WHEN THE System se connecte à RDS PostgreSQL, THE System SHALL forcer TLS obligatoire via le paramètre rds.force_ssl égal à 1
5. WHEN THE System déploie des tâches ECS Fargate, THE System SHALL utiliser task execution role et task role dédiés avec AWS Secrets Manager pour les credentials

### Requirement 2: Observabilité et Conformité

**User Story:** En tant qu'ingénieur SRE, je veux une visibilité complète sur l'infrastructure et les menaces, afin de détecter et résoudre rapidement les incidents.

#### Acceptance Criteria

1. WHEN THE System démarre, THE System SHALL activer CloudTrail multi-région avec logs vers S3 chiffré
2. WHEN THE System détecte une menace, THE System SHALL utiliser GuardDuty pour alerter automatiquement
3. WHEN THE System évalue la conformité, THE System SHALL activer Security Hub FSBP pour remonter les écarts standards
4. WHEN THE System monitore ECS, THE System SHALL activer Container Insights sur les 3 clusters (ai-team, huntaze-cluster, huntaze-of-fargate)
5. WHEN THE System trace les requêtes, THE System SHALL utiliser OpenTelemetry au lieu de X-Ray (deprecated février 2027)

### Requirement 3: Gestion des Coûts (FinOps)

**User Story:** En tant que responsable financier, je veux des alertes prévisionnelles et réelles sur les dépassements budgétaires, afin de contrôler les dépenses cloud.

#### Acceptance Criteria

1. WHEN THE System atteint 80% du budget mensuel, THE System SHALL envoyer une alerte prévisionnelle via SNS
2. WHEN THE System atteint 100% du budget mensuel, THE System SHALL envoyer une alerte réelle via SNS
3. WHEN THE System détecte une anomalie de coût, THE System SHALL utiliser Cost Anomaly Detection pour alerter
4. WHEN THE System stocke des logs CloudWatch, THE System SHALL appliquer une rétention de 30 à 90 jours maximum
5. WHEN THE System stocke des données DynamoDB volatiles, THE System SHALL configurer TTL pour purge automatique

### Requirement 4: Orchestrateur Hybride - Ressources Manquantes

**User Story:** En tant que développeur, je veux que l'orchestrateur hybride dispose de toutes ses ressources AWS, afin de tracker les coûts IA et gérer les workflows multi-agents.

#### Acceptance Criteria

1. WHEN THE System crée la queue SQS workflows, THE System SHALL créer huntaze-hybrid-workflows.fifo avec FIFO, DLQ et high-throughput mode perMessageGroupId
2. WHEN THE System crée la queue SQS rate limiter, THE System SHALL créer huntaze-rate-limiter-queue Standard avec long polling 20 secondes et DLQ
3. WHEN THE System crée la table DynamoDB costs, THE System SHALL créer huntaze-ai-costs-production avec clés pk/sk, TTL activé et encryption
4. WHEN THE System crée la table DynamoDB alerts, THE System SHALL créer huntaze-cost-alerts-production avec clés pk/sk, TTL activé et encryption
5. WHEN THE System crée le topic SNS, THE System SHALL créer huntaze-cost-alerts avec policy autorisant AWS Budgets à publier

### Requirement 5: Rate Limiting OnlyFans (10 msg/min)

**User Story:** En tant que service OnlyFans, je veux respecter la limite de 10 messages par minute, afin d'éviter le bannissement du compte.

#### Acceptance Criteria

1. WHEN THE System reçoit une demande d'envoi de message, THE System SHALL envoyer vers huntaze-rate-limiter-queue avec long polling
2. WHEN THE System consomme la queue rate limiter, THE System SHALL utiliser Lambda avec reserved concurrency égal à 1
3. WHEN THE System applique le rate limiting, THE System SHALL utiliser un token bucket dans Redis avec script Lua
4. WHEN THE System traite un message, THE System SHALL garantir l'idempotence via messageId et DLQ à 5 tentatives maximum
5. WHEN THE System dépasse la limite, THE System SHALL retourner HTTP 429 avec Retry-After header

### Requirement 6: Auto Scaling et Résilience

**User Story:** En tant qu'ingénieur SRE, je veux que les services ECS s'adaptent automatiquement à la charge et rollback en cas d'échec, afin de garantir la disponibilité.

#### Acceptance Criteria

1. WHEN THE System détecte une charge CPU supérieure à 70%, THE System SHALL scaler automatiquement les tâches ECS
2. WHEN THE System détecte une charge mémoire supérieure à 80%, THE System SHALL scaler automatiquement les tâches ECS
3. WHEN THE System déploie une nouvelle version, THE System SHALL activer deployment circuit breaker pour rollback automatique
4. WHEN THE System détecte des requêtes lourdes RDS, THE System SHALL utiliser Performance Insights pour profiler
5. WHEN THE System monitore les services, THE System SHALL créer des alarmes CloudWatch pour CPU, Memory et RequestCount

### Requirement 7: Optimisation des Coûts

**User Story:** En tant que responsable financier, je veux réduire les coûts AWS sans impacter les performances, afin d'optimiser le ROI.

#### Acceptance Criteria

1. WHEN THE System stocke des assets peu consultés dans S3, THE System SHALL appliquer Intelligent-Tiering
2. WHEN THE System accède à S3 ou DynamoDB depuis VPC, THE System SHALL utiliser VPC endpoints au lieu de NAT Gateway
3. WHEN THE System stocke des logs CloudWatch, THE System SHALL appliquer une rétention de 30 jours pour logs non critiques
4. WHEN THE System stocke des événements DynamoDB, THE System SHALL configurer TTL pour purge automatique après 90 jours
5. WHEN THE System analyse les coûts, THE System SHALL utiliser Trusted Advisor et Cost Anomaly Detection

### Requirement 8: Runbook de Vérification

**User Story:** En tant qu'ingénieur DevOps, je veux un runbook automatisé pour vérifier la conformité de l'infrastructure, afin de détecter rapidement les dérives.

#### Acceptance Criteria

1. WHEN THE System exécute le runbook, THE System SHALL lister toutes les tables DynamoDB et vérifier les manquantes
2. WHEN THE System exécute le runbook, THE System SHALL lister toutes les queues SQS et vérifier les manquantes
3. WHEN THE System exécute le runbook, THE System SHALL vérifier le chiffrement ElastiCache (at-rest et transit)
4. WHEN THE System exécute le runbook, THE System SHALL vérifier CloudTrail multi-région activé
5. WHEN THE System exécute le runbook, THE System SHALL vérifier RDS force_ssl égal à 1

### Requirement 9: Déploiement Terraform

**User Story:** En tant qu'ingénieur infrastructure, je veux déployer toutes les ressources manquantes via Terraform, afin de garantir la reproductibilité et le versioning.

#### Acceptance Criteria

1. WHEN THE System déploie via Terraform, THE System SHALL créer les 2 queues SQS (workflows FIFO et rate-limiter Standard) avec leurs DLQ
2. WHEN THE System déploie via Terraform, THE System SHALL créer les 2 tables DynamoDB (ai-costs et cost-alerts) avec TTL et encryption
3. WHEN THE System déploie via Terraform, THE System SHALL créer le topic SNS cost-alerts avec policy Budgets
4. WHEN THE System déploie via Terraform, THE System SHALL créer AWS Budget mensuel avec alertes à 80% et 100%
5. WHEN THE System déploie via Terraform, THE System SHALL activer point-in-time recovery sur toutes les tables DynamoDB

### Requirement 10: Feuille de Route (2 Semaines)

**User Story:** En tant que chef de projet, je veux un plan d'exécution clair sur 2 semaines, afin de coordonner les équipes et suivre l'avancement.

#### Acceptance Criteria

1. WHEN THE System planifie la semaine 1, THE System SHALL inclure création SQS, DynamoDB, SNS, Budgets, recréation ElastiCache chiffré
2. WHEN THE System planifie la semaine 1, THE System SHALL inclure activation GuardDuty, Security Hub FSBP, CloudTrail multi-région
3. WHEN THE System planifie la semaine 1, THE System SHALL inclure activation Container Insights sur 3 clusters et rétention logs
4. WHEN THE System planifie la semaine 2, THE System SHALL inclure déploiement rate-limiter Lambda avec token bucket Redis
5. WHEN THE System planifie la semaine 2, THE System SHALL inclure activation Performance Insights RDS, alarmes et Service Auto Scaling ECS
