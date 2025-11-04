/**
 * CLI Manager for AWS Amplify Environment Variables
 */

import { ICLIManager, IAWSCLIWrapper, ILogger, IConfigParser } from './interfaces';
import { 
  VariableDiff, 
  ValidationResult, 
  CLICommandOptions, 
  CLICommandResult 
} from './types';
import { AWSCLIWrapper } from './awsCliWrapper';
import { Logger } from './logger';
import { ConfigParser } from './configParser';
import { 
  ConfigurationError, 
  MissingVariableError,
  InvalidVariableFormatError 
} from './errors';
import { CLI_CONFIG, SUCCESS_MESSAGES } from './constants';

export class CLIManager implements ICLIManager {
  private awsCli: IAWSCLIWrapper;
  private logger: ILogger;
  private configParser: IConfigParser;

  constructor(awsCli?: IAWSCLIWrapper, logger?: ILogger, configParser?: IConfigParser) {
    this.awsCli = awsCli || new AWSCLIWrapper();
    this.logger = logger || new Logger();
    this.configParser = configParser || new ConfigParser();
  }

  /**
   * Set multiple environment variables for an Amplify branch
   */
  async setVariables(
    appId: string, 
    branchName: string, 
    variables: Record<string, string>
  ): Promise<void> {
    this.logger.info('Setting environment variables', { 
      appId, 
      branchName, 
      variableCount: Object.keys(variables).length 
    });

    try {
      // Validate inputs
      this.validateVariables(variables);

      // Process variables in batches to avoid CLI limits
      const batches = this.createBatches(variables, CLI_CONFIG.BATCH_SIZE);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        this.logger.debug(`Processing batch ${i + 1}/${batches.length}`, { 
          batchSize: Object.keys(batch).length 
        });

        await this.awsCli.updateAmplifyBranch(appId, branchName, batch);
        
        // Small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await this.sleep(100);
        }
      }

      this.logger.info(SUCCESS_MESSAGES.VARIABLES_SET, { 
        appId, 
        branchName, 
        variableCount: Object.keys(variables).length 
      });

      // Audit log the operation
      this.logger.audit('SET_VARIABLES', appId, branchName, {
        variableNames: Object.keys(variables),
        variableCount: Object.keys(variables).length
      });

    } catch (error) {
      this.logger.error('Failed to set environment variables', error as Error, {
        appId,
        branchName,
        variableCount: Object.keys(variables).length
      });
      throw error;
    }
  }

  /**
   * Get all environment variables for an Amplify branch
   */
  async getVariables(appId: string, branchName?: string): Promise<Record<string, string>> {
    this.logger.info('Getting environment variables', { appId, branchName });

    try {
      if (branchName) {
        const variables = await this.awsCli.getAmplifyEnvironmentVariables(appId, branchName);
        
        this.logger.info('Retrieved environment variables', { 
          appId, 
          branchName, 
          variableCount: Object.keys(variables).length 
        });

        return variables;
      } else {
        // If no branch specified, get app-level variables
        const appData = await this.awsCli.getAmplifyApp(appId);
        const variables = appData.app?.environmentVariables || {};
        
        this.logger.info('Retrieved app-level environment variables', { 
          appId, 
          variableCount: Object.keys(variables).length 
        });

        return variables;
      }
    } catch (error) {
      this.logger.error('Failed to get environment variables', error as Error, {
        appId,
        branchName
      });
      throw error;
    }
  }

  /**
   * Compare environment variables between two branches
   */
  async compareEnvironments(
    appId: string, 
    branch1: string, 
    branch2: string
  ): Promise<VariableDiff> {
    this.logger.info('Comparing environments', { appId, branch1, branch2 });

    try {
      const [vars1, vars2] = await Promise.all([
        this.getVariables(appId, branch1),
        this.getVariables(appId, branch2)
      ]);

      const diff = this.calculateDiff(vars1, vars2);
      
      this.logger.info('Environment comparison completed', {
        appId,
        branch1,
        branch2,
        totalDifferences: diff.added.length + diff.removed.length + diff.modified.length
      });

      return diff;
    } catch (error) {
      this.logger.error('Failed to compare environments', error as Error, {
        appId,
        branch1,
        branch2
      });
      throw error;
    }
  }

  /**
   * Apply configuration from a file
   */
  async applyConfigFile(appId: string, configPath: string, environment?: string): Promise<void> {
    this.logger.info('Applying configuration from file', { appId, configPath, environment });

    try {
      // Default to staging if no environment specified
      const targetEnv = environment || 'staging';
      
      // Parse configuration file
      const variables = await this.configParser.parseConfigFile(configPath, targetEnv);
      
      // Get current variables for diff
      const currentVariables = await this.getVariables(appId, targetEnv);
      
      // Create diff preview
      const diff = await this.configParser.createConfigDiff(currentVariables, configPath, targetEnv);
      
      this.logger.info('Configuration diff preview', {
        appId,
        environment: targetEnv,
        added: diff.added.length,
        removed: diff.removed.length,
        modified: diff.modified.length,
        unchanged: diff.unchanged.length
      });

      // Apply the new configuration
      await this.setVariables(appId, targetEnv, variables);
      
      this.logger.info('Configuration applied successfully', {
        appId,
        environment: targetEnv,
        configPath,
        totalVariables: Object.keys(variables).length
      });

      // Audit log the operation
      this.logger.audit('APPLY_CONFIG_FILE', appId, targetEnv, {
        configPath,
        variableCount: Object.keys(variables).length,
        changes: {
          added: diff.added.length,
          removed: diff.removed.length,
          modified: diff.modified.length
        }
      });

    } catch (error) {
      this.logger.error('Failed to apply configuration file', error as Error, {
        appId,
        configPath,
        environment
      });
      throw error;
    }
  }

  /**
   * Validate configuration (placeholder - will be implemented with validation engine)
   */
  async validateConfiguration(appId: string, branchName: string): Promise<ValidationResult> {
    throw new Error('Configuration validation will be implemented with the validation engine');
  }

  /**
   * Parse comma-separated variables string (KEY1=value1,KEY2=value2)
   */
  parseVariablesString(variablesString: string): Record<string, string> {
    const variables: Record<string, string> = {};
    
    if (!variablesString.trim()) {
      return variables;
    }

    // Split by comma, but handle escaped commas
    const pairs = this.splitVariablePairs(variablesString);
    
    for (const pair of pairs) {
      const equalIndex = pair.indexOf('=');
      if (equalIndex === -1) {
        throw new InvalidVariableFormatError(
          pair,
          'KEY=value',
          pair
        );
      }

      const key = pair.substring(0, equalIndex).trim();
      const value = pair.substring(equalIndex + 1);

      if (!key) {
        throw new InvalidVariableFormatError(
          'empty key',
          'KEY=value',
          pair
        );
      }

      variables[key] = value;
    }

    return variables;
  }

  /**
   * Format variables as comma-separated string
   */
  formatVariablesString(variables: Record<string, string>): string {
    return Object.entries(variables)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
  }

  /**
   * Execute CLI command with options
   */
  async executeCommand(
    command: string, 
    options: CLICommandOptions = {}
  ): Promise<CLICommandResult> {
    this.logger.info('Executing CLI command', { command, options });

    try {
      switch (command) {
        case 'set':
          if (!options.appId || !options.branchName || !options.variables) {
            throw new ConfigurationError('Missing required options: appId, branchName, variables');
          }
          
          const variables = this.parseVariablesString(options.variables);
          
          if (options.dryRun) {
            return {
              success: true,
              message: `Dry run: Would set ${Object.keys(variables).length} variables`,
              data: { variables, dryRun: true }
            };
          }

          await this.setVariables(options.appId, options.branchName, variables);
          return {
            success: true,
            message: SUCCESS_MESSAGES.VARIABLES_SET,
            data: { variableCount: Object.keys(variables).length }
          };

        case 'get':
          if (!options.appId) {
            throw new ConfigurationError('Missing required option: appId');
          }

          const retrievedVars = await this.getVariables(options.appId, options.branchName);
          return {
            success: true,
            message: `Retrieved ${Object.keys(retrievedVars).length} variables`,
            data: { variables: retrievedVars }
          };

        case 'compare':
          if (!options.appId || !options.branchName) {
            throw new ConfigurationError('Missing required options: appId, branchName (source and target)');
          }

          // For compare, we expect branchName to be "source,target"
          const branches = options.branchName.split(',');
          if (branches.length !== 2) {
            throw new ConfigurationError('Compare command requires two branch names separated by comma');
          }

          const diff = await this.compareEnvironments(options.appId, branches[0], branches[1]);
          return {
            success: true,
            message: `Found ${diff.added.length + diff.removed.length + diff.modified.length} differences`,
            data: { diff }
          };

        default:
          throw new ConfigurationError(`Unknown command: ${command}`);
      }
    } catch (error) {
      this.logger.error('CLI command failed', error as Error, { command, options });
      return {
        success: false,
        message: (error as Error).message,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Validate variables object
   */
  private validateVariables(variables: Record<string, string>): void {
    if (!variables || Object.keys(variables).length === 0) {
      throw new ConfigurationError('No variables provided');
    }

    for (const [key, value] of Object.entries(variables)) {
      if (!key.trim()) {
        throw new InvalidVariableFormatError('empty key', 'non-empty string', '');
      }

      if (value === undefined || value === null) {
        throw new MissingVariableError(key, 'unknown', 'unknown');
      }
    }
  }

  /**
   * Create batches of variables for processing
   */
  private createBatches(
    variables: Record<string, string>, 
    batchSize: number
  ): Record<string, string>[] {
    const entries = Object.entries(variables);
    const batches: Record<string, string>[] = [];

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      batches.push(Object.fromEntries(batch));
    }

    return batches;
  }

  /**
   * Calculate differences between two variable sets
   */
  private calculateDiff(
    vars1: Record<string, string>, 
    vars2: Record<string, string>
  ): VariableDiff {
    const keys1 = new Set(Object.keys(vars1));
    const keys2 = new Set(Object.keys(vars2));
    
    const added: string[] = [];
    const removed: string[] = [];
    const modified: Array<{ key: string; oldValue: string; newValue: string }> = [];
    const unchanged: string[] = [];

    // Find added variables (in vars2 but not in vars1)
    for (const key of keys2) {
      if (!keys1.has(key)) {
        added.push(key);
      }
    }

    // Find removed variables (in vars1 but not in vars2)
    for (const key of keys1) {
      if (!keys2.has(key)) {
        removed.push(key);
      }
    }

    // Find modified and unchanged variables
    for (const key of keys1) {
      if (keys2.has(key)) {
        if (vars1[key] !== vars2[key]) {
          modified.push({
            key,
            oldValue: vars1[key],
            newValue: vars2[key]
          });
        } else {
          unchanged.push(key);
        }
      }
    }

    return {
      added: added.sort(),
      removed: removed.sort(),
      modified: modified.sort((a, b) => a.key.localeCompare(b.key)),
      unchanged: unchanged.sort()
    };
  }

  /**
   * Split variable pairs handling escaped commas
   */
  private splitVariablePairs(variablesString: string): string[] {
    const pairs: string[] = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < variablesString.length; i++) {
      const char = variablesString[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
        current += char;
        continue;
      }

      if (char === ',' && !inQuotes) {
        if (current.trim()) {
          pairs.push(current.trim());
        }
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      pairs.push(current.trim());
    }

    return pairs;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}