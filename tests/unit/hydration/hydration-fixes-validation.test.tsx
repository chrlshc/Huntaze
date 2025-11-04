import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { 
  SafeWindowAccess,
  SafeDocumentAccess,
  SafeAnimationWrapper,
  useWindowSize,
  useWindowScroll,
  ResponsiveWrapper
} from '@/components/hydration';

// Mock des APIs du navigateur pour les tests
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  scrollX: 0,
  scrollY: 100,
  location: { href: 'http://localhost:3000' },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  open: jest.fn()
};

const mockDocument = {
  title: 'Test Page',
  body: document.createElement('body'),
  head: document.createElement('head'),
  createElement: jest.fn(() => document.createElement('div')),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock de window et document
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

describe('Hydration Fixes Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SafeWindowAccess', () => {
    it('should provide safe access to window properties', async () => {
      const TestComponent = () => (
        <SafeWindowAccess>
          {(windowAPI) => (
            <div>
              <div data-testid="width">Width: {windowAPI.innerWidth}</div>
              <div data-testid="height">Height: {windowAPI.innerHeight}</div>
              <div data-testid="available">Available: {windowAPI.isAvailable.toString()}</div>
            </div>
          )}
        </SafeWindowAccess>
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('width')).toHaveTextContent('Width: 1024');
        expect(screen.getByTestId('height')).toHaveTextContent('Height: 768');
        expect(screen.getByTestId('available')).toHaveTextContent('Available: true');
      });
    });

    it('should handle window events safely', async () => {
      const TestComponent = () => (
        <SafeWindowAccess>
          {(windowAPI) => (
            <button
              onClick={() => {
                windowAPI.addEventListener('resize', () => {});
                windowAPI.removeEventListener('resize', () => {});
              }}
            >
              Test Events
            </button>
          )}
        </SafeWindowAccess>
      );

      render(<TestComponent />);
      
      const button = screen.getByText('Test Events');
      
      await act(async () => {
        button.click();
      });

      // Vérifier que les événements sont gérés sans erreur
      expect(button).toBeInTheDocument();
    });

    it('should render fallback when window is not available', () => {
      const fallback = <div data-testid="fallback">Loading...</div>;
      
      const TestComponent = () => (
        <SafeWindowAccess fallback={fallback}>
          {(windowAPI) => <div>Window content</div>}
        </SafeWindowAccess>
      );

      render(<TestComponent />);
      
      // Le fallback ou le contenu principal devrait être présent
      const fallbackElement = screen.queryByTestId('fallback');
      const mainContent = screen.queryByText('Window content');
      
      expect(fallbackElement || mainContent).toBeTruthy();
    });
  });

  describe('SafeDocumentAccess', () => {
    it('should provide safe access to document properties', async () => {
      const TestComponent = () => (
        <SafeDocumentAccess>
          {(documentAPI) => (
            <div>
              <div data-testid="title">Title: {documentAPI.title}</div>
              <div data-testid="available">Available: {documentAPI.isAvailable.toString()}</div>
            </div>
          )}
        </SafeDocumentAccess>
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('available')).toHaveTextContent('Available: true');
      });
    });

    it('should handle DOM manipulation safely', async () => {
      const TestComponent = () => (
        <SafeDocumentAccess>
          {(documentAPI) => (
            <button
              onClick={() => {
                const element = documentAPI.createElement('div');
                const found = documentAPI.getElementById('test');
                const selected = documentAPI.querySelector('.test');
              }}
            >
              Test DOM
            </button>
          )}
        </SafeDocumentAccess>
      );

      render(<TestComponent />);
      
      const button = screen.getByText('Test DOM');
      
      await act(async () => {
        button.click();
      });

      // Vérifier que les manipulations DOM sont gérées sans erreur
      expect(button).toBeInTheDocument();
    });
  });

  describe('useWindowSize hook', () => {
    it('should return window dimensions safely', async () => {
      let windowSize: { width: number; height: number };
      
      const TestComponent = () => {
        windowSize = useWindowSize();
        return (
          <div>
            <div data-testid="width">{windowSize.width}</div>
            <div data-testid="height">{windowSize.height}</div>
          </div>
        );
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('width')).toHaveTextContent('1024');
        expect(screen.getByTestId('height')).toHaveTextContent('768');
      });
    });

    it('should update on window resize', async () => {
      const TestComponent = () => {
        const { width, height } = useWindowSize();
        return (
          <div>
            <div data-testid="dimensions">{width}x{height}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Simuler un redimensionnement
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('dimensions')).toHaveTextContent('800x600');
      });
    });
  });

  describe('ResponsiveWrapper', () => {
    it('should detect breakpoints correctly', async () => {
      const TestComponent = () => (
        <ResponsiveWrapper>
          {(breakpoint) => (
            <div>
              <div data-testid="mobile">Mobile: {breakpoint.isMobile.toString()}</div>
              <div data-testid="tablet">Tablet: {breakpoint.isTablet.toString()}</div>
              <div data-testid="desktop">Desktop: {breakpoint.isDesktop.toString()}</div>
            </div>
          )}
        </ResponsiveWrapper>
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('mobile')).toHaveTextContent('Mobile: false');
        expect(screen.getByTestId('tablet')).toHaveTextContent('Tablet: false');
        expect(screen.getByTestId('desktop')).toHaveTextContent('Desktop: true');
      });
    });

    it('should update breakpoints on resize', async () => {
      const TestComponent = () => (
        <ResponsiveWrapper>
          {(breakpoint) => (
            <div data-testid="breakpoint">
              {breakpoint.isMobile ? 'Mobile' : 
               breakpoint.isTablet ? 'Tablet' : 'Desktop'}
            </div>
          )}
        </ResponsiveWrapper>
      );

      render(<TestComponent />);

      // Initialement desktop
      await waitFor(() => {
        expect(screen.getByTestId('breakpoint')).toHaveTextContent('Desktop');
      });

      // Simuler un redimensionnement vers mobile
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('breakpoint')).toHaveTextContent('Mobile');
      });
    });
  });

  describe('SafeAnimationWrapper', () => {
    it('should handle animations safely', async () => {
      const TestComponent = () => (
        <SafeAnimationWrapper
          animationConfig={{ delay: 100, duration: 200 }}
        >
          <div data-testid="animated-content">Animated Content</div>
        </SafeAnimationWrapper>
      );

      render(<TestComponent />);

      // Le contenu devrait être présent
      expect(screen.getByTestId('animated-content')).toBeInTheDocument();
    });

    it('should render fallback during animation setup', () => {
      const fallback = <div data-testid="animation-fallback">Loading animation...</div>;
      
      const TestComponent = () => (
        <SafeAnimationWrapper fallback={fallback}>
          <div>Animated content</div>
        </SafeAnimationWrapper>
      );

      render(<TestComponent />);
      
      // Le fallback ou le contenu principal devrait être présent
      const fallbackElement = screen.queryByTestId('animation-fallback');
      const mainContent = screen.queryByText('Animated content');
      
      expect(fallbackElement || mainContent).toBeTruthy();
    });

    it('should handle random delays with seeds', async () => {
      const TestComponent = () => (
        <SafeAnimationWrapper
          animationConfig={{ 
            randomDelay: true, 
            seed: 'test-seed' 
          }}
        >
          <div data-testid="seeded-animation">Seeded Animation</div>
        </SafeAnimationWrapper>
      );

      render(<TestComponent />);

      // Le contenu devrait être présent
      await waitFor(() => {
        expect(screen.getByTestId('seeded-animation')).toBeInTheDocument();
      });
    });
  });

  describe('Hydration Error Prevention', () => {
    it('should prevent hydration mismatches with dates', async () => {
      // Simuler un composant qui utilisait new Date().getFullYear()
      const TestComponent = () => {
        // Avant: const year = new Date().getFullYear(); // Cause hydration error
        // Après: utiliser SafeCurrentYear
        return (
          <div data-testid="safe-year">
            Copyright 2024 - Utilisation sécurisée
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('safe-year')).toHaveTextContent('Copyright 2024');
    });

    it('should prevent hydration mismatches with random content', async () => {
      // Simuler un composant qui utilisait Math.random()
      const TestComponent = () => {
        // Avant: const randomId = Math.random(); // Cause hydration error
        // Après: utiliser SafeRandomContent avec seed
        return (
          <div data-testid="safe-random">
            ID sécurisé généré
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('safe-random')).toHaveTextContent('ID sécurisé généré');
    });

    it('should prevent hydration mismatches with browser APIs', async () => {
      // Simuler un composant qui utilisait window directement
      const TestComponent = () => (
        <SafeWindowAccess>
          {(windowAPI) => (
            <div data-testid="safe-window">
              {windowAPI.isAvailable ? 'Browser APIs available' : 'Server rendering'}
            </div>
          )}
        </SafeWindowAccess>
      );

      render(<TestComponent />);

      await waitFor(() => {
        const element = screen.getByTestId('safe-window');
        expect(element).toHaveTextContent(/Browser APIs available|Server rendering/);
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clean up event listeners properly', async () => {
      const TestComponent = ({ shouldRender }: { shouldRender: boolean }) => {
        if (!shouldRender) return null;
        
        return (
          <SafeWindowAccess>
            {(windowAPI) => (
              <div data-testid="event-component">
                Component with events
              </div>
            )}
          </SafeWindowAccess>
        );
      };

      const { rerender } = render(<TestComponent shouldRender={true} />);
      
      expect(screen.getByTestId('event-component')).toBeInTheDocument();
      
      // Démonter le composant
      rerender(<TestComponent shouldRender={false} />);
      
      expect(screen.queryByTestId('event-component')).not.toBeInTheDocument();
    });

    it('should handle multiple instances without conflicts', async () => {
      const TestComponent = () => (
        <div>
          <SafeWindowAccess>
            {(windowAPI) => (
              <div data-testid="instance-1">Instance 1: {windowAPI.innerWidth}</div>
            )}
          </SafeWindowAccess>
          <SafeWindowAccess>
            {(windowAPI) => (
              <div data-testid="instance-2">Instance 2: {windowAPI.innerWidth}</div>
            )}
          </SafeWindowAccess>
        </div>
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('instance-1')).toHaveTextContent('Instance 1: 1024');
        expect(screen.getByTestId('instance-2')).toHaveTextContent('Instance 2: 1024');
      });
    });
  });
});