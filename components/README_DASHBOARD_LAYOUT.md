# Dashboard Layout Components

## Overview

Ces composants fournissent le layout principal pour toutes les pages de l'application (dashboard, analytics, etc.).

## Components

### Header.tsx
Header principal de l'application avec :
- Logo/titre de l'app
- Menu mobile (hamburger)
- Notifications
- User menu (avatar, nom, email)
- Bouton de déconnexion

**Usage:**
```tsx
import Header from '@/components/Header';

<Header />
```

### Sidebar.tsx
Sidebar desktop avec navigation principale.

**Features:**
- Navigation vers toutes les pages principales
- État actif automatique basé sur l'URL
- Lien "Back to Home"
- Caché sur mobile (< md breakpoint)

**Usage:**
```tsx
import { Sidebar } from '@/components/Sidebar';

<Sidebar />
```

### MobileSidebar.tsx
Menu mobile avec overlay et sidebar coulissante.

**Features:**
- Bouton hamburger
- Overlay semi-transparent
- Sidebar coulissante depuis la gauche
- Fermeture automatique après navigation
- Visible uniquement sur mobile (< md breakpoint)

**Usage:**
```tsx
import { MobileSidebar } from '@/components/MobileSidebar';

<MobileSidebar />
```

### DashboardLayout.tsx
Layout wrapper avec props pour titre et actions (existant, non utilisé actuellement).

**Usage:**
```tsx
import { DashboardLayout } from '@/components/DashboardLayout';

<DashboardLayout 
  title="Page Title"
  breadcrumb={<Breadcrumb />}
  headerActions={<Button>Action</Button>}
>
  {children}
</DashboardLayout>
```

## Layout Structure

Le layout est appliqué dans `app/(app)/layout.tsx` :

```tsx
<div className="flex min-h-screen">
  <Sidebar />              {/* Desktop sidebar */}
  <div className="flex flex-1 flex-col">
    <Header />             {/* Header with mobile menu */}
    <main className="flex-1">
      {children}           {/* Page content */}
    </main>
  </div>
</div>
```

## Navigation Items

Les items de navigation sont définis dans les deux sidebars :

```tsx
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { name: 'Analytics', href: '/analytics', icon: <ChartIcon /> },
  { name: 'Content', href: '/content', icon: <ContentIcon /> },
  { name: 'Messages', href: '/messages', icon: <MessageIcon /> },
  { name: 'Integrations', href: '/integrations', icon: <IntegrationIcon /> },
  { name: 'Settings', href: '/settings', icon: <SettingsIcon /> },
];
```

## Styling

Tous les composants utilisent les design tokens Linear :

- `--color-bg-base` : Background principal
- `--color-bg-surface` : Background des surfaces
- `--color-border-subtle` : Bordures
- `--color-text-primary` : Texte principal
- `--color-text-secondary` : Texte secondaire
- `--color-text-inverse` : Texte sur fond coloré
- `--color-accent-primary` : Couleur d'accent
- `--spacing-*` : Espacements

## Responsive Behavior

- **Desktop (≥ md)** : Sidebar visible, menu hamburger caché
- **Mobile (< md)** : Sidebar cachée, menu hamburger visible

## Active State

L'état actif est déterminé automatiquement :

```tsx
const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
```

Cela permet de highlight :
- La page exacte (`/dashboard`)
- Les sous-pages (`/dashboard/settings`)

## Adding New Pages

Pour ajouter une nouvelle page au layout :

1. Créer la page dans `app/(app)/your-page/page.tsx`
2. Ajouter l'item dans les deux sidebars :

```tsx
{
  name: 'Your Page',
  href: '/your-page',
  icon: <YourIcon />
}
```

Le layout sera automatiquement appliqué !

## Session Management

Le Header utilise NextAuth pour :
- Afficher les infos utilisateur
- Gérer la déconnexion

```tsx
const { data: session } = useSession();

// Afficher le nom
{session?.user?.name}

// Déconnexion
signOut({ callbackUrl: '/' })
```

## Mobile Menu State

Le menu mobile gère son propre état :

```tsx
const [isOpen, setIsOpen] = useState(false);

// Ouvrir/fermer
<button onClick={() => setIsOpen(!isOpen)}>

// Fermer après navigation
<Link onClick={() => setIsOpen(false)}>
```

## Accessibility

- Tous les boutons ont des `aria-label`
- Navigation au clavier supportée
- Focus visible sur les éléments interactifs
- Contraste suffisant pour le texte

## Performance

- Composants client-side (`'use client'`)
- Pas de re-render inutiles
- État local pour le menu mobile
- Hooks Next.js optimisés (`usePathname`, `useSession`)
