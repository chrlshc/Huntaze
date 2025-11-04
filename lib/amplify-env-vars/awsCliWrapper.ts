/**
 * AWS CLI Wrapper for Amplify Environment Variables Management
 */

import { execSync } from 'child_process';
import { IAWSCLIWrapper } from './interfaces';
import { 
  AWSCLIError, 
  AmplifyAppNotFoundError, 
  AmplifyBranchNotFoundError,
  NetworkTimeoutError 
} from './errors';
import { AWS_CONFIG, CLI_CONFIG } from './constants';

export class AWSCLIWrapper implements IAWSCLIWrapper {
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor() {
    this.timeout = AWS_CONFIG.CONNECTION_TIMEOUT;
    this.maxRetries = AWS_CONFIG.MAX_RETRIES;
  }

  /**
   * Set a single environment variable for an Amplify branch
   */
  async setAmplifyEnvironmentVariable(
    appId: string, 
    branchName: string, 
    key: string, 
    value: string
  ): Promise<void> {
    this.validateAppId(appId);
    this.validateBranchName(branchName);
    this.validateVariableName(key);

    const command = `aws amplify update-branch --app-id ${appId} --branch-name ${branchName} --environment-variables "${key}=${value}" --output ${CLI_CONFIG.OUTPUT_FORMAT}`;
    
    try {
      await this.executeCommand(command);
    } catch (error) {
      if (error instanceof AWSCLIError) {
        if (error.context?.stderr?.includes('NotFoundException')) {
          if (error.context.stderr.includes('app')) {
            throw new AmplifyAppNotFoundError(appId);
          } else {
            throw new AmplifyBranchNotFoundError(appId, branchName);
          }
        }
      }
      throw error;
    }
  }

  /**
   * Get all environment variables for an Amplify branch
   */
  async getAmplifyEnvironmentVariables(appId: string, branchName: string): Promise<Record<string, string>> {
    this.validateAppId(appId);
    this.validateBranchName(branchName);

    const command = `aws amplify get-branch --app-id ${appId} --branch-name ${branchName} --output ${CLI_CONFIG.OUTPUT_FORMAT}`;
    
    try {
      const result = await this.executeCommand(command);
      const branchData = JSON.parse(result);
      return branchData.branch?.environmentVariables || {};
    } catch (error) {
      if (error instanceof AWSCLIError) {
        if (error.context?.stderr?.includes('NotFoundException')) {
          if (error.context.stderr.includes('app')) {
            throw new AmplifyAppNotFoundError(appId);
          } else {
            throw new AmplifyBranchNotFoundError(appId, branchName);
          }
        }
      }
      throw error;
    }
  }

  /**
   * Update multiple environment variables for an Amplify branch
   */
  async updateAmplifyBranch(
    appId: string, 
    branchName: string, 
    variables: Record<string, string>
  ): Promise<void> {
    this.validateAppId(appId);
    this.validateBranchName(branchName);

    // Convert variables to comma-separated format
    const variablesString = Object.entries(variables)
      .map(([key, value]) => {
        this.validateVariableName(key);
        // Escape special characters in values
        const escapedValue = this.escapeValue(value);
        return `${key}=${escapedValue}`;
      })
      .join(',');

    const command = `aws amplify update-branch --app-id ${appId} --branch-name ${branchName} --environment-variables "${variablesString}" --output ${CLI_CONFIG.OUTPUT_FORMAT}`;
    
    try {
      await this.executeCommand(command);
    } catch (error) {
      if (error instanceof AWSCLIError) {
        if (error.context?.stderr?.includes('NotFoundException')) {
          if (error.context.stderr.includes('app')) {
            throw new AmplifyAppNotFoundError(appId);
          } else {
            throw new AmplifyBranchNotFoundError(appId, branchName);
          }
        }
      }
      throw error;
    }
  }

  /**
   * Get Amplify app information
   */
  async getAmplifyApp(appId: string): Promise<any> {
    this.validateAppId(appId);

    const command = `aws amplify get-app --app-id ${appId} --output ${CLI_CONFIG.OUTPUT_FORMAT}`;
    
    try {
      const result = await this.executeCommand(command);
      return JSON.parse(result);
    } catch (error) {
      if (error instanceof AWSCLIError) {
        if (error.context?.stderr?.includes('NotFoundException')) {
          throw new AmplifyAppNotFoundError(appId);
        }
      }
      throw error;
    }
  }

  /**
   * Get Amplify branch information
   */
  async getBranch(appId: string, branchName: string): Promise<any> {
    this.validateAppId(appId);
    this.validateBranchName(branchName);

    const command = `aws amplify get-branch --app-id ${appId} --branch-name ${branchName} --output ${CLI_CONFIG.OUTPUT_FORMAT}`;
    
    try {
      const result = await this.executeCommand(command);
      return JSON.parse(result);
    } catch (error) {
      if (error instanceof AWSCLIError) {
        if (error.context?.stderr?.includes('NotFoundException')) {
          if (error.context.stderr.includes('app')) {
            throw new AmplifyAppNotFoundError(appId);
          } else {
            throw new AmplifyBranchNotFoundError(appId, branchName);
          }
        }
      }
      throw error;
    }
  }

  /**
   * Execute AWS CLI command with retry logic
   */
  private async executeCommand(command: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = execSync(command, {
          timeout: this.timeout,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        return result;
      } catch (error: any) {
        lastError = error;

        // Create detailed error information
        const stderr = error.stderr?.toString() || '';
        const stdout = error.stdout?.toString() || '';
        const exitCode = error.status || error.code || 1;

        // Check for specific error types
        if (stderr.includes('Timeout')) {
          throw new NetworkTimeoutError(command, this.timeout);
        }

        // If this is the last attempt, throw the error
        if (attempt === this.maxRetries) {
          throw new AWSCLIError(
            `AWS CLI command failed after ${this.maxRetries} attempts: ${stderr || error.message}`,
            command,
            exitCode,
            stderr
          );
        }

        // Wait before retrying (exponential backoff)
        const delay = AWS_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    // This should never be reached, but just in case
    throw lastError || new Error('Unknown error occurred');
  }

  /**
   * Validate Amplify App ID format
   */
  private validateAppId(appId: string): void {
    const appIdPattern = /^d[a-z0-9]{12}$/;
    if (!appIdPattern.test(appId)) {
      throw new Error(`Invalid Amplify App ID format: ${appId}. Expected format: d followed by 12 alphanumeric characters.`);
    }
  }

  /**
   * Validate branch name format
   */
  private validateBranchName(branchName: string): void {
    const branchNamePattern = /^[a-zA-Z0-9._-]+$/;
    if (!branchNamePattern.test(branchName)) {
      throw new Error(`Invalid branch name format: ${branchName}. Only alphanumeric characters, dots, underscores, and hyphens are allowed.`);
    }
  }

  /**
   * Validate environment variable name
   */
  private validateVariableName(name: string): void {
    if (name.length > CLI_CONFIG.MAX_VARIABLE_NAME_LENGTH) {
      throw new Error(`Variable name too long: ${name}. Maximum length is ${CLI_CONFIG.MAX_VARIABLE_NAME_LENGTH} characters.`);
    }

    if (name.startsWith('AWS_')) {
      throw new Error(`Variable name cannot start with 'AWS_': ${name}. This prefix is reserved by AWS.`);
    }

    const validNamePattern = /^[A-Z_][A-Z0-9_]*$/;
    if (!validNamePattern.test(name)) {
      throw new Error(`Invalid variable name format: ${name}. Must start with a letter or underscore and contain only uppercase letters, numbers, and underscores.`);
    }
  }

  /**
   * Escape special characters in environment variable values
   */
  private escapeValue(value: string): string {
    if (value.length > CLI_CONFIG.MAX_VARIABLE_VALUE_LENGTH) {
      throw new Error(`Variable value too long. Maximum length is ${CLI_CONFIG.MAX_VARIABLE_VALUE_LENGTH} characters.`);
    }

    // Escape quotes and special characters
    return value
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/"/g, '\\"')    // Escape double quotes
      .replace(/'/g, "\\'")    // Escape single quotes
      .replace(/\$/g, '\\$')   // Escape dollar signs
      .replace(/`/g, '\\`');   // Escape backticks
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}