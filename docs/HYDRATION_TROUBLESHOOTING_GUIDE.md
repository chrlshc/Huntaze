# Guide de Dépannage des Erreurs d'Hydratation

Ce guide vous aide à diagnostiquer et résoudre rapidement les erreurs d'hydratation les plus courantes.

## Table des Matières

1. [Diagnostic Rapide](#diagnostic-rapide)
2. [Erreurs Courantes et Solutions](#erreurs-courantes-et-solutions)
3. [Outils de Diagnostic](#outils-de-diagnostic)
4. [Patterns de Débogage](#patterns-de-débogage)
5. [FAQ](#faq)

## Diagnostic Rapide

### 🚨 Symptômes d'Erreur d'Hydratation

- Console affiche : "Text content does not match server-rendered HTML"
- Console affiche : "Hydration failed because the initial UI does not match"
- Contenu qui "clignote" ou change après le chargement de la page
- Erreur React #130 ou #418
- Composants qui ne répondent pas aux interactions

### 🔍 Diagnostic en 30 Secondes

1. **Ouvrez la console** et cherchez les erreurs d'hydratation
2. **Activez les devtools** : `Ctrl/Cmd + Shift + H`
3. **Vérifiez les indicateurs visuels** : bordures colorées autour des composants problématiques
4. **Consultez les suggestions automatiques** dans la console

## Erreurs Courantes et Solutions

### 1. "Text content does not match server-rendered HTML"

**Cause :** Différence de contenu textuel entre serveur et client.

```jsx
// ❌ Problème
function BadComponent() {
  return <div>{new Date().toString()}</div>; // Différent à chaque rendu
}

// ✅ Solution
function GoodComponent() {
  return (
    <SafeDateRenderer 
      date={new Date()} 
      format="full"
      fallback="Chargement..."
    />
  );
}
```

**Diagnostic :**
```javascript
// Dans la console
window.__HYDRATION_DEVTOOLS__.getMismatches()
  .filter(m => m.type === 'text')
```

### 2. "Cannot read property 'innerWidth' of undefined"

**Cause :** Accès à `window` côté serveur.

```jsx
// ❌ Problème
function BadComponent() {
  const width = window.innerWidth; // Erreur côté serveur
  return <div>Width: {width}</div>;
}

// ✅ Solution
function GoodComponent() {
  return (
    <SafeBrowserAPI>
      {(api) => (
        <div>Width: {api.window?.innerWidth || 'Unknown'}</div>
      )}
    </SafeBrowserAPI>
  );
}
```

### 3. "Math.random() causing hydration mismatch"

**Cause :** Valeurs aléatoires différentes entre serveur et client.

```jsx
// ❌ Problème
function BadComponent() {
  const randomId = Math.random().toString(36);
  return <div id={randomId}>Content</div>;
}

// ✅ Solution
function GoodComponent() {
  return (
    <SafeRandomContent seed="component-id" min={0} max={1000000}>
      {(value) => {
        const randomId = Math.floor(value).toString(36);
        return <div id={randomId}>Content</div>;
      }}
    </SafeRandomContent>
  );
}
```

### 4. "localStorage is not defined"

**Cause :** Accès au localStorage côté serveur.

```jsx
// ❌ Problème
function BadComponent() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  return <div className={theme}>Content</div>;
}

// ✅ Solution
function GoodComponent() {
  const [theme, setTheme] = useState('light');
  
  return (
    <SafeBrowserAPI>
      {(api) => {
        useEffect(() => {
          const savedTheme = api.localStorage?.getItem('theme');
          if (savedTheme) {
            setTheme(savedTheme);
          }
        }, [api]);
        
        return <div className={theme}>Content</div>;
      }}
    </SafeBrowserAPI>
  );
}
```

### 5. "Conditional rendering causing mismatch"

**Cause :** Conditions qui diffèrent entre serveur et client.

```jsx
// ❌ Problème
function BadComponent() {
  const isMobile = window.innerWidth < 768; // Erreur côté serveur
  return isMobile ? <MobileView /> : <DesktopView />;
}

// ✅ Solution 1: Client-only
function GoodComponent() {
  return (
    <ClientOnly fallback={<DesktopView />}>
      <ResponsiveComponent />
    </ClientOnly>
  );
}

// ✅ Solution 2: Hydration-safe
function GoodComponent() {
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

## Outils de Diagnostic

### 1. Hydration Devtools (Intégré)

**Activation :**
```jsx
// Dans votre _app.tsx ou layout.tsx
import { hydrationDevtools } from '@/lib/devtools/hydrationDevtools';

if (process.env.NODE_ENV === 'development') {
  // Activé automatiquement
}
```

**Utilisation :**
- `Ctrl/Cmd + Shift + H` : Ouvrir le panel
- Indicateurs visuels sur les composants
- Suggestions automatiques dans la console

### 2. Extension Navigateur

**Installation :**
1. Chargez l'extension depuis `browser-extension/`
2. Ouvrez les DevTools
3. Onglet "Hydration" disponible

**Fonctionnalités :**
- Vue d'ensemble des composants
- Filtrage par statut (erreur, succès, en cours)
- Export des rapports
- Mise en évidence des composants

### 3. Validation Automatique

**Pre-commit :**
```bash
# Validation automatique avant commit
npm run validate:hydration:pre-commit
```

**Build-time :**
```bash
# Validation complète du projet
npm run validate:hydration
```

### 4. Console API

```javascript
// API disponible dans la console
const devtools = window.__HYDRATION_DEVTOOLS__;

// Obtenir tous les composants
devtools.getComponents();

// Obtenir les mismatches
devtools.getMismatches();

// Générer un rapport
devtools.generateReport();

// Mettre en évidence un composant
devtools.highlightComponent('component-id');
```

## Patterns de Débogage

### Pattern 1: Isolation du Problème

```jsx
// Enveloppez le composant suspect
function DebugWrapper({ children, name }) {
  useEffect(() => {
    console.log(`${name} mounted on client`);
  }, [name]);

  return (
    <div data-debug={name}>
      {children}
    </div>
  );
}

// Utilisation
<DebugWrapper name="SuspiciousComponent">
  <SuspiciousComponent />
</DebugWrapper>
```

### Pattern 2: Comparaison Serveur/Client

```jsx
function DebugContent() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const serverContent = "Contenu serveur";
  const clientContent = new Date().toString(); // Problématique

  return (
    <div>
      <div>Serveur: {serverContent}</div>
      <div>Client: {isClient ? clientContent : serverContent}</div>
      <div>Match: {serverContent === clientContent ? '✅' : '❌'}</div>
    </div>
  );
}
```

### Pattern 3: Logging Détaillé

```jsx
function DebuggingComponent() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    console.log('Component hydrated');
    setHydrated(true);
  }, []);

  // Log des props et state
  console.log('Render:', { hydrated, props: arguments[0] });

  return (
    <div data-hydrated={hydrated}>
      {/* Contenu */}
    </div>
  );
}
```

## FAQ

### Q: Comment savoir si mon composant cause une erreur d'hydratation ?

**R:** Utilisez les outils de développement intégrés :

1. Activez les devtools : `Ctrl/Cmd + Shift + H`
2. Cherchez les bordures rouges autour des composants
3. Consultez la console pour les messages d'erreur
4. Utilisez `window.__HYDRATION_DEVTOOLS__.getComponents()` pour voir tous les composants

### Q: Puis-je désactiver l'hydratation pour un composant spécifique ?

**R:** Oui, utilisez `ClientOnly` ou `suppressHydrationWarning` :

```jsx
// Option 1: Rendu client uniquement
<ClientOnly fallback={<Skeleton />}>
  <ProblematicComponent />
</ClientOnly>

// Option 2: Supprimer les warnings (à utiliser avec précaution)
<div suppressHydrationWarning>
  <ProblematicComponent />
</div>
```

### Q: Comment déboguer une erreur d'hydratation intermittente ?

**R:** Les erreurs intermittentes sont souvent liées au timing :

1. **Ajoutez des logs** pour tracer l'exécution
2. **Utilisez des seeds fixes** pour le contenu aléatoire
3. **Testez avec différentes vitesses de réseau**
4. **Vérifiez les conditions de course** dans les useEffect

```jsx
// Exemple de débogage d'erreur intermittente
function IntermittentComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    console.log('Effect running, data:', data);
    
    // Simuler un délai variable
    const delay = Math.random() * 1000;
    setTimeout(() => {
      console.log('Setting data after', delay, 'ms');
      setData('loaded');
    }, delay);
  }, []);

  console.log('Rendering with data:', data);
  
  return <div>{data || 'loading'}</div>;
}
```

### Q: Comment tester l'hydratation en local ?

**R:** Plusieurs méthodes :

1. **Mode développement Next.js** : `npm run dev`
2. **Build de production** : `npm run build && npm start`
3. **Simulation de réseau lent** : DevTools → Network → Slow 3G
4. **Tests automatisés** : `npm run test:hydration`

### Q: Que faire si les outils de débogage ne détectent pas le problème ?

**R:** Débogage manuel :

1. **Comparez le HTML source** (View Source) avec le DOM final
2. **Utilisez React DevTools** pour inspecter les composants
3. **Ajoutez des breakpoints** dans les useEffect
4. **Vérifiez les conditions de rendu** étape par étape

```jsx
// Débogage manuel avec comparaison HTML
function ManualDebug() {
  const [serverHTML, setServerHTML] = useState('');
  const [clientHTML, setClientHTML] = useState('');
  
  useEffect(() => {
    // Capturer le HTML initial (serveur)
    setServerHTML(document.documentElement.outerHTML);
    
    // Capturer après hydratation
    setTimeout(() => {
      setClientHTML(document.documentElement.outerHTML);
    }, 100);
  }, []);

  return (
    <div>
      <button onClick={() => console.log('Server:', serverHTML)}>
        Log Server HTML
      </button>
      <button onClick={() => console.log('Client:', clientHTML)}>
        Log Client HTML
      </button>
      <button onClick={() => console.log('Diff:', serverHTML === clientHTML)}>
        Compare
      </button>
    </div>
  );
}
```

### Q: Comment éviter les erreurs d'hydratation dans les tests ?

**R:** Configuration de test appropriée :

```jsx
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};

// jest.setup.js
import { hydrationDevtools } from '@/lib/devtools/hydrationDevtools';

// Désactiver en test
hydrationDevtools.cleanup();

// Mock des APIs navigateur
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Ressources Supplémentaires

- [Guide des Meilleures Pratiques](./HYDRATION_BEST_PRACTICES_GUIDE.md)
- [Documentation des Composants Safe](./HYDRATION_SAFE_COMPONENTS_GUIDE.md)
- [Configuration des Hooks Git](./HYDRATION_HOOKS_GUIDE.md)
- [Exemples Interactifs](../examples/hydration/)

---

**💡 Conseil :** Gardez ce guide à portée de main pendant le développement. La plupart des erreurs d'hydratation suivent des patterns prévisibles et ont des solutions éprouvées.