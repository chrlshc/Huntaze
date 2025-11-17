#!/usr/bin/env node

/**
 * Log Git hook bypass attempts
 * 
 * This script logs when developers use --no-verify to bypass pre-commit hooks
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

interface BypassLog {
  timestamp: string;
  branch: string;
  commitMessage: string;
  user: string;
  reason: string;
}

/**
 * Get current Git branch
 */
function getCurrentBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get Git user name
 */
function getGitUser(): string {
  try {
    return execSync('git config user.name', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get last commit message
 */
function getLastCommitMessage(): string {
  try {
    return execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Log bypass attempt
 */
async function logBypass(reason: string = 'manual bypass'): Promise<void> {
  const logDir = path.join(process.cwd(), '.kiro', 'build-logs');
  const bypassLogPath = path.join(logDir, 'bypass-log.jsonl');
  
  // Ensure log directory exists
  await fs.mkdir(logDir, { recursive: true });
  
  // Create bypass log entry
  const logEntry: BypassLog = {
    timestamp: new Date().toISOString(),
    branch: getCurrentBranch(),
    commitMessage: getLastCommitMessage(),
    user: getGitUser(),
    reason,
  };
  
  // Append to log file (JSONL format - one JSON object per line)
  const logLine = JSON.stringify(logEntry) + '\n';
  await fs.appendFile(bypassLogPath, logLine, 'utf-8');
  
  // Display warning
  console.log('\n⚠️  WARNING: Pre-commit validation was bypassed');
  console.log(`   Branch: ${logEntry.branch}`);
  console.log(`   User: ${logEntry.user}`);
  console.log(`   Timestamp: ${new Date(logEntry.timestamp).toLocaleString()}`);
  console.log('\n   This bypass has been logged to .kiro/build-logs/bypass-log.jsonl');
  console.log('   Please ensure your code builds successfully before pushing.\n');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const reason = process.argv[2] || 'manual bypass';
  
  try {
    await logBypass(reason);
  } catch (error) {
    console.error('Error logging bypass:', error);
    // Don't fail the commit if logging fails
  }
}

// Run the script
main();
