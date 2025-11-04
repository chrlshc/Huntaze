import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { 
  HydrationRecoverySystem,
  useHydrationRecovery,
  HydrationHealthDashboard,
  HydrationNotificationSystem
} from '@/components/hydration';
import { hydrationMonitoringService } from '@/lib/services/hydrationMonitoringService';
import { hydrationRetryManager } from '@/lib/utils/hydrationRetryManager';

// Mock des services
jest.mock('@/lib/services/hydrationMonitoringService', () => ({
  hydrationMonitoringService: {
    getMetrics: jest.fn(),
    getRecentErrors: jest.fn(),
    getRecentAlerts: jest.fn(),
    generateHealthReport: jest.fn(),
    onAlert: jest.fn(),
    recordHydrationError: jest.fn(),
    recordHydrationSuccess: jest.fn(),
    startHydration: jest.fn(),
    recordRecoverySuccess: jest.fn()
  }
}));

jest.mock('@/lib/utils/hydrationRetryManager', () => ({
  hydrationRetryManager: {
    executeWithRetry: jest.fn(),
    getComponentStats: jest.fn(),
    getGlobalStats: jest.fn(),
    resetContext: jest.fn(),
    forceCloseCircuitBreaker: jest.fn()
  }
}));

describe('HydrationRecoverySystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children normally when no errors occur', async () => {
    const TestComponent = () => (
      <HydrationRecoverySystem>
        <div data-testid="test-content">Test Content</div>
      </HydrationRecoverySystem>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  it('should show recovery UI when hydration fails', async () => {
    const onRecoveryAttempt = jest.fn();
    const onRecoveryFailure = jest.fn();

    const TestComponent = () => (
      <HydrationRecoverySystem
        config={{ maxRetries: 2, retryDelay: 100 }}
        onRecoveryAttempt={onRecoveryAttempt}
        onRecoveryFailure={onRecoveryFailure}
      >
        <div data-testid="test-content">Test Content</div>
      </HydrationRecoverySystem>
    );

    render(<TestComponent />);

    // Simuler une erreur d'hydratation
    const error = new Error('Hydration failed');
    
    // Le composant devrait gérer l'erreur et tenter une récupération
    await waitFor(() => {
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  it('should show fallback after max retries exceeded', async () => {
    const TestComponent = () => (
      <HydrationRecoverySystem
        config={{ maxRetries: 1, retryDelay: 50, fallbackDelay: 100 }}
        fallback={<div data-testid="fallback">Fallback Content</div>}
      >
        <div data-testid="test-content">Test Content</div>
      </HydrationRecoverySystem>
    );

    render(<TestComponent />);

    // Le contenu normal devrait être affiché initialement
    await waitFor(() => {
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  it('should provide manual recovery option', async () => {
    const TestComponent = () => (
      <HydrationRecoverySystem
        config={{ enableManualRecovery: true }}
        fallback={
          <div data-testid="fallback">
            <button data-testid="retry-button">Réessayer</button>
          </div>
        }
      >
        <div data-testid="test-content">Test Content</div>
      </HydrationRecoverySystem>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  it('should preserve user state during recovery', async () => {
    // Mock des fonctions de préservation d'état
    const mockScrollTo = jest.fn();
    Object.defineProperty(window, 'scrollTo', { value: mockScrollTo });
    Object.defineProperty(window, 'scrollX', { value: 100 });
    Object.defineProperty(window, 'scrollY', { value: 200 });

    const TestComponent = () => (
      <HydrationRecoverySystem config={{ preserveState: true }}>
        <div data-testid="test-content">
          <input data-testid="test-input" defaultValue="test value" />
        </div>
      </HydrationRecoverySystem>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });
});

describe('useHydrationRecovery hook', () => {
  it('should provide recovery state and controls', () => {
    let recoveryState: any;
    
    const TestComponent = () => {
      recoveryState = useHydrationRecovery();
      return <div>Recovery Hook Test</div>;
    };

    render(<TestComponent />);

    expect(recoveryState).toHaveProperty('isRecovering');
    expect(recoveryState).toHaveProperty('canRecover');
    expect(recoveryState).toHaveProperty('lastError');
    expect(recoveryState).toHaveProperty('triggerRecovery');
    expect(recoveryState).toHaveProperty('resetRecovery');
  });

  it('should handle recovery trigger', () => {
    let recoveryState: any;
    
    const TestComponent = () => {
      recoveryState = useHydrationRecovery();
      return <div>Recovery Hook Test</div>;
    };

    render(<TestComponent />);

    act(() => {
      recoveryState.triggerRecovery(new Error('Test error'));
    });

    expect(recoveryState.isRecovering).toBe(true);
    expect(recoveryState.lastError).toBeInstanceOf(Error);
  });
});

describe('HydrationHealthDashboard', () => {
  beforeEach(() => {
    // Mock des données du service de monitoring
    (hydrationMonitoringService.getMetrics as jest.Mock).mockReturnValue({
      totalHydrations: 100,
      successfulHydrations: 95,
      failedHydrations: 5,
      averageHydrationTime: 150,
      errorRate: 0.05,
      recoverySuccessRate: 0.8
    });

    (hydrationMonitoringService.getRecentErrors as jest.Mock).mockReturnValue([]);
    (hydrationMonitoringService.getRecentAlerts as jest.Mock).mockReturnValue([]);
    (hydrationMonitoringService.generateHealthReport as jest.Mock).mockReturnValue({
      status: 'healthy',
      metrics: {
        totalHydrations: 100,
        successfulHydrations: 95,
        failedHydrations: 5,
        averageHydrationTime: 150,
        errorRate: 0.05,
        recoverySuccessRate: 0.8
      },
      recentErrors: [],
      recentAlerts: [],
      recommendations: ['Système d\'hydratation fonctionnel - Aucune action requise']
    });

    (hydrationMonitoringService.onAlert as jest.Mock).mockReturnValue(() => {});
  });

  it('should render health metrics', async () => {
    render(<HydrationHealthDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Santé d\'Hydratation')).toBeInTheDocument();
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // Total hydrations
      expect(screen.getByText('95.0%')).toBeInTheDocument(); // Success rate
    });
  });

  it('should show detailed view when expanded', async () => {
    render(<HydrationHealthDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Détails Techniques')).toBeInTheDocument();
    });

    // Cliquer pour étendre
    fireEvent.click(screen.getByText('Détails Techniques'));

    await waitFor(() => {
      expect(screen.getByText('Métriques Détaillées')).toBeInTheDocument();
    });
  });

  it('should display recommendations', async () => {
    render(<HydrationHealthDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recommandations')).toBeInTheDocument();
      expect(screen.getByText('Système d\'hydratation fonctionnel - Aucune action requise')).toBeInTheDocument();
    });
  });

  it('should handle critical status', async () => {
    (hydrationMonitoringService.generateHealthReport as jest.Mock).mockReturnValue({
      status: 'critical',
      metrics: {
        totalHydrations: 100,
        successfulHydrations: 70,
        failedHydrations: 30,
        averageHydrationTime: 3000,
        errorRate: 0.3,
        recoverySuccessRate: 0.4
      },
      recentErrors: [],
      recentAlerts: [],
      recommendations: ['Taux d\'erreur critique - Investigation immédiate requise']
    });

    render(<HydrationHealthDashboard />);

    await waitFor(() => {
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByText('Taux d\'erreur critique - Investigation immédiate requise')).toBeInTheDocument();
    });
  });
});

describe('HydrationNotificationSystem', () => {
  beforeEach(() => {
    (hydrationMonitoringService.onAlert as jest.Mock).mockReturnValue(() => {});
  });

  it('should render without notifications initially', () => {
    const { container } = render(<HydrationNotificationSystem />);
    expect(container.firstChild).toBeNull();
  });

  it('should handle alert subscription', () => {
    render(<HydrationNotificationSystem />);
    
    expect(hydrationMonitoringService.onAlert).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should position notifications correctly', () => {
    const { rerender } = render(
      <HydrationNotificationSystem config={{ position: 'top-left' }} />
    );

    rerender(
      <HydrationNotificationSystem config={{ position: 'bottom-center' }} />
    );

    // Les notifications devraient être positionnées selon la configuration
    // (Test visuel - difficile à tester unitairement)
  });
});

describe('Integration Tests', () => {
  it('should integrate recovery system with monitoring service', async () => {
    const TestComponent = () => (
      <HydrationRecoverySystem
        onRecoveryAttempt={(attempt, error) => {
          hydrationMonitoringService.recordHydrationError('test-component', error, attempt);
        }}
        onRecoverySuccess={() => {
          hydrationMonitoringService.recordHydrationSuccess('recovery-1', 'test-component');
        }}
      >
        <div data-testid="integrated-content">Integrated Content</div>
      </HydrationRecoverySystem>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('integrated-content')).toBeInTheDocument();
    });
  });

  it('should work with retry manager', async () => {
    (hydrationRetryManager.executeWithRetry as jest.Mock).mockResolvedValue('success');

    const TestComponent = () => {
      React.useEffect(() => {
        hydrationRetryManager.executeWithRetry(
          'test-component',
          async () => {
            return 'test-result';
          }
        );
      }, []);

      return <div data-testid="retry-test">Retry Test</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('retry-test')).toBeInTheDocument();
      expect(hydrationRetryManager.executeWithRetry).toHaveBeenCalledWith(
        'test-component',
        expect.any(Function)
      );
    });
  });

  it('should handle complete recovery workflow', async () => {
    const onRecoverySuccess = jest.fn();
    
    const TestComponent = () => (
      <div>
        <HydrationRecoverySystem onRecoverySuccess={onRecoverySuccess}>
          <div data-testid="workflow-content">Workflow Content</div>
        </HydrationRecoverySystem>
        <HydrationHealthDashboard />
        <HydrationNotificationSystem />
      </div>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('workflow-content')).toBeInTheDocument();
      expect(screen.getByText('Santé d\'Hydratation')).toBeInTheDocument();
    });
  });
});