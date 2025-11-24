# Requirements Document

## Introduction

Cette spécification définit la refonte complète de l'interface utilisateur de Huntaze vers un style "Linear-like" (thème Midnight Violet) et l'optimisation des performances de démarrage. L'objectif est de remplacer l'interface actuelle par un design professionnel, cohérent et performant, tout en corrigeant les problèmes de proportions et de lenteur au démarrage sur l'environnement de staging.

## Glossary

- **Application Huntaze**: La plateforme web complète incluant le tableau de bord, les formulaires et toutes les pages de l'application
- **Thème Midnight Violet**: Palette de couleurs sombres inspirée de Linear avec accent violet (#7D57C1)
- **Dead Zone**: Espace vide latéral sur les grands écrans causé par l'absence de contraintes de largeur maximale
- **Cold Start**: Démarrage à froid du serveur causant une lenteur extrême au premier chargement
- **Skeleton Screen**: Écran squelette affichant la structure de la page pendant le chargement des données
- **Lazy Loading**: Chargement différé des composants lourds uniquement lorsqu'ils sont nécessaires
- **Design Token**: Variable de design réutilisable (couleurs, espacements, typographie)
- **Système de Grille 4px**: Système d'espacement où toutes les valeurs sont des multiples de 4 pixels

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur de l'application, je veux une interface avec un thème sombre professionnel cohérent, afin d'avoir une expérience visuelle moderne et confortable pour les yeux.

#### Acceptance Criteria

1. WHEN the application renders any page THEN the system SHALL apply the background color #0F0F10 (anthracite très sombre) as the main app background
2. WHEN the application renders cards or sidebars THEN the system SHALL apply the surface color #151516
3. WHEN the application renders borders THEN the system SHALL use the color #2E2E33 with a maximum width of 1px
4. WHEN the application renders primary action buttons THEN the system SHALL use the accent color #7D57C1 (violet haute visibilité)
5. WHEN the application renders primary text THEN the system SHALL use the color #EDEDEF (blanc cassé)
6. WHEN the application renders secondary text or metadata THEN the system SHALL use the color #8A8F98 (gris moyen)
7. THE application SHALL NOT use pure black (#000000) anywhere in the interface

### Requirement 2

**User Story:** En tant qu'utilisateur de l'application, je veux une typographie claire et lisible, afin de pouvoir lire confortablement le contenu sans fatigue oculaire.

#### Acceptance Criteria

1. WHEN the application renders any text THEN the system SHALL use the Inter font family (sans-serif)
2. WHEN the application renders titles or headings THEN the system SHALL use font-weight 500 (Medium)
3. WHEN the application renders body text THEN the system SHALL use font-weight 400 (Regular)
4. THE application SHALL NOT use font-weight 700 (Bold) or higher for any text elements

### Requirement 3

**User Story:** En tant qu'utilisateur de l'application, je veux des espacements cohérents et proportionnés, afin d'avoir une interface visuellement harmonieuse et professionnelle.

#### Acceptance Criteria

1. WHEN the application applies spacing (margins or padding) THEN the system SHALL use values that are multiples of 4 pixels (4px, 8px, 16px, 24px, etc.)
2. WHEN the application renders input fields THEN the system SHALL set their height to either 32px (dense) or 40px (standard)
3. WHEN the application renders buttons THEN the system SHALL set their height to either 32px (dense) or 40px (standard)
4. THE application SHALL NOT use spacing values that are not multiples of 4 pixels
5. THE application SHALL NOT render input fields or buttons with heights exceeding 40px

### Requirement 4

**User Story:** En tant qu'utilisateur sur un grand écran, je veux que le contenu soit centré avec des marges latérales appropriées, afin d'éviter une interface étirée et disproportionnée.

#### Acceptance Criteria

1. WHEN the application renders the main content container THEN the system SHALL apply a maximum width of 1200px or 1280px
2. WHEN the application renders the main content container THEN the system SHALL center it horizontally using automatic left and right margins
3. WHEN the application renders the main content container THEN the system SHALL apply an internal padding of 24px
4. WHEN the viewport width exceeds the maximum content width THEN the system SHALL display empty lateral spaces (dead zones) on both sides
5. THE application SHALL encapsulate all dashboard and form content within the centered container

### Requirement 5

**User Story:** En tant qu'utilisateur accédant à l'application sur staging, je veux un démarrage rapide sans attente excessive, afin de pouvoir commencer à utiliser l'application immédiatement.

#### Acceptance Criteria

1. WHEN the staging server is idle for more than 10 minutes THEN the system SHALL receive an automatic ping to prevent cold start
2. WHEN a user accesses the staging URL THEN the system SHALL respond within 3 seconds maximum
3. THE system SHALL implement an automated ping mechanism that calls the staging URL every 10 minutes
4. THE system SHALL use an external service or CRON task for the automated ping mechanism

### Requirement 6

**User Story:** En tant qu'utilisateur attendant le chargement d'une page, je veux voir immédiatement la structure de la page, afin de comprendre que l'application fonctionne et de réduire la perception d'attente.

#### Acceptance Criteria

1. WHEN the application loads data for a page THEN the system SHALL display skeleton screens showing the page structure
2. WHEN the application displays skeleton screens THEN the system SHALL use pulsating gray backgrounds to indicate loading
3. WHEN the application completes data loading THEN the system SHALL replace skeleton screens with actual content
4. THE application SHALL NOT display blank white screens or frozen states during data loading
5. THE skeleton screens SHALL match the layout structure of the final content

### Requirement 7

**User Story:** En tant qu'utilisateur de l'application, je veux que les composants lourds se chargent uniquement quand nécessaire, afin d'avoir un temps de chargement initial plus rapide.

#### Acceptance Criteria

1. WHEN the application identifies heavy components (charts, editors) THEN the system SHALL load them using dynamic imports
2. WHEN a heavy component is not immediately visible THEN the system SHALL defer its loading until needed
3. WHEN a heavy component becomes necessary THEN the system SHALL load it asynchronously without blocking the main thread
4. THE application SHALL identify and mark all components exceeding 50KB as candidates for lazy loading

### Requirement 8

**User Story:** En tant que développeur, je veux un système de design tokens centralisé, afin de maintenir la cohérence visuelle et faciliter les futures modifications de style.

#### Acceptance Criteria

1. WHEN the application defines colors THEN the system SHALL store them as CSS custom properties or design tokens
2. WHEN the application defines spacing values THEN the system SHALL store them as CSS custom properties or design tokens
3. WHEN the application defines typography settings THEN the system SHALL store them as CSS custom properties or design tokens
4. WHEN a component needs a design value THEN the system SHALL reference the design token instead of hardcoding the value
5. THE design tokens SHALL be defined in a single centralized location

### Requirement 9

**User Story:** En tant qu'utilisateur de l'application, je veux que tous les éléments interactifs respectent les standards d'accessibilité, afin de pouvoir utiliser l'application efficacement quel que soit mon mode d'interaction.

#### Acceptance Criteria

1. WHEN the application renders interactive elements THEN the system SHALL ensure a minimum contrast ratio of 4.5:1 for normal text
2. WHEN the application renders interactive elements THEN the system SHALL ensure a minimum contrast ratio of 3:1 for large text and UI components
3. WHEN a user navigates using keyboard THEN the system SHALL display visible focus indicators on all interactive elements
4. WHEN the application renders buttons or links THEN the system SHALL provide adequate touch target sizes (minimum 44x44px)

### Requirement 10

**User Story:** En tant que visiteur des pages marketing, je veux une expérience visuelle cohérente avec le nouveau design system, afin d'avoir une première impression professionnelle de la plateforme.

#### Acceptance Criteria

1. WHEN a user visits any marketing page (landing, about, pricing, features) THEN the system SHALL apply the Midnight Violet theme consistently
2. WHEN a user views marketing content THEN the system SHALL use the same design tokens as the application dashboard
3. WHEN a user navigates from marketing pages to the application THEN the system SHALL maintain visual continuity without jarring style changes
4. THE marketing pages SHALL use the same typography (Inter font family) and spacing system (4px grid) as the application
5. THE marketing pages SHALL implement the same max-width constraints (1200px-1280px) for content containers

### Requirement 11

**User Story:** En tant que développeur, je veux que le nouveau système de design soit appliqué progressivement, afin de minimiser les risques et permettre des tests incrémentaux.

#### Acceptance Criteria

1. WHEN implementing the new design system THEN the system SHALL allow coexistence of old and new styles during migration
2. WHEN a component is migrated to the new design THEN the system SHALL mark it as migrated in the codebase
3. WHEN the migration is complete THEN the system SHALL remove all legacy style definitions
4. THE migration SHALL prioritize high-visibility pages (dashboard, landing page, marketing pages) first
