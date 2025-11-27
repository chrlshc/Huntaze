# Guide d'Utilisation: Navigation Infrastructure

## Vue d'Ensemble

Ce guide explique comment utiliser les nouveaux composants de navigation créés dans la Phase 1.

## Hook: useNavigationContext

### Import

```typescript
import { useNavigationContext } from '@/hooks/useNavigationContext';
```

### Usage de Base

```typescript
function MyPage() {
  const { 
    currentSection,      // Section actuelle (ex: 'analytics')
    currentSubSection,   // Sub-section actuelle (ex: 'pricing')
    breadcrumbs,         // Array de breadcrumb items
    subNavItems,         // Array de sub-nav items (si applicable)
    showSubNav          // Boolean: afficher sub-nav?
  } = useNavigationContext();
  
  return (
    <div>
      {/* Votre contenu */}
    </div>
  );
}
```

### Exemple Complet

```typescript
'use client';

import { useNavigationContext } from '@/hooks/useNavigationContext';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { SubNavigation } from '@/components/dashboard/SubNavigation';

export default function AnalyticsPage() {
  const { breadcrumbs, subNavItems, showSubNav } = useNavigationContext();
  
  return (
    <div className="page-container">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} />
      
      {/* Sub-Navigation (si applicable) */}
      {showSubNav && subNavItems && (
        <SubNavigation items={subNavItems} />
      )}
      
      {/* Contenu de la page */}
      <main>
        <h1>Analytics</h1>
        {/* ... */}
      </main>
    </div>
  );
}
```

## Composant: Breadcrumbs

### Import

```typescript
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
```

### Props

```typescript
interface BreadcrumbsProps {
  items: BreadcrumbItem[];  // Array de breadcrumb items
  className?: string;       // Classes CSS optionnelles
}

interface BreadcrumbItem {
  label: string;   // Texte à afficher
  href?: string;   // Lien (undefined pour page actuelle)
}
```

### Usage

```typescript
// Avec le hook
const { breadcrumbs } = useNavigationContext();
<Breadcrumbs items={breadcrumbs} />

// Manuellement
<Breadcrumbs 
  items={[
    { label: 'Home', href: '/home' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Pricing' }  // Page actuelle (pas de href)
  ]}
/>

// Avec classes custom
<Breadcrumbs 
  items={breadcrumbs} 
  className="my-custom-class"
/>
```

### Styling

Le composant utilise les classes CSS suivantes (définies dans `styles/navigation.css`):

- `.breadcrumbs` - Container principal
- `.breadcrumbs-list` - Liste des breadcrumbs
- `.breadcrumb-item` - Item individuel
- `.breadcrumb-link` - Lien cliquable
- `.breadcrumb-current` - Page actuelle
- `.breadcrumb-separator` - Séparateur chevron

## Composant: SubNavigation

### Import

```typescript
import { SubNavigation } from '@/components/dashboard/SubNavigation';
```

### Props

```typescript
interface SubNavigationProps {
  items: SubNavItem[];  // Array de sub-nav items
  className?: string;   // Classes CSS optionnelles
}

interface SubNavItem {
  label: string;    // Texte à afficher
  href: string;     // Lien de destination
  icon?: string;    // Icône optionnelle
  badge?: number;   // Badge de notification optionnel
}
```

### Usage

```typescript
// Avec le hook
const { subNavItems, showSubNav } = useNavigationContext();
{showSubNav && subNavItems && (
  <SubNavigation items={subNavItems} />
)}

// Manuellement
<SubNavigation 
  items={[
    { label: 'Overview', href: '/analytics' },
    { label: 'Pricing', href: '/analytics/pricing' },
    { label: 'Churn', href: '/analytics/churn', badge: 3 },
  ]}
/>
```

### Styling

Le composant utilise les classes CSS suivantes:

- `.sub-navigation` - Container principal
- `.sub-nav-container` - Container scrollable
- `.sub-nav-scroll` - Wrapper flex
- `.sub-nav-item` - Item individuel
- `.sub-nav-item.active` - Item actif
- `.sub-nav-icon` - Icône
- `.sub-nav-label` - Label
- `.sub-nav-badge` - Badge de notification

## Configuration des Sections

### Ajouter une Nouvelle Section

Pour ajouter une nouvelle section avec sub-navigation:

1. Ouvrir `hooks/useNavigationContext.ts`
2. Ajouter dans `SECTION_CONFIG`:

```typescript
'ma-section': {
  label: 'Ma Section',
  hasSubNav: true,
  subPages: [
    { path: '', label: 'Overview', icon: 'home' },
    { path: 'sub-page-1', label: 'Sub Page 1', icon: 'icon-name' },
    { path: 'sub-page-2', label: 'Sub Page 2', icon: 'icon-name' },
  ],
}
```

### Section Sans Sub-Navigation

```typescript
'ma-section': {
  label: 'Ma Section',
  hasSubNav: false,
}
```

## Intégration dans une Page

### Template de Page Complète

```typescript
'use client';

import { useNavigationContext } from '@/hooks/useNavigationContext';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { SubNavigation } from '@/components/dashboard/SubNavigation';

export default function MyPage() {
  const { breadcrumbs, subNavItems, showSubNav } = useNavigationContext();
  
  return (
    <div className="page-wrapper">
      {/* Header avec breadcrumbs */}
      <header className="page-header">
        <Breadcrumbs items={breadcrumbs} />
        <h1>Titre de la Page</h1>
      </header>
      
      {/* Sub-navigation si applicable */}
      {showSubNav && subNavItems && (
        <SubNavigation items={subNavItems} />
      )}
      
      {/* Contenu principal */}
      <main className="page-content">
        {/* Votre contenu ici */}
      </main>
    </div>
  );
}
```

### Layout avec Navigation

Pour un layout qui s'applique à toutes les pages d'une section:

```typescript
// app/(app)/analytics/layout.tsx
'use client';

import { useNavigationContext } from '@/hooks/useNavigationContext';
import { SubNavigation } from '@/components/dashboard/SubNavigation';

export default function AnalyticsLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { subNavItems, showSubNav } = useNavigationContext();
  
  return (
    <div>
      {showSubNav && subNavItems && (
        <SubNavigation items={subNavItems} />
      )}
      {children}
    </div>
  );
}
```

## Styling Personnalisé

### Override des Styles

Vous pouvez override les styles en ajoutant vos propres classes:

```css
/* Dans votre fichier CSS */
.my-breadcrumbs {
  padding: 1rem 0;
}

.my-breadcrumbs .breadcrumb-link {
  color: #custom-color;
}

.my-sub-nav {
  background: #custom-bg;
}
```

```typescript
<Breadcrumbs items={breadcrumbs} className="my-breadcrumbs" />
<SubNavigation items={subNavItems} className="my-sub-nav" />
```

### Variables CSS Disponibles

Les composants utilisent les variables CSS du design system:

```css
/* Couleurs */
--color-primary
--color-text-main
--color-text-sub
--color-text-muted
--color-bg-main
--color-bg-hover
--color-border

/* Espacement */
--space-2, --space-3, --space-4, --space-6

/* Typographie */
--text-xs, --text-sm
--font-medium, --font-semibold

/* Border Radius */
--radius-sm
```

## Tests

### Tester le Hook

```typescript
import { renderHook } from '@testing-library/react';
import { useNavigationContext } from '@/hooks/useNavigationContext';

test('should parse navigation correctly', () => {
  // Mock usePathname
  jest.mock('next/navigation', () => ({
    usePathname: () => '/analytics/pricing'
  }));
  
  const { result } = renderHook(() => useNavigationContext());
  
  expect(result.current.currentSection).toBe('analytics');
  expect(result.current.currentSubSection).toBe('pricing');
  expect(result.current.showSubNav).toBe(true);
});
```

### Tester les Composants

```typescript
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';

test('should render breadcrumbs', () => {
  const items = [
    { label: 'Home', href: '/home' },
    { label: 'Analytics' }
  ];
  
  render(<Breadcrumbs items={items} />);
  
  expect(screen.getByText('Home')).toBeInTheDocument();
  expect(screen.getByText('Analytics')).toBeInTheDocument();
});
```

## Troubleshooting

### Breadcrumbs ne s'affichent pas

- Vérifier que `items` n'est pas vide
- Sur la page Home, les breadcrumbs sont cachés par design
- Vérifier l'import du CSS: `import '@/styles/navigation.css'`

### Sub-navigation ne s'affiche pas

- Vérifier que `showSubNav` est `true`
- Vérifier que la section est configurée avec `hasSubNav: true`
- Vérifier que `subNavItems` n'est pas `undefined`

### État actif incorrect

- Vérifier que le `pathname` est correct
- Vérifier la configuration des routes dans `SECTION_CONFIG`
- Le composant utilise `usePathname()` de Next.js

### Styles ne s'appliquent pas

- Importer `styles/navigation.css` dans votre layout ou page
- Vérifier que les variables CSS sont définies
- Vérifier l'ordre des imports CSS

## Exemples Réels

### Page Analytics

```typescript
// app/(app)/analytics/page.tsx
'use client';

import { useNavigationContext } from '@/hooks/useNavigationContext';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { SubNavigation } from '@/components/dashboard/SubNavigation';

export default function AnalyticsPage() {
  const { breadcrumbs, subNavItems, showSubNav } = useNavigationContext();
  
  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      {showSubNav && subNavItems && <SubNavigation items={subNavItems} />}
      
      <div className="analytics-content">
        <h1>Analytics Overview</h1>
        {/* Contenu */}
      </div>
    </>
  );
}
```

### Page OnlyFans Messages

```typescript
// app/(app)/onlyfans/messages/page.tsx
'use client';

import { useNavigationContext } from '@/hooks/useNavigationContext';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';

export default function MessagesPage() {
  const { breadcrumbs } = useNavigationContext();
  
  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      
      <div className="messages-content">
        <h1>Messages</h1>
        {/* Contenu */}
      </div>
    </>
  );
}
```

## Ressources

- **Hook:** `hooks/useNavigationContext.ts`
- **Composants:** `components/dashboard/Breadcrumbs.tsx`, `SubNavigation.tsx`
- **Styles:** `styles/navigation.css`
- **Tests:** `tests/unit/properties/navigation-*.property.test.ts`
- **Documentation:** `.kiro/specs/dashboard-home-analytics-fix/`

## Support

Pour toute question ou problème:
1. Consulter les tests de propriétés pour des exemples
2. Vérifier la configuration dans `SECTION_CONFIG`
3. Tester avec `scripts/test-navigation-infrastructure.ts`
