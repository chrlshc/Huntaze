# Requirements Document

## Introduction

Ce projet vise à nettoyer et valider tous les fichiers layout.tsx de l'application Next.js pour éliminer les layouts redondants qui causent des problèmes de build sur Amplify. L'objectif est de tester localement avec `npm run build` avant chaque push pour garantir que le build passe en production.

## Glossary

- **Layout Component**: Un composant Next.js qui enveloppe les pages enfants dans une route spécifique
- **Redundant Layout**: Un layout qui ne fait que retourner `children` sans ajouter de logique ou de UI
- **Build System**: Le système Next.js qui compile l'application (local et Amplify)
- **App Router**: Le système de routing de Next.js 13+ utilisant le dossier `app/`

## Requirements

### Requirement 1

**User Story:** En tant que développeur, je veux identifier tous les layouts redondants, afin de réduire la complexité et éviter les erreurs de build

#### Acceptance Criteria

1. WHEN le système analyse le dossier `app/`, THE Build System SHALL identifier tous les fichiers `layout.tsx`
2. WHEN un layout ne contient que `return children` sans logique additionnelle, THE Build System SHALL le marquer comme redondant
3. THE Build System SHALL générer un rapport listant tous les layouts redondants avec leur chemin complet
4. THE Build System SHALL catégoriser les layouts en "à supprimer", "à conserver" et "à vérifier manuellement"

### Requirement 2

**User Story:** En tant que développeur, je veux supprimer les layouts inutiles de manière sécurisée, afin d'éviter de casser la navigation de l'application

#### Acceptance Criteria

1. WHEN un layout redondant est identifié, THE Build System SHALL vérifier qu'aucune page enfant ne dépend de ce layout
2. BEFORE suppression d'un layout, THE Build System SHALL créer une sauvegarde du fichier
3. AFTER suppression d'un layout, THE Build System SHALL exécuter `npm run build` pour valider le changement
4. IF le build échoue, THEN THE Build System SHALL restaurer le layout depuis la sauvegarde
5. THE Build System SHALL logger chaque suppression avec succès ou échec

### Requirement 3

**User Story:** En tant que développeur, je veux valider localement avec `npm run build` avant de pousser, afin d'éviter les échecs de build sur Amplify

#### Acceptance Criteria

1. BEFORE chaque commit, THE Build System SHALL exécuter `npm run build` automatiquement
2. IF le build local échoue, THEN THE Build System SHALL bloquer le commit et afficher les erreurs
3. WHEN le build local réussit, THE Build System SHALL permettre le commit et le push
4. THE Build System SHALL logger le temps de build et les warnings éventuels
5. THE Build System SHALL créer un rapport de build avec les métriques (temps, taille, warnings)

### Requirement 4

**User Story:** En tant que développeur, je veux un script automatisé pour nettoyer les layouts, afin de gagner du temps et éviter les erreurs manuelles

#### Acceptance Criteria

1. THE Build System SHALL fournir un script `scripts/cleanup-layouts.sh` exécutable
2. WHEN le script est lancé, THE Build System SHALL analyser, supprimer et valider les layouts en une seule commande
3. THE Build System SHALL afficher une barre de progression pendant l'exécution
4. AFTER exécution, THE Build System SHALL générer un rapport de nettoyage avec statistiques
5. THE Build System SHALL permettre un mode dry-run pour prévisualiser les changements sans les appliquer

### Requirement 5

**User Story:** En tant que développeur, je veux un hook Git pre-commit qui valide le build, afin de garantir que seul du code qui build est poussé

#### Acceptance Criteria

1. THE Build System SHALL installer un hook Git pre-commit automatiquement
2. WHEN un commit est tenté, THE Build System SHALL exécuter `npm run build` avant de valider
3. IF le build échoue avec des erreurs de layout, THEN THE Build System SHALL afficher les fichiers problématiques
4. THE Build System SHALL permettre de bypasser le hook avec `--no-verify` en cas d'urgence
5. THE Build System SHALL logger tous les builds pre-commit dans `.kiro/build-logs/`
