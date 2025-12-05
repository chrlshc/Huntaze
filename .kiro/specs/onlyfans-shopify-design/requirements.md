# Requirements Document

## Introduction

Refonte du design de la section OnlyFans du dashboard Huntaze pour adopter un style visuel inspiré de Shopify Polaris. L'interface actuelle utilise un thème sombre dense qui paraît "moche" et peu professionnel. L'objectif est de créer une interface claire, épurée, moderne avec beaucoup d'espace blanc, des cards bien espacées et une hiérarchie visuelle claire - exactement comme le dashboard Shopify.

## Glossary

- **Shopify Polaris**: Design system de Shopify caractérisé par un fond blanc, des cards avec ombres légères, beaucoup d'espace blanc
- **Light Theme**: Thème clair avec fond blanc/gris clair comme couleur principale
- **Whitespace**: Espace vide intentionnel entre les éléments pour améliorer la lisibilité
- **Card Elevation**: Effet d'ombre subtil donnant l'impression que la card flotte au-dessus du fond
- **Sidebar**: Navigation latérale avec fond sombre contrastant avec le contenu clair
- **Content Area**: Zone principale de contenu avec fond clair
- **Metric Card**: Card affichant une statistique clé avec label et valeur
- **Quick Action**: Bouton d'action rapide avec icône et description

## Requirements

### Requirement 1: Fond Clair et Espace Blanc

**User Story:** As a user, I want a clean light interface with plenty of whitespace, so that the dashboard feels modern and professional like Shopify.

#### Acceptance Criteria

1. WHEN displaying the OnlyFans dashboard THEN the System SHALL use a light gray background (#f6f6f7 or similar) for the main content area
2. WHEN displaying cards THEN the System SHALL use a pure white background (#ffffff) with subtle shadow for elevation
3. WHEN displaying content sections THEN the System SHALL maintain minimum 24px spacing between major sections
4. WHEN displaying the page THEN the System SHALL use maximum 1200px content width with centered alignment

### Requirement 2: Cards Style Shopify

**User Story:** As a user, I want cards that look like Shopify's cards, so that the interface feels premium and trustworthy.

#### Acceptance Criteria

1. WHEN displaying a card THEN the System SHALL apply white background with 1px light gray border (#e1e3e5)
2. WHEN displaying a card THEN the System SHALL apply subtle shadow (0 1px 3px rgba(0,0,0,0.08))
3. WHEN displaying a card THEN the System SHALL apply 8px border-radius
4. WHEN displaying a card THEN the System SHALL apply 20px internal padding
5. WHEN hovering a card THEN the System SHALL NOT change the card appearance (no hover effects on static cards)

### Requirement 3: Metric Cards Épurées

**User Story:** As a user, I want clean metric cards showing key stats, so that I can quickly understand my performance.

#### Acceptance Criteria

1. WHEN displaying a metric card THEN the System SHALL show the metric label in small gray text (12-13px, #6b7177)
2. WHEN displaying a metric card THEN the System SHALL show the metric value in large bold text (24-28px, #1a1a1a)
3. WHEN displaying a metric card THEN the System SHALL show optional trend indicator with green/red color
4. WHEN displaying metric cards THEN the System SHALL arrange them in a 4-column grid on desktop with 16px gap

### Requirement 4: Sidebar Sombre Contrastée

**User Story:** As a user, I want a dark sidebar contrasting with light content, so that navigation is clearly separated from content.

#### Acceptance Criteria

1. WHEN displaying the sidebar THEN the System SHALL use dark background (#1a1a1a or similar) contrasting with light content
2. WHEN displaying sidebar items THEN the System SHALL use white/light gray text for readability
3. WHEN a sidebar item is active THEN the System SHALL display a light background highlight or left border indicator
4. WHEN displaying the sidebar THEN the System SHALL maintain consistent width (240-260px)

### Requirement 5: Typographie Claire

**User Story:** As a user, I want clear readable typography, so that I can easily scan and understand information.

#### Acceptance Criteria

1. WHEN displaying text THEN the System SHALL use dark text (#1a1a1a) on light backgrounds for maximum contrast
2. WHEN displaying secondary text THEN the System SHALL use medium gray (#6b7177) for labels and metadata
3. WHEN displaying headings THEN the System SHALL use font-weight 600 with appropriate size hierarchy (20px, 16px, 14px)
4. WHEN displaying body text THEN the System SHALL use 14px base size with 1.5 line-height

### Requirement 6: Boutons et Actions

**User Story:** As a user, I want clear action buttons, so that I know what I can do on each page.

#### Acceptance Criteria

1. WHEN displaying primary action THEN the System SHALL use solid dark button (#1a1a1a or brand color) with white text
2. WHEN displaying secondary action THEN the System SHALL use outlined button with dark border and text
3. WHEN displaying action buttons THEN the System SHALL apply 8px border-radius matching cards
4. WHEN displaying action buttons THEN the System SHALL apply consistent padding (12px 16px)

### Requirement 7: Connection Banner Shopify-Style

**User Story:** As a user, I want a clean connection status banner, so that I understand my account status at a glance.

#### Acceptance Criteria

1. WHEN OnlyFans is not connected THEN the System SHALL display a light yellow/amber banner with icon and action button
2. WHEN OnlyFans is connected THEN the System SHALL display a subtle success indicator or hide the banner
3. WHEN displaying the banner THEN the System SHALL use rounded corners (8px) and appropriate padding (16px)
4. WHEN displaying the banner THEN the System SHALL include a clear "Connect Account" button

### Requirement 8: Quick Actions Grid

**User Story:** As a user, I want quick action cards, so that I can access common tasks easily.

#### Acceptance Criteria

1. WHEN displaying quick actions THEN the System SHALL show them as clickable cards with icon, title, and description
2. WHEN displaying quick actions THEN the System SHALL arrange them in a 3-column grid on desktop
3. WHEN hovering a quick action THEN the System SHALL display subtle hover effect (slight shadow increase or border color change)
4. WHEN displaying quick action icons THEN the System SHALL use consistent 24px size with brand or semantic colors

### Requirement 9: Section Headers

**User Story:** As a user, I want clear section headers, so that I understand the organization of the page.

#### Acceptance Criteria

1. WHEN displaying a section THEN the System SHALL include a clear header with title (16-18px, semibold)
2. WHEN displaying a section header THEN the System SHALL maintain 24px spacing above and 16px below
3. WHEN a section has actions THEN the System SHALL display them aligned to the right of the header

### Requirement 10: Feature Navigation Cards

**User Story:** As a user, I want feature navigation cards, so that I can access sub-pages easily.

#### Acceptance Criteria

1. WHEN displaying feature navigation THEN the System SHALL show cards with icon, title, and description
2. WHEN displaying feature navigation THEN the System SHALL arrange them in a 2-column grid
3. WHEN hovering a feature card THEN the System SHALL display subtle hover effect
4. WHEN displaying feature cards THEN the System SHALL include a chevron or arrow indicating navigation

