/**
 * Error handling classes and interfaces for AWS Amplify Environment Variables Management
 */

// Base Error Classes
export abstract class AmplifyEnvVarError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Configuration Errors
export class ConfigurationError extends AmplifyEnvVarError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', context);
  }
}

export class MissingVariableError extends ConfigurationError {
  constructor(variableName: string, appId: string, branchName: string) {
    super(
      `Required environment variable '${variableName}' is missing`,
      { variableName, appId, branchName }
    );
  }
}

export class InvalidVariableFormatError extends ConfigurationError {
  constructor(variableName: string, expectedFormat: string, actualValue: string) {
    super(
      `Variable '${variableName}' has invalid format. Expected: ${expectedFormat}`,
      { variableName, expectedFormat, actualValue }
    );
  }
}

export class ConnectivityError extends ConfigurationError {
  constructor(service: string, endpoint: string, error: string) {
    super(
      `Failed to connect to ${service} at ${endpoint}: ${error}`,
      { service, endpoint, error }
    );
  }
}

// Security Errors
export class SecurityError extends AmplifyEnvVarError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'SECURITY_ERROR', context);
  }
}

export class InsufficientPermissionsError extends SecurityError {
  constructor(action: string, resource: string) {
    super(
      `Insufficient permissions to perform '${action}' on resource '${resource}'`,
      { action, resource }
    );
  }
}

export class EncryptionError extends SecurityError {
  constructor(operation: string, details: string) {
    super(
      `Encryption operation '${operation}' failed: ${details}`,
      { operation, details }
    );
  }
}

export class AccessViolationError extends SecurityError {
  constructor(user: string, resource: string, action: string) {
    super(
      `User '${user}' attempted unauthorized '${action}' on resource '${resource}'`,
      { user, resource, action }
    );
  }
}

// Synchronization Errors
export class SyncError extends AmplifyEnvVarError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'SYNC_ERROR', context);
  }
}

export class EnvironmentConflictError extends SyncError {
  constructor(sourceEnv: string, targetEnv: string, conflictingVariables: string[]) {
    super(
      `Environment conflict between '${sourceEnv}' and '${targetEnv}' for variables: ${conflictingVariables.join(', ')}`,
      { sourceEnv, targetEnv, conflictingVariables }
    );
  }
}

export class NetworkTimeoutError extends SyncError {
  constructor(operation: string, timeout: number) {
    super(
      `Network timeout during '${operation}' after ${timeout}ms`,
      { operation, timeout }
    );
  }
}

export class RateLimitError extends SyncError {
  constructor(service: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for service '${service}'${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      { service, retryAfter }
    );
  }
}

// AWS CLI Errors
export class AWSCLIError extends AmplifyEnvVarError {
  constructor(message: string, command: string, exitCode: number, stderr?: string) {
    super(
      `AWS CLI command failed: ${message}`,
      'AWS_CLI_ERROR',
      { command, exitCode, stderr }
    );
  }
}

export class AmplifyAppNotFoundError extends AWSCLIError {
  constructor(appId: string) {
    super(
      `Amplify app with ID '${appId}' not found`,
      `amplify get-app --app-id ${appId}`,
      1
    );
  }
}

export class AmplifyBranchNotFoundError extends AWSCLIError {
  constructor(appId: string, branchName: string) {
    super(
      `Branch '${branchName}' not found in Amplify app '${appId}'`,
      `amplify get-branch --app-id ${appId} --branch-name ${branchName}`,
      1
    );
  }
}

// Validation Errors
export class ValidationError extends AmplifyEnvVarError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context);
  }
}

export class ConfigFileValidationError extends ValidationError {
  constructor(filePath: string, errors: string[]) {
    super(
      `Configuration file '${filePath}' validation failed: ${errors.join(', ')}`,
      { filePath, errors }
    );
  }
}

// Error Recovery Actions
export interface RecoveryAction {
  type: 'retry' | 'skip' | 'abort' | 'manual_intervention';
  message: string;
  retryDelay?: number;
  maxRetries?: number;
}

export interface SecurityAction {
  type: 'rotate_credentials' | 'revoke_access' | 'audit_log' | 'notify_admin';
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface SyncAction {
  type: 'force_sync' | 'manual_resolve' | 'rollback' | 'create_backup';
  message: string;
  requiresConfirmation: boolean;
}

// Error Handler Interface
export interface IErrorHandler {
  handleConfigurationError(error: ConfigurationError): Promise<RecoveryAction>;
  handleSecurityError(error: SecurityError): Promise<SecurityAction>;
  handleSyncError(error: SyncError): Promise<SyncAction>;
  generateErrorReport(errors: Error[]): ErrorReport;
}

export interface ErrorReport {
  timestamp: Date;
  totalErrors: number;
  errorsByType: Record<string, number>;
  criticalErrors: Error[];
  recommendations: string[];
}