# Guide des Composants Hydration-Safe

Ce guide explique comment utiliser les composants hydration-safe pour résoudre les problèmes d'hydratation React, notamment l'erreur #130.

## 🎯 Problèmes Résolus

Les composants hydration-safe résolvent les problèmes suivants :
- **Contenu sensible au temps** : `new Date()`, `Date.now()`, timestamps
- **APIs client-only** : `window`, `document`, `navigator`, `localStorage`
- **Contenu aléatoire** : `Math.random()`, génération d'IDs uniques
- **Code client dans composants serveur** : accès aux APIs du navigateur

## 🛠️ Composants Disponibles

### 1. HydrationSafeWrapper

Wrapper générique pour gérer l'hydratation de manière sécurisée.

```tsx
import { HydrationSafeWrapper } from '@/components/hydration';

function MyComponent() {
  return (
    <HydrationSafeWrapper 
      fallback={<div>Chargement...</div>}
      onHydrationError={(error) => console.error(error)}
    >
      <div>Contenu hydraté</div>
    </HydrationSafeWrapper>
  );
}
```

**Props :**
- `fallback` : Contenu affiché pendant l'hydratation
- `onHydrationError` : Callback en cas d'erreur d'hydratation
- `suppressHydrationWarning` : Supprime les warnings d'hydratation

### 2. ClientOnly

Pour le contenu qui ne doit s'afficher que côté client.

```tsx
import { ClientOnly } from '@/components/hydration';

function ClientOnlyFeature() {
  return (
    <ClientOnly fallback={<div>Disponible côté client...</div>}>
      <div>
        Largeur de l'écran : {window.innerWidth}px
      </div>
    </ClientOnly>
  );
}
```

### 3. SafeDateRenderer

Affichage sécurisé des dates et heures.

```tsx
import { SafeDateRenderer, SafeCurrentYear } from '@/components/hydration';

function DateDisplay() {
  return (
    <div>
      {/* Année courante (cas le plus fréquent) */}
      <SafeCurrentYear fallback={<span>2024</span>} />
      
      {/* Date complète */}
      <SafeDateRenderer 
        date={new Date()} 
        format="full"
        fallback={<span>Chargement...</span>}
      />
      
      {/* Formats disponibles : 'full', 'short', 'time', 'date', 'relative', 'year' */}
      <SafeDateRenderer date={createdAt} format="relative" />
    </div>
  );
}
```

### 4. SafeBrowserAPI

Accès sécurisé aux APIs du navigateur.

```tsx
import { SafeBrowserAPI, SafeLocalStorage } from '@/components/hydration';

function BrowserFeatures() {
  return (
    <SafeBrowserAPI fallback={<div>APIs non disponibles</div>}>
      {(api) => (
        <div>
          {api.isClient && (
            <div>
              <p>Largeur : {api.window?.innerWidth}px</p>
              <p>User Agent : {api.navigator?.userAgent}</p>
            </div>
          )}
        </div>
      )}
    </SafeBrowserAPI>
  );
}

function LocalStorageExample() {
  return (
    <SafeLocalStorage>
      {(storage) => (
        <div>
          <button onClick={() => storage.setItem('key', 'value')}>
            Sauvegarder
          </button>
          <p>Valeur : {storage.getItem('key')}</p>
        </div>
      )}
    </SafeLocalStorage>
  );
}
```

### 5. SafeRandomContent

Génération de contenu aléatoire cohérent.

```tsx
import { SafeRandomContent, SafeRandomChoice } from '@/components/hydration';

function RandomFeatures() {
  return (
    <div>
      {/* Valeur aléatoire avec seed pour cohérence */}
      <SafeRandomContent seed="hero-animation" min={0} max={100}>
        {(value) => (
          <div style={{ animationDelay: `${value}ms` }}>
            Animation avec délai aléatoire
          </div>
        )}
      </SafeRandomContent>
      
      {/* Sélection aléatoire d'un élément */}
      <SafeRandomChoice 
        items={['🎉', '🚀', '✨', '🎯']} 
        seed="hero-emoji"
      >
        {(emoji) => <span>{emoji}</span>}
      </SafeRandomChoice>
    </div>
  );
}
```

### 6. SSRDataProvider

Gestion cohérente des données entre serveur et client.

```tsx
import { SSRDataProvider, useSSRData, useSSRValue } from '@/components/hydration';

function App() {
  return (
    <SSRDataProvider 
      initialData={{ theme: 'dark', user: null }}
      hydrationId="app-data"
    >
      <UserProfile />
    </SSRDataProvider>
  );
}

function UserProfile() {
  const { getData, setData, isHydrated } = useSSRData();
  const theme = useSSRValue('theme', 'light');
  
  return (
    <div className={`theme-${theme}`}>
      {isHydrated ? 'Hydraté' : 'En cours d\'hydratation'}
    </div>
  );
}
```

## 🔧 Patterns d'Utilisation

### Fixer le Footer avec l'Année Courante

**❌ Problématique :**
```tsx
function Footer() {
  const currentYear = new Date().getFullYear(); // Cause React error #130
  return <p>&copy; {currentYear} Mon Site</p>;
}
```

**✅ Solution :**
```tsx
import { SafeCurrentYear, SSRDataProvider } from '@/components/hydration';

function Footer() {
  return (
    <SSRDataProvider hydrationId="footer">
      <p>&copy; <SafeCurrentYear fallback={<span>2024</span>} /> Mon Site</p>
    </SSRDataProvider>
  );
}
```

### Gérer les Accès window/document

**❌ Problématique :**
```tsx
function WindowSize() {
  const width = window.innerWidth; // Erreur côté serveur
  return <div>Largeur : {width}px</div>;
}
```

**✅ Solution :**
```tsx
import { SafeBrowserAPI } from '@/components/hydration';

function WindowSize() {
  return (
    <SafeBrowserAPI>
      {(api) => (
        <div>
          {api.window ? (
            <div>Largeur : {api.window.innerWidth}px</div>
          ) : (
            <div>Largeur non disponible</div>
          )}
        </div>
      )}
    </SafeBrowserAPI>
  );
}
```

### Contenu Aléatoire Cohérent

**❌ Problématique :**
```tsx
function RandomQuote() {
  const quotes = ['Quote 1', 'Quote 2', 'Quote 3'];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]; // Différent serveur/client
  return <blockquote>{randomQuote}</blockquote>;
}
```

**✅ Solution :**
```tsx
import { SafeRandomChoice, SSRDataProvider } from '@/components/hydration';

function RandomQuote() {
  const quotes = ['Quote 1', 'Quote 2', 'Quote 3'];
  
  return (
    <SSRDataProvider hydrationId="quotes">
      <SafeRandomChoice items={quotes} seed="daily-quote">
        {(quote) => <blockquote>{quote}</blockquote>}
      </SafeRandomChoice>
    </SSRDataProvider>
  );
}
```

## 🎨 HOCs (Higher-Order Components)

### withHydrationSafety

Wrapper automatique pour les composants existants :

```tsx
import { withHydrationSafety } from '@/components/hydration';

const UnsafeComponent = () => (
  <div>{new Date().toLocaleString()}</div>
);

const SafeComponent = withHydrationSafety(UnsafeComponent, {
  fallback: <div>Chargement...</div>,
  suppressHydrationWarning: true
});
```

### withSSRData

Wrapper automatique avec données SSR :

```tsx
import { withSSRData } from '@/components/hydration';

const DataComponent = () => {
  const { getData } = useSSRData();
  return <div>{getData('message', 'Hello')}</div>;
};

const WrappedComponent = withSSRData(DataComponent, {
  initialData: { message: 'Bonjour' },
  hydrationId: 'greeting'
});
```

## 🧪 Tests

Les composants incluent des tests complets :

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { SafeCurrentYear, SSRDataProvider } from '@/components/hydration';

test('SafeCurrentYear renders correctly', async () => {
  render(
    <SSRDataProvider>
      <SafeCurrentYear />
    </SSRDataProvider>
  );
  
  await waitFor(() => {
    expect(screen.getByText(new Date().getFullYear().toString())).toBeInTheDocument();
  });
});
```

## 📋 Checklist de Migration

Pour migrer du code existant vers les composants hydration-safe :

- [ ] **Identifier les problèmes** : Utiliser l'audit d'hydratation
- [ ] **Remplacer `new Date()`** : Utiliser `SafeDateRenderer` ou `SafeCurrentYear`
- [ ] **Wrapper les accès browser APIs** : Utiliser `SafeBrowserAPI` ou `ClientOnly`
- [ ] **Gérer le contenu aléatoire** : Utiliser `SafeRandomContent` avec seeds
- [ ] **Ajouter des fallbacks** : Prévoir des contenus de chargement
- [ ] **Tester l'hydratation** : Vérifier que les erreurs sont résolues
- [ ] **Monitorer en production** : Utiliser les outils de debugging

## 🚀 Bonnes Pratiques

1. **Toujours fournir des fallbacks** pour une meilleure UX
2. **Utiliser des seeds** pour le contenu aléatoire cohérent
3. **Grouper les données** avec `SSRDataProvider` pour la performance
4. **Tester l'hydratation** en développement et production
5. **Monitorer les erreurs** avec les outils de debugging intégrés

## 🔍 Debugging

Les composants incluent des outils de debugging intégrés :

```tsx
import { hydrationDebugger } from '@/lib/utils/hydrationDebugger';

// En développement, activer le debugging
if (process.env.NODE_ENV === 'development') {
  hydrationDebugger.enableDebugMode();
}
```

Les erreurs d'hydratation sont automatiquement loggées et peuvent être visualisées dans le panel de debug.