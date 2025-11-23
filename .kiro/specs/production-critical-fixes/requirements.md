# Requirements Document

## Introduction

Ce document définit les exigences pour corriger les problèmes critiques identifiés dans l'application Huntaze avant le déploiement en production. L'application utilise Next.js 16.0.3 avec Amplify Compute (ECS Fargate) et nécessite des corrections au niveau des middlewares, de la configuration, et de la gestion des headers de sécurité.

## Glossary

- **Next.js App Router**: Architecture de routage de Next.js 14+ utilisant le dossier `app/`
- **Amplify Compute**: Service AWS utilisant ECS Fargate pour héberger des containers (pas Lambda)
- **RouteHandler**: Type TypeScript pour les handlers de routes Next.js App Router
- **Middleware**: Fonction qui intercepte et traite les requêtes avant qu'elles n'atteignent le handler
- **CSRF**: Cross-Site Request Forgery - attaque de sécurité web
- **Rate Limiting**: Limitation du nombre de requêtes par IP/utilisateur
- **CloudFront**: CDN AWS qui distribue le contenu
- **Lambda@Edge**: Fonctions Lambda qui s'exécutent sur les edge locations CloudFront

## Requirements

### Requirement 1

**User Story:** En tant que développeur, je veux corriger les types de middlewares incompatibles avec Next.js App Router, afin que le code compile sans erreurs et fonctionne correctement.

#### Acceptance Criteria

1. WHEN the system defines middleware types THEN it SHALL use `RouteHandler` type compatible with Next.js App Router
2. WHEN a middleware wraps a handler THEN it SHALL accept and return a `RouteHandler` type
3. WHEN middleware types are imported THEN they SHALL come from `next/server` and not from `next` Pages Router
4. WHEN the code is compiled THEN it SHALL not produce type errors related to middleware signatures
5. WHEN API routes use middlewares THEN they SHALL compose them correctly without double exports

### Requirement 2

**User Story:** En tant que développeur, je veux créer des types de middlewares réutilisables, afin de maintenir la cohérence à travers l'application.

#### Acceptance Criteria

1. WHEN middleware types are defined THEN the system SHALL create a central `lib/middleware/types.ts` file
2. WHEN a `RouteHandler` type is needed THEN it SHALL be imported from the central types file
3. WHEN new middlewares are created THEN they SHALL use the standardized `RouteHandler` type
4. WHEN middlewares are composed THEN they SHALL maintain type safety throughout the chain

### Requirement 3

**User Story:** En tant que développeur, je veux corriger le middleware d'authentification, afin qu'il fonctionne avec Next.js App Router et NextAuth v5.

#### Acceptance Criteria

1. WHEN the auth middleware checks authentication THEN it SHALL use `getServerSession` from `next-auth`
2. WHEN a user is not authenticated THEN the system SHALL return a 401 Unauthorized response
3. WHEN admin access is required THEN the system SHALL verify the user role from the database
4. WHEN a non-admin tries to access admin routes THEN the system SHALL return a 403 Forbidden response
5. WHEN authentication succeeds THEN the system SHALL attach user information to the request object

### Requirement 4

**User Story:** En tant que développeur, je veux corriger le middleware CSRF, afin de protéger l'application contre les attaques CSRF.

#### Acceptance Criteria

1. WHEN a GET request is received THEN the system SHALL skip CSRF validation
2. WHEN a non-GET request is received THEN the system SHALL validate the CSRF token
3. WHEN CSRF tokens are validated THEN the system SHALL compare header token with cookie token
4. WHEN CSRF validation fails THEN the system SHALL return a 403 Forbidden response
5. WHEN CSRF validation succeeds THEN the system SHALL call the wrapped handler

### Requirement 5

**User Story:** En tant que développeur, je veux corriger le middleware de rate limiting, afin de protéger l'API contre les abus.

#### Acceptance Criteria

1. WHEN rate limiting extracts client IP THEN it SHALL use `x-forwarded-for` header from CloudFront
2. WHEN multiple IPs are in `x-forwarded-for` THEN the system SHALL use the first IP in the list
3. WHEN a rate limit counter is incremented THEN the system SHALL use Redis with proper expiration
4. WHEN rate limit is exceeded THEN the system SHALL return a 429 Too Many Requests response
5. WHEN rate limit headers are added THEN the system SHALL include `X-RateLimit-Limit` and `X-RateLimit-Remaining`
6. WHEN Redis is unavailable THEN the system SHALL fail open and allow the request

### Requirement 6

**User Story:** En tant que développeur, je veux corriger la configuration Next.js pour Next.js 16, afin d'utiliser les fonctionnalités appropriées.

#### Acceptance Criteria

1. WHEN Next.js config is defined THEN it SHALL use `output: 'standalone'` for Amplify Compute
2. WHEN Turbopack is configured THEN it SHALL be enabled only for development mode
3. WHEN webpack is used THEN it SHALL be used for production builds
4. WHEN security headers are configured THEN they SHALL be defined in `async headers()` function
5. WHEN the config references Next.js 16 features THEN it SHALL use correct API for version 16.0.3

### Requirement 7

**User Story:** En tant que développeur, je veux configurer les security headers correctement, afin de protéger l'application contre les vulnérabilités web.

#### Acceptance Criteria

1. WHEN security headers are set THEN the system SHALL include HSTS with preload
2. WHEN security headers are set THEN the system SHALL include X-Frame-Options DENY
3. WHEN security headers are set THEN the system SHALL include X-Content-Type-Options nosniff
4. WHEN security headers are set THEN the system SHALL include Content-Security-Policy
5. WHEN security headers are set THEN the system SHALL include Permissions-Policy

### Requirement 8

**User Story:** En tant que développeur, je veux corriger la configuration des cookies CSRF, afin qu'ils fonctionnent avec le domaine Amplify.

#### Acceptance Criteria

1. WHEN CSRF cookies are set in production THEN the system SHALL use `.huntaze.com` as domain
2. WHEN CSRF cookies are set in development THEN the system SHALL not specify a domain
3. WHEN CSRF cookies are set THEN they SHALL be httpOnly and secure in production
4. WHEN CSRF cookies are set THEN they SHALL use sameSite 'lax' policy
5. WHEN CSRF cookies are set THEN they SHALL have a 24-hour expiration

### Requirement 9

**User Story:** En tant que développeur, je veux vérifier la configuration Amplify Compute, afin de m'assurer qu'elle est optimale pour Next.js 16.

#### Acceptance Criteria

1. WHEN amplify.yml is configured THEN it SHALL use `compute` type with `container`
2. WHEN Amplify Compute is configured THEN it SHALL specify 2048MB memory and 1024 CPU
3. WHEN VPC is configured THEN it SHALL include security group IDs and subnet IDs
4. WHEN build commands are defined THEN they SHALL include Prisma generate and migrate
5. WHEN cache paths are defined THEN they SHALL include node_modules and .next/cache

### Requirement 10

**User Story:** En tant que développeur, je veux tester les corrections localement, afin de valider qu'elles fonctionnent avant le déploiement.

#### Acceptance Criteria

1. WHEN the code is built locally THEN it SHALL compile without type errors
2. WHEN tests are run THEN they SHALL pass without failures
3. WHEN API routes are tested THEN they SHALL respond correctly with proper status codes
4. WHEN middlewares are tested THEN they SHALL correctly intercept and process requests
5. WHEN rate limiting is tested THEN it SHALL correctly track and limit requests
