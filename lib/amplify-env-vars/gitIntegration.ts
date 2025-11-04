/**
 * Git Integration Service for Amplify Environment Variables
 * Provides version control tracking and change history for configuration files
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { logger } from './logger';
import { ConfigurationFile, GitCommitInfo, ChangeHistoryEntry } from './interfaces';

export class GitIntegrationService {
  private readonly configDir: string;
  private readonly historyFile: string;

  constructor(configDir: string = 'config/amplify-env-vars') {
    this.configDir = configDir;
    this.historyFile = join(configDir, '.change-history.json');
  }

  /**
   * Initialize Git integration for configuration tracking
   */
  async initialize(): Promise<void> {
    try {
      // Check if we're in a Git repository
      if (!this.isGitRepository()) {
        logger.warn('Not in a Git repository. Git integration will be limited.');
        return;
      }

      // Create .gitignore entries for sensitive files
      await this.setupGitIgnore();

      // Initialize change history file
      if (!existsSync(this.historyFile)) {
        this.initializeChangeHistory();
      }

      logger.info('Git integration initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Git integration:', error);
      throw error;
    }
  }

  /**
   * Track configuration changes in Git
   */
  async trackConfigurationChange(
    configFile: string,
    environment: string,
    changeDescription: string,
    author?: string
  ): Promise<GitCommitInfo> {
    try {
      const timestamp = new Date().toISOString();
      const commitMessage = `config: ${changeDescription} for ${environment}`;

      // Add configuration file to Git
      this.executeGitCommand(`add ${configFile}`);

      // Create commit
      const commitHash = this.createCommit(commitMessage, author);

      // Record change in history
      const changeEntry: ChangeHistoryEntry = {
        timestamp,
        environment,
        configFile,
        changeDescription,
        commitHash,
        author: author || this.getGitUser()
      };

      this.addToChangeHistory(changeEntry);

      const commitInfo: GitCommitInfo = {
        hash: commitHash,
        message: commitMessage,
        author: changeEntry.author,
        timestamp,
        files: [configFile]
      };

      logger.info(`Configuration change tracked: ${commitHash}`);
      return commitInfo;
    } catch (error) {
      logger.error('Failed to track configuration change:', error);
      throw error;
    }
  }

  /**
   * Get change history for a specific environment or file
   */
  getChangeHistory(environment?: string, configFile?: string): ChangeHistoryEntry[] {
    try {
      if (!existsSync(this.historyFile)) {
        return [];
      }

      const history = JSON.parse(readFileSync(this.historyFile, 'utf8'));
      let filteredHistory = history.changes || [];

      if (environment) {
        filteredHistory = filteredHistory.filter((entry: ChangeHistoryEntry) => 
          entry.environment === environment
        );
      }

      if (configFile) {
        filteredHistory = filteredHistory.filter((entry: ChangeHistoryEntry) => 
          entry.configFile === configFile
        );
      }

      return filteredHistory.sort((a: ChangeHistoryEntry, b: ChangeHistoryEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      logger.error('Failed to get change history:', error);
      return [];
    }
  }

  /**
   * Create a Git hook for configuration validation
   */
  async setupPreCommitHook(): Promise<void> {
    try {
      const hookPath = '.git/hooks/pre-commit';
      const hookContent = this.generatePreCommitHook();

      writeFileSync(hookPath, hookContent, { mode: 0o755 });
      logger.info('Pre-commit hook installed successfully');
    } catch (error) {
      logger.error('Failed to setup pre-commit hook:', error);
      throw error;
    }
  }

  /**
   * Validate configuration files before commit
   */
  async validateBeforeCommit(): Promise<boolean> {
    try {
      const stagedFiles = this.getStagedConfigFiles();
      
      if (stagedFiles.length === 0) {
        return true; // No config files to validate
      }

      logger.info(`Validating ${stagedFiles.length} configuration files...`);

      for (const file of stagedFiles) {
        const isValid = await this.validateConfigFile(file);
        if (!isValid) {
          logger.error(`Validation failed for ${file}`);
          return false;
        }
      }

      logger.info('All configuration files validated successfully');
      return true;
    } catch (error) {
      logger.error('Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Get Git diff for configuration changes
   */
  getConfigurationDiff(commitHash?: string): string {
    try {
      const command = commitHash 
        ? `diff ${commitHash}^ ${commitHash} -- ${this.configDir}`
        : `diff HEAD -- ${this.configDir}`;
      
      return this.executeGitCommand(command);
    } catch (error) {
      logger.error('Failed to get configuration diff:', error);
      return '';
    }
  }

  /**
   * Revert configuration to a specific commit
   */
  async revertToCommit(commitHash: string, configFile?: string): Promise<void> {
    try {
      const command = configFile
        ? `checkout ${commitHash} -- ${configFile}`
        : `checkout ${commitHash} -- ${this.configDir}`;

      this.executeGitCommand(command);
      
      const revertMessage = `Revert configuration to ${commitHash}`;
      this.createCommit(revertMessage);

      logger.info(`Configuration reverted to commit ${commitHash}`);
    } catch (error) {
      logger.error('Failed to revert configuration:', error);
      throw error;
    }
  }

  /**
   * Create a configuration branch for environment-specific changes
   */
  async createConfigurationBranch(environment: string, baseBranch: string = 'main'): Promise<string> {
    try {
      const branchName = `config/${environment}-${Date.now()}`;
      
      this.executeGitCommand(`checkout -b ${branchName} ${baseBranch}`);
      
      logger.info(`Created configuration branch: ${branchName}`);
      return branchName;
    } catch (error) {
      logger.error('Failed to create configuration branch:', error);
      throw error;
    }
  }

  // Private helper methods

  private isGitRepository(): boolean {
    try {
      this.executeGitCommand('rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  private executeGitCommand(command: string): string {
    try {
      return execSync(`git ${command}`, { 
        encoding: 'utf8',
        cwd: process.cwd()
      }).trim();
    } catch (error) {
      throw new Error(`Git command failed: ${command}`);
    }
  }

  private createCommit(message: string, author?: string): string {
    try {
      const authorFlag = author ? `--author="${author}"` : '';
      this.executeGitCommand(`commit ${authorFlag} -m "${message}"`);
      return this.executeGitCommand('rev-parse HEAD');
    } catch (error) {
      throw new Error(`Failed to create commit: ${message}`);
    }
  }

  private getGitUser(): string {
    try {
      const name = this.executeGitCommand('config user.name');
      const email = this.executeGitCommand('config user.email');
      return `${name} <${email}>`;
    } catch {
      return 'Unknown User <unknown@example.com>';
    }
  }

  private getStagedConfigFiles(): string[] {
    try {
      const output = this.executeGitCommand('diff --cached --name-only');
      return output
        .split('\n')
        .filter(file => file.startsWith(this.configDir) && file.length > 0);
    } catch {
      return [];
    }
  }

  private async validateConfigFile(file: string): Promise<boolean> {
    try {
      // Import validation service dynamically to avoid circular dependencies
      const { ValidationEngine } = await import('./validationEngine');
      const validator = new ValidationEngine();
      
      const result = await validator.validateFile(file);
      return result.isValid;
    } catch (error) {
      logger.error(`Failed to validate ${file}:`, error);
      return false;
    }
  }

  private setupGitIgnore(): void {
    const gitignorePath = '.gitignore';
    const configIgnoreRules = [
      '# Amplify Environment Variables - Sensitive Files',
      'config/amplify-env-vars/*-secrets.yaml',
      'config/amplify-env-vars/*-production.yaml',
      'config/amplify-env-vars/.env.*',
      'config/amplify-env-vars/backup-*.json',
      ''
    ].join('\n');

    try {
      let gitignoreContent = '';
      if (existsSync(gitignorePath)) {
        gitignoreContent = readFileSync(gitignorePath, 'utf8');
      }

      if (!gitignoreContent.includes('# Amplify Environment Variables')) {
        writeFileSync(gitignorePath, gitignoreContent + '\n' + configIgnoreRules);
        logger.info('Updated .gitignore with configuration rules');
      }
    } catch (error) {
      logger.warn('Failed to update .gitignore:', error);
    }
  }

  private initializeChangeHistory(): void {
    const initialHistory = {
      version: '1.0',
      created: new Date().toISOString(),
      changes: []
    };

    writeFileSync(this.historyFile, JSON.stringify(initialHistory, null, 2));
  }

  private addToChangeHistory(entry: ChangeHistoryEntry): void {
    try {
      const history = existsSync(this.historyFile)
        ? JSON.parse(readFileSync(this.historyFile, 'utf8'))
        : { version: '1.0', created: new Date().toISOString(), changes: [] };

      history.changes.push(entry);
      
      // Keep only last 100 entries
      if (history.changes.length > 100) {
        history.changes = history.changes.slice(-100);
      }

      writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      logger.error('Failed to add change to history:', error);
    }
  }

  private generatePreCommitHook(): string {
    return `#!/bin/sh
# Pre-commit hook for Amplify Environment Variables validation

echo "Validating Amplify environment variable configurations..."

# Run configuration validation
node scripts/amplify-env-vars/validate-env-vars.js --pre-commit

if [ $? -ne 0 ]; then
  echo "❌ Configuration validation failed. Commit aborted."
  echo "Please fix the configuration errors and try again."
  exit 1
fi

echo "✅ Configuration validation passed."
exit 0
`;
  }
}