import { VariableValidator } from './validators';
import { ConnectivityTester } from './connectivityTester';
import { ValidationReporter } from './validationReporter';
import { ValidationResult, EnvironmentVariable } from './interfaces';
import { Logger } from './logger';

/**
 * Main validation engine that orchestrates all validation processes
 */
export class ValidationEngine {
  /**
   * Perform comprehensive validation of environment variables
   */
  static async validateEnvironmentVariables(
    variables: EnvironmentVariable[],
    options: ValidationOptions = {}
  ): Promise<ValidationEngineResult> {
    const {
      skipConnectivityTests = false,
      useCache = true,
      parallel = true,
      timeout = 30000
    } = options;

    Logger.log(`Starting validation of ${variables.length} environment variables`, 'info');

    try {
      // Check cache first if enabled
      if (useCache) {
        const cachedReport = ValidationReporter.getCachedReport(variables);
        if (cachedReport) {
          Logger.log('Using cached validation results', 'info');
          return {
            success: true,
            report: cachedReport,
            executionTime: 0
          };
        }
      }

      const startTime = Date.now();

      // Step 1: Format validation (always performed)
      Logger.log('Performing format validation...', 'info');
      const formatResults = VariableValidator.validateVariables(variables);
      
      // Step 2: Connectivity testing (optional)
      let connectivityResults: ValidationResult[] = [];
      if (!skipConnectivityTests) {
        Logger.log('Performing connectivity tests...', 'info');
        
        if (parallel) {
          connectivityResults = await Promise.race([
            ConnectivityTester.testConnectivityParallel(variables),
            new Promise<ValidationResult[]>((_, reject) => 
              setTimeout(() => reject(new Error('Connectivity tests timed out')), timeout)
            )
          ]);
        } else {
          connectivityResults = await ConnectivityTester.testConnectivity(variables);
        }
      }

      // Step 3: Generate comprehensive report
      Logger.log('Generating validation report...', 'info');
      const report = ValidationReporter.generateReport(
        formatResults,
        connectivityResults,
        variables
      );

      const executionTime = Date.now() - startTime;
      Logger.log(`Validation completed in ${executionTime}ms`, 'info');

      // Log report summary
      ValidationReporter.logReport(report);

      return {
        success: true,
        report,
        executionTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      Logger.log(`Validation failed: ${errorMessage}`, 'error');

      return {
        success: false,
        error: errorMessage,
        executionTime: Date.now()
      };
    }
  }

  /**
   * Validate specific variable types
   */
  static async validateVariableType(
    variables: EnvironmentVariable[],
    type: VariableType
  ): Promise<ValidationResult[]> {
    const filteredVariables = this.filterVariablesByType(variables, type);
    
    switch (type) {
      case 'database':
        return filteredVariables.map(v => VariableValidator.validateDatabaseUrl(v.key, v.value));
      
      case 'jwt':
        return filteredVariables.map(v => VariableValidator.validateJwtSecret(v.key, v.value));
      
      case 'azure-openai':
        return filteredVariables.map(v => VariableValidator.validateAzureOpenAI(v.key, v.value));
      
      case 'url':
        return filteredVariables.map(v => VariableValidator.validateUrl(v.key, v.value));
      
      case 'email':
        return filteredVariables.map(v => VariableValidator.validateEmail(v.key, v.value));
      
      default:
        return filteredVariables.map(v => VariableValidator.validateVariable(v));
    }
  }

  /**
   * Filter variables by type
   */
  private static filterVariablesByType(
    variables: EnvironmentVariable[],
    type: VariableType
  ): EnvironmentVariable[] {
    switch (type) {
      case 'database':
        return variables.filter(v => 
          v.key.includes('DATABASE') || v.key.includes('DB_')
        );
      
      case 'jwt':
        return variables.filter(v => 
          v.key.includes('JWT') || v.key.includes('SECRET')
        );
      
      case 'azure-openai':
        return variables.filter(v => 
          v.key.includes('AZURE_OPENAI') || v.key.includes('OPENAI')
        );
      
      case 'url':
        return variables.filter(v => 
          v.key.includes('URL') || v.key.includes('ENDPOINT')
        );
      
      case 'email':
        return variables.filter(v => 
          v.key.includes('EMAIL') || v.key.includes('MAIL')
        );
      
      default:
        return variables;
    }
  }

  /**
   * Quick validation for CI/CD pipelines
   */
  static async quickValidation(variables: EnvironmentVariable[]): Promise<QuickValidationResult> {
    Logger.log('Performing quick validation for CI/CD', 'info');

    const formatResults = VariableValidator.validateVariables(variables);
    const criticalErrors = formatResults.filter(r => !r.isValid && r.severity === 'error');
    
    const summary = VariableValidator.getValidationSummary(formatResults);
    
    return {
      passed: criticalErrors.length === 0,
      criticalErrors: criticalErrors.length,
      warnings: formatResults.filter(r => r.severity === 'warning').length,
      score: Math.round((summary.passed / summary.total) * 100),
      details: criticalErrors.map(r => `${r.variable}: ${r.message}`)
    };
  }

  /**
   * Validate required variables are present
   */
  static validateRequiredVariables(
    variables: EnvironmentVariable[],
    requiredVariables: string[]
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const variableKeys = variables.map(v => v.key);

    for (const required of requiredVariables) {
      if (!variableKeys.includes(required)) {
        results.push({
          isValid: false,
          variable: required,
          message: 'Required environment variable is missing',
          severity: 'error'
        });
      } else {
        const variable = variables.find(v => v.key === required);
        if (!variable?.value || variable.value.trim() === '') {
          results.push({
            isValid: false,
            variable: required,
            message: 'Required environment variable is empty',
            severity: 'error'
          });
        } else {
          results.push({
            isValid: true,
            variable: required,
            message: 'Required variable is present and not empty',
            severity: 'success'
          });
        }
      }
    }

    return results;
  }

  /**
   * Validate environment-specific configuration
   */
  static async validateEnvironmentConfig(
    variables: EnvironmentVariable[],
    environment: 'development' | 'staging' | 'production'
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Environment-specific validation rules
    switch (environment) {
      case 'production':
        // Production should use HTTPS URLs
        const urlVariables = variables.filter(v => 
          v.key.includes('URL') && !v.key.includes('DATABASE')
        );
        
        for (const urlVar of urlVariables) {
          if (urlVar.value && !urlVar.value.startsWith('https://')) {
            results.push({
              isValid: false,
              variable: urlVar.key,
              message: 'Production URLs should use HTTPS protocol',
              severity: 'error'
            });
          }
        }

        // Production should have strong JWT secrets
        const jwtVariables = variables.filter(v => 
          v.key.includes('SECRET') || v.key.includes('JWT')
        );
        
        for (const jwtVar of jwtVariables) {
          if (jwtVar.value && jwtVar.value.length < 64) {
            results.push({
              isValid: false,
              variable: jwtVar.key,
              message: 'Production secrets should be at least 64 characters long',
              severity: 'warning'
            });
          }
        }
        break;

      case 'staging':
        // Staging can be more lenient but should still be secure
        const stagingSecrets = variables.filter(v => 
          v.key.includes('SECRET') || v.key.includes('KEY')
        );
        
        for (const secret of stagingSecrets) {
          if (secret.value && secret.value.length < 32) {
            results.push({
              isValid: false,
              variable: secret.key,
              message: 'Staging secrets should be at least 32 characters long',
              severity: 'warning'
            });
          }
        }
        break;

      case 'development':
        // Development can use localhost and shorter secrets
        results.push({
          isValid: true,
          variable: 'ENVIRONMENT',
          message: 'Development environment validation passed',
          severity: 'info'
        });
        break;
    }

    return results;
  }

  /**
   * Batch validation for multiple environments
   */
  static async validateMultipleEnvironments(
    environmentConfigs: Record<string, EnvironmentVariable[]>,
    options: ValidationOptions = {}
  ): Promise<Record<string, ValidationEngineResult>> {
    const results: Record<string, ValidationEngineResult> = {};

    for (const [envName, variables] of Object.entries(environmentConfigs)) {
      Logger.log(`Validating environment: ${envName}`, 'info');
      
      try {
        results[envName] = await this.validateEnvironmentVariables(variables, options);
      } catch (error) {
        results[envName] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0
        };
      }
    }

    return results;
  }

  /**
   * Get validation statistics across multiple results
   */
  static getValidationStatistics(results: ValidationEngineResult[]): ValidationStatistics {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalExecutionTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0);
    
    const scores = results
      .filter(r => r.success && r.report)
      .map(r => r.report!.summary.overallScore);
    
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    return {
      totalValidations: results.length,
      successful,
      failed,
      averageScore,
      totalExecutionTime,
      averageExecutionTime: results.length > 0 ? Math.round(totalExecutionTime / results.length) : 0
    };
  }
}

// Type definitions
interface ValidationOptions {
  skipConnectivityTests?: boolean;
  useCache?: boolean;
  parallel?: boolean;
  timeout?: number;
}

interface ValidationEngineResult {
  success: boolean;
  report?: any; // ValidationReport type from validationReporter.ts
  error?: string;
  executionTime: number;
}

interface QuickValidationResult {
  passed: boolean;
  criticalErrors: number;
  warnings: number;
  score: number;
  details: string[];
}

interface ValidationStatistics {
  totalValidations: number;
  successful: number;
  failed: number;
  averageScore: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
}

type VariableType = 'database' | 'jwt' | 'azure-openai' | 'url' | 'email' | 'all';