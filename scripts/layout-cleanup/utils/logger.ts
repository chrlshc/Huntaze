import fs from 'fs/promises';
import path from 'path';
import { ensureDirectory } from './file-operations';

/**
 * Logger utility for layout cleanup operations
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export class Logger {
  private logDir: string;
  private logFile: string;
  private verbose: boolean;
  private logs: LogEntry[] = [];

  constructor(logDir: string = '.kiro/build-logs', verbose: boolean = false) {
    this.logDir = logDir;
    this.verbose = verbose;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logDir, `${timestamp}.log`);
  }

  /**
   * Initialize the logger (create directories, etc.)
   */
  async initialize(): Promise<void> {
    await ensureDirectory(this.logDir);
  }

  /**
   * Log a message
   */
  private async log(level: LogLevel, message: string, data?: any): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    // Console output with colors
    if (this.verbose || level !== LogLevel.DEBUG) {
      this.consoleLog(entry);
    }

    // Write to file
    await this.writeToFile(entry);
  }

  /**
   * Console output with colors
   */
  private consoleLog(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[90m',    // Gray
      [LogLevel.INFO]: '\x1b[36m',     // Cyan
      [LogLevel.WARN]: '\x1b[33m',     // Yellow
      [LogLevel.ERROR]: '\x1b[31m',    // Red
      [LogLevel.SUCCESS]: '\x1b[32m',  // Green
    };

    const icons = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.SUCCESS]: '✅',
    };

    const color = colors[entry.level] || '';
    const icon = icons[entry.level] || '';
    const reset = '\x1b[0m';

    console.log(`${color}${icon} [${entry.level}] ${entry.message}${reset}`);
    
    if (entry.data && this.verbose) {
      console.log(`${color}   Data:${reset}`, entry.data);
    }
  }

  /**
   * Write log entry to file
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.logFile, logLine, 'utf-8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Create a symlink to the latest log file
   */
  async createLatestSymlink(): Promise<void> {
    const latestPath = path.join(this.logDir, 'latest.log');
    
    try {
      // Remove existing symlink if it exists
      try {
        await fs.unlink(latestPath);
      } catch {
        // Ignore if doesn't exist
      }

      // Create new symlink
      await fs.symlink(path.basename(this.logFile), latestPath);
    } catch (error) {
      // Symlinks might not work on all systems, just warn
      this.warn('Could not create latest.log symlink');
    }
  }

  /**
   * Public logging methods
   */
  async debug(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.DEBUG, message, data);
  }

  async info(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.INFO, message, data);
  }

  async warn(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.WARN, message, data);
  }

  async error(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.ERROR, message, data);
  }

  async success(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.SUCCESS, message, data);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Save logs to a JSON file
   */
  async saveLogsToFile(filePath: string): Promise<void> {
    await ensureDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(this.logs, null, 2), 'utf-8');
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.logFile;
  }

  /**
   * Rotate logs (delete old logs beyond size limit)
   */
  async rotateLogs(maxSizeMB: number = 100): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      let totalSize = 0;

      // Calculate total size
      for (const file of files) {
        if (file.endsWith('.log') && file !== 'latest.log') {
          const filePath = path.join(this.logDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      // If over limit, delete oldest files
      if (totalSize > maxSizeBytes) {
        const fileStats = await Promise.all(
          files
            .filter(f => f.endsWith('.log') && f !== 'latest.log')
            .map(async (file) => {
              const filePath = path.join(this.logDir, file);
              const stats = await fs.stat(filePath);
              return { file, mtime: stats.mtime, size: stats.size };
            })
        );

        // Sort by modification time (oldest first)
        fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

        let deletedSize = 0;
        for (const { file, size } of fileStats) {
          if (totalSize - deletedSize <= maxSizeBytes) break;
          
          await fs.unlink(path.join(this.logDir, file));
          deletedSize += size;
          await this.info(`Rotated old log file: ${file}`);
        }
      }
    } catch (error) {
      await this.warn('Failed to rotate logs', { error });
    }
  }
}

/**
 * Create a progress bar for console output
 */
export class ProgressBar {
  private total: number;
  private current: number = 0;
  private label: string;
  private width: number = 40;

  constructor(total: number, label: string = 'Progress') {
    this.total = total;
    this.label = label;
  }

  /**
   * Update progress
   */
  update(current: number): void {
    this.current = current;
    this.render();
  }

  /**
   * Increment progress by 1
   */
  increment(): void {
    this.current++;
    this.render();
  }

  /**
   * Render the progress bar
   */
  private render(): void {
    const percentage = Math.min(100, Math.floor((this.current / this.total) * 100));
    const filled = Math.floor((this.current / this.total) * this.width);
    const empty = this.width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const output = `\r${this.label}: [${bar}] ${percentage}% (${this.current}/${this.total})`;

    process.stdout.write(output);

    if (this.current >= this.total) {
      process.stdout.write('\n');
    }
  }

  /**
   * Complete the progress bar
   */
  complete(): void {
    this.current = this.total;
    this.render();
  }
}
