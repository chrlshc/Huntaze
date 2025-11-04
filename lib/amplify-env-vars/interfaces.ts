/**
 * Service interfaces for AWS Amplify Environment Variables Management
 */

import {
  EnvironmentVariable,
  ValidationResult,
  ValidationReport,
  VariableDiff,
  EnvironmentDiff,
  BackupInfo,
  DriftReport,
  HealthReport,
  BuildAnalysis,
  AlertConfiguration,
  AzureOpenAIConfig,
  RotationConfig
} from './types';

// CLI Management Interface
export interface ICLIManager {
  setVariables(appId: string, branchName: string, variables: Record<string, string>): Promise<void>;
  getVariables(appId: string, branchName?: string): Promise<Record<string, string>>;
  compareEnvironments(appId: string, branch1: string, branch2: string): Promise<VariableDiff>;
  applyConfigFile(appId: string, configPath: string): Promise<void>;
  validateConfiguration(appId: string, branchName: string): Promise<ValidationResult>;
}

// Variable Validation Engine
export interface IValidationEngine {
  validateDatabaseUrl(url: string): ValidationResult;
  validateJwtSecret(secret: string): ValidationResult;
  validateAzureOpenAI(config: AzureOpenAIConfig): ValidationResult;
  validateConnectivity(variables: Record<string, string>): Promise<ValidationResult>;
  generateReport(appId: string, branchName: string): Promise<ValidationReport>;
}

// Security Handler
export interface ISecurityHandler {
  maskSensitiveValues(variables: Record<string, string>): Record<string, string>;
  validateEncryption(appId: string): Promise<boolean>;
  auditAccess(appId: string, branchName: string, action: string): Promise<void>;
  rotateSensitiveVariables(appId: string, rotationConfig: RotationConfig): Promise<void>;
}

// Environment Synchronization Service
export interface ISyncService {
  compareEnvironments(appId: string, sourceEnv: string, targetEnv: string): Promise<EnvironmentDiff>;
  promoteVariables(appId: string, sourceEnv: string, targetEnv: string, variables: string[]): Promise<void>;
  detectDrift(appId: string, expectedConfig: Record<string, string>): Promise<DriftReport>;
  createBackup(appId: string, branchName: string): Promise<BackupInfo>;
}

// Monitoring and Alerting System
export interface IMonitoringSystem {
  monitorVariableAccess(appId: string, branchName: string): Promise<void>;
  analyzeBuilds(appId: string, buildIds: string[]): Promise<BuildAnalysis>;
  performHealthCheck(appId: string): Promise<HealthReport>;
  configureAlerts(appId: string, alertConfig: AlertConfiguration): Promise<void>;
}

// AWS CLI Wrapper
export interface IAWSCLIWrapper {
  setAmplifyEnvironmentVariable(appId: string, branchName: string, key: string, value: string): Promise<void>;
  getAmplifyEnvironmentVariables(appId: string, branchName: string): Promise<Record<string, string>>;
  updateAmplifyBranch(appId: string, branchName: string, variables: Record<string, string>): Promise<void>;
  getAmplifyApp(appId: string): Promise<any>;
  getBranch(appId: string, branchName: string): Promise<any>;
}

// Configuration Parser
export interface IConfigParser {
  parseYAML(filePath: string): Promise<any>;
  parseJSON(filePath: string): Promise<any>;
  validateConfigFormat(config: any): ValidationResult;
  generateConfigFile(variables: Record<string, string>, format: 'yaml' | 'json'): string;
}

// Logger Interface
export interface ILogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  debug(message: string, meta?: any): void;
  audit(action: string, appId: string, branchName: string, meta?: any): void;
}

// Git Integration Interfaces
export interface IGitIntegration {
  initialize(): Promise<void>;
  trackConfigurationChange(configFile: string, environment: string, changeDescription: string, author?: string): Promise<GitCommitInfo>;
  getChangeHistory(environment?: string, configFile?: string): ChangeHistoryEntry[];
  setupPreCommitHook(): Promise<void>;
  validateBeforeCommit(): Promise<boolean>;
  getConfigurationDiff(commitHash?: string): string;
  revertToCommit(commitHash: string, configFile?: string): Promise<void>;
  createConfigurationBranch(environment: string, baseBranch?: string): Promise<string>;
}

export interface GitCommitInfo {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  files: string[];
}

export interface ChangeHistoryEntry {
  timestamp: string;
  environment: string;
  configFile: string;
  changeDescription: string;
  commitHash: string;
  author: string;
}

export interface GitHookConfig {
  preCommit: boolean;
  preCommitValidation: boolean;
  postCommit: boolean;
  commitMessageValidation: boolean;
}