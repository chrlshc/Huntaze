/**
 * Error Handling Components for Messages Interface
 * User-friendly error messages with retry mechanisms
 */

import React from 'react';
import { AlertCircle, WifiOff, RefreshCw, Clock } from 'lucide-react';

export type ErrorType = 'network' | 'auth' | 'rate-limit' | 'server' | 'unknown';

interface ErrorAlertProps {
  type: ErrorType;
  message?: string;
  onRetry?: () => void;
  retryAfter?: number;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  type, 
  message, 
  onRetry,
  retryAfter 
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: <WifiOff size={20} />,
          title: 'Connexion perdue',
          description: message || 'Vérifiez votre connexion internet et réessayez.',
          color: 'red',
          showRetry: true,
        };
      case 'auth':
        return {
          icon: <AlertCircle size={20} />,
          title: 'Session expirée',
          description: message || 'Votre session a expiré. Reconnexion en cours...',
          color: 'yellow',
          showRetry: false,
        };
      case 'rate-limit':
        return {
          icon: <Clock size={20} />,
          title: 'Trop de requêtes',
          description: message || `Veuillez patienter ${retryAfter || 60} secondes avant de réessayer.`,
          color: 'blue',
          showRetry: true,
        };
      case 'server':
        return {
          icon: <AlertCircle size={20} />,
          title: 'Erreur serveur',
          description: message || 'Une erreur est survenue sur le serveur. Réessayez dans quelques instants.',
          color: 'red',
          showRetry: true,
        };
      default:
        return {
          icon: <AlertCircle size={20} />,
          title: 'Une erreur est survenue',
          description: message || 'Contactez le support si le problème persiste.',
          color: 'red',
          showRetry: true,
        };
    }
  };

  const config = getErrorConfig();
  
  const colorClasses = {
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  return (
    <div 
      className={`flex items-start space-x-3 p-4 rounded-lg border ${colorClasses[config.color as keyof typeof colorClasses]}`}
      role="alert"
      data-testid={`error-alert-${type}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm mb-1">{config.title}</h4>
        <p className="text-sm opacity-90">{config.description}</p>
      </div>
      {config.showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Réessayer"
        >
          <RefreshCw size={16} />
        </button>
      )}
    </div>
  );
};

interface MessageErrorProps {
  messageId: string;
  onRetry: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}

export const MessageSendError: React.FC<MessageErrorProps> = ({ 
  messageId, 
  onRetry, 
  onDelete 
}) => {
  return (
    <div 
      className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400"
      data-testid="message-send-error"
    >
      <AlertCircle size={14} />
      <span>Échec de l'envoi</span>
      <button
        onClick={() => onRetry(messageId)}
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        Réessayer
      </button>
      <span className="text-gray-400">•</span>
      <button
        onClick={() => onDelete(messageId)}
        className="text-gray-600 dark:text-gray-400 hover:underline"
      >
        Supprimer
      </button>
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

export class MessageErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Message component error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Ce composant n'a pas pu être chargé correctement.
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recharger
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorHandling = {
  ErrorAlert,
  MessageSendError,
  MessageErrorBoundary,
};

export default ErrorHandling;
