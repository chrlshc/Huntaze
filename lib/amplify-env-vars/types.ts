/**
 * Core TypeScript interfaces for AWS Amplify Environment Variables Management
 */

// Environment Variable Configuration
export interface EnvironmentVariable {
  key: string;
  value: string;
  isSensitive: boolean;
  isRequired: boolean;
  validationRules: ValidationRule[];
  lastModified: Date;
  modifiedBy: string;
}

export interface EnvironmentConfig {
  appId: string;
  branchName: string;
  variables: EnvironmentVariable[];
  metadata: {
    version: string;
    createdAt: Date;
    lastValidated: Date;
  };
}

// Validation Types
export interface ValidationRule {
  type: 'format' | 'length' | 'pattern' | 'connectivity';
  value: string | number;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  variable: string;
  message: string;
  expectedFormat?: string;
  severity: 'critical' | 'error' | 'warning';
}

export interface ValidationWarning {
  variable: string;
  message: string;
  suggestion?: string;
}

export interface ValidationReport {
  appId: string;
  branchName: string;
  timestamp: Date;
  overallStatus: 'valid' | 'warnings' | 'errors';
  results: ValidationResult[];
  summary: {
    totalVariables: number;
    validVariables: number;
    warningVariables: number;
    errorVariables: number;
  };
}

// Configuration Management
export interface ConfigurationFile {
  version: string;
  environments: {
    [branchName: string]: {
      variables: Record<string, string>;
      overrides?: Record<string, string>;
    };
  };
  validation: {
    required: string[];
    formats: Record<string, string>;
  };
}

// Azure OpenAI Configuration
export interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  apiVersion: string;
  deployment: string;
}

// Environment Comparison
export interface VariableDiff {
  added: string[];
  removed: string[];
  modified: Array<{
    key: string;
    oldValue: string;
    newValue: string;
  }>;
  unchanged: string[];
}

export interface EnvironmentDiff {
  sourceEnvironment: string;
  targetEnvironment: string;
  differences: VariableDiff;
  summary: {
    totalDifferences: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
  };
}

// Monitoring and Alerting
export interface AlertConfiguration {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook';
  endpoint: string;
  enabled: boolean;
}

export interface AlertRule {
  condition: 'missing_variable' | 'validation_failure' | 'build_failure' | 'drift_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface HealthReport {
  appId: string;
  timestamp: Date;
  overallHealth: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: Record<string, any>;
}

// Build Analysis
export interface BuildAnalysis {
  buildIds: string[];
  variableRelatedFailures: BuildFailure[];
  patterns: FailurePattern[];
  recommendations: string[];
}

export interface BuildFailure {
  buildId: string;
  timestamp: Date;
  errorMessage: string;
  relatedVariables: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface FailurePattern {
  pattern: string;
  frequency: number;
  affectedVariables: string[];
  suggestedFix: string;
}

// Backup and Restore
export interface BackupInfo {
  id: string;
  appId: string;
  branchName: string;
  timestamp: Date;
  variableCount: number;
  checksum: string;
}

export interface DriftReport {
  appId: string;
  branchName: string;
  timestamp: Date;
  driftDetected: boolean;
  changes: Array<{
    variable: string;
    expectedValue: string;
    actualValue: string;
    changeType: 'added' | 'removed' | 'modified';
  }>;
}

// Security and Rotation
export interface RotationConfig {
  variables: string[];
  schedule?: string;
  notificationChannels: string[];
  backupBeforeRotation: boolean;
}

// CLI Command Types
export interface CLICommandOptions {
  appId?: string;
  branchName?: string;
  variables?: string;
  configFile?: string;
  output?: string;
  format?: 'json' | 'yaml' | 'table';
  verbose?: boolean;
  dryRun?: boolean;
}

export interface CLICommandResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
}

// Enhanced Backup and Restore Types
export interface BackupMetadata {
  backupId: string;
  appId: string;
  branchName: string;
  timestamp: string;
  description: string;
  tags: Record<string, string>;
  variableCount: number;
  checksum: string;
  version: string;
}

export interface RestoreInfo {
  backupId: string;
  targetAppId: string;
  targetBranch: string;
  timestamp: string;
  variablesRestored: string[];
  preRestoreBackupId: string;
  success: boolean;
  dryRun: boolean;
}

export interface BackupVerificationResult {
  isValid: boolean;
  errors: string[];
  metadata?: BackupMetadata;
}

export interface EnhancedBackupInfo {
  backupId: string;
  appId: string;
  branchName: string;
  timestamp: string;
  description: string;
  filePath: string;
  size: number;
  checksum: string;
  variableCount: number;
}