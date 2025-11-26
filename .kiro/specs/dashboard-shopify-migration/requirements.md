# Requirements Document

## Introduction

This specification defines the comprehensive migration of the Huntaze dashboard from its legacy dark-mode interface to a modern, light-mode "App Shell" architecture inspired by Shopify's Online Store 2.0 (OS 2.0) paradigm. The transformation follows the philosophy of "Copier, S'inspirer, Sublimer" (Copy, Inspire, Sublimate)—leveraging Shopify's proven structural patterns while elevating the visual execution to resonate with the creator economy audience.

The migration encompasses a complete architectural overhaul including CSS Grid-based layout system, Electric Indigo brand identity implementation, gamified onboarding experience, and responsive mobile adaptation. The goal is to create a dashboard that functions with enterprise-grade reliability while feeling like a modern consumer application.

## Glossary

- **App Shell**: The invariant frame structure consisting of header, sidebar, and main content area that surrounds variable content
- **Electric Indigo**: The primary brand color (#6366f1) replacing legacy colors, associated with creativity and digital culture
- **Shopify 2.0 Structure**: The reference architecture featuring fixed sidebar, sticky header, and scrollable main content with clear visual hierarchy
- **Sublimation**: The process of taking a proven design pattern and elevating it with superior aesthetics and creator-focused enhancements
- **Gamified Onboarding**: An interactive dashboard section using psychological principles (Endowed Progress Effect) to encourage user engagement
- **Scroll Isolation**: The architectural pattern where navigation remains fixed while only the main content area scrolls
- **Duotone Icons**: Two-layer iconography using primary and secondary colors for visual richness
- **Soft Shadow Physics**: Diffused shadow system (0 4px 20px rgba(0,0,0,0.05)) replacing flat or hard-bordered elements
- **Gris très pâle**: The primary canvas color (#F8F9FB), a very pale gray providing warmth while maintaining high contrast
- **Holy Grail Layout**: A CSS Grid pattern with header, sidebar, main content defining the viewport structure

## Requirements

### Requirement 1: CSS Grid Layout Architecture

**User Story:** As a developer, I want a robust CSS Grid-based layout system, so that the dashboard structure is maintainable, responsive, and prevents layout thrashing.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL create a CSS Grid container consuming the full viewport (100vh x 100vw)
2. WHEN defining the grid structure THEN the system SHALL use named grid areas for semantic clarity ("header", "sidebar", "main")
3. WHEN setting grid dimensions THEN the system SHALL use CSS Custom Properties for all structural measurements (sidebar width, header height, z-index values)
4. WHEN the viewport is desktop size THEN the system SHALL define grid-template-columns as fixed sidebar width (256px) plus flexible content (1fr)
5. WHEN the viewport is desktop size THEN the system SHALL define grid-template-rows as fixed header height (64px) plus flexible content (1fr)

### Requirement 2: Fixed Sidebar Navigation

**User Story:** As a user, I want a permanently visible sidebar navigation, so that I can access all dashboard sections without scrolling or searching.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the system SHALL display a fixed sidebar spanning the full viewport height
2. WHEN the sidebar contains many menu items THEN the system SHALL enable internal vertical scrolling (overflow-y: auto) within the sidebar
3. WHEN a navigation item is active THEN the system SHALL display a 3px Electric Indigo left border marker and fade indigo background
4. WHEN a navigation item is inactive THEN the system SHALL display gray text with transparent background
5. WHEN hovering over navigation items THEN the system SHALL provide visual feedback with smooth transitions (0.15s ease)

### Requirement 3: Sticky Global Header

**User Story:** As a user, I want a persistent header with global search and user controls, so that critical navigation tools are always accessible.

#### Acceptance Criteria

1. WHEN viewing any dashboard page THEN the system SHALL display a sticky header spanning the full viewport width
2. WHEN the header renders THEN the system SHALL include logo (left), global search bar (center), and user menu (right)
3. WHEN the global search receives focus THEN the system SHALL expand the input with Electric Indigo glow effect (box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2))
4. WHEN the header is positioned THEN the system SHALL maintain z-index of 500 to stay above other content
5. WHEN scrolling the main content THEN the system SHALL keep the header fixed at the top of the viewport

### Requirement 4: Scroll Isolation for Main Content

**User Story:** As a user, I want the main content area to scroll independently, so that navigation remains accessible while viewing long content.

#### Acceptance Criteria

1. WHEN the main content area renders THEN the system SHALL apply overflow-y: auto to enable internal scrolling
2. WHEN scrolling main content THEN the system SHALL keep the sidebar and header fixed in position
3. WHEN the viewport height is exceeded THEN the system SHALL prevent the entire window from scrolling (overflow: hidden on layout container)
4. WHEN scrolling behavior is applied THEN the system SHALL use smooth scroll behavior for enhanced UX
5. WHEN the main content scrolls THEN the system SHALL maintain consistent performance without layout thrashing

### Requirement 5: Light Mode Color System

**User Story:** As a user, I want a light-mode interface with the Electric Indigo brand identity, so that the dashboard feels modern, clean, and aligned with creator aesthetics.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL use Gris très pâle (#F8F9FB) as the primary canvas background
2. WHEN rendering surface elements THEN the system SHALL use pure white (#FFFFFF) for cards and containers
3. WHEN displaying primary actions THEN the system SHALL use Electric Indigo (#6366f1) as the primary action color
4. WHEN rendering text THEN the system SHALL use deep gray (#1F2937) for main text and medium gray (#6B7280) for secondary text
5. WHEN applying shadows THEN the system SHALL use soft diffused shadows (0 4px 20px rgba(0, 0, 0, 0.05))

### Requirement 6: Duotone Icon System

**User Story:** As a user, I want visually rich duotone icons in the navigation, so that the interface feels polished and responds to my interactions.

#### Acceptance Criteria

1. WHEN rendering navigation icons THEN the system SHALL use two-layer SVG paths with primary and secondary colors
2. WHEN a navigation item is inactive THEN the system SHALL display icons in gray (#9CA3AF) for both layers
3. WHEN a navigation item is active THEN the system SHALL display icons in Electric Indigo (#6366f1) for both layers
4. WHEN hovering over navigation items THEN the system SHALL transition icon colors smoothly
5. WHEN implementing duotone icons THEN the system SHALL use CSS Custom Properties (--icon-primary, --icon-secondary) for dynamic color control

### Requirement 7: Gamified Onboarding Dashboard

**User Story:** As a new user, I want an engaging onboarding experience with clear action cards, so that I understand how to get started and feel motivated to complete setup.

#### Acceptance Criteria

1. WHEN a user views the dashboard THEN the system SHALL display a personalized greeting ("Bonjour [User], prêt à faire décoller ton audience?")
2. WHEN the onboarding section renders THEN the system SHALL display three distinct action cards in a responsive grid
3. WHEN displaying the "Connect Account" card THEN the system SHALL show blurred social platform logos and a clear call-to-action button
4. WHEN displaying the "Latest Stats" card for new users THEN the system SHALL show a potential growth visualization (SVG curve) instead of empty state
5. WHEN displaying the "Create Content" card THEN the system SHALL include a pulsing icon effect to draw attention

### Requirement 8: Card-Based Content Layout

**User Story:** As a user, I want content organized in well-spaced cards with soft shadows, so that information is easy to scan and the interface feels spacious.

#### Acceptance Criteria

1. WHEN rendering content cards THEN the system SHALL apply 16px border radius for modern rounded corners
2. WHEN spacing cards THEN the system SHALL use CSS Grid gap of 24px to ensure consistent spacing
3. WHEN styling cards THEN the system SHALL apply internal padding of at least 24px for breathing room
4. WHEN cards are interactive THEN the system SHALL lift on hover (translateY(-4px)) with deepened shadow
5. WHEN cards render THEN the system SHALL use white background (#FFFFFF) on the pale gray canvas (#F8F9FB)

### Requirement 9: Responsive Mobile Adaptation

**User Story:** As a mobile user, I want the dashboard to adapt to smaller screens with a collapsible sidebar, so that I can access all features on any device.

#### Acceptance Criteria

1. WHEN the viewport width is below 1024px THEN the system SHALL collapse the sidebar off-screen (translateX(-100%))
2. WHEN on mobile THEN the system SHALL display a hamburger menu icon in the header
3. WHEN the hamburger menu is clicked THEN the system SHALL slide the sidebar into view with smooth animation (0.3s cubic-bezier)
4. WHEN the mobile sidebar is open THEN the system SHALL display it at 80% viewport width with maximum 300px
5. WHEN the mobile sidebar opens THEN the system SHALL apply a shadow (10px 0 25px rgba(0,0,0,0.1)) for depth

### Requirement 10: Typography System

**User Story:** As a user, I want clear, readable typography with appropriate hierarchy, so that I can quickly scan and understand dashboard content.

#### Acceptance Criteria

1. WHEN rendering headings THEN the system SHALL use Poppins or Inter font with font-weight 600 and color #111827
2. WHEN rendering body text THEN the system SHALL use Inter or system font with color #1F2937
3. WHEN displaying the welcome title THEN the system SHALL use 24px font size with -0.5px letter spacing
4. WHEN rendering text THEN the system SHALL avoid pure black (#000000) in favor of deep gray for reduced eye strain
5. WHEN setting font sizes THEN the system SHALL maintain clear hierarchy (headings larger than body, labels smaller than body)

### Requirement 11: CSS Custom Properties System

**User Story:** As a developer, I want all design tokens defined as CSS Custom Properties, so that theming and maintenance are centralized and efficient.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL define all structural dimensions as CSS variables (--huntaze-sidebar-width, --huntaze-header-height)
2. WHEN defining colors THEN the system SHALL create CSS variables for all color tokens (--bg-app, --bg-surface, --color-indigo, --color-text-main, --color-text-sub)
3. WHEN defining shadows THEN the system SHALL create a CSS variable for the soft shadow system (--shadow-soft)
4. WHEN defining border radius THEN the system SHALL create a CSS variable for card radius (--radius-card)
5. WHEN defining z-index values THEN the system SHALL create CSS variables for stacking context (--huntaze-z-index-header, --huntaze-z-index-nav)

### Requirement 12: Global Search Functionality

**User Story:** As a user, I want a powerful global search in the header, so that I can quickly navigate to any section or data (e.g., "Type TikTok and find stats").

#### Acceptance Criteria

1. WHEN the header renders THEN the system SHALL display a prominent search input (400px width on desktop)
2. WHEN the search input is unfocused THEN the system SHALL display it with light gray background (#F3F4F6) and no border
3. WHEN the search input receives focus THEN the system SHALL change background to white and add Electric Indigo border
4. WHEN the search input is focused THEN the system SHALL apply a subtle shadow (0 4px 12px rgba(0,0,0,0.05))
5. WHEN the user types in search THEN the system SHALL provide real-time results for navigation items, stats, and content

### Requirement 13: Button and Action Styling

**User Story:** As a user, I want visually appealing buttons with gradients and clear states, so that I understand what actions are available and feel confident clicking them.

#### Acceptance Criteria

1. WHEN rendering primary buttons THEN the system SHALL apply an Electric Indigo gradient (linear-gradient(135deg, #6366f1 0%, #4f46e5 100%))
2. WHEN hovering over buttons THEN the system SHALL provide visual feedback with smooth transitions
3. WHEN buttons are in active state THEN the system SHALL provide clear visual indication
4. WHEN buttons are disabled THEN the system SHALL reduce opacity and prevent interaction
5. WHEN rendering secondary buttons THEN the system SHALL use outline style with Electric Indigo border

### Requirement 14: Legacy Code Migration

**User Story:** As a developer, I want a clear migration strategy from the legacy dark mode codebase, so that the transition is smooth and doesn't break existing functionality.

#### Acceptance Criteria

1. WHEN migrating THEN the system SHALL neutralize all legacy dark mode background colors
2. WHEN migrating THEN the system SHALL reset all hardcoded text colors to use new CSS variables
3. WHEN legacy components cannot be immediately refactored THEN the system SHALL wrap them in temporary containers with appropriate styling
4. WHEN spacing is updated THEN the system SHALL enforce minimum 24px gaps between content blocks
5. WHEN cards are updated THEN the system SHALL ensure minimum 24px internal padding

### Requirement 15: Performance and Accessibility

**User Story:** As a user, I want the dashboard to load quickly and be accessible, so that I can work efficiently regardless of my device or abilities.

#### Acceptance Criteria

1. WHEN the layout renders THEN the system SHALL avoid layout thrashing by using CSS Grid instead of position calculations
2. WHEN animations are applied THEN the system SHALL use CSS transforms and opacity for GPU acceleration
3. WHEN the sidebar scrolls THEN the system SHALL style scrollbars for aesthetic consistency (scrollbar-width: thin)
4. WHEN interactive elements are rendered THEN the system SHALL ensure sufficient color contrast for WCAG compliance
5. WHEN the application loads THEN the system SHALL maintain smooth 60fps performance during scrolling and interactions
