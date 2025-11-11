/**
 * Backup and Restore Service for Amplify Environment Variables
 * Provides automated backup, point-in-time restore, and integrity verification
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { Logger } from './logger';

const logger = new Logger();
import { IAWSCLIWrapper } from './interfaces';
import { BackupInfo, RestoreInfo, BackupMetadata, BackupVerificationResult } from './types';

export class BackupRestoreService {
  private readonly backupDir: string;
  private readonly awsCli: IAWSCLIWrapper;

  constructor(awsCli: IAWSCLIWrapper, backupDir: string = 'backups/amplify-env-vars') {
    this.awsCli = awsCli;
    this.backupDir = backupDir;
    this.ensureBackupDirectory();
  }

  /**
   * Create a backup of environment variables for a specific app and branch
   */
  async createBackup(
    appId: string, 
    branchName: string, 
    description?: string,
    tags?: Record<string, string>
  ): Promise<BackupInfo> {
    try {
      logger.info(`Creating backup for app ${appId}, branch ${branchName}`);

      // Get current environment variables
      const variables = await this.awsCli.getAmplifyEnvironmentVariables(appId, branchName);
      
      // Generate backup metadata
      const timestamp = new Date().toISOString();
      const backupId = this.generateBackupId(appId, branchName, timestamp);
      
      const metadata: BackupMetadata = {
        backupId,
        appId,
        branchName,
        timestamp,
        description: description || `Automatic backup for ${branchName}`,
        tags: tags || {},
        variableCount: Object.keys(variables).length,
        checksum: this.calculateChecksum(variables),
        version: '1.0'
      };

      // Create backup files
      const backupPath = this.createBackupFiles(backupId, variables, metadata);

      // Verify backup integrity
      const verification = await this.verifyBackup(backupId);
      if (!verification.isValid) {
        throw new Error(`Backup verification failed: ${verification.errors.join(', ')}`);
      }

      const backupInfo: BackupInfo = {
        id: backupId,
        appId,
        branchName,
        timestamp: new Date(timestamp),
        variableCount: metadata.variableCount,
        checksum: metadata.checksum
      };

      logger.info(`Backup created successfully: ${backupId}`);
      return backupInfo;
    } catch (error) {
      logger.error('Failed to create backup:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Restore environment variables from a backup
   */
  async restoreFromBackup(
    backupId: string,
    targetAppId?: string,
    targetBranch?: string,
    options: {
      dryRun?: boolean;
      selective?: string[];
      excludeVariables?: string[];
    } = {}
  ): Promise<RestoreInfo> {
    try {
      logger.info(`Restoring from backup: ${backupId}`);

      // Verify backup exists and is valid
      const verification = await this.verifyBackup(backupId);
      if (!verification.isValid) {
        throw new Error(`Backup verification failed: ${verification.errors.join(', ')}`);
      }

      // Load backup data
      const { variables, metadata } = this.loadBackup(backupId);
      
      // Determine target app and branch
      const appId = targetAppId || metadata.appId;
      const branchName = targetBranch || metadata.branchName;

      // Filter variables if selective restore
      let variablesToRestore = variables;
      if (options.selective && options.selective.length > 0) {
        variablesToRestore = Object.fromEntries(
          Object.entries(variables).filter(([key]) => options.selective!.includes(key))
        );
      }

      // Exclude variables if specified
      if (options.excludeVariables && options.excludeVariables.length > 0) {
        variablesToRestore = Object.fromEntries(
          Object.entries(variablesToRestore).filter(([key]) => !options.excludeVariables!.includes(key))
        );
      }

      // Create pre-restore backup
      const preRestoreBackup = await this.createBackup(
        appId,
        branchName,
        `Pre-restore backup before restoring ${backupId}`
      );

      if (options.dryRun) {
        logger.info('Dry run mode - no changes will be made');
        return {
          backupId,
          targetAppId: appId,
          targetBranch: branchName,
          timestamp: new Date().toISOString(),
          variablesRestored: Object.keys(variablesToRestore),
          preRestoreBackupId: preRestoreBackup.id,
          success: true,
          dryRun: true
        };
      }

      // Restore variables
      await this.awsCli.updateAmplifyBranch(appId, branchName, variablesToRestore);

      // Verify restoration
      const currentVariables = await this.awsCli.getAmplifyEnvironmentVariables(appId, branchName);
      const restoredCorrectly = this.verifyRestoration(variablesToRestore, currentVariables);

      const restoreInfo: RestoreInfo = {
        backupId,
        targetAppId: appId,
        targetBranch: branchName,
        timestamp: new Date().toISOString(),
        variablesRestored: Object.keys(variablesToRestore),
        preRestoreBackupId: preRestoreBackup.id,
        success: restoredCorrectly,
        dryRun: false
      };

      if (restoredCorrectly) {
        logger.info(`Restore completed successfully: ${backupId}`);
      } else {
        logger.error(`Restore verification failed for backup: ${backupId}`);
      }

      return restoreInfo;
    } catch (error) {
      logger.error('Failed to restore from backup:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * List available backups
   */
  listBackups(appId?: string, branchName?: string): BackupInfo[] {
    try {
      const backups: BackupInfo[] = [];
      
      if (!existsSync(this.backupDir)) {
        return backups;
      }

      const backupFiles = readdirSync(this.backupDir)
        .filter(file => file.endsWith('.metadata.json'))
        .map(file => file.replace('.metadata.json', ''));

      for (const backupId of backupFiles) {
        try {
          const metadata = this.loadBackupMetadata(backupId);
          
          // Filter by app and branch if specified
          if (appId && metadata.appId !== appId) continue;
          if (branchName && metadata.branchName !== branchName) continue;

          const backupPath = join(this.backupDir, `${backupId}.json`);
          const size = existsSync(backupPath) ? statSync(backupPath).size : 0;

          backups.push({
            id: metadata.backupId,
            appId: metadata.appId,
            branchName: metadata.branchName,
            timestamp: new Date(metadata.timestamp),
            variableCount: metadata.variableCount,
            checksum: metadata.checksum
          });
        } catch (error) {
          logger.warn(`Failed to load backup metadata for ${backupId}:`, error);
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      logger.error('Failed to list backups:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Delete a backup
   */
  deleteBackup(backupId: string): boolean {
    try {
      const backupFile = join(this.backupDir, `${backupId}.json`);
      const metadataFile = join(this.backupDir, `${backupId}.metadata.json`);

      let deleted = false;
      
      if (existsSync(backupFile)) {
        require('fs').unlinkSync(backupFile);
        deleted = true;
      }
      
      if (existsSync(metadataFile)) {
        require('fs').unlinkSync(metadataFile);
        deleted = true;
      }

      if (deleted) {
        logger.info(`Backup deleted: ${backupId}`);
      } else {
        logger.warn(`Backup not found: ${backupId}`);
      }

      return deleted;
    } catch (error) {
      logger.error(`Failed to delete backup ${backupId}:`, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId: string): Promise<BackupVerificationResult> {
    try {
      const errors: string[] = [];
      
      // Check if backup files exist
      const backupFile = join(this.backupDir, `${backupId}.json`);
      const metadataFile = join(this.backupDir, `${backupId}.metadata.json`);

      if (!existsSync(backupFile)) {
        errors.push('Backup data file not found');
      }

      if (!existsSync(metadataFile)) {
        errors.push('Backup metadata file not found');
      }

      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      // Load and validate metadata
      const metadata = this.loadBackupMetadata(backupId);
      const variables = JSON.parse(readFileSync(backupFile, 'utf8'));

      // Verify checksum
      const calculatedChecksum = this.calculateChecksum(variables);
      if (calculatedChecksum !== metadata.checksum) {
        errors.push('Checksum mismatch - backup may be corrupted');
      }

      // Verify variable count
      if (Object.keys(variables).length !== metadata.variableCount) {
        errors.push('Variable count mismatch');
      }

      // Verify JSON structure
      if (typeof variables !== 'object' || variables === null) {
        errors.push('Invalid backup data structure');
      }

      return {
        isValid: errors.length === 0,
        errors,
        metadata: errors.length === 0 ? metadata : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Verification failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Create automated backup before changes
   */
  async createPreChangeBackup(appId: string, branchName: string, changeDescription: string): Promise<BackupInfo> {
    return this.createBackup(
      appId,
      branchName,
      `Pre-change backup: ${changeDescription}`,
      { type: 'pre-change', automated: 'true' }
    );
  }

  /**
   * Cleanup old backups based on retention policy
   */
  cleanupOldBackups(retentionDays: number = 30, maxBackups: number = 100): number {
    try {
      const backups = this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let deletedCount = 0;

      // Delete backups older than retention period
      const oldBackups = backups.filter(backup => 
        new Date(backup.timestamp) < cutoffDate
      );

      // If still too many backups, delete oldest ones
      const excessBackups = backups.length > maxBackups 
        ? backups.slice(maxBackups) 
        : [];

      const backupsToDelete = [...oldBackups, ...excessBackups];

      for (const backup of backupsToDelete) {
        if (this.deleteBackup(backup.id)) {
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old backups`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old backups:', error instanceof Error ? error : new Error(String(error)));
      return 0;
    }
  }

  // Private helper methods

  private ensureBackupDirectory(): void {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private generateBackupId(appId: string, branchName: string, timestamp: string): string {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
    return `${appId}-${branchName}-${dateStr}-${timeStr}`;
  }

  private calculateChecksum(variables: Record<string, string>): string {
    const sortedKeys = Object.keys(variables).sort();
    const content = sortedKeys.map(key => `${key}=${variables[key]}`).join('\n');
    return createHash('sha256').update(content).digest('hex');
  }

  private createBackupFiles(backupId: string, variables: Record<string, string>, metadata: BackupMetadata): string {
    const backupFile = join(this.backupDir, `${backupId}.json`);
    const metadataFile = join(this.backupDir, `${backupId}.metadata.json`);

    writeFileSync(backupFile, JSON.stringify(variables, null, 2));
    writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    return backupFile;
  }

  private getBackupSize(filePath: string): number {
    try {
      return statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  private loadBackup(backupId: string): { variables: Record<string, string>; metadata: BackupMetadata } {
    const backupFile = join(this.backupDir, `${backupId}.json`);
    const metadataFile = join(this.backupDir, `${backupId}.metadata.json`);

    const variables = JSON.parse(readFileSync(backupFile, 'utf8'));
    const metadata = JSON.parse(readFileSync(metadataFile, 'utf8'));

    return { variables, metadata };
  }

  private loadBackupMetadata(backupId: string): BackupMetadata {
    const metadataFile = join(this.backupDir, `${backupId}.metadata.json`);
    return JSON.parse(readFileSync(metadataFile, 'utf8'));
  }

  private verifyRestoration(expected: Record<string, string>, actual: Record<string, string>): boolean {
    for (const [key, value] of Object.entries(expected)) {
      if (actual[key] !== value) {
        logger.error(`Restoration verification failed for variable ${key}`);
        return false;
      }
    }
    return true;
  }
}