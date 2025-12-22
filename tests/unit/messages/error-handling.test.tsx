/**
 * Unit Tests for Error Handling Components
 * Tests error messages and retry mechanisms
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ErrorAlert,
  MessageSendError,
  MessageErrorBoundary,
} from '@/components/messages/ErrorHandling';

describe('ErrorAlert', () => {
  it('should render network error with correct message', () => {
    render(<ErrorAlert type="network" />);
    
    expect(screen.getByText('Connexion perdue')).toBeInTheDocument();
    expect(screen.getByText(/Vérifiez votre connexion internet/)).toBeInTheDocument();
  });

  it('should render auth error with correct message', () => {
    render(<ErrorAlert type="auth" />);
    
    expect(screen.getByText('Session expirée')).toBeInTheDocument();
    expect(screen.getByText(/Reconnexion en cours/)).toBeInTheDocument();
  });

  it('should render rate-limit error with retry time', () => {
    render(<ErrorAlert type="rate-limit" retryAfter={30} />);
    
    expect(screen.getByText('Trop de requêtes')).toBeInTheDocument();
    expect(screen.getByText(/30 secondes/)).toBeInTheDocument();
  });

  it('should render server error with correct message', () => {
    render(<ErrorAlert type="server" />);
    
    expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
  });

  it('should render unknown error with generic message', () => {
    render(<ErrorAlert type="unknown" />);
    
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    expect(screen.getByText(/Contactez le support/)).toBeInTheDocument();
  });

  it('should render custom message when provided', () => {
    const customMessage = 'Custom error message';
    render(<ErrorAlert type="network" message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('should render retry button for network errors', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert type="network" onRetry={onRetry} />);
    
    const retryButton = screen.getByLabelText('Réessayer');
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert type="network" onRetry={onRetry} />);
    
    const retryButton = screen.getByLabelText('Réessayer');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button for auth errors', () => {
    render(<ErrorAlert type="auth" onRetry={() => {}} />);
    
    const retryButton = screen.queryByLabelText('Réessayer');
    expect(retryButton).not.toBeInTheDocument();
  });

  it('should have correct test id', () => {
    render(<ErrorAlert type="network" />);
    
    expect(screen.getByTestId('error-alert-network')).toBeInTheDocument();
  });

  it('should have role="alert" for accessibility', () => {
    const { container } = render(<ErrorAlert type="network" />);
    
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
  });
});

describe('MessageSendError', () => {
  it('should render error message', () => {
    render(
      <MessageSendError
        messageId="msg-1"
        onRetry={() => {}}
        onDelete={() => {}}
      />
    );
    
    expect(screen.getByText("Échec de l'envoi")).toBeInTheDocument();
  });

  it('should render retry button', () => {
    render(
      <MessageSendError
        messageId="msg-1"
        onRetry={() => {}}
        onDelete={() => {}}
      />
    );
    
    expect(screen.getByText('Réessayer')).toBeInTheDocument();
  });

  it('should render delete button', () => {
    render(
      <MessageSendError
        messageId="msg-1"
        onRetry={() => {}}
        onDelete={() => {}}
      />
    );
    
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
  });

  it('should call onRetry with messageId when retry clicked', () => {
    const onRetry = vi.fn();
    render(
      <MessageSendError
        messageId="msg-123"
        onRetry={onRetry}
        onDelete={() => {}}
      />
    );
    
    fireEvent.click(screen.getByText('Réessayer'));
    expect(onRetry).toHaveBeenCalledWith('msg-123');
  });

  it('should call onDelete with messageId when delete clicked', () => {
    const onDelete = vi.fn();
    render(
      <MessageSendError
        messageId="msg-123"
        onRetry={() => {}}
        onDelete={onDelete}
      />
    );
    
    fireEvent.click(screen.getByText('Supprimer'));
    expect(onDelete).toHaveBeenCalledWith('msg-123');
  });

  it('should have correct test id', () => {
    render(
      <MessageSendError
        messageId="msg-1"
        onRetry={() => {}}
        onDelete={() => {}}
      />
    );
    
    expect(screen.getByTestId('message-send-error')).toBeInTheDocument();
  });
});

describe('MessageErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  const ThrowError = () => {
    throw new Error('Test error');
  };

  it('should render children when no error', () => {
    render(
      <MessageErrorBoundary>
        <div>Test content</div>
      </MessageErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render fallback UI when error occurs', () => {
    render(
      <MessageErrorBoundary>
        <ThrowError />
      </MessageErrorBoundary>
    );
    
    expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
    expect(screen.getByText(/Ce composant n'a pas pu être chargé/)).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    render(
      <MessageErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError />
      </MessageErrorBoundary>
    );
    
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('should render reload button in default fallback', () => {
    render(
      <MessageErrorBoundary>
        <ThrowError />
      </MessageErrorBoundary>
    );
    
    expect(screen.getByRole('button', { name: /Recharger/i })).toBeInTheDocument();
  });

  it('should call onReset when reload button clicked', () => {
    const onReset = vi.fn();
    render(
      <MessageErrorBoundary onReset={onReset}>
        <ThrowError />
      </MessageErrorBoundary>
    );
    
    const reloadButton = screen.getByRole('button', { name: /Recharger/i });
    fireEvent.click(reloadButton);
    
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe('Error Handling Integration', () => {
  it('should all error components use consistent color scheme', () => {
    const { container: network } = render(<ErrorAlert type="network" />);
    const { container: server } = render(<ErrorAlert type="server" />);

    const checkRedColor = (container: HTMLElement) => {
      return container.querySelector('[class*="red"]') !== null;
    };

    expect(checkRedColor(network)).toBe(true);
    expect(checkRedColor(server)).toBe(true);
  });

  it('should error alerts support dark mode', () => {
    const { container } = render(<ErrorAlert type="network" />);
    
    const darkElements = container.querySelectorAll('[class*="dark:"]');
    expect(darkElements.length).toBeGreaterThan(0);
  });
});
