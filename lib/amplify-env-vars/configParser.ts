/**
 * Configuration file parser for AWS Amplify Environment Variables
 */

import { readFileSync } from 'fs';
import { parse as parseYAML } from 'yaml';
import { IConfigParser } from './interfaces';
import { ValidationResult, ConfigurationFile } from './types';
import { ConfigFileValidationError } from './errors';

export class ConfigParser implements IConfigParser {
  
  /**
   * Parse YAML configuration file
   */
  async parseYAML(filePath: string): Promise<any> {
    try {
      const content = readFileSync(filePath, 'utf8');
      return parseYAML(content);
    } catch (error) {
      throw new Error(`Failed to parse YAML file ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Parse JSON configuration file
   */
  async parseJSON(filePath: string): Promise<any> {
    try {
      const content = readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON file ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Validate configuration file format
   */
  validateConfigFormat(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check if config is an object
    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return {
        isValid: false,
        errors: errors.map(msg => ({ variable: 'root', message: msg, severity: 'error' as const })),
        warnings: [],
        suggestions
      };
    }

    // Validate version
    if (!config.version) {
      errors.push('Configuration must include a version field');
    } else if (typeof config.version !== 'string') {
      errors.push('Version must be a string');
    }

    // Validate environments
    if (!config.environments) {
      errors.push('Configuration must include an environments field');
    } else if (typeof config.environments !== 'object') {
      errors.push('Environments must be an object');
    } else {
      // Validate each environment
      for (const [envName, envConfig] of Object.entries(config.environments)) {
        if (!envConfig || typeof envConfig !== 'object') {
          errors.push(`Environment '${envName}' must be an object`);
          continue;
        }

        const env = envConfig as any;

        // Validate variables
        if (!env.variables) {
          warnings.push(`Environment '${envName}' has no variables defined`);
        } else if (typeof env.variables !== 'object') {
          errors.push(`Variables in environment '${envName}' must be an object`);
        } else {
          // Validate variable values
          for (const [varName, varValue] of Object.entries(env.variables)) {
            if (typeof varValue !== 'string') {
              errors.push(`Variable '${varName}' in environment '${envName}' must be a string`);
            }
          }
        }

        // Validate overrides (optional)
        if (env.overrides && typeof env.overrides !== 'object') {
          errors.push(`Overrides in environment '${envName}' must be an object`);
        }
      }
    }

    // Validate validation section (optional)
    if (config.validation) {
      if (typeof config.validation !== 'object') {
        errors.push('Validation section must be an object');
      } else {
        // Validate required array
        if (config.validation.required && !Array.isArray(config.validation.required)) {
          errors.push('Validation.required must be an array');
        }

        // Validate formats object
        if (config.validation.formats && typeof config.validation.formats !== 'object') {
          errors.push('Validation.formats must be an object');
        }
      }
    }

    // Generate suggestions
    if (Object.keys(config.environments || {}).length === 0) {
      suggestions.push('Consider adding at least one environment (e.g., staging, production)');
    }

    if (!config.validation) {
      suggestions.push('Consider adding a validation section to define required variables and formats');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map(msg => ({ variable: 'config', message: msg, severity: 'error' as const })),
      warnings: warnings.map(msg => ({ variable: 'config', message: msg, suggestion: undefined })),
      suggestions
    };
  }

  /**
   * Generate configuration file content
   */
  generateConfigFile(variables: Record<string, string>, format: 'yaml' | 'json'): string {
    const config: ConfigurationFile = {
      version: '1.0',
      environments: {
        staging: {
          variables: { ...variables }
        },
        production: {
          variables: { ...variables }
        }
      },
      validation: {
        required: Object.keys(variables),
        formats: {}
      }
    };

    if (format === 'yaml') {
      return this.generateYAML(config);
    } else {
      return JSON.stringify(config, null, 2);
    }
  }

  /**
   * Parse configuration file and extract variables for specific environment
   */
  async parseConfigFile(filePath: string, environment: string): Promise<Record<string, string>> {
    let config: any;

    // Determine file type by extension
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      config = await this.parseYAML(filePath);
    } else if (filePath.endsWith('.json')) {
      config = await this.parseJSON(filePath);
    } else {
      throw new Error(`Unsupported file format. Use .json, .yaml, or .yml extension.`);
    }

    // Validate configuration format
    const validation = this.validateConfigFormat(config);
    if (!validation.isValid) {
      throw new ConfigFileValidationError(filePath, validation.errors.map(e => e.message));
    }

    // Extract variables for the specified environment
    if (!config.environments[environment]) {
      throw new Error(`Environment '${environment}' not found in configuration file`);
    }

    const envConfig = config.environments[environment];
    const variables = { ...envConfig.variables };

    // Apply overrides if they exist
    if (envConfig.overrides) {
      Object.assign(variables, envConfig.overrides);
    }

    return variables;
  }

  /**
   * Create diff preview between current and new configuration
   */
  async createConfigDiff(
    currentVariables: Record<string, string>,
    configFilePath: string,
    environment: string
  ): Promise<{
    added: string[];
    removed: string[];
    modified: Array<{ key: string; oldValue: string; newValue: string }>;
    unchanged: string[];
  }> {
    const newVariables = await this.parseConfigFile(configFilePath, environment);
    
    const currentKeys = new Set(Object.keys(currentVariables));
    const newKeys = new Set(Object.keys(newVariables));
    
    const added: string[] = [];
    const removed: string[] = [];
    const modified: Array<{ key: string; oldValue: string; newValue: string }> = [];
    const unchanged: string[] = [];

    // Find added variables
    for (const key of newKeys) {
      if (!currentKeys.has(key)) {
        added.push(key);
      }
    }

    // Find removed variables
    for (const key of currentKeys) {
      if (!newKeys.has(key)) {
        removed.push(key);
      }
    }

    // Find modified and unchanged variables
    for (const key of currentKeys) {
      if (newKeys.has(key)) {
        if (currentVariables[key] !== newVariables[key]) {
          modified.push({
            key,
            oldValue: currentVariables[key],
            newValue: newVariables[key]
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
   * Generate YAML content from configuration object
   */
  private generateYAML(config: ConfigurationFile): string {
    // Simple YAML generation - in a real implementation, you'd use a proper YAML library
    let yaml = `version: "${config.version}"\n\n`;
    
    yaml += 'environments:\n';
    for (const [envName, envConfig] of Object.entries(config.environments)) {
      yaml += `  ${envName}:\n`;
      yaml += '    variables:\n';
      
      for (const [key, value] of Object.entries(envConfig.variables)) {
        // Escape quotes in values
        const escapedValue = value.replace(/"/g, '\\"');
        yaml += `      ${key}: "${escapedValue}"\n`;
      }
      
      if (envConfig.overrides && Object.keys(envConfig.overrides).length > 0) {
        yaml += '    overrides:\n';
        for (const [key, value] of Object.entries(envConfig.overrides)) {
          const escapedValue = value.replace(/"/g, '\\"');
          yaml += `      ${key}: "${escapedValue}"\n`;
        }
      }
      
      yaml += '\n';
    }
    
    yaml += 'validation:\n';
    yaml += '  required:\n';
    for (const required of config.validation.required) {
      yaml += `    - ${required}\n`;
    }
    
    if (Object.keys(config.validation.formats).length > 0) {
      yaml += '  formats:\n';
      for (const [key, format] of Object.entries(config.validation.formats)) {
        yaml += `    ${key}: "${format}"\n`;
      }
    }
    
    return yaml;
  }
}