import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  readFile,
  deleteFile,
  copyFile,
  ensureDirectory,
  fileExists,
  createBackup,
  restoreFromBackup,
} from './utils/file-operations';
import { Logger } from './utils/logger';
import { LayoutAnalyzer, LayoutAnalysis, AnalysisReport } from './layout-analyzer';

const execAsync = promisify(exec);

/**
 * Options for the cleanup process
 */
export interface CleanupOptions {
  dryRun: boolean;
  backup: boolean;
  validate: boolean;
  verbose: boolean;
  skipValidation?: boolean;
}

/**
 * Result of a cleanup operation
 */
export interface CleanupResult {
  removed: string[];
  failed: string[];
  restored: string[];
  buildSuccess: boolean;
  duration: number;
  totalAnalyzed: number;
  redundantFound: number;
}

/**
 * Details of a single cleanup operation
 */
interface CleanupOperation {
  filePath: string;
  backupPath?: string;
  success: boolean;
  error?: string;
  buildPassed?: boolean;
}

/**
 * LayoutCleaner - Safely removes redundant layout files with backup and validation
 */
export class LayoutCleaner {
  private logger: Logger;
  private analyzer: LayoutAnalyzer;
  private backupDir: string;
  private operations: CleanupOperation[] = [];

  constructor(
    private options: CleanupOptions,
    private appDir: string = 'app',
    logger?: Logger
  ) {
    this.logger = logger || new Logger('.kiro/build-logs', options.verbose);
    this.analyzer = new LayoutAnalyzer(appDir, this.logger);
    this.backupDir = path.join('.kiro', 'backups', 'layouts');
  }

  /**
   * Execute the cleanup process
   */
  async cleanup(): Promise<CleanupResult> {
    const startTime = Date.now();
    
    await this.logger.initialize();
    await this.logger.info('Starting layout cleanup process...');

    if (this.options.dryRun) {
      await this.logger.info('DRY RUN MODE - No files will be modified');
    }

    // Step 1: Analyze all layouts
    await this.logger.info('Step 1: Analyzing layouts...');
    const analysisReport = await this.analyzer.analyzeAll();

    if (analysisReport.redundant.length === 0) {
      await this.logger.success('No redundant layouts found!');
      return {
        removed: [],
        failed: [],
        restored: [],
        buildSuccess: true,
        duration: Date.now() - startTime,
        totalAnalyzed: analysisReport.total,
        redundantFound: 0,
      };
    }

    await this.logger.info(
      `Found ${analysisReport.redundant.length} redundant layouts to clean up`
    );

    // Step 2: Ensure backup directory exists
    if (this.options.backup && !this.options.dryRun) {
      await ensureDirectory(this.backupDir);
      await this.logger.debug(`Backup directory ready: ${this.backupDir}`);
    }

    // Step 3: Process each redundant layout
    const removed: string[] = [];
    const failed: string[] = [];
    const restored: string[] = [];

    await this.logger.info(''); // Empty line for progress bar
    
    for (let i = 0; i < analysisReport.redundant.length; i++) {
      const layout = analysisReport.redundant[i];
      const progress = `[${i + 1}/${analysisReport.redundant.length}]`;
      const percentage = Math.round(((i + 1) / analysisReport.redundant.length) * 100);
      
      // Display progress bar
      this.displayProgressBar(i + 1, analysisReport.redundant.length, layout.path);

      await this.logger.info(`${progress} Processing: ${layout.path}`);

      const operation = await this.processLayout(layout);
      this.operations.push(operation);

      if (operation.success) {
        removed.push(operation.filePath);
        await this.logger.success(`${progress} Removed: ${layout.path}`);
      } else {
        failed.push(operation.filePath);
        await this.logger.error(
          `${progress} Failed: ${layout.path}`,
          { error: operation.error }
        );

        // If build failed and we restored, track it
        if (operation.backupPath && !operation.buildPassed) {
          restored.push(operation.filePath);
          await this.logger.info(`${progress} Restored from backup: ${layout.path}`);
        }
      }
    }
    
    await this.logger.info(''); // Empty line after progress bar

    const duration = Date.now() - startTime;

    await this.logger.success(
      `Cleanup complete! Removed: ${removed.length}, Failed: ${failed.length}, Restored: ${restored.length}`
    );

    return {
      removed,
      failed,
      restored,
      buildSuccess: failed.length === 0,
      duration,
      totalAnalyzed: analysisReport.total,
      redundantFound: analysisReport.redundant.length,
    };
  }

  /**
   * Process a single layout file
   */
  private async processLayout(layout: LayoutAnalysis): Promise<CleanupOperation> {
    const operation: CleanupOperation = {
      filePath: layout.path,
      success: false,
    };

    try {
      // Step 1: Create backup if enabled
      if (this.options.backup && !this.options.dryRun) {
        await this.logger.debug(`Creating backup for: ${layout.path}`);
        operation.backupPath = await this.backupFile(layout.path);
        await this.logger.debug(`Backup created: ${operation.backupPath}`);
      }

      // Step 2: Delete the file (or simulate in dry-run)
      if (this.options.dryRun) {
        await this.logger.debug(`[DRY RUN] Would delete: ${layout.path}`);
        operation.success = true;
        operation.buildPassed = true;
      } else {
        await this.logger.debug(`Deleting: ${layout.path}`);
        await deleteFile(layout.path);
        await this.logger.debug(`Deleted: ${layout.path}`);

        // Step 3: Validate build if enabled
        if (this.options.validate && !this.options.skipValidation) {
          await this.logger.debug('Running build validation...');
          const buildPassed = await this.validateBuild();
          operation.buildPassed = buildPassed;

          if (!buildPassed) {
            // Build failed - restore from backup
            await this.logger.warn(`Build failed after deleting ${layout.path}`);
            
            if (operation.backupPath) {
              await this.logger.info('Restoring from backup...');
              await this.restoreFile(operation.backupPath, layout.path);
              await this.logger.info('File restored successfully');
            }

            operation.success = false;
            operation.error = 'Build validation failed';
          } else {
            operation.success = true;
          }
        } else {
          // No validation - assume success
          operation.success = true;
          operation.buildPassed = true;
        }
      }
    } catch (error) {
      operation.success = false;
      operation.error = error instanceof Error ? error.message : String(error);

      // Try to restore if we have a backup
      if (operation.backupPath && !this.options.dryRun) {
        try {
          await this.logger.warn('Error occurred, attempting to restore from backup...');
          await this.restoreFile(operation.backupPath, layout.path);
          await this.logger.info('File restored after error');
        } catch (restoreError) {
          await this.logger.error('Failed to restore from backup', { error: restoreError });
        }
      }
    }

    return operation;
  }

  /**
   * Create a backup of a file
   */
  private async backupFile(filePath: string): Promise<string> {
    return await createBackup(filePath, this.backupDir);
  }

  /**
   * Restore a file from backup
   */
  private async restoreFile(backupPath: string, originalPath: string): Promise<void> {
    await restoreFromBackup(backupPath, originalPath);
  }

  /**
   * Validate the build by running npm run build
   */
  private async validateBuild(): Promise<boolean> {
    try {
      await this.logger.debug('Executing: npm run build');
      
      const { stdout, stderr } = await execAsync('npm run build', {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Check for build errors in output
      const output = stdout + stderr;
      const hasErrors = /error/i.test(output) || /failed/i.test(output);

      if (hasErrors) {
        await this.logger.debug('Build output contains errors', { output: output.slice(0, 500) });
        return false;
      }

      await this.logger.debug('Build completed successfully');
      return true;
    } catch (error) {
      await this.logger.debug('Build command failed', { error });
      return false;
    }
  }

  /**
   * Display a progress bar in the console
   */
  private displayProgressBar(current: number, total: number, currentFile: string): void {
    if (!this.options.verbose) {
      return; // Only show progress bar in non-verbose mode
    }

    const percentage = Math.round((current / total) * 100);
    const barLength = 40;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    const fileName = path.basename(currentFile);
    const dirName = path.dirname(currentFile);
    
    // Use process.stdout.write to update the same line
    if (process.stdout.isTTY) {
      process.stdout.write(
        `\r${bar} ${percentage}% (${current}/${total}) ${dirName}/${fileName}`
      );
      
      if (current === total) {
        process.stdout.write('\n');
      }
    }
  }

  /**
   * Get all cleanup operations performed
   */
  getOperations(): CleanupOperation[] {
    return this.operations;
  }

  /**
   * Generate a detailed report of the cleanup
   */
  generateReport(result: CleanupResult): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('LAYOUT CLEANUP REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    
    lines.push(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    lines.push(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    lines.push('');
    
    lines.push('STATISTICS:');
    lines.push(`  Total Layouts Analyzed: ${result.totalAnalyzed}`);
    lines.push(`  Redundant Found: ${result.redundantFound}`);
    lines.push(`  Successfully Removed: ${result.removed.length}`);
    lines.push(`  Failed: ${result.failed.length}`);
    lines.push(`  Restored: ${result.restored.length}`);
    lines.push('');
    
    if (result.removed.length > 0) {
      lines.push('REMOVED FILES:');
      result.removed.forEach(file => {
        lines.push(`  ✓ ${file}`);
      });
      lines.push('');
    }
    
    if (result.failed.length > 0) {
      lines.push('FAILED FILES:');
      result.failed.forEach(file => {
        lines.push(`  ✗ ${file}`);
      });
      lines.push('');
    }
    
    if (result.restored.length > 0) {
      lines.push('RESTORED FILES (due to build failures):');
      result.restored.forEach(file => {
        lines.push(`  ↺ ${file}`);
      });
      lines.push('');
    }
    
    lines.push('='.repeat(60));
    lines.push(`Status: ${result.buildSuccess ? '✓ SUCCESS' : '✗ PARTIAL FAILURE'}`);
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
}
