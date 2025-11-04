import { EnvironmentVariable, VariableDiff, EnvironmentDiff } from './interfaces';
import { SecurityHandler } from './securityHandler';
import { AwsCliWrapper } from './awsCliWrapper';
import { Logger } from './logger';
import { ENVIRONMENT_SPECIFIC_VARIABLES } from './constants';

/**
 * Environment synchronization service for AWS Amplify environment variables
 */
export class SyncService {
  /**
   * Compare environment variables between two environments
   */
  static async compareEnvironments(
    appId: string,
    sourceEnv: string,
    targetEnv: string,
    options: ComparisonOptions = {}
  ): Promise<EnvironmentDiff> {
    const {
      includeValues = false,
      maskSensitive = true,
      excludeEnvironmentSpecific = true
    } = options;

    try {
      Logger.log(`Comparing environments: ${sourceEnv} -> ${targetEnv}`, 'info');

      // Get variables from both environments
      const [sourceResult, targetResult] = await Promise.all([
        AwsCliWrapper.getEnvironmentVariables(appId, sourceEnv),
        AwsCliWrapper.getEnvironmentVariables(appId, targetEnv)
      ]);

      if (!sourceResult.success || !targetResult.success) {
        throw new Error(`Failed to fetch environment variables: ${sourceResult.error || targetResult.error}`);
      }

      const sourceVars = this.objectToVariables(sourceResult.variables || {});
      const targetVars = this.objectToVariables(targetResult.variables || {});

      // Filter out environment-specific variables if requested
      const filteredSourceVars = excludeEnvironmentSpecific 
        ? sourceVars.filter(v => !ENVIRONMENT_SPECIFIC_VARIABLES.includes(v.key as any))
        : sourceVars;
      
      const filteredTargetVars = excludeEnvironmentSpecific
        ? targetVars.filter(v => !ENVIRONMENT_SPECIFIC_VARIABLES.includes(v.key as any))
        : targetVars;

      // Generate diff
      const diff = this.generateDiff(filteredSourceVars, filteredTargetVars, {
        includeValues,
        maskSensitive
      });

      const environmentDiff: EnvironmentDiff = {
        sourceEnvironment: sourceEnv,
        targetEnvironment: targetEnv,
        timestamp: new Date().toISOString(),
        summary: {
          totalSourceVariables: filteredSourceVars.length,
          totalTargetVariables: filteredTargetVars.length,
          added: diff.filter(d => d.type === 'added').length,
          removed: diff.filter(d => d.type === 'removed').length,
          modified: diff.filter(d => d.type === 'modified').length,
          unchanged: diff.filter(d => d.type === 'unchanged').length
        },
        differences: diff,
        recommendations: this.generateSyncRecommendations(diff)
      };

      Logger.log(`Environment comparison completed: ${diff.length} differences found`, 'info');
      return environmentDiff;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.log(`Environment comparison failed: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Generate diff between two sets of environment variables
   */
  private static generateDiff(
    sourceVars: EnvironmentVariable[],
    targetVars: EnvironmentVariable[],
    options: { includeValues: boolean; maskSensitive: boolean }
  ): VariableDiff[] {
    const { includeValues, maskSensitive } = options;
    const diff: VariableDiff[] = [];
    
    const sourceMap = new Map(sourceVars.map(v => [v.key, v.value]));
    const targetMap = new Map(targetVars.map(v => [v.key, v.value]));
    
    const allKeys = new Set([...sourceMap.keys(), ...targetMap.keys()]);

    for (const key of allKeys) {
      const sourceValue = sourceMap.get(key);
      const targetValue = targetMap.get(key);
      
      let type: VariableDiff['type'];
      let oldValue = sourceValue;
      let newValue = targetValue;

      if (sourceValue !== undefined && targetValue !== undefined) {
        type = sourceValue === targetValue ? 'unchanged' : 'modified';
      } else if (sourceValue !== undefined && targetValue === undefined) {
        type = 'removed';
        newValue = undefined;
      } else {
        type = 'added';
        oldValue = undefined;
      }

      // Apply masking if requested
      if (maskSensitive && SecurityHandler.isSensitive(key)) {
        if (oldValue) oldValue = SecurityHandler.maskSensitiveData(key, oldValue);
        if (newValue) newValue = SecurityHandler.maskSensitiveData(key, newValue);
      }

      // Include values only if requested
      if (!includeValues) {
        oldValue = oldValue ? '[HIDDEN]' : undefined;
        newValue = newValue ? '[HIDDEN]' : undefined;
      }

      diff.push({
        key,
        type,
        oldValue,
        newValue,
        isSensitive: SecurityHandler.isSensitive(key),
        impact: this.assessChangeImpact(key, type)
      });
    }

    return diff.sort((a, b) => {
      // Sort by impact (high first), then by type, then by key
      const impactOrder = { high: 0, medium: 1, low: 2 };
      const typeOrder = { removed: 0, added: 1, modified: 2, unchanged: 3 };
      
      if (a.impact !== b.impact) {
        return impactOrder[a.impact] - impactOrder[b.impact];
      }
      if (a.type !== b.type) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.key.localeCompare(b.key);
    });
  }

  /**
   * Assess the impact of a variable change
   */
  private static assessChangeImpact(key: string, type: VariableDiff['type']): 'low' | 'medium' | 'high' {
    // Critical variables that have high impact
    const criticalVariables = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'AZURE_OPENAI_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ];

    // Important variables that have medium impact
    const importantVariables = [
      'NODE_ENV',
      'REDIS_URL',
      'SMTP_HOST',
      'FROM_EMAIL'
    ];

    if (criticalVariables.includes(key)) {
      return type === 'unchanged' ? 'low' : 'high';
    }

    if (importantVariables.includes(key)) {
      return type === 'unchanged' ? 'low' : 'medium';
    }

    if (SecurityHandler.isSensitive(key)) {
      return type === 'unchanged' ? 'low' : 'medium';
    }

    return 'low';
  }

  /**
   * Generate synchronization recommendations
   */
  private static generateSyncRecommendations(diff: VariableDiff[]): string[] {
    const recommendations: string[] = [];
    
    const added = diff.filter(d => d.type === 'added');
    const removed = diff.filter(d => d.type === 'removed');
    const modified = diff.filter(d => d.type === 'modified');
    const highImpact = diff.filter(d => d.impact === 'high');

    if (highImpact.length > 0) {
      recommendations.push(`⚠️  ${highImpact.length} high-impact changes detected. Review carefully before syncing.`);
    }

    if (removed.length > 0) {
      recommendations.push(`🗑️  ${removed.length} variables will be removed from target environment.`);
    }

    if (added.length > 0) {
      recommendations.push(`➕ ${added.length} new variables will be added to target environment.`);
    }

    if (modified.length > 0) {
      recommendations.push(`✏️  ${modified.length} variables will be updated in target environment.`);
    }

    // Security recommendations
    const sensitiveDiffs = diff.filter(d => d.isSensitive && d.type !== 'unchanged');
    if (sensitiveDiffs.length > 0) {
      recommendations.push(`🔒 ${sensitiveDiffs.length} sensitive variables will be changed. Ensure proper access controls.`);
    }

    // General recommendations
    if (diff.length > 10) {
      recommendations.push('📋 Large number of changes detected. Consider syncing in batches.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Environments are in sync. No changes needed.');
    }

    return recommendations;
  }

  /**
   * Selective variable promotion between environments
   */
  static async promoteVariables(
    appId: string,
    sourceEnv: string,
    targetEnv: string,
    variableKeys: string[],
    options: PromotionOptions = {}
  ): Promise<PromotionResult> {
    const {
      dryRun = false,
      requireConfirmation = true,
      backupTarget = true,
      excludeSensitive = false
    } = options;

    try {
      Logger.log(`Starting variable promotion: ${sourceEnv} -> ${targetEnv}`, 'info');

      // Get source variables
      const sourceResult = await AwsCliWrapper.getEnvironmentVariables(appId, sourceEnv);
      if (!sourceResult.success) {
        throw new Error(`Failed to fetch source variables: ${sourceResult.error}`);
      }

      const sourceVars = this.objectToVariables(sourceResult.variables || {});
      const variablesToPromote = sourceVars.filter(v => variableKeys.includes(v.key));

      // Filter out sensitive variables if requested
      const filteredVariables = excludeSensitive
        ? variablesToPromote.filter(v => !SecurityHandler.isSensitive(v.key, v.value))
        : variablesToPromote;

      if (filteredVariables.length === 0) {
        return {
          success: false,
          message: 'No variables to promote after filtering',
          promoted: [],
          skipped: variableKeys,
          backup: null
        };
      }

      // Create backup if requested
      let backup: EnvironmentBackup | null = null;
      if (backupTarget && !dryRun) {
        backup = await this.createEnvironmentBackup(appId, targetEnv);
      }

      // Confirmation prompt (in real implementation, this would be interactive)
      if (requireConfirmation && !dryRun) {
        const secureLogger = SecurityHandler.createSecureLogger();
        secureLogger.logAudit('PROMOTION_REQUESTED', variableKeys, 'system');
      }

      // Perform promotion
      if (!dryRun) {
        const promotionResult = await this.executePromotion(appId, targetEnv, filteredVariables);
        
        const result: PromotionResult = {
          success: promotionResult.success,
          message: promotionResult.message,
          promoted: promotionResult.success ? filteredVariables.map(v => v.key) : [],
          skipped: variableKeys.filter(k => !filteredVariables.some(v => v.key === k)),
          backup
        };

        // Log the promotion
        const secureLogger = SecurityHandler.createSecureLogger();
        secureLogger.logAudit(
          'PROMOTION_EXECUTED',
          result.promoted,
          'system',
          result.success ? 'success' : 'failure'
        );

        return result;
      } else {
        // Dry run - just return what would be promoted
        return {
          success: true,
          message: `Dry run: Would promote ${filteredVariables.length} variables`,
          promoted: filteredVariables.map(v => v.key),
          skipped: variableKeys.filter(k => !filteredVariables.some(v => v.key === k)),
          backup: null
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.log(`Variable promotion failed: ${errorMessage}`, 'error');
      
      return {
        success: false,
        message: `Promotion failed: ${errorMessage}`,
        promoted: [],
        skipped: variableKeys,
        backup: null
      };
    }
  }

  /**
   * Execute the actual promotion of variables
   */
  private static async executePromotion(
    appId: string,
    targetEnv: string,
    variables: EnvironmentVariable[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Convert variables to the format expected by AWS CLI
      const variableMap: Record<string, string> = {};
      for (const variable of variables) {
        variableMap[variable.key] = variable.value;
      }

      const result = await AwsCliWrapper.setEnvironmentVariables(appId, targetEnv, variableMap);
      
      return {
        success: result.success,
        message: result.success ? 'Variables promoted successfully' : result.error || 'Promotion failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during promotion'
      };
    }
  }

  /**
   * Create backup of environment variables
   */
  static async createEnvironmentBackup(appId: string, environment: string): Promise<EnvironmentBackup> {
    try {
      const result = await AwsCliWrapper.getEnvironmentVariables(appId, environment);
      
      if (!result.success) {
        throw new Error(`Failed to create backup: ${result.error}`);
      }

      const backup: EnvironmentBackup = {
        appId,
        environment,
        timestamp: new Date().toISOString(),
        variables: result.variables || {},
        metadata: {
          totalVariables: Object.keys(result.variables || {}).length,
          sensitiveVariables: Object.keys(result.variables || {}).filter(k => 
            SecurityHandler.isSensitive(k)
          ).length
        }
      };

      Logger.log(`Environment backup created for ${environment}`, 'info');
      return backup;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.log(`Failed to create environment backup: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Restore environment from backup
   */
  static async restoreFromBackup(backup: EnvironmentBackup): Promise<{ success: boolean; message: string }> {
    try {
      Logger.log(`Restoring environment ${backup.environment} from backup`, 'info');

      const result = await AwsCliWrapper.setEnvironmentVariables(
        backup.appId,
        backup.environment,
        backup.variables
      );

      if (result.success) {
        const secureLogger = SecurityHandler.createSecureLogger();
        secureLogger.logAudit(
          'ENVIRONMENT_RESTORED',
          Object.keys(backup.variables),
          'system',
          'success'
        );
      }

      return {
        success: result.success,
        message: result.success ? 'Environment restored successfully' : result.error || 'Restore failed'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.log(`Environment restore failed: ${errorMessage}`, 'error');
      
      return {
        success: false,
        message: `Restore failed: ${errorMessage}`
      };
    }
  }

  /**
   * Detect configuration drift
   */
  static async detectDrift(
    appId: string,
    environment: string,
    expectedConfig: Record<string, string>,
    options: DriftDetectionOptions = {}
  ): Promise<DriftReport> {
    const { ignoreMissing = false, ignoreExtra = false } = options;

    try {
      Logger.log(`Detecting configuration drift for ${environment}`, 'info');

      const result = await AwsCliWrapper.getEnvironmentVariables(appId, environment);
      if (!result.success) {
        throw new Error(`Failed to fetch current variables: ${result.error}`);
      }

      const currentVars = result.variables || {};
      const driftItems: DriftItem[] = [];

      // Check for missing variables
      if (!ignoreMissing) {
        for (const [key, expectedValue] of Object.entries(expectedConfig)) {
          if (!(key in currentVars)) {
            driftItems.push({
              key,
              type: 'missing',
              expected: SecurityHandler.isSensitive(key) 
                ? SecurityHandler.maskSensitiveData(key, expectedValue)
                : expectedValue,
              actual: undefined,
              severity: SecurityHandler.isSensitive(key) ? 'high' : 'medium'
            });
          } else if (currentVars[key] !== expectedValue) {
            driftItems.push({
              key,
              type: 'modified',
              expected: SecurityHandler.isSensitive(key) 
                ? SecurityHandler.maskSensitiveData(key, expectedValue)
                : expectedValue,
              actual: SecurityHandler.isSensitive(key) 
                ? SecurityHandler.maskSensitiveData(key, currentVars[key])
                : currentVars[key],
              severity: SecurityHandler.isSensitive(key) ? 'high' : 'low'
            });
          }
        }
      }

      // Check for extra variables
      if (!ignoreExtra) {
        for (const key of Object.keys(currentVars)) {
          if (!(key in expectedConfig)) {
            driftItems.push({
              key,
              type: 'extra',
              expected: undefined,
              actual: SecurityHandler.isSensitive(key) 
                ? SecurityHandler.maskSensitiveData(key, currentVars[key])
                : currentVars[key],
              severity: 'low'
            });
          }
        }
      }

      const driftReport: DriftReport = {
        appId,
        environment,
        timestamp: new Date().toISOString(),
        hasDrift: driftItems.length > 0,
        summary: {
          totalDrift: driftItems.length,
          missing: driftItems.filter(d => d.type === 'missing').length,
          modified: driftItems.filter(d => d.type === 'modified').length,
          extra: driftItems.filter(d => d.type === 'extra').length,
          highSeverity: driftItems.filter(d => d.severity === 'high').length
        },
        driftItems,
        recommendations: this.generateDriftRecommendations(driftItems)
      };

      Logger.log(`Drift detection completed: ${driftItems.length} drift items found`, 'info');
      return driftReport;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.log(`Drift detection failed: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Generate drift correction recommendations
   */
  private static generateDriftRecommendations(driftItems: DriftItem[]): string[] {
    const recommendations: string[] = [];

    const missing = driftItems.filter(d => d.type === 'missing');
    const modified = driftItems.filter(d => d.type === 'modified');
    const extra = driftItems.filter(d => d.type === 'extra');
    const highSeverity = driftItems.filter(d => d.severity === 'high');

    if (highSeverity.length > 0) {
      recommendations.push(`🚨 ${highSeverity.length} high-severity drift items require immediate attention`);
    }

    if (missing.length > 0) {
      recommendations.push(`➕ Add ${missing.length} missing variables to match expected configuration`);
    }

    if (modified.length > 0) {
      recommendations.push(`✏️  Update ${modified.length} variables to match expected values`);
    }

    if (extra.length > 0) {
      recommendations.push(`🗑️  Consider removing ${extra.length} unexpected variables`);
    }

    if (driftItems.length === 0) {
      recommendations.push('✅ No configuration drift detected');
    }

    return recommendations;
  }

  /**
   * Convert object to EnvironmentVariable array
   */
  private static objectToVariables(obj: Record<string, string>): EnvironmentVariable[] {
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
  }
}

// Type definitions
interface ComparisonOptions {
  includeValues?: boolean;
  maskSensitive?: boolean;
  excludeEnvironmentSpecific?: boolean;
}

interface PromotionOptions {
  dryRun?: boolean;
  requireConfirmation?: boolean;
  backupTarget?: boolean;
  excludeSensitive?: boolean;
}

interface PromotionResult {
  success: boolean;
  message: string;
  promoted: string[];
  skipped: string[];
  backup: EnvironmentBackup | null;
}

interface EnvironmentBackup {
  appId: string;
  environment: string;
  timestamp: string;
  variables: Record<string, string>;
  metadata: {
    totalVariables: number;
    sensitiveVariables: number;
  };
}

interface DriftDetectionOptions {
  ignoreMissing?: boolean;
  ignoreExtra?: boolean;
}

interface DriftItem {
  key: string;
  type: 'missing' | 'modified' | 'extra';
  expected?: string;
  actual?: string;
  severity: 'low' | 'medium' | 'high';
}

interface DriftReport {
  appId: string;
  environment: string;
  timestamp: string;
  hasDrift: boolean;
  summary: {
    totalDrift: number;
    missing: number;
    modified: number;
    extra: number;
    highSeverity: number;
  };
  driftItems: DriftItem[];
  recommendations: string[];
}