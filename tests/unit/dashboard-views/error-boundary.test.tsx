import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardViewErrorBoundary } from '@/components/ui/DashboardViewErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('DashboardViewErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <DashboardViewErrorBoundary>
        <div>Test content</div>
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error state when child component throws', () => {
    render(
      <DashboardViewErrorBoundary viewName="Test View">
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an error loading Test View/)).toBeInTheDocument();
  });

  it('displays error message in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('displays generic message in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <DashboardViewErrorBoundary viewName="Fans View">
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText(/We encountered an error loading Fans View/)).toBeInTheDocument();
    expect(screen.queryByText(/Error: Test error/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('displays refresh page CTA button', () => {
    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    const refreshButton = screen.getByRole('button', { name: /Refresh Page/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('reloads page when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    const refreshButton = screen.getByRole('button', { name: /Refresh Page/i });
    await user.click(refreshButton);

    expect(reloadSpy).toHaveBeenCalledOnce();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <DashboardViewErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('logs error to console in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <DashboardViewErrorBoundary viewName="Test View">
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <DashboardViewErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('displays benefits list in error state', () => {
    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText(/Your data is safe and has not been affected/)).toBeInTheDocument();
    expect(screen.getByText(/This error has been logged and will be investigated/)).toBeInTheDocument();
    expect(screen.getByText(/Try refreshing the page to resolve the issue/)).toBeInTheDocument();
  });

  it('displays error icon in error state', () => {
    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    const icon = screen.getByTestId('empty-state-icon');
    expect(icon).toBeInTheDocument();
    expect(icon.querySelector('svg')).toBeInTheDocument();
  });

  it('uses default view name when not provided', () => {
    render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText(/We encountered an error loading this view/)).toBeInTheDocument();
  });

  it('maintains error state after re-render', () => {
    const { rerender } = render(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Re-render with same props
    rerender(
      <DashboardViewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardViewErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
