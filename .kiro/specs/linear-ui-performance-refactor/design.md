# Design Document - Linear UI & Performance Refactor

## Overview

Cette refonte transforme l'interface utilisateur de Huntaze vers un design professionnel inspiré de Linear (thème Midnight Violet) tout en résolvant les problèmes critiques de performance et de proportions. Le design s'articule autour de trois piliers:

1. **Design System Cohérent**: Palette de couleurs sombre professionnelle, typographie Inter, système de grille 4px
2. **Architecture de Mise en Page**: Conteneurs centrés avec max-width pour éliminer les "dead zones"
3. **Optimisation Performance**: Skeleton screens, lazy loading, et prévention des cold starts

L'approche privilégie une migration progressive permettant la coexistence temporaire des anciens et nouveaux styles, avec priorité sur les pages à haute visibilité (dashboard, landing, marketing).

## Architecture

### Design Token System

Le système de design tokens centralise toutes les valeurs de design dans des CSS custom properties, permettant une maintenance facile et une cohérence garantie.

```
Design Tokens Layer
├── Colors (Midnight Violet palette)
├── Typography (Inter font system)
├── Spacing (4px grid system)
└── Component Tokens (button heights, border widths)
     ↓
Global CSS Variables
     ↓
Component Styles (référencent les tokens)
```

### Layout Architecture

```
Viewport (100vw)
└── App Container
    └── Centered Content Container (max-width: 1200px-1280px)
        ├── Header
        ├── Main Content
        │   ├── Dashboard
        │   ├── Forms
        │   └── Marketing Pages
        └── Footer
```

Les marges latérales (dead zones) sont créées automatiquement sur les grands écrans via `margin: 0 auto`.

### Performance Architecture

```
Initial Load
├── Critical CSS (inline)
├── Skeleton Screens (immediate display)
└── Async Loading
    ├── Heavy Components (lazy loaded)
    ├── Non-critical CSS
    └── Analytics/Tracking

Cold Start Prevention
└── External Ping Service (every 10 min)
    └── Staging URL
```

## Components and Interfaces

### 1. Design Token Configuration

**Interface: DesignTokens**
```typescript
interface DesignTokens {
  colors: {
    background: {
      app: string;      // #0F0F10
      surface: string;  // #151516
    };
    border: {
      subtle: string;   // #2E2E33
    };
    accent: {
      primary: string;  // #7D57C1
    };
    text: {
      primary: string;   // #EDEDEF
      secondary: string; // #8A8F98
    };
  };
  typography: {
    fontFamily: string; // 'Inter', sans-serif
    weights: {
      regular: number;  // 400
      medium: number;   // 500
    };
  };
  spacing: {
    unit: number;       // 4px base unit
    scale: number[];    // [4, 8, 16, 24, 32, 40, 48, 64]
  };
  components: {
    input: {
      heightDense: number;    // 32px
      heightStandard: number; // 40px
    };
    button: {
      heightDense: number;    // 32px
      heightStandard: number; // 40px
    };
    border: {
      maxWidth: number;       // 1px
    };
  };
}
```

### 2. Layout Container Component

**Component: CenteredContainer**
```typescript
interface CenteredContainerProps {
  maxWidth?: '1200px' | '1280px';
  padding?: number; // multiples of 4
  children: React.ReactNode;
}

// Applique max-width, centrage horizontal, et padding interne
```

### 3. Skeleton Screen Components

**Component: SkeletonScreen**
```typescript
interface SkeletonScreenProps {
  variant: 'dashboard' | 'form' | 'card' | 'list';
  count?: number;
  animate?: boolean; // pulsating effect
}

// Affiche la structure de la page pendant le chargement
```

### 4. Lazy Loading Wrapper

**Component: LazyComponent**
```typescript
interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType }>;
  fallback?: React.ReactNode;
  threshold?: number; // KB size threshold for lazy loading
}

// Charge dynamiquement les composants lourds (>50KB)
```

### 5. Cold Start Prevention Service

**Service: PingService**
```typescript
interface PingServiceConfig {
  url: string;           // staging URL
  interval: number;      // 10 minutes (600000ms)
  method: 'GET' | 'HEAD';
  timeout: number;       // request timeout
}

// Service externe ou CRON qui ping l'URL régulièrement
```

## Data Models

### Design Token Storage

Les design tokens sont stockés dans un fichier CSS centralisé:

```css
:root {
  /* Colors - Midnight Violet Theme */
  --color-bg-app: #0F0F10;
  --color-bg-surface: #151516;
  --color-border-subtle: #2E2E33;
  --color-accent-primary: #7D57C1;
  --color-text-primary: #EDEDEF;
  --color-text-secondary: #8A8F98;
  
  /* Typography */
  --font-family-base: 'Inter', sans-serif;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  
  /* Spacing - 4px Grid System */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  
  /* Components */
  --input-height-dense: 32px;
  --input-height-standard: 40px;
  --button-height-dense: 32px;
  --button-height-standard: 40px;
  --border-width-max: 1px;
  
  /* Layout */
  --content-max-width: 1280px;
  --content-padding: 24px;
}
```

### Migration Tracking

Pour suivre la progression de la migration:

```typescript
interface MigrationStatus {
  componentPath: string;
  status: 'legacy' | 'migrated' | 'in-progress';
  migratedDate?: Date;
  priority: 'high' | 'medium' | 'low';
}

// Stocké dans un fichier JSON ou base de données
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Color System Properties

**Property 1: App background color consistency**
*For any* page in the application, the main app background color should be #0F0F10
**Validates: Requirements 1.1**

**Property 2: Surface color consistency**
*For any* card or sidebar element, the background color should be #151516
**Validates: Requirements 1.2**

**Property 3: Border styling constraints**
*For any* element with a border, the border color should be #2E2E33 and the border width should not exceed 1px
**Validates: Requirements 1.3**

**Property 4: Primary action button color**
*For any* primary action button, the background or accent color should be #7D57C1
**Validates: Requirements 1.4**

**Property 5: Text color hierarchy**
*For any* text element, if it is primary text then its color should be #EDEDEF, and if it is secondary text then its color should be #8A8F98
**Validates: Requirements 1.5, 1.6**

**Property 6: Pure black prohibition**
*For any* element in the interface, the computed color values should never be #000000 (pure black)
**Validates: Requirements 1.7**

### Typography Properties

**Property 7: Font family consistency**
*For any* text element in the application, the computed font-family should include 'Inter' or fall back to sans-serif
**Validates: Requirements 2.1**

**Property 8: Heading font weight**
*For any* heading or title element (h1-h6), the font-weight should be 500 (Medium)
**Validates: Requirements 2.2**

**Property 9: Body text font weight**
*For any* body text element (p, span, div with text), the font-weight should be 400 (Regular)
**Validates: Requirements 2.3**

**Property 10: Bold font prohibition**
*For any* text element in the application, the font-weight should not be 700 or higher
**Validates: Requirements 2.4**

### Spacing System Properties

**Property 11: 4px grid system compliance**
*For any* element with margin or padding, all margin and padding values should be multiples of 4 pixels
**Validates: Requirements 3.1**

**Property 12: Input field height constraints**
*For any* input field element, the height should be either 32px or 40px
**Validates: Requirements 3.2**

**Property 13: Button height constraints**
*For any* button element, the height should be either 32px or 40px
**Validates: Requirements 3.3**

### Layout Properties

**Property 14: Content container max-width**
*For any* main content container, the max-width should be either 1200px or 1280px
**Validates: Requirements 4.1**

**Property 15: Content container centering**
*For any* main content container, it should have automatic left and right margins (margin-left: auto and margin-right: auto) to achieve horizontal centering
**Validates: Requirements 4.2**

**Property 16: Content container padding**
*For any* main content container, the internal padding should be 24px
**Validates: Requirements 4.3**

**Property 17: Content encapsulation**
*For any* dashboard or form content, it should be a descendant of the centered content container in the DOM tree
**Validates: Requirements 4.5**

### Performance Properties

**Property 18: Skeleton screen display during loading**
*For any* page with loading state, skeleton screen components should be rendered while data is being fetched
**Validates: Requirements 6.1**

**Property 19: Skeleton screen animation**
*For any* skeleton screen component, it should have a pulsating animation applied via CSS
**Validates: Requirements 6.2**

**Property 20: Skeleton to content transition**
*For any* page that completes loading, skeleton screens should be removed from the DOM and replaced with actual content
**Validates: Requirements 6.3**

**Property 21: Lazy loading for invisible components**
*For any* heavy component that is not immediately visible in the viewport, it should not be loaded until it becomes necessary
**Validates: Requirements 7.2**

**Property 22: Asynchronous component loading**
*For any* heavy component being loaded, the loading should be asynchronous and not block the main JavaScript thread
**Validates: Requirements 7.3**

### Design Token Properties

**Property 23: Design token usage over hardcoded values**
*For any* component style that references a color, spacing, or typography value, it should use a CSS custom property (design token) rather than a hardcoded value
**Validates: Requirements 8.4**

### Accessibility Properties

**Property 24: Normal text contrast ratio**
*For any* normal text element, the contrast ratio between text color and background color should be at least 4.5:1
**Validates: Requirements 9.1**

**Property 25: Large text and UI component contrast ratio**
*For any* large text element or UI component, the contrast ratio between foreground and background should be at least 3:1
**Validates: Requirements 9.2**

**Property 26: Focus indicator visibility**
*For any* interactive element (button, link, input), it should have a visible focus style defined in CSS with sufficient contrast
**Validates: Requirements 9.3**

**Property 27: Touch target size adequacy**
*For any* button or link element, the computed width and height should each be at least 44px
**Validates: Requirements 9.4**

### Marketing Consistency Properties

**Property 28: Marketing page theme consistency**
*For any* marketing page (landing, about, pricing, features), the applied colors should match the Midnight Violet theme (using the same color values as the application)
**Validates: Requirements 10.1**

**Property 29: Marketing and app design token consistency**
*For any* design token (color, spacing, typography), if it is defined for the application, then marketing pages should reference the same token
**Validates: Requirements 10.2**

**Property 30: Marketing page layout constraints**
*For any* marketing page content container, it should have the same max-width constraints (1200px or 1280px) as the application content containers
**Validates: Requirements 10.5**

## Error Handling

### Design Token Fallbacks

Si un design token n'est pas disponible (navigateur ancien, CSS non chargé), le système doit fournir des fallbacks:

```css
.component {
  /* Fallback puis token */
  background-color: #0F0F10;
  background-color: var(--color-bg-app, #0F0F10);
}
```

### Lazy Loading Errors

Si un composant lazy-loaded échoue à charger:

1. **Retry Logic**: Tenter de recharger 2 fois avec délai exponentiel
2. **Fallback UI**: Afficher un message d'erreur gracieux
3. **Error Boundary**: Capturer l'erreur sans crasher l'application

```typescript
const LazyComponent = lazy(() => 
  import('./HeavyComponent')
    .catch(() => {
      // Retry logic
      return import('./HeavyComponent');
    })
    .catch(() => {
      // Fallback to error component
      return { default: ErrorFallback };
    })
);
```

### Skeleton Screen Timeout

Si les données ne se chargent pas après un délai raisonnable (30 secondes):

1. **Timeout Detection**: Détecter le timeout
2. **Error State**: Passer à un état d'erreur
3. **Retry Option**: Offrir à l'utilisateur de réessayer

### Cold Start Ping Failures

Si le service de ping échoue:

1. **Monitoring**: Logger les échecs de ping
2. **Alerting**: Alerter l'équipe après 3 échecs consécutifs
3. **Fallback**: Le serveur peut toujours démarrer, juste plus lentement

### Accessibility Violations

Si un élément ne respecte pas les ratios de contraste:

1. **Development Warnings**: Afficher des warnings en développement
2. **Automated Testing**: Bloquer le déploiement si violations critiques
3. **Fallback Colors**: Utiliser des couleurs de secours avec contraste suffisant

## Testing Strategy

### Unit Testing

Les tests unitaires couvriront:

1. **Design Token Parsing**: Vérifier que les tokens CSS sont correctement parsés
2. **Component Rendering**: Vérifier que les composants utilisent les bons tokens
3. **Layout Calculations**: Vérifier les calculs de max-width et centrage
4. **Skeleton Components**: Vérifier le rendu des skeletons
5. **Lazy Loading Wrappers**: Vérifier la logique de lazy loading

### Property-Based Testing

Nous utiliserons **fast-check** (pour TypeScript/JavaScript) comme bibliothèque de property-based testing. Chaque test de propriété sera configuré pour exécuter un minimum de 100 itérations.

Les tests de propriétés couvriront:

1. **Color Validation Properties** (Properties 1-6): Générer des composants aléatoires et vérifier que les couleurs respectent la palette Midnight Violet
2. **Typography Properties** (Properties 7-10): Générer du texte aléatoire et vérifier les font-family et font-weights
3. **Spacing Properties** (Properties 11-13): Générer des valeurs d'espacement aléatoires et vérifier qu'elles sont des multiples de 4px
4. **Layout Properties** (Properties 14-17): Vérifier les contraintes de layout sur différentes tailles de viewport
5. **Accessibility Properties** (Properties 24-27): Générer des combinaisons de couleurs aléatoires et vérifier les ratios de contraste

Chaque test de propriété sera tagué avec un commentaire explicite référençant la propriété du document de design:

```typescript
// Feature: linear-ui-performance-refactor, Property 1: App background color consistency
test('app background color is always #0F0F10', () => {
  fc.assert(
    fc.property(fc.pageComponent(), (page) => {
      const bgColor = getComputedBackgroundColor(page);
      return bgColor === '#0F0F10';
    }),
    { numRuns: 100 }
  );
});
```

### Visual Regression Testing

Pour les aspects visuels qui ne peuvent pas être testés par propriétés:

1. **Screenshot Comparison**: Comparer les screenshots avant/après migration
2. **Percy/Chromatic**: Utiliser des outils de visual regression
3. **Manual QA**: Revue manuelle des pages clés

### Performance Testing

Pour valider les optimisations de performance:

1. **Lighthouse CI**: Scores de performance automatisés
2. **Cold Start Monitoring**: Mesurer les temps de réponse sur staging
3. **Bundle Size Tracking**: Vérifier que le lazy loading réduit le bundle initial
4. **Loading State Duration**: Mesurer combien de temps les skeletons sont visibles

### Integration Testing

Pour valider l'intégration complète:

1. **End-to-End Tests**: Parcours utilisateur complets avec Playwright
2. **Cross-Browser Testing**: Vérifier sur Chrome, Firefox, Safari
3. **Responsive Testing**: Vérifier sur différentes tailles d'écran
4. **Accessibility Audits**: Utiliser axe-core pour détecter les violations WCAG

### Migration Testing

Pour valider la migration progressive:

1. **Coexistence Tests**: Vérifier que anciens et nouveaux styles coexistent sans conflits
2. **Feature Flags**: Tester l'activation/désactivation du nouveau design
3. **Rollback Tests**: Vérifier que le rollback fonctionne si nécessaire
