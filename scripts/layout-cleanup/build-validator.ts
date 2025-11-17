import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { Logger } from './utils/logger';
import { ensureDirectory } from './utils/file-operations';

const execAsync = promisify(exec);

/**
 * Build error information
 */
export interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  type: 'layout' | 'component' | 'type' | 'other';
}

/**
 * Build warning information
 */
export interface BuildWarning {
  message: string;
  count: number;
}

/**
 * Build statistics
 */
export interface BuildStats {
  pages: number;
  routes: number;
  staticPages: number;
  serverPages: number;
  edgePages: number;
  bundleSize: number;
}

/**
 * Complete build result
 */
export interface BuildResult {
  success: boolean;
  duration: number;
  errors: BuildError[];
  warnings: BuildWarning[];
  timestamp: string;
  stats: BuildStats;
  stdout: string;
  stderr: string;
}

/**
 * BuildValidator - Validates Next.js builds and logs results
 */
export class BuildValidator {
  private logger: Logger;
  private logDir: string;
  private maxLogSizeMB: number;

  constructor(
    logDir: string = '.kiro/build-logs',
    logger?: Logger,
    maxLogSizeMB: number = 100
  ) {
    this.logDir = logDir;
    this.logger = logger || new Logger(logDir, false);
    this.maxLogSizeMB = maxLogSizeMB;
  }

  /**
   * Validate the build by running npm run build
   */
  async validate(): Promise<BuildResult> {
    await this.logger.initialize();
    await this.logger.info('Starting build validation...');

    const startTime = Date.now();
    
    try {
      // Run the build
      const { stdout, stderr } = await this.runBuild();
      const duration = (Date.now() - startTime) / 1000;

      // Parse the output
      const result = this.parseOutput(stdout, stderr, duration, true);

      // Log the result
      await this.logResult(result);

      // Create symlink to latest log
      await this.logger.createLatestSymlink();

      // Rotate logs if needed
      await this.logger.rotateLogs(this.maxLogSizeMB);

      if (result.success) {
        await this.logger.success(`Build completed successfully in ${duration.toFixed(2)}s`);
      } else {
        await this.logger.error(`Build failed with ${result.errors.length} error(s)`);
      }

      return result;
    } catch (error: any) {
      const duration = (Date.now() - startTime) / 1000;
      
      // Build failed - parse error output
      const stdout = error.stdout || '';
      const stderr = error.stderr || '';
      const result = this.parseOutput(stdout, stderr, duration, false);

      // Log the result
      await this.logResult(result);
      await this.logger.createLatestSymlink();

      await this.logger.error(`Build failed after ${duration.toFixed(2)}s`);

      return result;
    }
  }

  /**
   * Run npm run build and capture output
   */
  private async runBuild(): Promise<{ stdout: string; stderr: string }> {
    await this.logger.info('Executing: npm run build');
    
    try {
      const { stdout, stderr } = await execAsync('npm run build', {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: { ...process.env, FORCE_COLOR: '0' }, // Disable colors for parsing
      });

      return { stdout, stderr };
    } catch (error: any) {
      // exec throws on non-zero exit code, but we still get stdout/stderr
      throw error;
    }
  }

  /**
   * Parse build output and extract information
   */
  private parseOutput(
    stdout: string,
    stderr: string,
    duration: number,
    success: boolean
  ): BuildResult {
    const errors = this.extractErrors(stdout + '\n' + stderr);
    const warnings = this.extractWarnings(stdout + '\n' + stderr);
    const stats = this.extractStats(stdout);

    return {
      success,
      duration,
      errors,
      warnings,
      timestamp: new Date().toISOString(),
      stats,
      stdout,
      stderr,
    };
  }

  /**
   * Extract errors from build output
   */
  private extractErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];
    const lines = output.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern 1: TypeScript errors - file.ts(line,col): error message
      const tsErrorMatch = line.match(/(.+?)\((\d+),(\d+)\):\s*error\s*TS\d+:\s*(.+)/);
      if (tsErrorMatch) {
        const [, file, lineNum, col, message] = tsErrorMatch;
        errors.push({
          file: file.trim(),
          line: parseInt(lineNum, 10),
          column: parseInt(col, 10),
          message: message.trim(),
          type: this.categorizeError(file, message),
        });
        continue;
      }

      // Pattern 2: Next.js errors - ./file.ts
      const nextErrorMatch = line.match(/^(\.\/[^\s:]+):(\d+):(\d+)\s*-\s*(.+)/);
      if (nextErrorMatch) {
        const [, file, lineNum, col, message] = nextErrorMatch;
        errors.push({
          file: file.trim(),
          line: parseInt(lineNum, 10),
          column: parseInt(col, 10),
          message: message.trim(),
          type: this.categorizeError(file, message),
        });
        continue;
      }

      // Pattern 3: Generic error with file reference
      if (line.includes('Error:') || line.includes('error')) {
        const fileMatch = line.match(/([^\s]+\.tsx?)/);
        if (fileMatch) {
          errors.push({
            file: fileMatch[1],
            line: 0,
            column: 0,
            message: line.trim(),
            type: this.categorizeError(fileMatch[1], line),
          });
        }
      }

      // Pattern 4: Build failed message
      if (line.includes('Failed to compile') || line.includes('Build failed')) {
        // Look ahead for error details
        let errorMessage = line;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].trim()) {
            errorMessage += ' ' + lines[j].trim();
          }
        }

        const fileMatch = errorMessage.match(/([^\s]+\.tsx?)/);
        if (fileMatch) {
          errors.push({
            file: fileMatch[1],
            line: 0,
            column: 0,
            message: errorMessage.trim(),
            type: this.categorizeError(fileMatch[1], errorMessage),
          });
        }
      }
    }

    return errors;
  }

  /**
   * Categorize error type based on file and message
   */
  private categorizeError(file: string, message: string): BuildError['type'] {
    const lowerFile = file.toLowerCase();
    const lowerMessage = message.toLowerCase();

    // Layout errors have highest priority
    if (lowerFile.includes('layout.tsx') || lowerFile.includes('layout.ts')) {
      return 'layout';
    }

    // Type errors
    if (lowerMessage.includes('type') || 
        lowerMessage.includes('typescript') ||
        lowerMessage.includes('ts2307') ||
        lowerMessage.includes('cannot find module')) {
      return 'type';
    }

    // Component errors
    if (lowerFile.includes('component') || 
        lowerFile.includes('/components/') ||
        lowerMessage.includes('component')) {
      return 'component';
    }

    return 'other';
  }

  /**
   * Extract warnings from build output
   */
  private extractWarnings(output: string): BuildWarning[] {
    const warningMap = new Map<string, number>();
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('warning') || line.includes('Warning')) {
        // Clean up the warning message
        let message = line.trim();
        
        // Remove ANSI color codes
        message = message.replace(/\x1b\[[0-9;]*m/g, '');
        
        // Normalize the message
        message = message.replace(/^warning:\s*/i, '').trim();
        
        if (message) {
          warningMap.set(message, (warningMap.get(message) || 0) + 1);
        }
      }
    }

    return Array.from(warningMap.entries()).map(([message, count]) => ({
      message,
      count,
    }));
  }

  /**
   * Extract build statistics from output
   */
  private extractStats(output: string): BuildStats {
    const stats: BuildStats = {
      pages: 0,
      routes: 0,
      staticPages: 0,
      serverPages: 0,
      edgePages: 0,
      bundleSize: 0,
    };

    const lines = output.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract route information
      // Pattern: ○ /path or λ /path or ƒ /path (with various symbols)
      // Also handle lines starting with ├ or └ followed by the symbol
      if (/^[├└┌]?\s*[○λƒ]\s+\//.test(trimmed)) {
        stats.routes++;

        if (trimmed.includes('○')) {
          stats.staticPages++;
        } else if (trimmed.includes('λ')) {
          stats.serverPages++;
        } else if (trimmed.includes('ƒ')) {
          stats.edgePages++;
        }
      }

      // Extract total pages count - look for patterns like "(45/45)" or "45 pages"
      const pagesMatch = line.match(/\((\d+)\/\d+\)|(\d+)\s+pages?/i);
      if (pagesMatch) {
        const pageCount = parseInt(pagesMatch[1] || pagesMatch[2], 10);
        stats.pages = Math.max(stats.pages, pageCount);
      }

      // Extract bundle size (in MB or KB)
      const sizeMatch = line.match(/(\d+(?:\.\d+)?)\s*(MB|KB)/i);
      if (sizeMatch) {
        const size = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        const sizeInMB = unit === 'MB' ? size : size / 1024;
        stats.bundleSize = Math.max(stats.bundleSize, sizeInMB);
      }
    }

    // If routes were counted but pages wasn't, use routes as pages
    if (stats.pages === 0 && stats.routes > 0) {
      stats.pages = stats.routes;
    }

    return stats;
  }

  /**
   * Log build result to JSON file
   */
  private async logResult(result: BuildResult): Promise<void> {
    try {
      await ensureDirectory(this.logDir);

      // Create a sanitized version without full stdout/stderr for JSON log
      const sanitizedResult = {
        ...result,
        stdout: result.stdout.length > 1000 ? result.stdout.substring(0, 1000) + '...' : result.stdout,
        stderr: result.stderr.length > 1000 ? result.stderr.substring(0, 1000) + '...' : result.stderr,
      };

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFile = path.join(this.logDir, `build-${timestamp}.json`);

      await fs.writeFile(logFile, JSON.stringify(sanitizedResult, null, 2), 'utf-8');

      await this.logger.debug(`Build result logged to: ${logFile}`);
    } catch (error) {
      await this.logger.warn('Failed to write build result log', { error });
    }
  }

  /**
   * Get the logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get log directory path
   */
  getLogDir(): string {
    return this.logDir;
  }
}
