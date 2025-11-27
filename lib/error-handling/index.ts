/**
 * Error Handling and Graceful Degradation
 * Central export for error handling utilities
 */

export {
  ErrorHandler,
  getErrorHandler,
  DEFAULT_RETRY_OPTIONS,
  ALERT_THRESHOLDS,
  type RetryOptions,
  type CircuitBreakerConfig,
  type ErrorContext,
  type StructuredError,
  ErrorCategory,
} from './error-handler';

export {
  GracefulDegradationManager,
  getDegradationManager,
  withDegradation,
  type DegradationStrategy,
  type ServiceHealth,
} from './graceful-degradation';
