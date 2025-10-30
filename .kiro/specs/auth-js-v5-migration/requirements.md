# Requirements Document

## Introduction

Cette spec définit la migration complète de l'authentification vers Auth.js v5, en remplaçant les anciens fichiers NextAuth v4 et les systèmes JWT custom par l'implémentation Auth.js v5 moderne déjà en place dans `auth.ts`.

## Glossary

- **Auth.js v5**: La dernière version majeure de NextAuth.js, rebrandée en Auth.js
- **Authentication System**: Le système centralisé d'authentification utilisant Auth.js v5
- **Legacy Auth Files**: Les anciens fichiers d'authentification utilisant NextAuth v4 ou des patterns obsolètes
- **Migration Process**: Le processus de remplacement des anciens fichiers par les nouveaux patterns Auth.js v5

## Requirements

### Requirement 1

**User Story:** En tant que développeur, je veux supprimer tous les fichiers d'authentification obsolètes, afin d'éviter la confusion et les conflits avec Auth.js v5

#### Acceptance Criteria

1. WHEN the Migration Process executes, THE Authentication System SHALL remove `lib/auth.ts` containing the obsolete `getServerSession()` stub
2. WHEN the Migration Process executes, THE Authentication System SHALL remove `lib/server-auth.ts` containing NextAuth v4 patterns
3. WHEN the Migration Process executes, THE Authentication System SHALL remove `lib/middleware/api-auth.ts` containing obsolete `getToken()` usage
4. WHEN the Migration Process executes, THE Authentication System SHALL remove `lib/middleware/auth-middleware.ts` containing obsolete middleware patterns
5. WHEN the Migration Process executes, THE Authentication System SHALL remove `src/lib/platform-auth.ts` containing NextAuth v4 configuration

### Requirement 2

**User Story:** En tant que développeur, je veux migrer tous les usages de `getServerSession()` vers `auth()`, afin d'utiliser l'API Auth.js v5 moderne

#### Acceptance Criteria

1. WHEN code imports authentication functions, THE Authentication System SHALL use `auth()` from `@/auth` instead of `getServerSession()`
2. WHEN Server Components need session data, THE Authentication System SHALL call `auth()` directly without parameters
3. WHEN API routes need session data, THE Authentication System SHALL call `auth()` directly without parameters
4. WHEN authentication checks fail, THE Authentication System SHALL return null from `auth()` instead of throwing errors

### Requirement 3

**User Story:** En tant que développeur, je veux un helper `requireAuth()` moderne, afin de simplifier la protection des routes serveur

#### Acceptance Criteria

1. WHEN creating the auth helper, THE Authentication System SHALL export a `requireAuth()` function from `@/lib/auth-helpers`
2. WHEN `requireAuth()` is called, THE Authentication System SHALL invoke `auth()` to retrieve the session
3. IF the session is null, THEN THE Authentication System SHALL throw an error with message "Unauthorized"
4. WHEN the session exists, THE Authentication System SHALL return the session object
5. WHEN used in Server Components, THE Authentication System SHALL allow `requireAuth()` to be awaited

### Requirement 4

**User Story:** En tant que développeur, je veux conserver le système JWT custom, afin de maintenir la compatibilité avec les fonctionnalités avancées existantes

#### Acceptance Criteria

1. WHEN evaluating `lib/services/auth-service.ts`, THE Authentication System SHALL preserve the file without modifications
2. WHEN the JWT system is needed, THE Authentication System SHALL allow coexistence with Auth.js v5
3. WHEN documentation is updated, THE Authentication System SHALL clarify that `auth-service.ts` provides advanced JWT features beyond Auth.js scope
4. WHEN new code is written, THE Authentication System SHALL prefer Auth.js v5 for standard authentication flows

### Requirement 5

**User Story:** En tant que développeur, je veux mettre à jour tous les imports obsolètes, afin d'utiliser uniquement les exports Auth.js v5

#### Acceptance Criteria

1. WHEN scanning the codebase, THE Authentication System SHALL identify all imports from `next-auth/next`
2. WHEN scanning the codebase, THE Authentication System SHALL identify all imports from `next-auth/jwt`
3. WHEN updating imports, THE Authentication System SHALL replace `getServerSession` imports with `auth` from `@/auth`
4. WHEN updating imports, THE Authentication System SHALL replace `getToken` imports with `auth` from `@/auth`
5. WHEN all imports are updated, THE Authentication System SHALL ensure no references to NextAuth v4 APIs remain

### Requirement 6

**User Story:** En tant que développeur, je veux une documentation claire de la migration, afin de comprendre les changements et les nouveaux patterns

#### Acceptance Criteria

1. WHEN the migration completes, THE Authentication System SHALL create a migration guide document
2. WHEN developers read the guide, THE Authentication System SHALL document the mapping from old to new APIs
3. WHEN developers read the guide, THE Authentication System SHALL provide code examples for common patterns
4. WHEN developers read the guide, THE Authentication System SHALL explain when to use Auth.js v5 vs the custom JWT service
5. WHEN developers read the guide, THE Authentication System SHALL list all removed files and their replacements
