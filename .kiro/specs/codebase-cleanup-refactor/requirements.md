# Requirements Document

## Introduction

Ce document définit les exigences pour le nettoyage et la réorganisation de la codebase Huntaze. Suite à l'achèvement de plusieurs projets majeurs (dashboard-home-analytics-fix, dashboard-routing-fix, performance-optimization-aws), le projet contient de nombreux fichiers obsolètes, doublons de styles CSS, et documentation redondante qui doivent être nettoyés pour maintenir une base de code saine et maintenable.

## Glossary

- **System**: La plateforme Huntaze (application Next.js 15)
- **Codebase**: L'ensemble des fichiers source du projet
- **CSS Duplication**: Fichiers CSS multiples définissant les mêmes styles ou propriétés
- **Obsolete Files**: Fichiers de backup, anciens fichiers de documentation, ou fichiers non utilisés
- **Spec Documentation**: Fichiers markdown dans .kiro/specs/ documentant les projets complétés
- **Tailwind**: Framework CSS utility-first utilisé comme système de design principal
- **Legacy Code**: Code ancien ou déprécié qui n'est plus utilisé

## Requirements

### Requirement 1: CSS File Consolidation

**User Story:** En tant que développeur, je veux un système CSS unifié et sans duplication, afin de maintenir une cohérence visuelle et réduire la taille du bundle.

#### Acceptance Criteria

1. WHEN the system loads CSS files THEN it SHALL use a single consolidated stylesheet per concern (mobile, animations, glass effects)
2. WHEN multiple CSS files define the same properties THEN the system SHALL merge them into a single authoritative file
3. WHEN CSS files contain Tailwind classes THEN the system SHALL remove inline CSS in favor of Tailwind utilities
4. WHEN mobile-specific styles exist THEN the system SHALL consolidate mobile.css, mobile-optimized.css, mobile-emergency-fix.css, and nuclear-mobile-fix.css into one file
5. WHEN the build process runs THEN the system SHALL not include unused CSS files

### Requirement 2: Obsolete File Removal

**User Story:** En tant que développeur, je veux supprimer tous les fichiers obsolètes et de backup, afin de réduire la confusion et améliorer la navigabilité du projet.

#### Acceptance Criteria

1. WHEN backup files exist (files ending in .backup, .bak, .old, -backup) THEN the system SHALL remove them from the codebase
2. WHEN duplicate page files exist (page-backup.tsx, page-old-generic.tsx) THEN the system SHALL keep only the active version
3. WHEN test or demo files exist in production directories THEN the system SHALL move them to appropriate test directories or remove them
4. WHEN shadow effect component duplicates exist THEN the system SHALL consolidate to a single implementation
5. WHEN auth client backup files exist THEN the system SHALL remove them after verifying the main implementation

### Requirement 3: Spec Documentation Cleanup

**User Story:** En tant que développeur, je veux une documentation de spec organisée et concise, afin de retrouver rapidement les informations importantes sans être submergé par des fichiers redondants.

#### Acceptance Criteria

1. WHEN a spec project is complete THEN the system SHALL consolidate all completion reports into a single FINAL-REPORT.md file
2. WHEN multiple task completion files exist (TASK-X-COMPLETE.md) THEN the system SHALL archive them in a /archive subdirectory
3. WHEN duplicate summary files exist (RÉSUMÉ-FINAL.md, PROJECT-COMPLETE.md, 🎉-PROJET-TERMINÉ.md) THEN the system SHALL keep only one canonical summary
4. WHEN deployment guides exist THEN the system SHALL consolidate them into a single DEPLOYMENT.md per spec
5. WHEN visual summaries and reports exist THEN the system SHALL keep only essential documentation in the root spec directory

### Requirement 4: Root Directory Documentation Consolidation

**User Story:** En tant que développeur, je veux un répertoire racine propre avec une documentation essentielle, afin de comprendre rapidement le projet sans être distrait par des fichiers obsolètes.

#### Acceptance Criteria

1. WHEN multiple deployment status files exist THEN the system SHALL consolidate them into a single DEPLOYMENT-STATUS.md
2. WHEN multiple "start here" files exist (COMMENCER-ICI.md, START_HERE.md, QUICK_START.md) THEN the system SHALL keep only one canonical getting started guide
3. WHEN AWS setup documentation is scattered THEN the system SHALL consolidate it into docs/aws/
4. WHEN CSRF fix documentation exists in multiple files THEN the system SHALL consolidate it into a single reference
5. WHEN French and English versions of the same document exist THEN the system SHALL keep both but organize them clearly

### Requirement 5: Component Organization

**User Story:** En tant que développeur, je veux des composants organisés logiquement par fonctionnalité, afin de trouver et maintenir facilement le code.

#### Acceptance Criteria

1. WHEN shadow effect components exist THEN the system SHALL consolidate them into components/effects/ with a single exported implementation
2. WHEN atomic background components exist THEN the system SHALL keep only the production-ready version
3. WHEN neon canvas components exist THEN the system SHALL consolidate OptimizedNeonCanvas.tsx and SimpleNeonCanvas.tsx
4. WHEN debug components exist in production directories THEN the system SHALL move them to a /debug subdirectory or remove them
5. WHEN component duplicates exist THEN the system SHALL perform a usage analysis before removal

### Requirement 6: Environment File Management

**User Story:** En tant que développeur, je veux des fichiers d'environnement clairement organisés, afin de configurer rapidement différents environnements sans confusion.

#### Acceptance Criteria

1. WHEN multiple .env files exist THEN the system SHALL document their purpose in a single ENV-GUIDE.md
2. WHEN .env backup files exist (.env.bak) THEN the system SHALL remove them after verification
3. WHEN example environment files exist THEN the system SHALL consolidate them into .env.example with comprehensive comments
4. WHEN environment-specific files exist (.env.production, .env.test) THEN the system SHALL keep them but document their usage
5. WHEN migration-specific env files exist THEN the system SHALL archive them after migration completion

### Requirement 7: Build and Configuration File Cleanup

**User Story:** En tant que développeur, je veux des fichiers de configuration propres et sans duplication, afin de maintenir facilement la configuration du projet.

#### Acceptance Criteria

1. WHEN multiple TypeScript config files exist THEN the system SHALL document their purpose and remove unused ones
2. WHEN duplicate build configuration exists THEN the system SHALL consolidate into canonical config files
3. WHEN test configuration files exist THEN the system SHALL organize them by test type (unit, integration, e2e)
4. WHEN lighthouse configuration exists in multiple places THEN the system SHALL keep only the active configuration
5. WHEN buildspec files exist THEN the system SHALL document their purpose and usage

### Requirement 8: Codebase Health Metrics

**User Story:** En tant que développeur, je veux des métriques sur la santé de la codebase, afin de mesurer l'impact du nettoyage et prévenir la régression.

#### Acceptance Criteria

1. WHEN the cleanup is complete THEN the system SHALL report the number of files removed
2. WHEN the cleanup is complete THEN the system SHALL report the reduction in total codebase size
3. WHEN the cleanup is complete THEN the system SHALL report the number of CSS duplications resolved
4. WHEN the cleanup is complete THEN the system SHALL verify that no broken imports exist
5. WHEN the cleanup is complete THEN the system SHALL verify that the build process succeeds
