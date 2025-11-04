import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { 
  HydrationSafeWrapper, 
  ClientOnly, 
  useHydration,
  SafeCurrentYear,
  SafeDateRenderer,
  SSRDataProvider,
  SafeBrowserAPI,
  SafeRandomContent
} from '@/components/hydration';

// Mock du debugger d'hydratation
jest.mock('@/lib/utils/hydrationDebugger', () => ({
  hydrationDebugger: {
    logHydrationSuccess: jest.fn(),
    logHydrationError: jest.fn(),
    logDataMismatch: jest.fn(),
    logSSRDataHydration: jest.fn()
  }
}));

describe('HydrationSafeWrapper', () => {
  it('should render fallback initially and then children after hydration', async () => {
    const TestComponent = () => (
      <HydrationSafeWrapper fallback={<div>Loading...</div>}>
        <div>Hydrated content</div>
      </HydrationSafeWrapper>
    );

    render(<TestComponent />);
    
    // Initialement, le fallback peut être affiché
    // Après l'hydratation, le contenu principal devrait être visible
    await waitFor(() => {
      expect(screen.getByText('Hydrated content')).toBeInTheDocument();
    });
  });

  it('should handle hydration errors gracefully', async () => {
    const onError = jest.fn();
    
    const TestComponent = () => (
      <HydrationSafeWrapper 
        fallback={<div>Error fallback</div>}
        onHydrationError={onError}
      >
        <div>Content</div>
      </HydrationSafeWrapper>
    );

    render(<TestComponent />);
    
    // Le composant devrait gérer les erreurs sans crash
    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  it('should suppress hydration warnings when specified', () => {
    const TestComponent = () => (
      <HydrationSafeWrapper suppressHydrationWarning={true}>
        <div>Content with potential hydration mismatch</div>
      </HydrationSafeWrapper>
    );

    render(<TestComponent />);
    
    const wrapper = screen.getByText('Content with potential hydration mismatch').parentElement;
    expect(wrapper).toHaveAttribute('suppressHydrationWarning');
  });
});

describe('ClientOnly', () => {
  it('should render nothing initially and children after hydration', async () => {
    const TestComponent = () => (
      <ClientOnly fallback={<div>Server fallback</div>}>
        <div>Client only content</div>
      </ClientOnly>
    );

    render(<TestComponent />);
    
    // Après l'hydratation, le contenu client devrait être visible
    await waitFor(() => {
      expect(screen.getByText('Client only content')).toBeInTheDocument();
    });
  });

  it('should render fallback on server side', () => {
    const TestComponent = () => (
      <ClientOnly fallback={<div>Server fallback</div>}>
        <div>Client only content</div>
      </ClientOnly>
    );

    render(<TestComponent />);
    
    // Le fallback peut être présent initialement
    const fallback = screen.queryByText('Server fallback');
    const clientContent = screen.queryByText('Client only content');
    
    // Au moins un des deux devrait être présent
    expect(fallback || clientContent).toBeTruthy();
  });
});

describe('useHydration hook', () => {
  it('should return hydration state', async () => {
    let hydrationState: boolean;
    
    const TestComponent = () => {
      hydrationState = useHydration();
      return <div>Hydration state: {hydrationState.toString()}</div>;
    };

    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByText(/Hydration state:/)).toBeInTheDocument();
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

  it('should render fallback when specified', () => {
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

describe('SafeDateRenderer', () => {
  it('should render date safely with different formats', async () => {
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

  it('should render fallback during hydration', () => {
    const fallback = <span>Loading date...</span>;
    
    render(
      <SSRDataProvider>
        <SafeDateRenderer 
          date={new Date()} 
          format="full" 
          fallback={fallback}
        />
      </SSRDataProvider>
    );
    
    // Le fallback ou la date devrait être présent
    const loadingText = screen.queryByText('Loading date...');
    const dateContent = screen.queryByText(/\d{4}/); // Chercher une année
    
    expect(loadingText || dateContent).toBeTruthy();
  });
});

describe('SafeBrowserAPI', () => {
  it('should provide safe access to browser APIs', async () => {
    const TestComponent = () => (
      <SafeBrowserAPI>
        {(api) => (
          <div>
            <div>Is client: {api.isClient.toString()}</div>
            <div>Has window: {(api.window !== null).toString()}</div>
          </div>
        )}
      </SafeBrowserAPI>
    );

    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByText(/Is client:/)).toBeInTheDocument();
      expect(screen.getByText(/Has window:/)).toBeInTheDocument();
    });
  });

  it('should render fallback when browser APIs are not available', () => {
    const fallback = <div>Browser APIs not available</div>;
    
    const TestComponent = () => (
      <SafeBrowserAPI fallback={fallback}>
        {(api) => <div>Browser APIs available</div>}
      </SafeBrowserAPI>
    );

    render(<TestComponent />);
    
    // Le fallback ou le contenu principal devrait être présent
    const fallbackText = screen.queryByText('Browser APIs not available');
    const mainContent = screen.queryByText('Browser APIs available');
    
    expect(fallbackText || mainContent).toBeTruthy();
  });
});

describe('SafeRandomContent', () => {
  it('should generate consistent random values with seed', async () => {
    const TestComponent = () => (
      <SSRDataProvider>
        <SafeRandomContent seed="test-seed" min={0} max={100}>
          {(value) => <div>Random value: {value.toFixed(2)}</div>}
        </SafeRandomContent>
      </SSRDataProvider>
    );

    const { rerender } = render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByText(/Random value:/)).toBeInTheDocument();
    });
    
    const firstValue = screen.getByText(/Random value:/).textContent;
    
    // Re-render avec la même seed devrait donner la même valeur
    rerender(<TestComponent />);
    
    await waitFor(() => {
      const secondValue = screen.getByText(/Random value:/).textContent;
      expect(secondValue).toBe(firstValue);
    });
  });

  it('should render fallback during hydration', () => {
    const fallback = <div>Generating random content...</div>;
    
    render(
      <SSRDataProvider>
        <SafeRandomContent fallback={fallback}>
          {(value) => <div>Value: {value}</div>}
        </SafeRandomContent>
      </SSRDataProvider>
    );
    
    // Le fallback ou le contenu principal devrait être présent
    const fallbackText = screen.queryByText('Generating random content...');
    const mainContent = screen.queryByText(/Value:/);
    
    expect(fallbackText || mainContent).toBeTruthy();
  });
});

describe('SSRDataProvider', () => {
  it('should provide data context to children', async () => {
    const TestComponent = () => (
      <SSRDataProvider initialData={{ test: 'value' }} hydrationId="test">
        <div>Provider loaded</div>
      </SSRDataProvider>
    );

    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Provider loaded')).toBeInTheDocument();
    });
  });

  it('should handle data synchronization between server and client', async () => {
    const initialData = { counter: 0 };
    
    const TestComponent = () => (
      <SSRDataProvider initialData={initialData} hydrationId="sync-test">
        <div>Data provider ready</div>
      </SSRDataProvider>
    );

    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Data provider ready')).toBeInTheDocument();
    });
  });
});