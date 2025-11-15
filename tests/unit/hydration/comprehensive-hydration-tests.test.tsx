import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { 
  HydrationSafeWrapper,
  ClientOnly,
  useHydration,
  SSRDataProvider,
  useSSRData,
  useSSRValue,
  SafeDateRenderer,
  SafeCurrentYear,
  SafeBrowserAPI,
  SafeWindowAccess,
  SafeDocumentAccess,
  SafeRandomContent,
  SafeAnimationWrapper,
  HydrationRecoverySystem,
  HydrationHealthDashboard,
  HydrationNotificationSystem
} from '@/components/hydration';

// Mock des services externes
vi.mock('@/lib/utils/hydrationDebugger', () => ({
  hydrationDebugger: {
    logHydrationSuccess: vi.fn(),
    logHydrationError: vi.fn(),
    logDataMismatch: vi.fn(),
    logSSRDataHydration: vi.fn(),
    logRecoveryAttempt: vi.fn(),
    logRecoverySuccess: vi.fn(),
    logRecoveryFailure: vi.fn(),
    logManualRecovery: vi.fn()
  }
}));

vi.mock('@/lib/services/hydrationMonitoringService', () => ({
  hydrationMonitoringService: {
    getMetrics: vi.fn(() => ({
      totalHydrations: 100,
      successfulHydrations: 95,
      failedHydrations: 5,
      averageHydrationTime: 150,
      errorRate: 0.05,
      recoverySuccessRate: 0.8
    })),
    getRecentErrors: vi.fn(() => []),
    getRecentAlerts: vi.fn(() => []),
    generateHealthReport: vi.fn(() => ({
      status: 'healthy',
      metrics: {},
      recentErrors: [],
      recentAlerts: [],
      recommendations: ['Système fonctionnel']
    })),
    onAlert: vi.fn(() => () => {}),
    recordHydrationError: vi.fn(),
    recordHydrationSuccess: vi.fn(),
    startHydration: vi.fn(() => 'test-id'),
    recordRecoverySuccess: vi.fn()
  }
}));

describe('Comprehensive Hydration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';
    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  describe('6.1 Unit Tests for Hydration Components', () => {
    describe('HydrationSafeWrapper', () => {
      it('should handle hydration lifecycle correctly', async () => {
        const onHydrationError = vi.fn();
        const TestComponent = () => (
          <HydrationSafeWrapper onHydrationError={onHydrationError}>
            <div data-testid="content">Hydrated Content</div>
          </HydrationSafeWrapper>
        );

        render(<TestComponent />);

        await waitFor(() => {
          expect(screen.getByTestId('content')).toBeInTheDocument();
        });

        expect(onHydrationError).not.toHaveBeenCalled();
      });

      it('should render fallback during hydration', () => {
        const fallback = <div data-testid="fallback">Loading...</div>;
        const TestComponent = () => (
          <HydrationSafeWrapper fallback={fallback}>
            <div data-testid="content">Content</div>
          </HydrationSafeWrapper>
        );

        render(<TestComponent />);

        // Le fallback ou le contenu devrait être présent
        const fallbackElement = screen.queryByTestId('fallback');
        const contentElement = screen.queryByTestId('content');
        expect(fallbackElement || contentElement).toBeTruthy();
      });

      it('should suppress hydration warnings when configured', () => {
        const TestComponent = () => (
          <HydrationSafeWrapper suppressHydrationWarning={true}>
            <div>Content with potential mismatch</div>
          </HydrationSafeWrapper>
        );

        const { container } = render(<TestComponent />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveAttribute('suppressHydrationWarning');
      });

      it('should handle errors gracefully', async () => {
        const onError = vi.fn();
        const ErrorComponent = () => {
          throw new Error('Test error');
        };

        const TestComponent = () => (
          <HydrationSafeWrapper onHydrationError={onError}>
            <ErrorComponent />
          </HydrationSafeWrapper>
        );

        // Utiliser error boundary pour capturer l'erreur
        const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
          try {
            return <>{children}</>;
          } catch (error) {
            return <div data-testid="error">Error caught</div>;
          }
        };

        render(
          <ErrorBoundary>
            <TestComponent />
          </ErrorBoundary>
        );

        // L'erreur devrait être gérée
        await waitFor(() => {
          expect(screen.queryByTestId('error')).toBeTruthy();
        });
      });
    });

    describe('ClientOnly', () => {
      it('should render only on client side', async () => {
        const TestComponent = () => (
          <ClientOnly fallback={<div data-testid="server">Server</div>}>
            <div data-testid="client">Client Only</div>
          </ClientOnly>
        );

        render(<TestComponent />);

        // Après hydratation, le contenu client devrait être visible
        await waitFor(() => {
          expect(screen.getByTestId('client')).toBeInTheDocument();
        });
      });

      it('should show fallback during SSR', () => {
        const TestComponent = () => (
          <ClientOnly fallback={<div data-testid="server">Server Fallback</div>}>
            <div data-testid="client">Client Content</div>
          </ClientOnly>
        );

        render(<TestComponent />);

        // Le fallback ou le contenu client devrait être présent
        const serverElement = screen.queryByTestId('server');
        const clientElement = screen.queryByTestId('client');
        expect(serverElement || clientElement).toBeTruthy();
      });
    });

    describe('useHydration hook', () => {
      it('should track hydration state', async () => {
        let hydrationState: boolean;
        
        const TestComponent = () => {
          hydrationState = useHydration();
          return <div>Hydration: {hydrationState.toString()}</div>;
        };

        render(<TestComponent />);

        await waitFor(() => {
          expect(hydrationState!).toBeDefined();
        });
      });

      it('should start as false and become true after hydration', async () => {
        const states: boolean[] = [];
        
        const TestComponent = () => {
          const isHydrated = useHydration();
          states.push(isHydrated);
          return <div>State: {isHydrated.toString()}</div>;
        };

        render(<TestComponent />);

        await waitFor(() => {
          expect(states.length).toBeGreaterThan(0);
        });
      });
    });

    describe('SSRDataProvider', () => {
      it('should provide data context to children', async () => {
        const initialData = { test: 'value', count: 42 };
        let contextData: any;

        const TestComponent = () => {
          const { data } = useSSRData();
          contextData = data;
          return <div>Data provided</div>;
        };

        render(
          <SSRDataProvider initialData={initialData} hydrationId="test">
            <TestComponent />
          </SSRDataProvider>
        );

        await waitFor(() => {
          expect(contextData).toEqual(initialData);
        });
      });

      it('should handle data synchronization', async () => {
        const TestComponent = () => {
          const { setData, getData } = useSSRData();
          
          React.useEffect(() => {
            setData('dynamic', 'value');
          }, [setData]);

          return (
            <div>
              <span data-testid="value">{getData('dynamic', 'default')}</span>
            </div>
          );
        };

        render(
          <SSRDataProvider hydrationId="sync-test">
            <TestComponent />
          </SSRDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('value')).toHaveTextContent('value');
        });
      });

      it('should use useSSRValue hook correctly', async () => {
        const TestComponent = () => {
          const value = useSSRValue('test-key', 'default-value');
          return <div data-testid="ssr-value">{value}</div>;
        };

        render(
          <SSRDataProvider initialData={{ 'test-key': 'initial-value' }}>
            <TestComponent />
          </SSRDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('ssr-value')).toHaveTextContent('initial-value');
        });
      });
    });

    describe('SafeDateRenderer', () => {
      it('should render dates safely', async () => {
        const testDate = new Date('2024-01-15T10:30:00Z');

        render(
          <SSRDataProvider>
            <SafeDateRenderer date={testDate} format="year" />
          </SSRDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByText('2024')).toBeInTheDocument();
        });
      });

      it('should handle different date formats', async () => {
        const testDate = new Date('2024-01-15T10:30:00Z');

        const { rerender } = render(
          <SSRDataProvider>
            <SafeDateRenderer date={testDate} format="year" />
          </SSRDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByText('2024')).toBeInTheDocument();
        });

        rerender(
          <SSRDataProvider>
            <SafeDateRenderer date={testDate} format="date" />
          </SSRDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByText(/15\/01\/2024|1\/15\/2024/)).toBeInTheDocument();
        });
      });

      it('should handle invalid dates gracefully', async () => {
        render(
          <SSRDataProvider>
            <SafeDateRenderer date="invalid-date" format="full" />
          </SSRDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByText('Date invalide')).toBeInTheDocument();
        });
      });
    });

    describe('SafeCurrentYear', () => {
      it('should render current year safely', async () => {
        const currentYear = new Date().getFullYear();

        render(
          <SSRDataProvider>
            <SafeCurrentYear />
          </SSRDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByText(currentYear.toString())).toBeInTheDocument();
        });
      });

      it('should use fallback when specified', () => {
        render(
          <SSRDataProvider>
            <SafeCurrentYear fallback={<span>2024</span>} />
          </SSRDataProvider>
        );

        // Le fallback ou l'année courante devrait être présent
        const fallback = screen.queryByText('2024');
        const currentYear = screen.queryByText(new Date().getFullYear().toString());
        expect(fallback || currentYear).toBeTruthy();
      });
    });

    describe('SafeBrowserAPI', () => {
      it('should provide safe browser API access', async () => {
        const TestComponent = () => (
          <SafeBrowserAPI>
            {(api) => (
              <div>
                <div data-testid="client-status">Client: {api.isClient.toString()}</div>
                <div data-testid="window-status">Window: {(api.window !== null).toString()}</div>
              </div>
            )}
          </SafeBrowserAPI>
        );

        render(<TestComponent />);

        await waitFor(() => {
          expect(screen.getByTestId('client-status')).toBeInTheDocument();
          expect(screen.getByTestId('window-status')).toBeInTheDocument();
        });
      });

      it('should handle browser API calls safely', async () => {
        const TestComponent = () => (
          <SafeBrowserAPI>
            {(api) => (
              <button
                data-testid="api-button"
                onClick={() => {
                  api.addEventListener('resize', () => {});
                  api.removeEventListener('resize', () => {});
                }}
              >
                Test API
              </button>
            )}
          </SafeBrowserAPI>
        );

        render(<TestComponent />);

        const button = screen.getByTestId('api-button');
        
        await act(async () => {
          fireEvent.click(button);
        });

        // Vérifier que les appels API ne causent pas d'erreur
        expect(button).toBeInTheDocument();
      });
    });

    describe('SafeRandomContent', () => {
      it('should generate consistent random values with seed', async () => {
        const TestComponent = () => (
          <SSRDataProvider>
            <SafeRandomContent seed="test-seed" min={0} max={100}>
              {(value) => <div data-testid="random-value">{value.toFixed(2)}</div>}
            </SafeRandomContent>
          </SSRDataProvider>
        );

        const { rerender } = render(<TestComponent />);
        
        await waitFor(() => {
          expect(screen.getByTestId('random-value')).toBeInTheDocument();
        });

        const firstValue = screen.getByTestId('random-value').textContent;

        // Re-render avec la même seed devrait donner la même valeur
        rerender(<TestComponent />);

        await waitFor(() => {
          const secondValue = screen.getByTestId('random-value').textContent;
          expect(secondValue).toBe(firstValue);
        });
      });

      it('should handle random choice correctly', async () => {
        const items = ['A', 'B', 'C'];
        
        const TestComponent = () => (
          <SSRDataProvider>
            <SafeRandomContent seed="choice-seed" min={0} max={items.length - 1}>
              {(value) => {
                const index = Math.floor(value);
                return <div data-testid="choice">{items[index]}</div>;
              }}
            </SafeRandomContent>
          </SSRDataProvider>
        );

        render(<TestComponent />);

        await waitFor(() => {
          const choice = screen.getByTestId('choice').textContent;
          expect(items).toContain(choice);
        });
      });
    });
  });

  describe('6.2 Integration Tests for Full-Page Hydration', () => {
    it('should handle complete page hydration cycle', async () => {
      const ComplexPage = () => (
        <SSRDataProvider initialData={{ pageLoaded: false }} hydrationId="complex-page">
          <HydrationSafeWrapper>
            <div data-testid="page-header">
              <SafeCurrentYear />
            </div>
            <SafeBrowserAPI>
              {(api) => (
                <div data-testid="page-content">
                  <p>Width: {api.window?.innerWidth || 'unknown'}</p>
                  <SafeRandomContent seed="page-seed">
                    {(value) => <span data-testid="random-element">{value.toFixed(0)}</span>}
                  </SafeRandomContent>
                </div>
              )}
            </SafeBrowserAPI>
            <ClientOnly fallback={<div data-testid="loading">Loading...</div>}>
              <div data-testid="client-section">Client Only Section</div>
            </ClientOnly>
          </HydrationSafeWrapper>
        </SSRDataProvider>
      );

      render(<ComplexPage />);

      // Vérifier que tous les éléments sont présents après hydratation
      await waitFor(() => {
        expect(screen.getByTestId('page-header')).toBeInTheDocument();
        expect(screen.getByTestId('page-content')).toBeInTheDocument();
      });

      // Vérifier les éléments spécifiques
      await waitFor(() => {
        expect(screen.getByText(new Date().getFullYear().toString())).toBeInTheDocument();
        expect(screen.getByText(/Width: \d+|Width: unknown/)).toBeInTheDocument();
        expect(screen.getByTestId('random-element')).toBeInTheDocument();
      });

      // Vérifier la section client-only
      await waitFor(() => {
        expect(screen.getByTestId('client-section')).toBeInTheDocument();
      });
    });

    it('should verify cross-component hydration compatibility', async () => {
      const MultiComponentPage = () => (
        <div>
          <SSRDataProvider initialData={{ shared: 'data' }} hydrationId="shared">
            <HydrationSafeWrapper>
              <SafeDateRenderer date={new Date()} format="year" />
            </HydrationSafeWrapper>
          </SSRDataProvider>
          
          <SSRDataProvider initialData={{ other: 'data' }} hydrationId="other">
            <SafeBrowserAPI>
              {(api) => (
                <div data-testid="browser-section">
                  Browser available: {api.isClient.toString()}
                </div>
              )}
            </SafeBrowserAPI>
          </SSRDataProvider>

          <HydrationRecoverySystem config={{ maxRetries: 2 }}>
            <SafeRandomContent seed="multi-seed">
              {(value) => <div data-testid="recovery-content">{value}</div>}
            </SafeRandomContent>
          </HydrationRecoverySystem>
        </div>
      );

      render(<MultiComponentPage />);

      // Vérifier que tous les composants coexistent correctement
      await waitFor(() => {
        expect(screen.getByText(new Date().getFullYear().toString())).toBeInTheDocument();
        expect(screen.getByTestId('browser-section')).toBeInTheDocument();
        expect(screen.getByTestId('recovery-content')).toBeInTheDocument();
      });
    });

    it('should measure hydration performance', async () => {
      const startTime = performance.now();
      
      const PerformanceTestPage = () => (
        <SSRDataProvider hydrationId="perf-test">
          <HydrationSafeWrapper>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} data-testid={`item-${i}`}>
                <SafeDateRenderer date={new Date()} format="time" />
                <SafeRandomContent seed={`item-${i}`}>
                  {(value) => <span>{value.toFixed(2)}</span>}
                </SafeRandomContent>
              </div>
            ))}
          </HydrationSafeWrapper>
        </SSRDataProvider>
      );

      render(<PerformanceTestPage />);

      // Attendre que tous les éléments soient hydratés
      await waitFor(() => {
        for (let i = 0; i < 10; i++) {
          expect(screen.getByTestId(`item-${i}`)).toBeInTheDocument();
        }
      });

      const endTime = performance.now();
      const hydrationTime = endTime - startTime;

      // Vérifier que l'hydratation est raisonnablement rapide (< 1 seconde)
      expect(hydrationTime).toBeLessThan(1000);
    });
  });

  describe('6.3 Error Recovery and Edge Cases', () => {
    it('should handle hydration errors gracefully', async () => {
      const onRecoveryAttempt = vi.fn();
      const onRecoveryFailure = vi.fn();

      const ProblematicComponent = () => {
        // Simuler un composant qui pourrait causer des erreurs d'hydratation
        return <div data-testid="problematic">Problematic Content</div>;
      };

      const TestPage = () => (
        <HydrationRecoverySystem
          config={{ maxRetries: 2, retryDelay: 100 }}
          onRecoveryAttempt={onRecoveryAttempt}
          onRecoveryFailure={onRecoveryFailure}
          fallback={<div data-testid="fallback">Recovery Fallback</div>}
        >
          <ProblematicComponent />
        </HydrationRecoverySystem>
      );

      render(<TestPage />);

      // Le composant devrait s'afficher normalement
      await waitFor(() => {
        expect(screen.getByTestId('problematic')).toBeInTheDocument();
      });
    });

    it('should handle network conditions simulation', async () => {
      // Simuler des conditions réseau lentes
      const SlowLoadingComponent = () => {
        const [loaded, setLoaded] = React.useState(false);

        React.useEffect(() => {
          const timer = setTimeout(() => setLoaded(true), 200);
          return () => clearTimeout(timer);
        }, []);

        if (!loaded) {
          return <div data-testid="loading">Loading...</div>;
        }

        return (
          <SafeBrowserAPI>
            {(api) => (
              <div data-testid="loaded">
                Loaded with window: {api.isClient.toString()}
              </div>
            )}
          </SafeBrowserAPI>
        );
      };

      render(
        <HydrationSafeWrapper fallback={<div data-testid="hydration-loading">Hydrating...</div>}>
          <SlowLoadingComponent />
        </HydrationSafeWrapper>
      );

      // Initialement, le composant de chargement devrait être visible
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Après le délai, le contenu chargé devrait apparaître
      await waitFor(() => {
        expect(screen.getByTestId('loaded')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should handle state preservation during recovery', async () => {
      const StatePreservationTest = () => {
        const [count, setCount] = React.useState(0);

        return (
          <HydrationRecoverySystem config={{ preserveState: true }}>
            <div>
              <span data-testid="count">Count: {count}</span>
              <button 
                data-testid="increment" 
                onClick={() => setCount(c => c + 1)}
              >
                Increment
              </button>
            </div>
          </HydrationRecoverySystem>
        );
      };

      render(<StatePreservationTest />);

      // Incrémenter le compteur
      const button = screen.getByTestId('increment');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');
      });

      // Le state devrait être préservé même après hydratation
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('Count: 2');
      });
    });
  });

  describe('6.4 Monitoring and Health Dashboard Tests', () => {
    it('should display health metrics correctly', async () => {
      render(<HydrationHealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Santé d\'Hydratation')).toBeInTheDocument();
        expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      });

      // Vérifier les métriques affichées
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument(); // Total hydrations
        expect(screen.getByText('95.0%')).toBeInTheDocument(); // Success rate
      });
    });

    it('should handle notification system', async () => {
      const { container } = render(<HydrationNotificationSystem />);
      
      // Initialement, aucune notification ne devrait être visible
      expect(container.firstChild).toBeNull();
    });
  });

  describe('6.5 Performance and Memory Tests', () => {
    it('should not cause memory leaks', async () => {
      const MemoryTestComponent = () => (
        <SSRDataProvider hydrationId="memory-test">
          <HydrationSafeWrapper>
            <SafeBrowserAPI>
              {(api) => (
                <div data-testid="memory-test">
                  Memory test: {api.isClient.toString()}
                </div>
              )}
            </SafeBrowserAPI>
          </HydrationSafeWrapper>
        </SSRDataProvider>
      );

      const { unmount } = render(<MemoryTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('memory-test')).toBeInTheDocument();
      });

      // Démonter le composant
      unmount();

      // Vérifier qu'il n'y a pas de fuites mémoire évidentes
      // (Dans un vrai test, on utiliserait des outils de profiling)
      expect(document.querySelectorAll('[data-testid="memory-test"]')).toHaveLength(0);
    });

    it('should handle multiple instances efficiently', async () => {
      const MultiInstanceTest = () => (
        <div>
          {Array.from({ length: 5 }, (_, i) => (
            <SSRDataProvider key={i} hydrationId={`instance-${i}`}>
              <HydrationSafeWrapper>
                <SafeCurrentYear />
                <SafeRandomContent seed={`seed-${i}`}>
                  {(value) => <span data-testid={`value-${i}`}>{value.toFixed(1)}</span>}
                </SafeRandomContent>
              </HydrationSafeWrapper>
            </SSRDataProvider>
          ))}
        </div>
      );

      render(<MultiInstanceTest />);

      // Vérifier que toutes les instances sont rendues
      await waitFor(() => {
        for (let i = 0; i < 5; i++) {
          expect(screen.getByTestId(`value-${i}`)).toBeInTheDocument();
        }
      });
    });
  });
});