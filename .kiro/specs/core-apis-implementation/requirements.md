# Requirements Document

## Introduction

Ce projet vise à implémenter les APIs backend manquantes pour les pages principales de l'application (Content, Analytics, Marketing, OnlyFans). Actuellement, les pages frontend existent mais retournent des erreurs 404 car les endpoints API ne sont pas implémentés.

## Glossary

- **Content API**: API pour gérer la création, modification et publication de contenu multi-plateforme
- **Marketing API**: API pour gérer les campagnes marketing et l'automatisation
- **Analytics API**: API pour récupérer les métriques et statistiques de performance
- **OnlyFans API**: API pour gérer les interactions spécifiques à OnlyFans (fans, messages, revenue)
- **CRUD Operations**: Create, Read, Update, Delete - opérations de base sur les données
- **SWR**: Stale-While-Revalidate - bibliothèque de fetching de données utilisée par les hooks

## Requirements

### Requirement 1

**User Story:** En tant que créateur, je veux gérer mon contenu via l'API, afin de créer, modifier et publier du contenu sur différentes plateformes

#### Acceptance Criteria

1. THE Content API SHALL fournir un endpoint GET `/api/content` pour lister le contenu avec filtres (status, platform, type)
2. THE Content API SHALL fournir un endpoint POST `/api/content` pour créer un nouveau contenu
3. THE Content API SHALL fournir un endpoint PUT `/api/content/[id]` pour modifier un contenu existant
4. THE Content API SHALL fournir un endpoint DELETE `/api/content/[id]` pour supprimer un contenu
5. THE Content API SHALL retourner des données paginées avec total, limit, offset et hasMore
6. THE Content API SHALL valider les données d'entrée et retourner des erreurs 400 si invalides
7. THE Content API SHALL authentifier l'utilisateur et vérifier les permissions

### Requirement 2

**User Story:** En tant que créateur, je veux voir mes statistiques via l'API, afin de suivre mes performances et optimiser ma stratégie

#### Acceptance Criteria

1. THE Analytics API SHALL fournir un endpoint GET `/api/analytics/overview` pour les métriques globales
2. THE Analytics API SHALL calculer ARPU, LTV, churn rate, active subscribers et total revenue
3. THE Analytics API SHALL fournir un endpoint GET `/api/analytics/trends` pour les tendances temporelles
4. THE Analytics API SHALL supporter des filtres par période (day, week, month, year)
5. THE Analytics API SHALL retourner des données agrégées depuis la base de données
6. THE Analytics API SHALL cacher les résultats pendant 5 minutes pour optimiser les performances

### Requirement 3

**User Story:** En tant que créateur, je veux gérer mes campagnes marketing via l'API, afin d'automatiser mes communications avec mes fans

#### Acceptance Criteria

1. THE Marketing API SHALL fournir un endpoint GET `/api/marketing/campaigns` pour lister les campagnes
2. THE Marketing API SHALL fournir un endpoint POST `/api/marketing/campaigns` pour créer une campagne
3. THE Marketing API SHALL fournir un endpoint PUT `/api/marketing/campaigns/[id]` pour modifier une campagne
4. THE Marketing API SHALL fournir un endpoint DELETE `/api/marketing/campaigns/[id]` pour supprimer une campagne
5. THE Marketing API SHALL supporter les filtres par status (draft, active, paused, completed) et channel (email, dm, sms, push)
6. THE Marketing API SHALL calculer les statistiques (sent, opened, clicked, converted) pour chaque campagne

### Requirement 4

**User Story:** En tant que créateur, je veux accéder aux données OnlyFans via l'API, afin de gérer mes fans et mon contenu OnlyFans

#### Acceptance Criteria

1. THE OnlyFans API SHALL fournir un endpoint GET `/api/onlyfans/fans` pour lister les fans
2. THE OnlyFans API SHALL fournir un endpoint GET `/api/onlyfans/stats` pour les statistiques OnlyFans
3. THE OnlyFans API SHALL fournir un endpoint GET `/api/onlyfans/content` pour le contenu OnlyFans
4. THE OnlyFans API SHALL synchroniser les données avec l'API OnlyFans externe
5. THE OnlyFans API SHALL cacher les données pendant 10 minutes pour réduire les appels API externes

### Requirement 5

**User Story:** En tant que développeur, je veux des APIs sécurisées et performantes, afin de garantir la protection des données et une bonne expérience utilisateur

#### Acceptance Criteria

1. THE API System SHALL authentifier toutes les requêtes avec NextAuth session
2. THE API System SHALL valider que l'utilisateur a complété l'onboarding avant d'accéder aux données
3. THE API System SHALL implémenter le rate limiting (100 requêtes/minute par utilisateur)
4. THE API System SHALL logger toutes les erreurs avec correlation IDs
5. THE API System SHALL retourner des erreurs structurées avec codes HTTP appropriés
6. THE API System SHALL utiliser des transactions database pour les opérations critiques
7. THE API System SHALL implémenter le caching avec Redis quand disponible

### Requirement 6

**User Story:** En tant que créateur, je veux que les APIs retournent des données réelles depuis la base de données, afin de voir mon contenu et mes statistiques actuels

#### Acceptance Criteria

1. THE API System SHALL se connecter à la base de données PostgreSQL via Prisma
2. THE API System SHALL créer les tables manquantes via migrations Prisma
3. THE API System SHALL retourner des données vides (tableaux vides) quand aucune donnée n'existe
4. THE API System SHALL retourner des données réelles quand elles existent en base
5. THE API System SHALL gérer gracieusement les erreurs de connexion database

### Requirement 7

**User Story:** En tant que développeur, je veux des APIs testables et maintenables, afin de faciliter le développement futur

#### Acceptance Criteria

1. THE API System SHALL suivre une structure cohérente pour tous les endpoints
2. THE API System SHALL utiliser des types TypeScript pour toutes les requêtes/réponses
3. THE API System SHALL séparer la logique métier des routes API
4. THE API System SHALL documenter les endpoints avec des commentaires JSDoc
5. THE API System SHALL inclure des tests unitaires pour la logique métier critique
