# Requirements Document - Migration Base de Données Production (Beta Fermée)

## Introduction

Ce document définit les exigences pour migrer l'application Huntaze d'une architecture utilisant des données en mémoire (mocks) vers une base de données PostgreSQL RDS en production avec Prisma Client. L'objectif est de remplacer tous les stores en mémoire par des requêtes Prisma réelles, initialiser la base de données avec les migrations, et configurer NextAuth pour utiliser la base de données.

**Contexte Beta Fermée:** Cette migration vise un déploiement MVP pour une beta fermée avec un nombre limité d'utilisateurs (10-50). L'architecture doit être simple, économique (~$50/mois) et rapide à déployer (1-2 jours).

## Glossary

- **Prisma Client**: ORM TypeScript pour interagir avec PostgreSQL
- **RDS**: Amazon Relational Database Service - service de base de données managé
- **Migration**: Script SQL généré par Prisma pour créer/modifier le schéma de base de données
- **NextAuth**: Bibliothèque d'authentification pour Next.js
- **API Route**: Endpoint Next.js dans le dossier `app/api/`
- **Mock Store**: Stockage temporaire en mémoire (Map, Array) utilisé pour le développement
- **DATABASE_URL**: Variable d'environnement contenant la chaîne de connexion PostgreSQL
- **Beta Fermée**: Phase de test avec utilisateurs limités et invités uniquement
- **MVP**: Minimum Viable Product - version minimale fonctionnelle

## Requirements

### Requirement 1

**User Story:** En tant que développeur backend, je veux que les API routes critiques utilisent Prisma Client au lieu de stores en mémoire, afin que les données utilisateurs soient persistées dans PostgreSQL.

#### Acceptance Criteria

1. WHEN une API route lit des données utilisateur, THE System SHALL utiliser `prisma.user.findUnique()` ou `prisma.user.findMany()` au lieu de Map en mémoire
2. WHEN une API route crée ou met à jour un utilisateur, THE System SHALL utiliser les méthodes Prisma (`create`, `update`, `upsert`)
3. THE System SHALL importer le client Prisma depuis `@/lib/db` dans les API routes suivantes: `/api/auth/signin`, `/api/auth/me`, `/api/users/profile`
4. THE System SHALL conserver les mocks pour les API routes non-critiques en beta (analytics, metrics)
5. THE System SHALL supprimer les déclarations de Map/Array en mémoire uniquement des routes migrées

### Requirement 2

**User Story:** En tant que DevOps, je veux que la base de données PostgreSQL RDS soit initialisée avec le schéma Prisma, afin que l'application puisse fonctionner en production.

#### Acceptance Criteria

1. THE System SHALL exécuter `npx prisma migrate deploy` pour appliquer toutes les migrations au schéma de base de données
2. WHEN les migrations sont appliquées, THE System SHALL créer les tables essentielles: User, RefreshToken, SubscriptionRecord
3. THE System SHALL vérifier que la variable `DATABASE_URL` pointe vers l'instance RDS PostgreSQL avant d'exécuter les migrations
4. THE System SHALL créer un script `scripts/init-database.sh` qui exécute les migrations et seed la base avec 2 utilisateurs de test pour la beta
5. IF les migrations échouent, THEN THE System SHALL logger l'erreur et arrêter le déploiement

### Requirement 3

**User Story:** En tant que développeur, je veux que NextAuth utilise Prisma Adapter pour stocker les sessions dans PostgreSQL, afin que l'authentification soit persistée entre les redémarrages.

#### Acceptance Criteria

1. THE System SHALL installer `@next-auth/prisma-adapter` comme dépendance
2. THE System SHALL configurer NextAuth avec `PrismaAdapter(prisma)` dans la configuration
3. THE System SHALL ajouter les modèles NextAuth minimaux au schéma Prisma (Session, Account)
4. WHEN un utilisateur se connecte, THE System SHALL créer une session dans la table `sessions` via Prisma
5. WHERE beta fermée, THE System SHALL configurer une expiration de session de 7 jours

### Requirement 4

**User Story:** En tant que développeur, je veux que les services utilisateur et billing utilisent Prisma au lieu de mocks, afin que la logique métier soit connectée à la vraie base de données.

#### Acceptance Criteria

1. THE System SHALL modifier `lib/services/simple-user-service.ts` pour utiliser `prisma.user.*` au lieu de données mockées
2. THE System SHALL modifier `lib/services/simple-billing-service.ts` pour utiliser `prisma.subscriptionRecord.*` au lieu de données mockées
3. THE System SHALL conserver les méthodes existantes mais remplacer l'implémentation interne (Map → Prisma)
4. WHEN un service lit des données, THE System SHALL utiliser les méthodes Prisma avec gestion d'erreur try/catch
5. THE System SHALL utiliser les transactions Prisma (`prisma.$transaction`) uniquement pour les opérations critiques (création utilisateur + subscription)

### Requirement 5

**User Story:** En tant que développeur, je veux un script de validation simple qui vérifie que Prisma est correctement configuré et que la base de données est accessible, afin de détecter les problèmes avant le déploiement.

#### Acceptance Criteria

1. THE System SHALL créer un script `scripts/validate-database.sh` qui teste la connexion à la base de données
2. WHEN le script s'exécute, THE System SHALL exécuter `prisma.$queryRaw\`SELECT 1\`` pour vérifier la connectivité
3. THE System SHALL vérifier que les 3 tables essentielles existent (users, sessions, subscription_records)
4. THE System SHALL vérifier que la variable `DATABASE_URL` est définie et valide
5. IF la validation échoue, THEN THE System SHALL retourner un code d'erreur non-zéro et logger les détails

### Requirement 6

**User Story:** En tant que développeur, je veux que les clés Stripe et Azure soient sécurisées dans AWS Secrets Manager, afin de protéger les credentials sensibles en production.

#### Acceptance Criteria

1. THE System SHALL créer un service léger `lib/services/secrets-service.ts` qui récupère les secrets depuis AWS Secrets Manager
2. WHEN l'application démarre, THE System SHALL récupérer `STRIPE_SECRET_KEY` depuis le secret `huntaze/stripe` avec cache de 5 minutes
3. THE System SHALL récupérer `AZURE_OPENAI_API_KEY` depuis le secret `huntaze/azure` avec cache de 5 minutes
4. THE System SHALL utiliser les variables d'environnement comme fallback si Secrets Manager échoue (pour dev local)
5. WHERE beta fermée, THE System SHALL logger les accès aux secrets pour audit

### Requirement 7

**User Story:** En tant que développeur, je veux que le buildspec Amplify exécute les migrations Prisma automatiquement lors du déploiement, afin que le schéma soit toujours à jour.

#### Acceptance Criteria

1. THE System SHALL ajouter une étape `npx prisma generate` dans la phase `preBuild` du buildspec
2. THE System SHALL ajouter une étape `npx prisma migrate deploy` dans la phase `preBuild` du buildspec
3. WHEN le build Amplify s'exécute, THE System SHALL appliquer les migrations avant de builder l'application
4. IF les migrations échouent, THEN THE System SHALL arrêter le build et marquer le déploiement comme échoué
5. THE System SHALL logger les résultats des migrations dans les logs Amplify

### Requirement 8

**User Story:** En tant que développeur, je veux des tests d'intégration minimaux qui vérifient que Prisma fonctionne correctement avec la base de données, afin de garantir la qualité du code.

#### Acceptance Criteria

1. THE System SHALL créer des tests basiques dans `tests/integration/prisma-database.test.ts`
2. WHEN les tests s'exécutent, THE System SHALL créer un utilisateur de test avec Prisma et vérifier qu'il est persisté
3. THE System SHALL tester les opérations CRUD (Create, Read, Update, Delete) sur le modèle User uniquement
4. THE System SHALL tester une relation Prisma (User -> SubscriptionRecord)
5. WHERE beta fermée, THE System SHALL utiliser une base de données de test locale avec Docker pour éviter les coûts AWS

### Requirement 9

**User Story:** En tant que développeur, je veux une documentation concise sur la migration, afin que l'équipe comprenne les changements essentiels.

#### Acceptance Criteria

1. THE System SHALL créer un document `docs/DATABASE_MIGRATION_BETA.md` expliquant la migration
2. THE System SHALL documenter comment exécuter les migrations localement et en production
3. THE System SHALL documenter les 3 API routes migrées et les changements dans les services
4. THE System SHALL fournir 2-3 exemples de code avant/après pour les patterns courants
5. THE System SHALL documenter le processus de rollback simple (restaurer backup RDS)

### Requirement 10

**User Story:** En tant que développeur, je veux que les API routes gèrent correctement les erreurs Prisma courantes, afin que les utilisateurs reçoivent des messages d'erreur appropriés.

#### Acceptance Criteria

1. WHEN une requête Prisma échoue avec une erreur de contrainte unique, THE System SHALL retourner un code HTTP 409 (Conflict)
2. WHEN une requête Prisma échoue avec une erreur de record non trouvé, THE System SHALL retourner un code HTTP 404 (Not Found)
3. WHEN une requête Prisma échoue avec une erreur de connexion, THE System SHALL retourner un code HTTP 503 (Service Unavailable)
4. THE System SHALL logger toutes les erreurs Prisma avec le contexte minimal (userId, operation)
5. THE System SHALL utiliser un helper simple `lib/utils/prisma-errors.ts` pour mapper les 3 erreurs principales aux codes HTTP

### Requirement 11 (Beta Spécifique)

**User Story:** En tant que product owner, je veux limiter l'accès à la beta fermée, afin de contrôler le nombre d'utilisateurs et les coûts.

#### Acceptance Criteria

1. THE System SHALL créer une table `BetaInvites` dans le schéma Prisma avec les champs: email, code, usedAt, createdAt
2. WHEN un utilisateur s'inscrit, THE System SHALL vérifier qu'un code d'invitation valide existe pour son email
3. IF aucun code valide n'existe, THEN THE System SHALL retourner une erreur 403 avec message "Beta fermée - invitation requise"
4. WHEN un code est utilisé, THE System SHALL marquer le champ `usedAt` avec la date actuelle
5. THE System SHALL créer un script `scripts/generate-beta-codes.sh` pour générer 50 codes d'invitation

### Requirement 12 (Coûts Beta)

**User Story:** En tant que DevOps, je veux optimiser les coûts AWS pour la beta fermée, afin de rester sous $50/mois.

#### Acceptance Criteria

1. THE System SHALL utiliser RDS db.t3.micro (20GB) pour PostgreSQL (~$15/mois)
2. THE System SHALL configurer Amplify avec auto-scaling minimal (1 instance) (~$15/mois)
3. THE System SHALL limiter les appels Secrets Manager avec cache de 5 minutes (~$2/mois)
4. THE System SHALL configurer des alertes CloudWatch si les coûts dépassent $60/mois
5. THE System SHALL documenter les coûts estimés dans `docs/BETA_COSTS.md`
