import { writeFile, readFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { createHash, createCipher, createDecipher } from 'crypto';
import { SecurityTokens } from './securityTokenGenerator';

export interface TokenBackup {
  id: string;
  tokens: SecurityTokens;
  createdAt: Date;
  environment: string;
  checksum: string;
}

export interface BackupMetadata {
  id: string;
  createdAt: Date;
  environment: string;
  hasAdminToken: boolean;
  hasDebugToken: boolean;
}

export class TokenBackupService {
  private readonly backupDir: string;
  private readonly encryptionKey: string;

  constructor(backupDir: string = './.security-backups', encryptionKey?: string) {
    this.backupDir = backupDir;
    this.encryptionKey = encryptionKey || process.env.TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  /**
   * Create a backup of security tokens
   */
  async createBackup(tokens: SecurityTokens, environment: string = 'production'): Promise<string> {
    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory();

      // Generate backup ID
      const backupId = this.generateBackupId(environment);

      // Create checksum for integrity verification
      const checksum = this.createChecksum(tokens);

      // Create backup object
      const backup: TokenBackup = {
        id: backupId,
        tokens,
        createdAt: new Date(),
        environment,
        checksum,
      };

      // Encrypt and save backup
      const encryptedData = this.encryptBackup(backup);
      const backupPath = join(this.backupDir, `${backupId}.backup`);
      
      await writeFile(backupPath, encryptedData, 'utf8');

      // Save metadata for quick listing
      await this.saveBackupMetadata(backup);

      console.log(`✅ Token backup created: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('❌ Failed to create token backup:', error);
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore tokens from backup
   */
  async restoreFromBackup(backupId: string): Promise<SecurityTokens> {
    try {
      const backupPath = join(this.backupDir, `${backupId}.backup`);
      
      // Check if backup exists
      await access(backupPath);

      // Read and decrypt backup
      const encryptedData = await readFile(backupPath, 'utf8');
      const backup = this.decryptBackup(encryptedData);

      // Verify integrity
      const expectedChecksum = this.createChecksum(backup.tokens);
      if (backup.checksum !== expectedChecksum) {
        throw new Error('Backup integrity check failed - data may be corrupted');
      }

      console.log(`✅ Tokens restored from backup: ${backupId}`);
      return backup.tokens;
    } catch (error) {
      console.error('❌ Failed to restore from backup:', error);
      throw new Error(`Backup restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const metadataPath = join(this.backupDir, 'metadata.json');
      
      try {
        const metadataContent = await readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);
        return metadata.backups || [];
      } catch {
        // No metadata file exists yet
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backupPath = join(this.backupDir, `${backupId}.backup`);
      
      // Remove backup file
      await access(backupPath);
      await writeFile(backupPath, ''); // Overwrite with empty content for security
      
      // Remove from metadata
      await this.removeFromMetadata(backupId);

      console.log(`✅ Backup deleted: ${backupId}`);
    } catch (error) {
      console.error('❌ Failed to delete backup:', error);
      throw new Error(`Backup deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(backupId: string): Promise<boolean> {
    try {
      const tokens = await this.restoreFromBackup(backupId);
      return tokens.adminToken.length > 0 && tokens.debugToken.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(environment: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${environment}-${timestamp}-${randomSuffix}`;
  }

  /**
   * Create checksum for integrity verification
   */
  private createChecksum(tokens: SecurityTokens): string {
    const data = JSON.stringify({
      adminToken: tokens.adminToken,
      debugToken: tokens.debugToken,
      generatedAt: tokens.generatedAt,
    });
    
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Encrypt backup data
   */
  private encryptBackup(backup: TokenBackup): string {
    try {
      const cipher = createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(JSON.stringify(backup), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt backup data
   */
  private decryptBackup(encryptedData: string): TokenBackup {
    try {
      const decipher = createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const backup = JSON.parse(decrypted);
      
      // Convert date strings back to Date objects
      backup.createdAt = new Date(backup.createdAt);
      backup.tokens.generatedAt = new Date(backup.tokens.generatedAt);
      if (backup.tokens.expiresAt) {
        backup.tokens.expiresAt = new Date(backup.tokens.expiresAt);
      }
      
      return backup;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await access(this.backupDir);
    } catch {
      await mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Save backup metadata for quick listing
   */
  private async saveBackupMetadata(backup: TokenBackup): Promise<void> {
    const metadataPath = join(this.backupDir, 'metadata.json');
    
    let metadata: { backups: BackupMetadata[] };
    
    try {
      const existingContent = await readFile(metadataPath, 'utf8');
      metadata = JSON.parse(existingContent);
    } catch {
      metadata = { backups: [] };
    }

    // Add new backup metadata
    const backupMetadata: BackupMetadata = {
      id: backup.id,
      createdAt: backup.createdAt,
      environment: backup.environment,
      hasAdminToken: !!backup.tokens.adminToken,
      hasDebugToken: !!backup.tokens.debugToken,
    };

    metadata.backups.push(backupMetadata);

    // Keep only last 10 backups in metadata
    metadata.backups = metadata.backups
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  /**
   * Remove backup from metadata
   */
  private async removeFromMetadata(backupId: string): Promise<void> {
    const metadataPath = join(this.backupDir, 'metadata.json');
    
    try {
      const existingContent = await readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(existingContent);
      
      metadata.backups = metadata.backups.filter((backup: BackupMetadata) => backup.id !== backupId);
      
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    } catch (error) {
      // Metadata file might not exist, which is fine
      console.warn('Could not update metadata after backup deletion:', error);
    }
  }
}

// Export singleton instance
export const tokenBackupService = new TokenBackupService();