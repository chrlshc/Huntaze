# Requirements Document

## Introduction

Ce document définit les exigences pour créer un système robuste qui élimine les erreurs de build récurrentes sur AWS Amplify. Le projet vise à identifier, documenter et corriger systématiquement tous les problèmes de build, puis à mettre en place des garde-fous pour prévenir leur réapparition.

## Glossary

- **Build System**: Le système AWS Amplify qui compile et déploie l'application Next.js
- **Prerender**: Le processus de génération statique des pages Next.js au moment du build
- **SSR (Server-Side Rendering)**: Le rendu côté serveur des pages Next.js
- **Client Component**: Un composant React qui s'exécute uniquement côté client (navigateur)
- **Server Component**: Un composant React qui s'exécute côté serveur
- **Lazy Instantiation**: Pattern de création d'objets uniquement au moment de leur première utilisation
- **Environment Variable**: Variable de configuration définie dans l'environnement d'exécution
- **Dynamic Route**: Route Next.js qui force le rendu dynamique au lieu du prerender
- **Build-time Error**: Erreur qui se produit pendant la phase de compilation
- **Runtime Error**: Erreur qui se produit pendant l'exécution de l'application

## Requirements

### Requirement 1: Diagnostic et Analyse des Erreurs

**User Story:** En tant que développeur, je veux un diagnostic complet de toutes les erreurs de build actuelles, afin de comprendre les causes racines et prioriser les corrections.

#### Acceptance Criteria

1. WHEN THE Build System analyse les logs de build, THE Build System SHALL identifier tous les types d'erreurs récurrentes
2. WHEN THE Build System catégorise les erreurs, THE Build System SHALL grouper les erreurs par type (import, prerender, environment, OAuth, etc.)
3. WHEN THE Build System documente les erreurs, THE Build System SHALL créer un rapport avec la fréquence et l'impact de chaque type d'erreur
4. WHEN THE Build System analyse les dépendances, THE Build System SHALL identifier tous les services externes qui causent des erreurs de build
5. WHERE une erreur a été corrigée précédemment, THE Build System SHALL documenter la solution appliquée et vérifier si elle est toujours effective

### Requirement 2: Correction des Erreurs d'Import et d'Export

**User Story:** En tant que développeur, je veux que tous les modules soient correctement exportés et importés, afin d'éviter les erreurs "module not found" ou "export not found".

#### Acceptance Criteria

1. WHEN THE Build System compile un module, THE Build System SHALL vérifier que toutes les fonctions exportées sont accessibles
2. WHEN un fichier importe une fonction, THE Build System SHALL vérifier que l'export existe dans le module source
3. WHEN THE Build System détecte un import manquant, THE Build System SHALL générer une erreur claire indiquant le module et l'export manquant
4. WHERE un module utilise des exports nommés, THE Build System SHALL s'assurer que tous les imports utilisent la syntaxe correcte
5. WHEN THE Build System compile lib/db/index.ts, THE Build System SHALL exporter explicitement toutes les fonctions utilisées dans l'application

### Requirement 3: Gestion des Variables d'Environnement

**User Story:** En tant que développeur, je veux que toutes les variables d'environnement requises soient correctement configurées et validées, afin d'éviter les erreurs "undefined" pendant le build.

#### Acceptance Criteria

1. WHEN THE Build System démarre, THE Build System SHALL valider la présence de toutes les variables d'environnement critiques
2. WHEN une variable d'environnement est manquante, THE Build System SHALL fournir un message d'erreur clair avec le nom de la variable et son usage
3. WHERE une variable d'environnement est optionnelle, THE Build System SHALL fournir une valeur par défaut appropriée
4. WHEN THE Build System construit une URL, THE Build System SHALL vérifier que APP_URL ou NEXT_PUBLIC_APP_URL est défini
5. WHEN THE Build System écrit .env.production, THE Build System SHALL inclure toutes les variables nécessaires au runtime

### Requirement 4: Correction des Erreurs de Prerender

**User Story:** En tant que développeur, je veux que les pages qui utilisent du code browser-only soient correctement configurées, afin d'éviter les erreurs "document is not defined" ou "window is not defined".

#### Acceptance Criteria

1. WHEN une page utilise document ou window, THE Build System SHALL forcer le rendu dynamique avec export const dynamic = 'force-dynamic'
2. WHEN un composant accède au DOM, THE Build System SHALL isoler ce code dans un useEffect ou un Client Component
3. WHERE une page nécessite du SSR, THE Build System SHALL séparer la logique server et client en composants distincts
4. WHEN THE Build System détecte du code browser-only, THE Build System SHALL vérifier la présence de guards typeof window !== 'undefined'
5. WHEN une route API utilise des services externes, THE Build System SHALL marquer la route avec export const dynamic = 'force-dynamic'

### Requirement 5: Gestion des Services Externes (OAuth, AI)

**User Story:** En tant que développeur, je veux que tous les services externes (OpenAI, Instagram, Reddit, TikTok) utilisent le pattern de lazy instantiation, afin que le build réussisse même sans leurs credentials.

#### Acceptance Criteria

1. WHEN un service externe est instancié, THE Build System SHALL utiliser le pattern lazy instantiation au lieu de l'instantiation au top-level
2. WHEN un service externe n'a pas de credentials configurés, THE Build System SHALL retourner une erreur claire au runtime sans bloquer le build
3. WHERE un service OAuth est utilisé, THE Build System SHALL vérifier les credentials uniquement au moment de l'appel
4. WHEN THE Build System compile une route API utilisant un service externe, THE Build System SHALL utiliser des imports dynamiques
5. WHEN un service externe est appelé, THE Build System SHALL implémenter un système de graceful degradation

### Requirement 6: Correction des Directives Next.js

**User Story:** En tant que développeur, je veux que toutes les directives Next.js ('use client', export const dynamic) soient correctement positionnées, afin d'éviter les erreurs de compilation.

#### Acceptance Criteria

1. WHEN un fichier utilise 'use client', THE Build System SHALL vérifier que cette directive est la première ligne du fichier
2. WHEN un fichier utilise export const dynamic, THE Build System SHALL vérifier qu'il s'agit d'un Server Component ou d'une Route Handler
3. WHERE un fichier nécessite à la fois 'use client' et export const dynamic, THE Build System SHALL séparer le code en deux fichiers
4. WHEN THE Build System détecte une directive mal placée, THE Build System SHALL générer une erreur claire avec la position correcte
5. WHEN un composant utilise des hooks React, THE Build System SHALL vérifier la présence de 'use client'

### Requirement 7: Tests et Validation du Build

**User Story:** En tant que développeur, je veux un système de tests automatisés qui valide le build avant le déploiement, afin de détecter les erreurs avant qu'elles n'atteignent Amplify.

#### Acceptance Criteria

1. WHEN THE Build System exécute les tests, THE Build System SHALL vérifier que npm run build réussit localement
2. WHEN THE Build System valide les imports, THE Build System SHALL exécuter une analyse statique de tous les fichiers TypeScript
3. WHERE des variables d'environnement sont requises, THE Build System SHALL vérifier leur présence dans .env.example
4. WHEN THE Build System teste les routes API, THE Build System SHALL vérifier que toutes les routes compilent sans erreur
5. WHEN THE Build System valide les composants, THE Build System SHALL vérifier que les directives Next.js sont correctement placées

### Requirement 8: Documentation et Prévention

**User Story:** En tant que développeur, je veux une documentation claire des patterns à suivre et des erreurs à éviter, afin de prévenir les problèmes futurs.

#### Acceptance Criteria

1. WHEN un nouveau service externe est ajouté, THE Build System SHALL fournir un template de lazy instantiation
2. WHEN une nouvelle page est créée, THE Build System SHALL fournir des guidelines sur l'utilisation de 'use client' et dynamic
3. WHERE une erreur de build se produit, THE Build System SHALL documenter la solution dans un guide de référence
4. WHEN THE Build System détecte un anti-pattern, THE Build System SHALL générer un warning avec un lien vers la documentation
5. WHEN un développeur ajoute du code browser-only, THE Build System SHALL fournir des exemples de guards appropriés

### Requirement 9: Configuration Amplify Optimisée

**User Story:** En tant que développeur, je veux une configuration amplify.yml optimisée et robuste, afin de minimiser les erreurs de déploiement.

#### Acceptance Criteria

1. WHEN THE Build System configure amplify.yml, THE Build System SHALL définir toutes les variables d'environnement avec des valeurs par défaut appropriées
2. WHEN THE Build System exécute preBuild, THE Build System SHALL vérifier la version de Node.js et installer les dépendances correctement
3. WHERE une commande peut échouer, THE Build System SHALL utiliser des fallbacks (|| echo "message")
4. WHEN THE Build System écrit .env.production, THE Build System SHALL le faire avant toute commande qui en dépend
5. WHEN THE Build System configure le cache, THE Build System SHALL inclure node_modules et .next/cache

### Requirement 10: Monitoring et Alertes

**User Story:** En tant que développeur, je veux être alerté immédiatement en cas d'échec de build, avec des informations détaillées sur la cause, afin de corriger rapidement.

#### Acceptance Criteria

1. WHEN un build échoue sur Amplify, THE Build System SHALL extraire et analyser les logs d'erreur
2. WHEN THE Build System détecte une erreur connue, THE Build System SHALL fournir un lien vers la solution documentée
3. WHERE une erreur est nouvelle, THE Build System SHALL créer un rapport détaillé avec le contexte complet
4. WHEN THE Build System analyse les tendances, THE Build System SHALL identifier les erreurs récurrentes
5. WHEN un pattern d'erreur est détecté, THE Build System SHALL suggérer des corrections préventives
