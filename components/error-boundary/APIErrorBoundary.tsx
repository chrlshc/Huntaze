/**
 * Error Boundary spécialisé pour les erreurs API
 * Gère les erreurs d'API avec retry automatique et fallbacks
 */

import React, { Component, ReactNode } from 'react';
import { APIError, RateLimitError, NetworkError, AuthenticationError } from '@/lib/types/api-errors';
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';

interface APIErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: APIError, retry: () => void) => ReactNode;
  onError?: (error: APIError, errorInfo: React.ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface APIErrorBoundaryState {
  hasError: boolean;
  error: APIError | null;
  retryCount: number;
  isRetrying: boolean;
}

export class APIErrorBoundary extends Component<APIErrorBoundaryProps, APIErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private monitoring = getAPIMonitoringService();

  constructor(props: APIErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<APIErrorBoundaryState> {
    // Vérifier si c'est une erreur API
    if (error instanceof Error && 'code' in error) {
      return {
        hasError: true,
        error: error as APIError,
      };
    }

    // Convertir les erreurs normales en APIError
    const apiError: APIError = {
      ...error,
      code: 'UNKNOWN_ERROR',
      status: 500,
      retryable: false,
    };

    return {
      hasError: true,
      error: apiError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const apiError = this.state.error || (error as APIError);
    
    // Enregistrer l'erreur dans le monitoring
    this.monitoring.recordMetric({
      endpoint: 'react_error_boundary',
      method: 'ERROR',
      statusCode: apiError.status || 500,
      responseTime: 0,
      errorType: error.constructor.name,
    });

    // Appeler le callback d'erreur si fourni
    if (this.props.onError) {
      this.props.onError(apiError, errorInfo);
    }

    // Log l'erreur
    console.error('APIErrorBoundary caught an error:', {
      error: apiError,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    // Retry automatique pour certaines erreurs
    if (this.shouldAutoRetry(apiError)) {
      this.scheduleRetry();
    }
  }

  private shouldAutoRetry(error: APIError): boolean {
    const { enableRetry = true, maxRetries = 3 } = this.props;
    
    if (!enableRetry || this.state.retryCount >= maxRetries) {
      return false;
    }

    // Retry pour les erreurs réseau et rate limiting
    return error instanceof NetworkError || 
           error instanceof RateLimitError ||
           (error.retryable === true);
  }

  private scheduleRetry = (): void => {
    const { retryDelay = 2000 } = this.props;
    const delay = retryDelay * Math.pow(2, this.state.retryCount); // Exponential backoff

    this.setState({ isRetrying: true });

    this.retryTimeout = setTimeout(() => {
      this.retry();
    }, delay);
  };

  private retry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
    }));

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  };

  private manualRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      isRetrying: false,
    });
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.manualRetry);
      }

      // Fallback par défaut basé sur le type d'erreur
      return this.renderDefaultFallback();
    }

    return this.props.children;
  }

  private renderDefaultFallback(): ReactNode {
    const { error, isRetrying, retryCount } = this.state;
    const { maxRetries = 3 } = this.props;

    if (!error) return null;

    // Affichage pendant le retry
    if (isRetrying) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Reconnecting... (Attempt {retryCount + 1})</p>
          </div>
        </div>
      );
    }

    // Erreur d'authentification
    if (error instanceof AuthenticationError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-center mb-4">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1C5.03 1 1 5.03 1 10s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zM9 5a1 1 0 112 0v4a1 1 0 11-2 0V5zm0 8a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Authentication Required</h3>
            </div>
          </div>
          <div className="text-sm text-red-700 mb-4">
            <p>Your session has expired. Please log in again to continue.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
            >
              Log In
            </button>
            <button
              onClick={this.manualRetry}
              className="bg-white text-red-600 border border-red-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Erreur de rate limiting
    if (error instanceof RateLimitError) {
      const resetTime = error.context?.resetIn ? new Date(Date.now() + error.context.resetIn) : null;
      
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-4">
          <div className="flex items-center mb-4">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Rate Limit Exceeded</h3>
            </div>
          </div>
          <div className="text-sm text-yellow-700 mb-4">
            <p>Too many requests. Please wait before trying again.</p>
            {resetTime && (
              <p className="mt-1">Rate limit resets at: {resetTime.toLocaleTimeString()}</p>
            )}
          </div>
          <button
            onClick={this.manualRetry}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    // Erreur réseau
    if (error instanceof NetworkError) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 m-4">
          <div className="flex items-center mb-4">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">Connection Problem</h3>
            </div>
          </div>
          <div className="text-sm text-gray-700 mb-4">
            <p>Unable to connect to the server. Please check your internet connection.</p>
            {retryCount > 0 && (
              <p className="mt-1">Retry attempts: {retryCount}/{maxRetries}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={this.manualRetry}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    // Erreur générique
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <div className="flex items-center mb-4">
          <div className="shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
          </div>
        </div>
        <div className="text-sm text-red-700 mb-4">
          <p>{error.message || 'An unexpected error occurred'}</p>
          {process.env.NODE_ENV === 'development' && error.code && (
            <p className="mt-1 font-mono text-xs">Error Code: {error.code}</p>
          )}
          {retryCount > 0 && (
            <p className="mt-1">Retry attempts: {retryCount}/{maxRetries}</p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={this.manualRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => console.error('Full error details:', error)}
              className="bg-white text-red-600 border border-red-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50"
            >
              Log Details
            </button>
          )}
        </div>
      </div>
    );
  }
}

/**
 * Hook pour utiliser l'error boundary de manière programmatique
 */
export function useAPIErrorHandler() {
  const handleError = (error: APIError) => {
    // Cette fonction peut être utilisée pour déclencher l'error boundary
    // ou pour gérer les erreurs de manière centralisée
    throw error;
  };

  const isRetryableError = (error: APIError): boolean => {
    return error instanceof NetworkError || 
           error instanceof RateLimitError ||
           (error.retryable === true);
  };

  const getErrorMessage = (error: APIError): string => {
    if (error instanceof AuthenticationError) {
      return 'Please log in to continue';
    }
    if (error instanceof RateLimitError) {
      return 'Too many requests. Please wait and try again';
    }
    if (error instanceof NetworkError) {
      return 'Connection problem. Please check your internet';
    }
    return error.message || 'An unexpected error occurred';
  };

  const getErrorSeverity = (error: APIError): 'low' | 'medium' | 'high' | 'critical' => {
    if (error instanceof AuthenticationError) return 'high';
    if (error instanceof RateLimitError) return 'medium';
    if (error instanceof NetworkError) return 'medium';
    if (error.status && error.status >= 500) return 'high';
    return 'low';
  };

  return {
    handleError,
    isRetryableError,
    getErrorMessage,
    getErrorSeverity,
  };
}

/**
 * Composant wrapper pour faciliter l'utilisation
 */
interface APIErrorProviderProps {
  children: ReactNode;
  onError?: (error: APIError, errorInfo: React.ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
}

export function APIErrorProvider({ 
  children, 
  onError, 
  enableRetry = true, 
  maxRetries = 3 
}: APIErrorProviderProps) {
  return (
    <APIErrorBoundary
      onError={onError}
      enableRetry={enableRetry}
      maxRetries={maxRetries}
    >
      {children}
    </APIErrorBoundary>
  );
}