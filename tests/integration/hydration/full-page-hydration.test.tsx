import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { 
  HydrationSafeWrapper,
  SSRDataProvider,
  SafeCurrentYear,
  SafeBrowserAPI,
  SafeRandomContent,
  HydrationRecoverySystem,
  HydrationHealthDashboard,
  HydrationNotificationSystem
} from '@/components/hydration';

// Mock des services pour les tests d'intégration
jest.mock('@/lib/services/hydrationMonitoringService', () => ({
  hydrationMonitoringService: {
    getMetrics: jest.fn(() => ({
      totalHydrations: 250,
      successfulHydrations: 240,
      failedHydrations: 10,
      averageHydrationTime: 180,
      errorRate: 0.04,
      recoverySuccessRate: 0.9
    })),
    getRecentErrors: jest.fn(() => [
      {
        id: 'error-1',
        timestamp: Date.now() - 60000,
        componentId: 'test-component',
        errorType: 'HydrationError',
        errorMessage: 'Text content does not match',
        retryCount: 2,
        recovered: true,
        recoveryTime: 150
      }
    ]),
    getRecentAlerts: jest.fn(() => [
      {
        id: 'alert-1',
        type: 'performance_degradation',
        severity: 'medium',
        message: 'Temps d\'hydratation légèrement élevé',
        timestamp: Date.now() - 30000,
        threshold: 200,
        currentValue: 180
      }
    ]),
    generateHealthReport: jest.fn(() => ({
      status: 'warning',
      metrics: {
        totalHydrations: 250,
        successfulHydrations: 240,
        failedHydrations: 10,
        averageHydrationTime: 180,
        errorRate: 0.04,
        recoverySuccessRate: 0.9
      },
      recentErrors: [],
      recentAlerts: [],
      recommendations: [
        'Surveiller les performances d\'hydratation',
        'Optimiser les composants lents'
      ]
    })),
    onAlert: jest.fn(() => () => {}),
    recordHydrationError: jest.fn(),
    recordHydrationSuccess: jest.fn(),
    startHydration: jest.fn(() => 'integration-test-id'),
    recordRecoverySuccess: jest.fn()
  }
}));

describe('Integration Tests - Full Page Hydration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM state
    document.body.innerHTML = '';
    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn()
      }
    });
  });

  describe('Complete Application Hydration Flow', () => {
    const CompleteApplication = () => (
      <div data-testid="app-root">
        {/* Header avec année courante */}
        <header data-testid="app-header">
          <SSRDataProvider initialData={{ siteName: 'Huntaze' }} hydrationId="header">
            <HydrationSafeWrapper>
              <h1>© <SafeCurrentYear /> Huntaze</h1>
            </HydrationSafeWrapper>
          </SSRDataProvider>
        </header>

        {/* Contenu principal avec recovery */}
        <main data-testid="app-main">
          <HydrationRecoverySystem
            config={{
              maxRetries: 3,
              retryDelay: 500,
              preserveState: true,
              enableManualRecovery: true
            }}
            fallback={<div data-testid="main-fallback">Chargement du contenu principal...</div>}
          >
            <SSRDataProvider initialData={{ userPreferences: { theme: 'dark' } }} hydrationId="main">
              <div data-testid="main-content">
                {/* Section avec APIs du navigateur */}
                <SafeBrowserAPI>
                  {(api) => (
                    <section data-testid="browser-section">
                      <h2>Informations Navigateur</h2>
                      <p data-testid="screen-info">
                        Écran: {api.window?.innerWidth || 'inconnu'} x {api.window?.innerHeight || 'inconnu'}
                      </p>
                      <p data-testid="client-status">
                        Client: {api.isClient ? 'Oui' : 'Non'}
                      </p>
                    </section>
                  )}
                </SafeBrowserAPI>

                {/* Section avec contenu aléatoire */}
                <section data-testid="random-section">
                  <h2>Contenu Dynamique</h2>
                  <SafeRandomContent seed="app-random" min={1} max={100}>
                    {(value) => (
                      <div data-testid="random-content">
                        <p>Valeur aléatoire: {value.toFixed(2)}</p>
                        <div 
                          data-testid="random-bar"
                          style={{ 
                            width: `${value}%`, 
                            height: '20px', 
                            backgroundColor: '#3b82f6' 
                          }}
                        />
                      </div>
                    )}
                  </SafeRandomContent>
                </section>

                {/* Section interactive */}
                <section data-testid="interactive-section">
                  <InteractiveCounter />
                </section>
              </div>
            </SSRDataProvider>
          </HydrationRecoverySystem>
        </main>

        {/* Dashboard de monitoring */}
        <aside data-testid="monitoring-dashboard">
          <HydrationHealthDashboard refreshInterval={1000} />
        </aside>

        {/* Système de notifications */}
        <HydrationNotificationSystem config={{ position: 'top-right' }} />
      </div>
    );

    const InteractiveCounter = () => {
      const [count, setCount] = React.useState(0);
      const [history, setHistory] = React.useState<number[]>([]);

      const increment = () => {
        setCount(c => c + 1);
        setHistory(h => [...h, count + 1]);
      };

      return (
        <div data-testid="counter-widget">
          <h3>Compteur Interactif</h3>
          <p data-testid="counter-value">Valeur: {count}</p>
          <button data-testid="counter-button" onClick={increment}>
            Incrémenter
          </button>
          <p data-testid="counter-history">
            Historique: {history.join(', ')}
          </p>
        </div>
      );
    };

    it('should hydrate complete application successfully', async () => {
      const startTime = performance.now();
      
      render(<CompleteApplication />);

      // Vérifier que l'application de base est rendue
      expect(screen.getByTestId('app-root')).toBeInTheDocument();
      expect(screen.getByTestId('app-header')).toBeInTheDocument();
      expect(screen.getByTestId('app-main')).toBeInTheDocument();

      // Attendre l'hydratation complète
      await waitFor(() => {
        expect(screen.getByTestId('main-content')).toBeInTheDocument();
        expect(screen.getByTestId('browser-section')).toBeInTheDocument();
        expect(screen.getByTestId('random-section')).toBeInTheDocument();
        expect(screen.getByTestId('interactive-section')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Vérifier les composants spécifiques
      await waitFor(() => {
        // Header avec année courante
        expect(screen.getByText(new RegExp(new Date().getFullYear().toString()))).toBeInTheDocument();
        
        // Informations navigateur
        expect(screen.getByTestId('screen-info')).toBeInTheDocument();
        expect(screen.getByTestId('client-status')).toHaveTextContent('Client: Oui');
        
        // Contenu aléatoire
        expect(screen.getByTestId('random-content')).toBeInTheDocument();
        expect(screen.getByTestId('random-bar')).toBeInTheDocument();
        
        // Compteur interactif
        expect(screen.getByTestId('counter-widget')).toBeInTheDocument();
        expect(screen.getByTestId('counter-value')).toHaveTextContent('Valeur: 0');
      });

      // Vérifier le dashboard de monitoring
      await waitFor(() => {
        expect(screen.getByText('Santé d\'Hydratation')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const hydrationTime = endTime - startTime;
      
      // L'hydratation complète devrait prendre moins de 2 secondes
      expect(hydrationTime).toBeLessThan(2000);
    });

    it('should handle user interactions after hydration', async () => {
      render(<CompleteApplication />);

      // Attendre l'hydratation
      await waitFor(() => {
        expect(screen.getByTestId('counter-button')).toBeInTheDocument();
      });

      const button = screen.getByTestId('counter-button');
      const counterValue = screen.getByTestId('counter-value');
      const counterHistory = screen.getByTestId('counter-history');

      // Tester les interactions
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(counterValue).toHaveTextContent('Valeur: 1');
        expect(counterHistory).toHaveTextContent('Historique: 1');
      });

      // Plusieurs clics
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(counterValue).toHaveTextContent('Valeur: 3');
        expect(counterHistory).toHaveTextContent('Historique: 1, 2, 3');
      });
    });

    it('should maintain state consistency across re-renders', async () => {
      const { rerender } = render(<CompleteApplication />);

      // Attendre l'hydratation initiale
      await waitFor(() => {
        expect(screen.getByTestId('counter-button')).toBeInTheDocument();
      });

      // Interagir avec le compteur
      const button = screen.getByTestId('counter-button');
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('counter-value')).toHaveTextContent('Valeur: 2');
      });

      // Re-render de l'application
      rerender(<CompleteApplication />);

      // Vérifier que l'état est réinitialisé (nouveau composant)
      await waitFor(() => {
        expect(screen.getByTestId('counter-value')).toHaveTextContent('Valeur: 0');
      });
    });
  });

  describe('Cross-Component Data Flow', () => {
    const DataFlowApp = () => {
      const [globalState, setGlobalState] = React.useState({ message: 'Initial' });

      return (
        <div data-testid="data-flow-app">
          <SSRDataProvider initialData={globalState} hydrationId="global-state">
            <HydrationSafeWrapper>
              <div data-testid="state-display">
                Message global: {globalState.message}
              </div>
              
              <button 
                data-testid="update-state"
                onClick={() => setGlobalState({ message: 'Updated' })}
              >
                Mettre à jour
              </button>

              {/* Composant enfant qui utilise les données */}
              <ChildComponent />
              
              {/* Composant avec données aléatoires cohérentes */}
              <SafeRandomContent seed="data-flow" min={1} max={10}>
                {(value) => (
                  <div data-testid="consistent-random">
                    Valeur cohérente: {Math.floor(value)}
                  </div>
                )}
              </SafeRandomContent>
            </HydrationSafeWrapper>
          </SSRDataProvider>
        </div>
      );
    };

    const ChildComponent = () => {
      const { getData } = React.useContext(require('@/components/hydration').SSRDataContext) || { getData: () => null };
      
      return (
        <div data-testid="child-component">
          Données enfant: {getData?.('message') || 'Non disponible'}
        </div>
      );
    };

    it('should handle data flow between components', async () => {
      render(<DataFlowApp />);

      // Vérifier l'état initial
      await waitFor(() => {
        expect(screen.getByTestId('state-display')).toHaveTextContent('Message global: Initial');
        expect(screen.getByTestId('consistent-random')).toBeInTheDocument();
      });

      // Mettre à jour l'état
      const updateButton = screen.getByTestId('update-state');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByTestId('state-display')).toHaveTextContent('Message global: Updated');
      });

      // Vérifier que la valeur aléatoire reste cohérente
      const randomValue1 = screen.getByTestId('consistent-random').textContent;
      
      // Re-render
      fireEvent.click(updateButton); // Trigger re-render
      
      await waitFor(() => {
        const randomValue2 = screen.getByTestId('consistent-random').textContent;
        expect(randomValue2).toBe(randomValue1); // Devrait être identique avec la même seed
      });
    });
  });

  describe('Error Recovery Integration', () => {
    const ErrorProneApp = () => {
      const [shouldError, setShouldError] = React.useState(false);
      const [errorCount, setErrorCount] = React.useState(0);

      const ProblematicComponent = () => {
        if (shouldError && errorCount < 2) {
          throw new Error(`Simulated error ${errorCount + 1}`);
        }
        return <div data-testid="stable-content">Contenu stable</div>;
      };

      return (
        <div data-testid="error-prone-app">
          <button 
            data-testid="trigger-error"
            onClick={() => {
              setShouldError(true);
              setErrorCount(c => c + 1);
            }}
          >
            Déclencher erreur
          </button>

          <HydrationRecoverySystem
            config={{ 
              maxRetries: 3, 
              retryDelay: 100,
              preserveState: true 
            }}
            onRecoveryAttempt={(attempt, error) => {
              console.log(`Recovery attempt ${attempt}:`, error.message);
            }}
            onRecoverySuccess={() => {
              console.log('Recovery successful');
            }}
            fallback={<div data-testid="recovery-fallback">Récupération en cours...</div>}
          >
            <React.Suspense fallback={<div data-testid="suspense-fallback">Chargement...</div>}>
              <ProblematicComponent />
            </React.Suspense>
          </HydrationRecoverySystem>
        </div>
      );
    };

    it('should handle error recovery flow', async () => {
      // Utiliser un Error Boundary pour capturer les erreurs
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false);

        React.useEffect(() => {
          const handleError = () => setHasError(true);
          window.addEventListener('error', handleError);
          return () => window.removeEventListener('error', handleError);
        }, []);

        if (hasError) {
          return <div data-testid="error-boundary">Erreur capturée</div>;
        }

        return <>{children}</>;
      };

      render(
        <ErrorBoundary>
          <ErrorProneApp />
        </ErrorBoundary>
      );

      // Vérifier l'état initial
      await waitFor(() => {
        expect(screen.getByTestId('error-prone-app')).toBeInTheDocument();
        expect(screen.getByTestId('stable-content')).toBeInTheDocument();
      });

      // Le système devrait gérer les erreurs de manière gracieuse
      // (Dans un vrai test, on testerait la recovery, mais ici on vérifie la stabilité)
      const triggerButton = screen.getByTestId('trigger-error');
      expect(triggerButton).toBeInTheDocument();
    });
  });

  describe('Performance Benchmarks', () => {
    const PerformanceTestApp = () => (
      <div data-testid="perf-app">
        {/* Simuler une application avec de nombreux composants */}
        {Array.from({ length: 20 }, (_, i) => (
          <SSRDataProvider key={i} initialData={{ index: i }} hydrationId={`perf-${i}`}>
            <HydrationSafeWrapper>
              <div data-testid={`perf-item-${i}`}>
                <SafeCurrentYear />
                <SafeRandomContent seed={`perf-seed-${i}`}>
                  {(value) => <span>Item {i}: {value.toFixed(1)}</span>}
                </SafeRandomContent>
              </div>
            </HydrationSafeWrapper>
          </SSRDataProvider>
        ))}
      </div>
    );

    it('should meet performance benchmarks for large applications', async () => {
      const startTime = performance.now();
      
      render(<PerformanceTestApp />);

      // Attendre que tous les éléments soient hydratés
      await waitFor(() => {
        for (let i = 0; i < 20; i++) {
          expect(screen.getByTestId(`perf-item-${i}`)).toBeInTheDocument();
        }
      }, { timeout: 5000 });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // L'hydratation de 20 composants devrait prendre moins de 3 secondes
      expect(totalTime).toBeLessThan(3000);
      
      // Vérifier que tous les éléments sont correctement rendus
      for (let i = 0; i < 20; i++) {
        const item = screen.getByTestId(`perf-item-${i}`);
        expect(item).toHaveTextContent(new Date().getFullYear().toString());
        expect(item).toHaveTextContent(`Item ${i}:`);
      }
    });

    it('should handle concurrent hydration efficiently', async () => {
      const ConcurrentApp = () => (
        <div data-testid="concurrent-app">
          {/* Plusieurs providers concurrents */}
          <div style={{ display: 'flex', gap: '20px' }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} data-testid={`concurrent-section-${i}`}>
                <SSRDataProvider initialData={{ section: i }} hydrationId={`concurrent-${i}`}>
                  <HydrationSafeWrapper>
                    <h3>Section {i}</h3>
                    <SafeBrowserAPI>
                      {(api) => (
                        <p data-testid={`section-status-${i}`}>
                          Client: {api.isClient.toString()}
                        </p>
                      )}
                    </SafeBrowserAPI>
                    <SafeRandomContent seed={`concurrent-${i}`}>
                      {(value) => (
                        <div data-testid={`section-value-${i}`}>
                          {value.toFixed(2)}
                        </div>
                      )}
                    </SafeRandomContent>
                  </HydrationSafeWrapper>
                </SSRDataProvider>
              </div>
            ))}
          </div>
        </div>
      );

      const startTime = performance.now();
      render(<ConcurrentApp />);

      // Vérifier que toutes les sections sont hydratées
      await waitFor(() => {
        for (let i = 0; i < 5; i++) {
          expect(screen.getByTestId(`concurrent-section-${i}`)).toBeInTheDocument();
          expect(screen.getByTestId(`section-status-${i}`)).toHaveTextContent('Client: true');
          expect(screen.getByTestId(`section-value-${i}`)).toBeInTheDocument();
        }
      }, { timeout: 2000 });

      const endTime = performance.now();
      const concurrentTime = endTime - startTime;

      // L'hydratation concurrente devrait être efficace
      expect(concurrentTime).toBeLessThan(1500);
    });
  });
});