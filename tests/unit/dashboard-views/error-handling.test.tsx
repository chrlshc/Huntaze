import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { DashboardViewErrorBoundary } from '@/components/ui/DashboardViewErrorBoundary';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';

/**
 * Error Handling Tests
 * 
 * Tests for error boundary component that catches and displays errors
 * in dashboard views.
 */

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('DashboardViewErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <DashboardViewErrorBoundary>
        <div data-testid="child">Child content</div>
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('catches errors and displays fallback UI', () => {
    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    // Should display error empty state
    expect(screen.getByTestId('dashboard-empty-state')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(
        "We're having trouble loading this view. Please refresh the page or try again later."
      )
    ).toBeInTheDocument();
  });

  it('displays "Refresh Page" CTA button', () => {
    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <DashboardViewErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

    render(
      <DashboardViewErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('logs error to console', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('displays benefits list in error state', () => {
    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText('Your data is safe and has been saved')).toBeInTheDocument();
    expect(screen.getByText('This is a temporary issue')).toBeInTheDocument();
    expect(
      screen.getByText('Refreshing the page usually resolves the problem')
    ).toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    const emptyState = screen.getByTestId('dashboard-empty-state');
    expect(emptyState).toHaveAttribute('role', 'region');
    expect(emptyState).toHaveAttribute('aria-labelledby', 'empty-state-title');
    expect(emptyState).toHaveAttribute('aria-describedby', 'empty-state-description');
  });

  it('does not catch errors from outside the boundary', () => {
    // This test verifies that errors outside the boundary are not caught
    const { rerender } = render(
      <div>
        <DashboardViewErrorBoundary>
          <div>Safe content</div>
        </DashboardViewErrorBoundary>
      </div>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();

    // Rerender with error outside boundary - should not be caught
    expect(() => {
      rerender(
        <div>
          <ThrowError shouldThrow={true} />
          <DashboardViewErrorBoundary>
            <div>Safe content</div>
          </DashboardViewErrorBoundary>
        </div>
      );
    }).toThrow();
  });
});

describe('Error Boundary Integration', () => {
  it('can be nested for granular error handling', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <DashboardViewErrorBoundary>
        <div>
          <h1>Dashboard</h1>
          <DashboardViewErrorBoundary>
            <ThrowError shouldThrow={true} />
          </DashboardViewErrorBoundary>
          <div>Other content</div>
        </div>
      </DashboardViewErrorBoundary>
    );

    // Inner error boundary should catch the error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // Outer content should still render
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Other content')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('works with async errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    function AsyncError() {
      const [shouldThrow, setShouldThrow] = React.useState(false);

      React.useEffect(() => {
        setTimeout(() => setShouldThrow(true), 10);
      }, []);

      if (shouldThrow) {
        throw new Error('Async error');
      }

      return <div>Loading...</div>;
    }

    render(
      <DashboardViewErrorBoundary>
        <AsyncError />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    consoleError.mockRestore();
  });
});
