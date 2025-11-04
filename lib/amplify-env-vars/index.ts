/**
 * AWS Amplify Environment Variables Management
 * Main export file for all types, interfaces, and constants
 */

// Types and Interfaces
export * from './types';
export * from './interfaces';
export * from './errors';
export * from './constants';

// Core Services
export * from './cliManager';
export * from './awsCliWrapper';
export * from './configParser';
export * from './logger';

// Validation Services
export * from './validators';
export * from './connectivityTester';
export * from './validationReporter';
export * from './validationEngine';

// Security Services
export * from './securityHandler';

// Synchronization Services
export * from './syncService';

// Monitoring Services
export * from './monitoringSystem';

// Re-export commonly used types for convenience
export type {
  EnvironmentVariable,
  ValidationResult,
  ValidationReport,
  EnvironmentConfig,
  ConfigurationFile,
  VariableDiff,
  EnvironmentDiff,
  CLICommandOptions,
  CLICommandResult
} from './types';

export type {
  ICLIManager,
  IValidationEngine,
  ISecurityHandler,
  ISyncService,
  IMonitoringSystem,
  IAWSCLIWrapper,
  IConfigParser,
  ILogger
} from './interfaces';

// Constants for easy access
export {
  REQUIRED_VARIABLES,
  OPTIONAL_VARIABLES,
  SENSITIVE_PATTERNS,
  VALIDATION_PATTERNS,
  AWS_CONFIG,
  CLI_CONFIG
} from './constants';