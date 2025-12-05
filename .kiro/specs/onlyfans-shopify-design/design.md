# Design Document: OnlyFans Shopify-Style Design

## Overview

Cette refonte transforme la page OnlyFans du dashboard Huntaze d'un thème sombre dense vers un design clair, épuré et moderne inspiré de Shopify Polaris. L'objectif est de créer une interface professionnelle avec beaucoup d'espace blanc, des cards bien définies et une hiérarchie visuelle claire.

## Architecture

### Approche de Design

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (Dark #1a1a1a)  │  CONTENT AREA (Light #f6f6f7)       │
│  ┌─────────────────────┐ │  ┌─────────────────────────────────┐ │
│  │ Logo               │ │  │ Page Header                     │ │
│  │ ─────────────────  │ │  │ Title + Actions                 │ │
│  │ Home               │ │  └─────────────────────────────────┘ │
│  │ OnlyFans (active)  │ │                                      │
│  │   Overview         │ │  ┌─────────────────────────────────┐ │
│  │   Messages         │ │  │ Connection Banner (if needed)   │ │
│  │   Fans             │ │  └─────────────────────────────────┘ │
│  │   PPV              │ │                                      │
│  │ Analytics          │ │  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ Marketing          │ │  │Stat│ │Stat│ │Stat│ │Stat│       │
│  │ Content            │ │  │Card│ │Card│ │Card│ │Card│       │
│  │ ─────────────────  │ │  └────┘ └────┘ └────┘ └────┘       │
│  │ Settings           │ │                                      │
│  └─────────────────────┘ │  ┌─────────────────────────────────┐ │
│                          │  │ Quick Actions Section           │ │
│                          │  │ ┌─────┐ ┌─────┐ ┌─────┐        │ │
│                          │  │ │ Act │ │ Act │ │ Act │        │ │
│                          │  │ └─────┘ └─────┘ └─────┘        │ │
│                          │  └─────────────────────────────────┘ │
│                          │                                      │
│                          │  ┌─────────────────────────────────┐ │
│                          │  │ Features Section                │ │
│                          │  │ ┌───────────┐ ┌───────────┐    │ │
│                          │  │ │ Feature   │ │ Feature   │    │ │
│                          │  │ └───────────┘ └───────────┘    │ │
│                          │  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Palette de Couleurs Shopify-Style

```css
/* Backgrounds */
--shopify-bg-page: #f6f6f7;        /* Page background */
--shopify-bg-card: #ffffff;         /* Card background */
--shopify-bg-sidebar: #1a1a1a;      /* Sidebar background */

/* Borders */
--shopify-border: #e1e3e5;          /* Card borders */
--shopify-border-dark: #d1d5db;     /* Darker borders */

/* Text */
--shopify-text-primary: #1a1a1a;    /* Primary text */
--shopify-text-secondary: #6b7177;  /* Secondary/label text */
--shopify-text-muted: #8c9196;      /* Muted text */

/* Shadows */
--shopify-shadow-card: 0 1px 3px rgba(0,0,0,0.08);
--shopify-shadow-hover: 0 2px 6px rgba(0,0,0,0.12);

/* Accents */
--shopify-accent-success: #008060;  /* Green */
--shopify-accent-warning: #b98900;  /* Amber */
--shopify-accent-error: #d72c0d;    /* Red */
--shopify-accent-info: #2c6ecb;     /* Blue */
```

## Components and Interfaces

### 1. ShopifyPageLayout

Container principal pour les pages avec fond clair.

```typescript
interface ShopifyPageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'; // default: 'lg' (1200px)
}
```

### 2. ShopifyCard

Card style Shopify avec fond blanc et ombre légère.

```typescript
interface ShopifyCardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg'; // default: 'md' (20px)
  className?: string;
}
```

### 3. ShopifyMetricCard

Card de métrique avec label et valeur.

```typescript
interface ShopifyMetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon?: React.ReactNode;
  iconColor?: string;
}
```

### 4. ShopifyBanner

Banner de notification style Shopify.

```typescript
interface ShopifyBannerProps {
  status: 'info' | 'warning' | 'success' | 'critical';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}
```

### 5. ShopifyQuickAction

Card d'action rapide cliquable.

```typescript
interface ShopifyQuickActionProps {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  description: string;
  href: string;
}
```

### 6. ShopifyFeatureCard

Card de navigation vers une feature.

```typescript
interface ShopifyFeatureCardProps {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  description: string;
  href: string;
}
```

### 7. ShopifySectionHeader

Header de section avec titre et actions optionnelles.

```typescript
interface ShopifySectionHeaderProps {
  title: string;
  actions?: React.ReactNode;
}
```

## Data Models

### OnlyFansPageData

```typescript
interface OnlyFansPageData {
  metrics: {
    messages: { total: number; unread: number; responseRate: number };
    fans: { total: number; active: number; newThisMonth: number };
    revenue: { total: number; sales: number; conversionRate: number };
    aiQuota: { used: number; limit: number; percentUsed: number };
  };
  connection: {
    isConnected: boolean;
    lastSync: Date | null;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Light Background Consistency
*For any* page using ShopifyPageLayout, the main content area background color SHALL be #f6f6f7 or equivalent light gray.
**Validates: Requirements 1.1**

### Property 2: Card White Background
*For any* ShopifyCard component, the background color SHALL be #ffffff (pure white).
**Validates: Requirements 2.1**

### Property 3: Card Shadow Presence
*For any* ShopifyCard component, a subtle box-shadow SHALL be applied.
**Validates: Requirements 2.2**

### Property 4: Card Border Radius
*For any* ShopifyCard component, the border-radius SHALL be 8px.
**Validates: Requirements 2.3**

### Property 5: Metric Label Styling
*For any* ShopifyMetricCard, the label text SHALL have font-size between 12-13px and color #6b7177.
**Validates: Requirements 3.1**

### Property 6: Metric Value Styling
*For any* ShopifyMetricCard, the value text SHALL have font-size between 24-28px, font-weight bold, and color #1a1a1a.
**Validates: Requirements 3.2**

### Property 7: Metric Grid Layout
*For any* metrics grid on desktop viewport, the layout SHALL be 4 columns with 16px gap.
**Validates: Requirements 3.4**

### Property 8: Sidebar Dark Background
*For any* sidebar component, the background color SHALL be dark (#1a1a1a or similar).
**Validates: Requirements 4.1**

### Property 9: Primary Text Contrast
*For any* primary text on light backgrounds, the color SHALL be #1a1a1a for maximum contrast.
**Validates: Requirements 5.1**

### Property 10: Primary Button Styling
*For any* primary action button, the background SHALL be solid dark with white text.
**Validates: Requirements 6.1**

### Property 11: Banner Status Colors
*For any* ShopifyBanner with status 'warning', the background SHALL be light amber/yellow.
**Validates: Requirements 7.1**

### Property 12: Quick Action Structure
*For any* ShopifyQuickAction, the component SHALL contain icon, title, and description elements.
**Validates: Requirements 8.1**

### Property 13: Quick Action Grid
*For any* quick actions section on desktop, the layout SHALL be 3 columns.
**Validates: Requirements 8.2**

### Property 14: Section Header Spacing
*For any* ShopifySectionHeader, the margin-top SHALL be at least 24px and margin-bottom at least 16px.
**Validates: Requirements 9.2**

### Property 15: Feature Card Navigation Indicator
*For any* ShopifyFeatureCard, a chevron or arrow icon SHALL be present indicating navigation.
**Validates: Requirements 10.4**

## Error Handling

- Si les données ne chargent pas, afficher des skeleton loaders style Shopify
- Si la connexion OnlyFans échoue, afficher le banner de connexion avec message d'erreur
- Si les métriques sont à zéro, afficher les valeurs avec style normal (pas d'empty state spécial pour les stats)

## Testing Strategy

### Property-Based Testing

Utiliser `fast-check` pour les tests de propriétés:

1. **Styling Properties**: Vérifier que les composants appliquent les bons styles CSS
2. **Structure Properties**: Vérifier que les composants contiennent les éléments requis
3. **Layout Properties**: Vérifier les grids et espacements

### Unit Tests

- Tester le rendu des composants avec différentes props
- Tester les états de chargement et d'erreur
- Tester la responsivité des grids

### Configuration

```typescript
// vitest.config.ts
export default {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
};
```

Chaque test de propriété doit exécuter minimum 100 itérations et être annoté avec le format:
`**Feature: onlyfans-shopify-design, Property {number}: {property_text}**`
