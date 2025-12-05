# Requirements Document

## Introduction

Refonte complète du design du dashboard Huntaze (plateforme SaaS OnlyFans) pour atteindre un niveau de qualité professionnel comparable à Shopify Polaris. L'interface actuelle est perçue comme "buggée" et incohérente en raison d'un manque de système de design unifié, d'espacements arbitraires et d'éléments natifs non stylisés. L'objectif est de créer une interface minimaliste, cohérente et professionnelle qui inspire confiance et améliore la productivité des utilisateurs (créateurs et agences).

## Glossary

- **Design System**: Ensemble de règles, tokens et composants réutilisables garantissant la cohérence visuelle
- **Design Tokens**: Variables CSS centralisées pour couleurs, espacements, ombres et rayons
- **Grille 4px**: Système d'espacement où toutes les marges/paddings sont des multiples de 4 pixels
- **Empty State**: État visuel affiché quand une section ne contient pas de données
- **Skeleton Loader**: Placeholder animé affiché pendant le chargement des données
- **Power User**: Utilisateur professionnel (agence) gérant de gros volumes de données
- **LTV (Lifetime Value)**: Valeur totale générée par un fan sur sa durée de vie
- **PPV (Pay-Per-View)**: Contenu payant à l'unité
- **Dashboard**: Tableau de bord principal de l'application
- **IndexTable**: Composant de tableau de données avec tri et filtres
- **Badge**: Indicateur visuel de statut (VIP, Active, At-Risk)
- **Banner**: Composant d'alerte ou notification en haut de page

## Requirements

### Requirement 1: Système de Design Tokens

**User Story:** As a developer, I want a centralized design token system, so that all UI components share consistent spacing, colors, and styles.

#### Acceptance Criteria

1. WHEN the design system is implemented THEN the Dashboard SHALL use CSS custom properties for all spacing values based on a 4px grid (4px, 8px, 12px, 16px, 20px, 24px, 32px)
2. WHEN the design system is implemented THEN the Dashboard SHALL use CSS custom properties for all color values including surface, text, border, and action colors
3. WHEN the design system is implemented THEN the Dashboard SHALL use CSS custom properties for shadow values with consistent elevation levels
4. WHEN the design system is implemented THEN the Dashboard SHALL use CSS custom properties for border-radius values (4px, 8px, 12px)
5. WHEN a design token value is updated THEN all components using that token SHALL reflect the change automatically

### Requirement 2: Typographie Hiérarchisée

**User Story:** As a user, I want clear visual hierarchy in text, so that I can quickly scan and understand information.

#### Acceptance Criteria

1. WHEN displaying text content THEN the Dashboard SHALL use a typographic scale based on 12px, 14px, 16px, 20px, 24px, 28px sizes
2. WHEN displaying headings THEN the Dashboard SHALL use font-weight 600 (SemiBold) for titles and 400 (Regular) for body text
3. WHEN displaying numerical data in tables THEN the Dashboard SHALL use tabular-nums font-variant for proper alignment
4. WHEN displaying metadata THEN the Dashboard SHALL use a subdued color token (InkSubdued) to differentiate from primary content

### Requirement 3: Composants de Carte (Cards)

**User Story:** As a user, I want consistent card components, so that information is organized and easy to read.

#### Acceptance Criteria

1. WHEN displaying a card THEN the Dashboard SHALL apply consistent padding of 16px (--space-4) on all sides
2. WHEN displaying a card THEN the Dashboard SHALL apply a subtle shadow (--shadow-card) for elevation
3. WHEN displaying a card THEN the Dashboard SHALL apply border-radius of 8px (--radius-base)
4. WHEN a card contains actions THEN the Dashboard SHALL display them in a visually distinct footer section with subdued background
5. WHEN a card displays statistics THEN the Dashboard SHALL show the value prominently with a smaller label above

### Requirement 4: États Vides (Empty States)

**User Story:** As a new user, I want encouraging empty states, so that I understand what to do next instead of seeing zeros.

#### Acceptance Criteria

1. WHEN a statistics card has no data THEN the Dashboard SHALL display an illustration or skeleton placeholder instead of "0"
2. WHEN a statistics card has no data THEN the Dashboard SHALL display encouraging microcopy explaining the next action
3. WHEN a list or table has no data THEN the Dashboard SHALL display a centered empty state with icon, title, and call-to-action button
4. WHEN data is loading THEN the Dashboard SHALL display skeleton loaders matching the expected content structure

### Requirement 5: Bannières et Alertes

**User Story:** As a user, I want clear and actionable alerts, so that I understand important notifications and required actions.

#### Acceptance Criteria

1. WHEN displaying a connection banner THEN the Dashboard SHALL use semantic colors (Info blue, Warning yellow, Critical red) based on urgency
2. WHEN displaying a banner THEN the Dashboard SHALL include an icon on the left for visual anchoring
3. WHEN displaying a banner THEN the Dashboard SHALL include a clear call-to-action button
4. WHEN displaying a banner THEN the Dashboard SHALL meet WCAG contrast requirements between text and background

### Requirement 6: Tableau de Données (IndexTable)

**User Story:** As a power user, I want dense and scannable data tables, so that I can efficiently manage large volumes of fans.

#### Acceptance Criteria

1. WHEN displaying a data table THEN the Dashboard SHALL maintain uniform row heights by truncating long text with tooltips
2. WHEN displaying numerical columns THEN the Dashboard SHALL align values to the right for easy comparison
3. WHEN displaying status indicators THEN the Dashboard SHALL use standardized Badge components with consistent sizing (12px font, 4px radius)
4. WHEN displaying a data table THEN the Dashboard SHALL include a unified control bar with search and filters above the table
5. WHEN a table row is hovered THEN the Dashboard SHALL display a subtle background highlight for feedback

### Requirement 7: Liste de Conversations (Messages)

**User Story:** As an agency user, I want a compact conversation list, so that I can see more conversations without scrolling.

#### Acceptance Criteria

1. WHEN displaying the conversation list THEN the Dashboard SHALL use compact avatars (32px or 40px) to maximize density
2. WHEN displaying a conversation item THEN the Dashboard SHALL show name (14px SemiBold), message excerpt (13px Regular), and time (12px) with clear hierarchy
3. WHEN a conversation is unread THEN the Dashboard SHALL display a visible indicator (3px colored left border) instead of a subtle dot
4. WHEN displaying the conversation list THEN the Dashboard SHALL show 10-12 items without scrolling on standard viewport

### Requirement 8: Zone de Chat avec Contexte

**User Story:** As a creator, I want contextual fan information while chatting, so that I can personalize my responses based on their value.

#### Acceptance Criteria

1. WHEN a conversation is selected THEN the Dashboard SHALL display a contextual sidebar showing fan LTV, notes, and purchase history
2. WHEN composing a message THEN the Dashboard SHALL provide quick access to saved responses (canned responses)
3. WHEN composing a message THEN the Dashboard SHALL provide quick access to PPV media sending
4. WHEN displaying action buttons THEN the Dashboard SHALL ensure minimum 44px touch targets for accessibility

### Requirement 9: Grille de Contenu PPV

**User Story:** As a creator, I want an organized content grid, so that I can efficiently manage my PPV media library.

#### Acceptance Criteria

1. WHEN displaying content cards THEN the Dashboard SHALL use a responsive CSS Grid with consistent gap spacing (16px)
2. WHEN displaying media thumbnails THEN the Dashboard SHALL enforce a fixed aspect ratio (16:9 or 1:1) with object-fit: cover
3. WHEN displaying content card actions THEN the Dashboard SHALL distinguish primary action (solid button) from secondary action (outline or text link)
4. WHEN displaying content statistics THEN the Dashboard SHALL show labeled values with clear separators

### Requirement 10: Formulaires et Entrées

**User Story:** As a user, I want consistent form inputs, so that the interface feels polished and professional across all browsers.

#### Acceptance Criteria

1. WHEN displaying form inputs THEN the Dashboard SHALL apply custom styling that overrides browser defaults
2. WHEN an input receives focus THEN the Dashboard SHALL display a visible focus ring using the action-primary color token
3. WHEN displaying form inputs THEN the Dashboard SHALL ensure identical appearance across Chrome, Safari, and Firefox
4. WHEN displaying toggles THEN the Dashboard SHALL use custom-styled toggles matching the design system colors

### Requirement 11: Paramètres et Configuration

**User Story:** As a user, I want clear settings layout, so that I can easily find and toggle options.

#### Acceptance Criteria

1. WHEN displaying settings with toggles THEN the Dashboard SHALL place the toggle immediately adjacent to its label (respecting Gestalt proximity)
2. WHEN displaying settings lists THEN the Dashboard SHALL use visual separators (borders or zebra striping) to guide the eye
3. WHEN displaying account connection prompts THEN the Dashboard SHALL use compact Callout Card format with inline action button

### Requirement 12: États de Chargement

**User Story:** As a user, I want smooth loading experiences, so that the interface feels responsive and stable.

#### Acceptance Criteria

1. WHEN content is loading THEN the Dashboard SHALL display skeleton screens matching the expected layout structure
2. WHEN images are loading THEN the Dashboard SHALL reserve space using aspect-ratio to prevent layout shift
3. WHEN data is being fetched THEN the Dashboard SHALL maintain stable layout without content jumping (zero Cumulative Layout Shift)

### Requirement 13: Navigation Latérale

**User Story:** As a user, I want a clear and persistent navigation, so that I always know where I am and can quickly access other sections.

#### Acceptance Criteria

1. WHEN displaying the sidebar THEN the Dashboard SHALL show icons with text labels for each navigation item
2. WHEN a navigation item is active THEN the Dashboard SHALL display a clear visual indicator (background highlight or left border)
3. WHEN displaying the sidebar THEN the Dashboard SHALL limit first-level menu items to prevent overcrowding
4. WHEN on mobile viewport THEN the Dashboard SHALL collapse the sidebar into a hamburger menu

### Requirement 14: Serialization des Design Tokens

**User Story:** As a developer, I want design tokens to be serializable, so that they can be exported and imported for theming.

#### Acceptance Criteria

1. WHEN exporting design tokens THEN the System SHALL produce a valid JSON representation of all token values
2. WHEN importing design tokens from JSON THEN the System SHALL apply all values correctly to CSS custom properties
3. WHEN round-tripping tokens (export then import) THEN the System SHALL preserve all original values exactly
