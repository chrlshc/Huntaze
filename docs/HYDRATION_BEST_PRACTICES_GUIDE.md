# Guide des Meilleures Pratiques d'Hydratation React

Ce guide complet vous aidera à éviter et résoudre les erreurs d'hydratation dans vos applications React/Next.js.

## Table des Matières

1. [Comprendre l'Hydratation](#comprendre-lhydratation)
2. [Problèmes Courants](#problèmes-courants)
3. [Solutions et Patterns](#solutions-et-patterns)
4. [Composants Hydration-Safe](#composants-hydration-safe)
5. [Outils de Débogage](#outils-de-débogage)
6. [Checklist de Code Review](#checklist-de-code-review)
7. [Exemples Pratiques](#exemples-pratiques)

## Comprendre l'Hydratation

### Qu'est-ce que l'Hydratation ?

L'hydratation est le processus par lequel React "attache" les event listeners et l'état aux éléments DOM générés côté serveur (SSR). Pour que l'hydratation réussisse, le HTML généré côté client doit **exactement** correspondre au HTML généré côté serveur.

### Pourquoi les Erreurs d'Hydratation Surviennent-elles ?

```jsx
// ❌ PROBLÉMATIQUE - Différence serveur/client
function ProblematicComponent() {
  return <div>{new Date().toString()}</div>; // Différent à chaque rendu
}

// ✅ SOLUTION - Cohérence serveur/client
function SafeComponent() {
  return (
    <SafeDateRenderer date={new Date()} format="full" />
  );
}
```

## Problèmes Courants

### 1. Contenu Dépendant du Temps

**Problème :** Les dates, timestamps, et durées changent entre le serveur et le client.

```jsx
// ❌ Éviter
function TimeDisplay() {
  return <span>{new Date().toLocaleString()}</span>;
}

// ✅ Utiliser
function SafeTimeDisplay() {
  return (
    <SafeDateRenderer 
      date={new Date()} 
      format="datetime"
      fallback="Chargement..."
    />
  );
}
```

### 2. Contenu Aléatoire

**Problème :** `Math.random()` génère des valeurs différentes à chaque exécution.

```jsx
// ❌ Éviter
function RandomQuote() {
  const quotes = ['Quote 1', 'Quote 2', 'Quote 3'];
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return <blockquote>{quotes[randomIndex]}</blockquote>;
}

// ✅ Utiliser
function SafeRandomQuote() {
  const quotes = ['Quote 1', 'Quote 2', 'Quote 3'];
  
  return (
    <SafeRandomContent seed="daily-quote" min={0} max={quotes.length - 1}>
      {(value) => {
        const index = Math.floor(value);
        return <blockquote>{quotes[index]}</blockquote>;
      }}
    </SafeRandomContent>
  );
}
```

### 3. APIs du Navigateur

**Problème :** `window`, `document`, `localStorage` ne sont pas disponibles côté serveur.

```jsx
// ❌ Éviter
function WindowSize() {
  return <div>Width: {window.innerWidth}px</div>;
}

// ✅ Utiliser
function SafeWindowSize() {
  return (
    <SafeBrowserAPI>
      {(api) => (
        <div>
          Width: {api.window?.innerWidth || 'Unknown'}px
        </div>
      )}
    </SafeBrowserAPI>
  );
}
```

### 4. Rendu Conditionnel Instable

**Problème :** Conditions qui peuvent différer entre serveur et client.

```jsx
// ❌ Éviter
function ConditionalContent() {
  const isMobile = window.innerWidth < 768; // Erreur côté serveur
  return isMobile ? <MobileView /> : <DesktopView />;
}

// ✅ Utiliser
function SafeConditionalContent() {
  return (
    <HydrationSafeWrapper fallback={<DesktopView />}>
      <SafeBrowserAPI>
        {(api) => {
          const isMobile = (api.window?.innerWidth || 1024) < 768;
          return isMobile ? <MobileView /> : <DesktopView />;
        }}
      </SafeBrowserAPI>
    </HydrationSafeWrapper>
  );
}
```

## Solutions et Patterns

### Pattern 1: Rendu Différé (Client-Only)

Pour le contenu qui ne peut être rendu que côté client :

```jsx
import { ClientOnly } from '@/components/hydration';

function MyComponent() {
  return (
    <div>
      <h1>Contenu Universel</h1>
      <ClientOnly fallback={<div>Chargement...</div>}>
        <InteractiveWidget />
      </ClientOnly>
    </div>
  );
}
```

### Pattern 2: Données SSR Cohérentes

Pour partager des données entre serveur et client :

```jsx
import { SSRDataProvider, useSSRValue } from '@/components/hydration';

function App() {
  const initialData = {
    timestamp: Date.now(),
    randomSeed: 'fixed-seed-123'
  };

  return (
    <SSRDataProvider initialData={initialData}>
      <MyComponent />
    </SSRDataProvider>
  );
}

function MyComponent() {
  const timestamp = useSSRValue('timestamp', Date.now());
  
  return <div>Page générée à : {new Date(timestamp).toLocaleString()}</div>;
}
```

### Pattern 3: Wrapper de Sécurité

Pour les composants potentiellement problématiques :

```jsx
import { HydrationSafeWrapper } from '@/components/hydration';

function ProblematicComponent() {
  return (
    <HydrationSafeWrapper
      fallback={<div>Chargement...</div>}
      suppressHydrationWarning={true}
    >
      <ComplexInteractiveComponent />
    </HydrationSafeWrapper>
  );
}
```

## Composants Hydration-Safe

### SafeDateRenderer

Rendu sécurisé des dates avec cohérence serveur/client :

```jsx
import { SafeDateRenderer } from '@/components/hydration';

// Formats disponibles
<SafeDateRenderer date={new Date()} format="year" />        // 2024
<SafeDateRenderer date={new Date()} format="date" />        // 15/01/2024
<SafeDateRenderer date={new Date()} format="time" />        // 14:30:25
<SafeDateRenderer date={new Date()} format="datetime" />    // 15/01/2024 14:30:25
<SafeDateRenderer date={new Date()} format="full" />        // Lundi 15 janvier 2024 à 14:30:25

// Avec fallback personnalisé
<SafeDateRenderer 
  date={invalidDate} 
  format="full"
  fallback="Date non disponible"
/>
```

### SafeRandomContent

Génération de contenu aléatoire avec seed cohérent :

```jsx
import { SafeRandomContent } from '@/components/hydration';

// Valeur aléatoire simple
<SafeRandomContent seed="unique-seed" min={1} max={100}>
  {(value) => <div>Nombre aléatoire : {value.toFixed(0)}</div>}
</SafeRandomContent>

// Sélection aléatoire dans une liste
<SafeRandomContent seed="quote-of-day" min={0} max={quotes.length - 1}>
  {(value) => {
    const index = Math.floor(value);
    return <blockquote>{quotes[index]}</blockquote>;
  }}
</SafeRandomContent>
```

### SafeBrowserAPI

Accès sécurisé aux APIs du navigateur :

```jsx
import { SafeBrowserAPI } from '@/components/hydration';

<SafeBrowserAPI>
  {(api) => (
    <div>
      {/* Vérification de disponibilité */}
      {api.isClient && (
        <p>Largeur : {api.window?.innerWidth}px</p>
      )}
      
      {/* Utilisation sécurisée */}
      <button onClick={() => api.localStorage?.setItem('key', 'value')}>
        Sauvegarder
      </button>
      
      {/* Event listeners sécurisés */}
      <div
        onMouseEnter={() => api.addEventListener('resize', handleResize)}
        onMouseLeave={() => api.removeEventListener('resize', handleResize)}
      >
        Contenu responsive
      </div>
    </div>
  )}
</SafeBrowserAPI>
```

## Outils de Débogage

### 1. Hydration Devtools

Activez les outils de développement dans votre application :

```jsx
// pages/_app.tsx ou app/layout.tsx
import { hydrationDevtools } from '@/lib/devtools/hydrationDevtools';

if (process.env.NODE_ENV === 'development') {
  hydrationDevtools; // Active automatiquement les devtools
}
```

**Raccourcis clavier :**
- `Ctrl/Cmd + Shift + H` : Toggle panel de débogage
- `Ctrl/Cmd + Shift + R` : Actualiser les infos d'hydratation
- `Ctrl/Cmd + Shift + C` : Effacer les indicateurs visuels

### 2. Console API

Utilisez l'API console pour déboguer :

```javascript
// Dans la console du navigateur
window.__HYDRATION_DEVTOOLS__.getComponents()     // Liste des composants
window.__HYDRATION_DEVTOOLS__.getMismatches()     // Mismatches détectés
window.__HYDRATION_DEVTOOLS__.generateReport()    // Rapport détaillé
```

### 3. Extension Navigateur

Installez l'extension "Hydration Debugger" pour un débogage avancé avec interface graphique.

## Checklist de Code Review

### ✅ Vérifications Obligatoires

- [ ] Aucun usage direct de `new Date()` sans wrapper
- [ ] Aucun usage de `Math.random()` sans seed fixe
- [ ] Aucun accès direct à `window`/`document` sans protection
- [ ] Pas de rendu conditionnel basé sur des APIs navigateur
- [ ] Clés React stables (pas de `Math.random()` ou `Date.now()`)
- [ ] Gestion appropriée du `localStorage`/`sessionStorage`

### ✅ Bonnes Pratiques

- [ ] Utilisation des composants `Safe*` appropriés
- [ ] Fallbacks définis pour le contenu client-only
- [ ] Tests d'hydratation pour les nouveaux composants
- [ ] Documentation des patterns d'hydratation utilisés

### ✅ Performance

- [ ] Pas d'hydratation inutile de contenu statique
- [ ] Lazy loading approprié pour les composants lourds
- [ ] Minimisation des re-renders pendant l'hydratation

## Exemples Pratiques

### Exemple 1: Dashboard avec Métriques Temps Réel

```jsx
import { SafeBrowserAPI, SafeDateRenderer, ClientOnly } from '@/components/hydration';

function Dashboard() {
  return (
    <div className="dashboard">
      {/* Header avec timestamp cohérent */}
      <header>
        <h1>Dashboard</h1>
        <SafeDateRenderer 
          date={new Date()} 
          format="datetime"
          className="timestamp"
        />
      </header>

      {/* Métriques statiques (SSR) */}
      <div className="metrics-grid">
        <MetricCard title="Utilisateurs" value="1,234" />
        <MetricCard title="Revenus" value="€45,678" />
      </div>

      {/* Contenu interactif (Client-only) */}
      <ClientOnly fallback={<ChartSkeleton />}>
        <RealtimeChart />
      </ClientOnly>

      {/* Informations navigateur */}
      <SafeBrowserAPI>
        {(api) => (
          <div className="browser-info">
            <p>Résolution : {api.window?.innerWidth || '?'} × {api.window?.innerHeight || '?'}</p>
            <p>User Agent : {api.navigator?.userAgent?.slice(0, 50) || 'Inconnu'}...</p>
          </div>
        )}
      </SafeBrowserAPI>
    </div>
  );
}
```

### Exemple 2: Système de Thème avec Préférence Utilisateur

```jsx
import { SafeBrowserAPI, HydrationSafeWrapper } from '@/components/hydration';

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  return (
    <HydrationSafeWrapper>
      <SafeBrowserAPI>
        {(api) => {
          // Récupérer la préférence sauvegardée
          useEffect(() => {
            const saved = api.localStorage?.getItem('theme');
            if (saved) {
              setTheme(saved);
            } else {
              // Détecter la préférence système
              const prefersDark = api.window?.matchMedia?.('(prefers-color-scheme: dark)').matches;
              setTheme(prefersDark ? 'dark' : 'light');
            }
          }, [api]);

          return (
            <div className={`theme-${theme}`}>
              {children}
              <button 
                onClick={() => {
                  const newTheme = theme === 'light' ? 'dark' : 'light';
                  setTheme(newTheme);
                  api.localStorage?.setItem('theme', newTheme);
                }}
              >
                Toggle Theme
              </button>
            </div>
          );
        }}
      </SafeBrowserAPI>
    </HydrationSafeWrapper>
  );
}
```

### Exemple 3: Composant de Géolocalisation

```jsx
import { SafeBrowserAPI, ClientOnly } from '@/components/hydration';

function LocationWeather() {
  return (
    <div className="weather-widget">
      <h3>Météo Locale</h3>
      
      <ClientOnly fallback={<div>Chargement de la météo...</div>}>
        <SafeBrowserAPI>
          {(api) => (
            <WeatherContent api={api} />
          )}
        </SafeBrowserAPI>
      </ClientOnly>
    </div>
  );
}

function WeatherContent({ api }) {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (api.navigator?.geolocation) {
      api.navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Géolocalisation échouée:', error);
          // Fallback vers une localisation par défaut
          setLocation({ lat: 48.8566, lng: 2.3522 }); // Paris
        }
      );
    }
  }, [api]);

  useEffect(() => {
    if (location) {
      fetchWeather(location).then(setWeather);
    }
  }, [location]);

  if (!weather) {
    return <div>Récupération de la météo...</div>;
  }

  return (
    <div className="weather-display">
      <p>{weather.temperature}°C</p>
      <p>{weather.description}</p>
      <p>{weather.location}</p>
    </div>
  );
}
```

## Ressources Supplémentaires

- [Documentation React sur l'Hydratation](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Guide Next.js SSR](https://nextjs.org/docs/basic-features/pages#server-side-rendering)
- [Outils de Validation Automatique](./HYDRATION_HOOKS_GUIDE.md)
- [Troubleshooting Guide](./HYDRATION_TROUBLESHOOTING_GUIDE.md)

---

**💡 Conseil :** Utilisez toujours les outils de validation automatique en développement pour détecter les problèmes d'hydratation avant qu'ils n'atteignent la production.