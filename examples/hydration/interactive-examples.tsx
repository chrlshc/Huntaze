/**
 * Exemples Interactifs pour la Formation sur l'Hydratation
 * 
 * Ces exemples montrent les problèmes courants et leurs solutions
 * de manière interactive pour faciliter l'apprentissage.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
  SafeDateRenderer, 
  SafeRandomContent, 
  SafeBrowserAPI, 
  ClientOnly,
  HydrationSafeWrapper 
} from '@/components/hydration';

export function HydrationExamplesPage() {
  const [activeExample, setActiveExample] = useState('dates');

  const examples = [
    { id: 'dates', title: '📅 Gestion des Dates', component: DateExamples },
    { id: 'random', title: '🎲 Contenu Aléatoire', component: RandomExamples },
    { id: 'browser', title: '🌐 APIs Navigateur', component: BrowserAPIExamples },
    { id: 'conditional', title: '🔀 Rendu Conditionnel', component: ConditionalExamples },
    { id: 'storage', title: '💾 LocalStorage', component: StorageExamples },
    { id: 'advanced', title: '🚀 Cas Avancés', component: AdvancedExamples }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          🔧 Exemples Interactifs d'Hydratation
        </h1>
        <p className="text-gray-600">
          Apprenez à résoudre les erreurs d'hydratation avec des exemples pratiques
        </p>
      </header>

      <div className="flex gap-6">
        {/* Navigation */}
        <nav className="w-64 flex-shrink-0">
          <Card className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="font-semibold mb-4">Exemples</h2>
            <ul className="space-y-2">
              {examples.map((example) => (
                <li key={example.id}>
                  <Button variant="ghost" onClick={() => setActiveExample(example.id)}>
  setActiveExample(example.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeExample === example.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {example.title}
</Button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Contenu principal */}
        <main className="flex-1">
          {examples.map((example) => (
            <div
              key={example.id}
              className={activeExample === example.id ? 'block' : 'hidden'}
            >
              <example.component />
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}

// Exemple 1: Gestion des Dates
function DateExamples() {
  return (
    <ExampleSection
      title="📅 Gestion des Dates"
      description="Les dates changent entre le serveur et le client, causant des erreurs d'hydratation."
    >
      <ExampleCard
        title="❌ Problématique"
        description="new Date() génère des valeurs différentes"
        code={`function BadDateComponent() {
  return <div>Maintenant: {new Date().toString()}</div>;
}`}
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <div>Maintenant: {new Date().toString()}</div>
          <div className="text-sm text-red-600 mt-2">
            ⚠️ Cette approche cause des erreurs d'hydratation
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        title="✅ Solution"
        description="Utilisation de SafeDateRenderer"
        code={`function GoodDateComponent() {
  return (
    <SafeDateRenderer 
      date={new Date()} 
      format="full"
      fallback="Chargement..."
    />
  );
}`}
      >
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <SafeDateRenderer 
            date={new Date()} 
            format="full"
            fallback="Chargement..."
          />
          <div className="text-sm text-green-600 mt-2">
            ✅ Hydratation sécurisée
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        title="🎯 Formats Disponibles"
        description="Différents formats de date"
      >
        <div className="space-y-2">
          <div>Année: <SafeDateRenderer date={new Date()} format="year" /></div>
          <div>Date: <SafeDateRenderer date={new Date()} format="date" /></div>
          <div>Heure: <SafeDateRenderer date={new Date()} format="time" /></div>
          <div>Complet: <SafeDateRenderer date={new Date()} format="full" /></div>
        </div>
      </ExampleCard>
    </ExampleSection>
  );
}

// Exemple 2: Contenu Aléatoire
function RandomExamples() {
  return (
    <ExampleSection
      title="🎲 Contenu Aléatoire"
      description="Math.random() génère des valeurs différentes à chaque rendu."
    >
      <ExampleCard
        title="❌ Problématique"
        description="Math.random() cause des mismatches"
        code={`function BadRandomComponent() {
  const quotes = ['Quote 1', 'Quote 2', 'Quote 3'];
  const index = Math.floor(Math.random() * quotes.length);
  return <blockquote>{quotes[index]}</blockquote>;
}`}
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <blockquote className="italic">
            {['Citation inspirante', 'Pensée du jour', 'Sagesse populaire'][
              Math.floor(Math.random() * 3)
            ]}
          </blockquote>
          <div className="text-sm text-red-600 mt-2">
            ⚠️ Valeur différente à chaque rendu
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        title="✅ Solution"
        description="SafeRandomContent avec seed"
        code={`function GoodRandomComponent() {
  const quotes = ['Quote 1', 'Quote 2', 'Quote 3'];
  return (
    <SafeRandomContent seed="daily-quote" min={0} max={2}>
      {(value) => {
        const index = Math.floor(value);
        return <blockquote>{quotes[index]}</blockquote>;
      }}
    </SafeRandomContent>
  );
}`}
      >
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <SafeRandomContent seed="daily-quote" min={0} max={2}>
            {(value) => {
              const quotes = ['Citation inspirante', 'Pensée du jour', 'Sagesse populaire'];
              const index = Math.floor(value);
              return <blockquote className="italic">{quotes[index]}</blockquote>;
            }}
          </SafeRandomContent>
          <div className="text-sm text-green-600 mt-2">
            ✅ Même valeur à chaque rendu (seed fixe)
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        title="🎯 Différentes Seeds"
        description="Chaque seed produit une valeur cohérente"
      >
        <div className="space-y-2">
          <div>
            Seed "A": 
            <SafeRandomContent seed="seed-a" min={1} max={100}>
              {(value) => <span className="ml-2 font-mono">{value.toFixed(0)}</span>}
            </SafeRandomContent>
          </div>
          <div>
            Seed "B": 
            <SafeRandomContent seed="seed-b" min={1} max={100}>
              {(value) => <span className="ml-2 font-mono">{value.toFixed(0)}</span>}
            </SafeRandomContent>
          </div>
          <div>
            Seed "C": 
            <SafeRandomContent seed="seed-c" min={1} max={100}>
              {(value) => <span className="ml-2 font-mono">{value.toFixed(0)}</span>}
            </SafeRandomContent>
          </div>
        </div>
      </ExampleCard>
    </ExampleSection>
  );
}

// Exemple 3: APIs Navigateur
function BrowserAPIExamples() {
  return (
    <ExampleSection
      title="🌐 APIs Navigateur"
      description="window, document, navigator ne sont pas disponibles côté serveur."
    >
      <ExampleCard
        title="❌ Problématique"
        description="Accès direct aux APIs navigateur"
        code={`function BadBrowserComponent() {
  return (
    <div>
      Largeur: {window.innerWidth}px
      User Agent: {navigator.userAgent}
    </div>
  );
}`}
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <div className="text-red-600">
            ❌ ReferenceError: window is not defined (côté serveur)
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        title="✅ Solution"
        description="SafeBrowserAPI pour accès sécurisé"
        code={`function GoodBrowserComponent() {
  return (
    <SafeBrowserAPI>
      {(api) => (
        <div>
          <p>Largeur: {api.window?.innerWidth || 'Inconnu'}px</p>
          <p>Client: {api.isClient ? 'Oui' : 'Non'}</p>
          <p>User Agent: {api.navigator?.userAgent?.slice(0, 50) || 'Inconnu'}...</p>
        </div>
      )}
    </SafeBrowserAPI>
  );
}`}
      >
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <SafeBrowserAPI>
            {(api) => (
              <div className="space-y-1">
                <p>Largeur: {api.window?.innerWidth || 'Inconnu'}px</p>
                <p>Hauteur: {api.window?.innerHeight || 'Inconnu'}px</p>
                <p>Client: {api.isClient ? 'Oui' : 'Non'}</p>
                <p>User Agent: {api.navigator?.userAgent?.slice(0, 50) || 'Inconnu'}...</p>
              </div>
            )}
          </SafeBrowserAPI>
          <div className="text-sm text-green-600 mt-2">
            ✅ Accès sécurisé aux APIs navigateur
          </div>
        </div>
      </ExampleCard>
    </ExampleSection>
  );
}

// Exemple 4: Rendu Conditionnel
function ConditionalExamples() {
  return (
    <ExampleSection
      title="🔀 Rendu Conditionnel"
      description="Les conditions basées sur les APIs navigateur peuvent différer entre serveur et client."
    >
      <ExampleCard
        title="❌ Problématique"
        description="Condition basée sur window"
        code={`function BadConditionalComponent() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <MobileView /> : <DesktopView />;
}`}
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <div className="text-red-600">
            ❌ Erreur côté serveur + mismatch possible
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        title="✅ Solution 1: Client-Only"
        description="Rendu uniquement côté client"
        code={`function GoodConditionalComponent() {
  return (
    <ClientOnly fallback={<DesktopView />}>
      <ResponsiveComponent />
    </ClientOnly>
  );
}`}
      >
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <ClientOnly fallback={<div className="text-gray-500">Vue Desktop (fallback)</div>}>
            <SafeBrowserAPI>
              {(api) => {
                const isMobile = (api.window?.innerWidth || 1024) < 768;
                return (
                  <div className={isMobile ? 'text-blue-600' : 'text-purple-600'}>
                    {isMobile ? '📱 Vue Mobile' : '🖥️ Vue Desktop'}
                  </div>
                );
              }}
            </SafeBrowserAPI>
          </ClientOnly>
          <div className="text-sm text-green-600 mt-2">
            ✅ Rendu client-only avec fallback
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        title="✅ Solution 2: Hydration-Safe"
        description="Wrapper de sécurité avec APIs sécurisées"
        code={`function SafeConditionalComponent() {
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
}`}
      >
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <HydrationSafeWrapper fallback={<div className="text-gray-500">Chargement...</div>}>
            <SafeBrowserAPI>
              {(api) => {
                const width = api.window?.innerWidth || 1024;
                const isMobile = width < 768;
                return (
                  <div>
                    <div className={isMobile ? 'text-blue-600' : 'text-purple-600'}>
                      {isMobile ? '📱 Vue Mobile' : '🖥️ Vue Desktop'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Largeur détectée: {width}px
                    </div>
                  </div>
                );
              }}
            </SafeBrowserAPI>
          </HydrationSafeWrapper>
          <div className="text-sm text-green-600 mt-2">
            ✅ Hydratation sécurisée avec détection responsive
          </div>
        </div>
      </ExampleCard>
    </ExampleSection>
  );
}

// Exemple 5: LocalStorage
function StorageExamples() {
  return (
    <ExampleSection
      title="💾 LocalStorage"
      description="localStorage n'est pas disponible côté serveur."
    >
      <ExampleCard
        title="❌ Problématique"
        description="Accès direct au localStorage"
        code={`function BadStorageComponent() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );
  return <div className={theme}>Content</div>;
}`}
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <div className="text-red-600">
            ❌ ReferenceError: localStorage is not defined
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        title="✅ Solution"
        description="Accès sécurisé au localStorage"
        code={`function GoodStorageComponent() {
  const [theme, setTheme] = useState('light');
  
  return (
    <SafeBrowserAPI>
      {(api) => {
        useEffect(() => {
          const saved = api.localStorage?.getItem('theme');
          if (saved) setTheme(saved);
        }, [api]);
        
        return (
          <div className={theme}>
            <Button variant="primary" onClick={() => {
              const newTheme = theme === 'light' ? 'dark' : 'light';
              setTheme(newTheme);
              api.localStorage?.setItem('theme', newTheme);
            }>
  {
              const newTheme = theme === 'light' ? 'dark' : 'light';
              setTheme(newTheme);
              api.localStorage?.setItem('theme', newTheme);
            }}>
              Toggle Theme
</Button>
          </div>
        );
      }}
    </SafeBrowserAPI>
  );
}`}
      >
        <StorageExample />
      </ExampleCard>
    </ExampleSection>
  );
}

// Composant pour l'exemple de storage
function StorageExample() {
  const [theme, setTheme] = useState('light');

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded">
      <SafeBrowserAPI>
        {(api) => {
          useEffect(() => {
            const saved = api.localStorage?.getItem('example-theme');
            if (saved) setTheme(saved);
          }, [api]);

          const toggleTheme = () => {
            const newTheme = theme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
            api.localStorage?.setItem('example-theme', newTheme);
          };

          return (
            <div className={theme === 'dark' ? 'bg-gray-800 text-white p-4 rounded' : 'bg-white p-4 rounded border'}>
              <p>Thème actuel: {theme}</p>
              <Button variant="primary" onClick={toggleTheme}>
  Changer le thème
</Button>
            </div>
          );
        }}
      </SafeBrowserAPI>
      <div className="text-sm text-green-600 mt-2">
        ✅ Thème sauvegardé dans localStorage
      </div>
    </div>
  );
}

// Exemple 6: Cas Avancés
function AdvancedExamples() {
  return (
    <ExampleSection
      title="🚀 Cas Avancés"
      description="Combinaisons complexes et patterns avancés."
    >
      <ExampleCard
        title="🎯 Géolocalisation + Météo"
        description="Combinaison d'APIs navigateur et données externes"
      >
        <GeolocationWeatherExample />
      </ExampleCard>

      <ExampleCard
        title="🎨 Thème Système + Préférences"
        description="Détection du thème système avec sauvegarde"
      >
        <SystemThemeExample />
      </ExampleCard>
    </ExampleSection>
  );
}

// Exemple de géolocalisation
function GeolocationWeatherExample() {
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);
  const [weather, setWeather] = useState<{ temperature: number; condition: string } | null>(null);

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <ClientOnly fallback={<div>Chargement de la météo...</div>}>
        <SafeBrowserAPI>
          {(api) => {
            useEffect(() => {
              if (api.navigator?.geolocation) {
                api.navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setLocation({
                      lat: position.coords.latitude.toFixed(2),
                      lng: position.coords.longitude.toFixed(2)
                    });
                    // Simuler des données météo
                    setWeather({
                      temperature: Math.round(Math.random() * 30 + 5),
                      condition: ['Ensoleillé', 'Nuageux', 'Pluvieux'][Math.floor(Math.random() * 3)]
                    });
                  },
                  () => {
                    setLocation({ lat: '48.86', lng: '2.35' }); // Paris par défaut
                    setWeather({ temperature: 18, condition: 'Nuageux' });
                  }
                );
              }
            }, [api]);

            return (
              <div>
                {location ? (
                  <div>
                    <p>📍 Position: {location.lat}, {location.lng}</p>
                    {weather && (
                      <p>🌤️ Météo: {weather.temperature}°C, {weather.condition}</p>
                    )}
                  </div>
                ) : (
                  <p>Récupération de la position...</p>
                )}
              </div>
            );
          }}
        </SafeBrowserAPI>
      </ClientOnly>
      <div className="text-sm text-blue-600 mt-2">
        ✅ Géolocalisation sécurisée avec fallback
      </div>
    </div>
  );
}

// Exemple de thème système
function SystemThemeExample() {
  const [theme, setTheme] = useState('system');
  const [systemTheme, setSystemTheme] = useState('light');

  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded">
      <SafeBrowserAPI>
        {(api) => {
          useEffect(() => {
            if (api.window?.matchMedia) {
              const mediaQuery = api.window.matchMedia('(prefers-color-scheme: dark)');
              setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
              
              const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
              mediaQuery.addEventListener('change', handler);
              
              return () => mediaQuery.removeEventListener('change', handler);
            }
          }, [api]);

          const effectiveTheme = theme === 'system' ? systemTheme : theme;

          return (
            <div className={effectiveTheme === 'dark' ? 'bg-gray-800 text-white p-4 rounded' : 'bg-white p-4 rounded border'}>
              <p>Thème: {theme} (effectif: {effectiveTheme})</p>
              <p>Système: {systemTheme}</p>
              <div className="mt-2 space-x-2">
                <Button variant="primary" onClick={() => setTheme('light')}>
  setTheme('light')}
                  className="px-2 py-1 bg-yellow-400 text-black rounded text-sm"
                >
                  ☀️ Clair
</Button>
                <Button variant="secondary" onClick={() => setTheme('dark')}>
  setTheme('dark')}
                  className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
                >
                  🌙 Sombre
</Button>
                <Button variant="primary" onClick={() => setTheme('system')}>
  setTheme('system')}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  🖥️ Système
</Button>
              </div>
            </div>
          );
        }}
      </SafeBrowserAPI>
      <div className="text-sm text-purple-600 mt-2">
        ✅ Détection du thème système avec préférences utilisateur
      </div>
    </div>
  );
}

// Composants utilitaires
function ExampleSection({ title, description, children }: { 
  title: string; 
  description: string; 
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-white rounded-lg shadow-sm border p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </header>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function ExampleCard({ title, description, code, children }: { 
  title: string; 
  description?: string; 
  code?: string; 
  children: React.ReactNode;
}) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
          {code && (
            <Button variant="primary" onClick={() => setShowCode(!showCode)}>
  setShowCode(!showCode)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showCode ? 'Masquer' : 'Voir'} le code
</Button>
          )}
        </div>
      </div>
      
      {showCode && code && (
        <div className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
          <pre className="text-sm">
            <code>{code}</code>
          </pre>
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}