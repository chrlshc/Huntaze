#!/usr/bin/env node

/**
 * Build Error Handler
 * Comprehensive error handling and recovery for build failures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildErrorHandler {
  constructor() {
    this.errorLog = [];
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    const logEntry = `[${timestamp}] ${prefix} ${message}`;
    
    console.log(logEntry);
    this.errorLog.push({ timestamp, type, message });
  }

  async handleBuildError(error, buildContext = {}) {
    this.log('Analyzing build error...', 'error');
    
    const errorAnalysis = this.analyzeBuildError(error);
    this.log(`Error type: ${errorAnalysis.type}`, 'info');
    this.log(`Error category: ${errorAnalysis.category}`, 'info');
    
    // Log detailed error information
    this.logDetailedError(error, errorAnalysis);
    
    // Attempt recovery strategies
    const recoverySuccess = await this.attemptRecovery(errorAnalysis, buildContext);
    
    if (recoverySuccess) {
      this.log('Error recovery successful!', 'success');
      return true;
    } else {
      this.log('Error recovery failed. Manual intervention required.', 'error');
      this.generateErrorReport(error, errorAnalysis);
      return false;
    }
  }

  analyzeBuildError(error) {
    const errorMessage = error.message || error.toString();
    const errorOutput = error.stdout || error.stderr || '';
    const combinedError = `${errorMessage} ${errorOutput}`.toLowerCase();

    // Memory-related errors
    if (combinedError.includes('javascript heap out of memory') || 
        combinedError.includes('heap out of memory') ||
        combinedError.includes('allocation failed')) {
      return {
        type: 'MEMORY_ERROR',
        category: 'RESOURCE',
        severity: 'HIGH',
        recoverable: true,
        suggestions: [
          'Increase Node.js memory limit',
          'Clear build cache',
          'Optimize bundle size',
          'Enable incremental builds'
        ]
      };
    }

    // Dependency-related errors
    if (combinedError.includes('module not found') ||
        combinedError.includes('cannot resolve module') ||
        combinedError.includes('failed to resolve import')) {
      return {
        type: 'DEPENDENCY_ERROR',
        category: 'DEPENDENCY',
        severity: 'HIGH',
        recoverable: true,
        suggestions: [
          'Run npm install',
          'Clear node_modules and reinstall',
          'Check package.json for missing dependencies',
          'Verify import paths'
        ]
      };
    }

    // TypeScript compilation errors
    if (combinedError.includes('typescript error') ||
        combinedError.includes('type error') ||
        combinedError.includes('ts(')) {
      return {
        type: 'TYPESCRIPT_ERROR',
        category: 'COMPILATION',
        severity: 'MEDIUM',
        recoverable: false,
        suggestions: [
          'Fix TypeScript compilation errors',
          'Check type definitions',
          'Update @types packages',
          'Review tsconfig.json configuration'
        ]
      };
    }

    // ESLint errors
    if (combinedError.includes('eslint') ||
        combinedError.includes('linting errors')) {
      return {
        type: 'LINT_ERROR',
        category: 'CODE_QUALITY',
        severity: 'LOW',
        recoverable: true,
        suggestions: [
          'Fix ESLint errors',
          'Run eslint --fix',
          'Update ESLint configuration',
          'Disable specific rules if necessary'
        ]
      };
    }

    // File system errors
    if (combinedError.includes('emfile') ||
        combinedError.includes('too many open files') ||
        combinedError.includes('enospc')) {
      return {
        type: 'FILESYSTEM_ERROR',
        category: 'SYSTEM',
        severity: 'HIGH',
        recoverable: true,
        suggestions: [
          'Increase file descriptor limits',
          'Clear temporary files',
          'Free up disk space',
          'Restart the build process'
        ]
      };
    }

    // Network/timeout errors
    if (combinedError.includes('timeout') ||
        combinedError.includes('network error') ||
        combinedError.includes('connection refused')) {
      return {
        type: 'NETWORK_ERROR',
        category: 'NETWORK',
        severity: 'MEDIUM',
        recoverable: true,
        suggestions: [
          'Check network connectivity',
          'Retry the build',
          'Use different registry',
          'Increase timeout values'
        ]
      };
    }

    // Next.js specific errors
    if (combinedError.includes('next.js') ||
        combinedError.includes('next build') ||
        combinedError.includes('webpack')) {
      return {
        type: 'NEXTJS_ERROR',
        category: 'FRAMEWORK',
        severity: 'MEDIUM',
        recoverable: true,
        suggestions: [
          'Clear .next directory',
          'Update Next.js version',
          'Check next.config.js',
          'Review webpack configuration'
        ]
      };
    }

    // Generic build errors
    return {
      type: 'GENERIC_BUILD_ERROR',
      category: 'BUILD',
      severity: 'MEDIUM',
      recoverable: true,
      suggestions: [
        'Clear build cache',
        'Restart build process',
        'Check build configuration',
        'Review recent code changes'
      ]
    };
  }

  logDetailedError(error, analysis) {
    this.log('=== DETAILED ERROR ANALYSIS ===', 'error');
    this.log(`Error Code: ${error.code || 'N/A'}`, 'info');
    this.log(`Exit Status: ${error.status || 'N/A'}`, 'info');
    this.log(`Signal: ${error.signal || 'N/A'}`, 'info');
    
    if (error.stdout) {
      this.log('STDOUT:', 'info');
      console.log(error.stdout);
    }
    
    if (error.stderr) {
      this.log('STDERR:', 'info');
      console.log(error.stderr);
    }
    
    this.log('Suggested Actions:', 'info');
    analysis.suggestions.forEach((suggestion, index) => {
      this.log(`  ${index + 1}. ${suggestion}`, 'info');
    });
  }

  async attemptRecovery(errorAnalysis, buildContext) {
    if (!errorAnalysis.recoverable) {
      this.log('Error is not automatically recoverable', 'warning');
      return false;
    }

    this.log(`Attempting recovery for ${errorAnalysis.type}...`, 'info');

    try {
      switch (errorAnalysis.type) {
        case 'MEMORY_ERROR':
          return await this.recoverFromMemoryError();
        
        case 'DEPENDENCY_ERROR':
          return await this.recoverFromDependencyError();
        
        case 'FILESYSTEM_ERROR':
          return await this.recoverFromFilesystemError();
        
        case 'NETWORK_ERROR':
          return await this.recoverFromNetworkError();
        
        case 'NEXTJS_ERROR':
          return await this.recoverFromNextJsError();
        
        case 'LINT_ERROR':
          return await this.recoverFromLintError();
        
        default:
          return await this.genericRecovery();
      }
    } catch (recoveryError) {
      this.log(`Recovery attempt failed: ${recoveryError.message}`, 'error');
      return false;
    }
  }

  async recoverFromMemoryError() {
    this.log('Attempting memory error recovery...', 'info');
    
    // Increase Node.js memory limit
    const currentLimit = process.env.NODE_OPTIONS?.match(/--max-old-space-size=(\d+)/)?.[1];
    const newLimit = currentLimit ? parseInt(currentLimit) * 1.5 : 6144;
    
    process.env.NODE_OPTIONS = `--max-old-space-size=${Math.floor(newLimit)}`;
    this.log(`Increased memory limit to ${Math.floor(newLimit)}MB`, 'info');
    
    // Clear build cache
    await this.clearBuildCache();
    
    // Enable garbage collection
    process.env.NODE_OPTIONS += ' --expose-gc';
    
    return true;
  }

  async recoverFromDependencyError() {
    this.log('Attempting dependency error recovery...', 'info');
    
    try {
      // Clear node_modules and package-lock.json
      this.log('Clearing node_modules...', 'info');
      if (fs.existsSync('node_modules')) {
        execSync('rm -rf node_modules', { stdio: 'pipe' });
      }
      
      if (fs.existsSync('package-lock.json')) {
        fs.unlinkSync('package-lock.json');
        this.log('Removed package-lock.json', 'info');
      }
      
      // Reinstall dependencies
      this.log('Reinstalling dependencies...', 'info');
      execSync('npm install', { stdio: 'pipe', timeout: 300000 }); // 5 minute timeout
      
      this.log('Dependencies reinstalled successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Dependency recovery failed: ${error.message}`, 'error');
      return false;
    }
  }

  async recoverFromFilesystemError() {
    this.log('Attempting filesystem error recovery...', 'info');
    
    try {
      // Clear temporary files
      await this.clearTemporaryFiles();
      
      // Clear build cache
      await this.clearBuildCache();
      
      // Wait a moment for file handles to close
      await this.sleep(2000);
      
      this.log('Filesystem recovery completed', 'success');
      return true;
    } catch (error) {
      this.log(`Filesystem recovery failed: ${error.message}`, 'error');
      return false;
    }
  }

  async recoverFromNetworkError() {
    this.log('Attempting network error recovery...', 'info');
    
    // Wait and retry
    this.log(`Waiting ${this.retryDelay / 1000} seconds before retry...`, 'info');
    await this.sleep(this.retryDelay);
    
    // Try different npm registry
    try {
      execSync('npm config set registry https://registry.npmjs.org/', { stdio: 'pipe' });
      this.log('Switched to default npm registry', 'info');
    } catch (error) {
      this.log('Could not switch npm registry', 'warning');
    }
    
    return true;
  }

  async recoverFromNextJsError() {
    this.log('Attempting Next.js error recovery...', 'info');
    
    try {
      // Clear Next.js cache
      await this.clearBuildCache();
      
      // Clear Next.js specific directories
      const nextDirs = ['.next', '.swc'];
      for (const dir of nextDirs) {
        if (fs.existsSync(dir)) {
          execSync(`rm -rf ${dir}`, { stdio: 'pipe' });
          this.log(`Cleared ${dir} directory`, 'info');
        }
      }
      
      this.log('Next.js recovery completed', 'success');
      return true;
    } catch (error) {
      this.log(`Next.js recovery failed: ${error.message}`, 'error');
      return false;
    }
  }

  async recoverFromLintError() {
    this.log('Attempting lint error recovery...', 'info');
    
    try {
      // Try to auto-fix ESLint errors
      execSync('npx eslint . --fix --ext .js,.jsx,.ts,.tsx', { 
        stdio: 'pipe',
        timeout: 60000 // 1 minute timeout
      });
      
      this.log('ESLint auto-fix completed', 'success');
      return true;
    } catch (error) {
      this.log('ESLint auto-fix failed, manual intervention required', 'warning');
      return false;
    }
  }

  async genericRecovery() {
    this.log('Attempting generic recovery...', 'info');
    
    // Clear all caches
    await this.clearBuildCache();
    await this.clearTemporaryFiles();
    
    // Wait before retry
    await this.sleep(1000);
    
    return true;
  }

  async clearBuildCache() {
    this.log('Clearing build cache...', 'info');
    
    const cacheDirs = ['.next', 'node_modules/.cache', '.swc'];
    
    for (const dir of cacheDirs) {
      try {
        if (fs.existsSync(dir)) {
          execSync(`rm -rf ${dir}`, { stdio: 'pipe' });
          this.log(`Cleared ${dir}`, 'info');
        }
      } catch (error) {
        this.log(`Could not clear ${dir}: ${error.message}`, 'warning');
      }
    }
  }

  async clearTemporaryFiles() {
    this.log('Clearing temporary files...', 'info');
    
    const tempPatterns = [
      'tmp/*',
      '*.tmp',
      '*.temp',
      '.DS_Store'
    ];
    
    for (const pattern of tempPatterns) {
      try {
        execSync(`find . -name "${pattern}" -delete`, { stdio: 'pipe' });
      } catch (error) {
        // Ignore errors for missing files
      }
    }
  }

  async retryBuild(buildCommand, maxRetries = this.maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.log(`Build attempt ${attempt}/${maxRetries}...`, 'info');
      
      try {
        const result = execSync(buildCommand, {
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 600000 // 10 minute timeout
        });
        
        this.log(`Build successful on attempt ${attempt}`, 'success');
        return { success: true, output: result };
      } catch (error) {
        this.log(`Build attempt ${attempt} failed`, 'error');
        
        if (attempt < maxRetries) {
          const recovered = await this.handleBuildError(error, { attempt });
          
          if (!recovered) {
            this.log('Recovery failed, stopping retry attempts', 'error');
            break;
          }
          
          // Wait before next attempt
          this.log(`Waiting ${this.retryDelay / 1000} seconds before next attempt...`, 'info');
          await this.sleep(this.retryDelay);
        } else {
          this.log('All retry attempts exhausted', 'error');
          throw error;
        }
      }
    }
    
    return { success: false, error: 'All retry attempts failed' };
  }

  generateErrorReport(error, analysis) {
    const report = {
      timestamp: new Date().toISOString(),
      error: {
        type: analysis.type,
        category: analysis.category,
        severity: analysis.severity,
        message: error.message,
        code: error.code,
        status: error.status,
        signal: error.signal
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        cwd: process.cwd()
      },
      suggestions: analysis.suggestions,
      errorLog: this.errorLog
    };

    const reportPath = path.join(process.cwd(), 'build-error-report.json');
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`Error report saved to: ${reportPath}`, 'info');
    } catch (writeError) {
      this.log(`Could not save error report: ${writeError.message}`, 'warning');
    }

    // Also create a human-readable summary
    this.generateHumanReadableReport(report);
  }

  generateHumanReadableReport(report) {
    const summaryPath = path.join(process.cwd(), 'build-error-summary.md');
    
    const summary = `# Build Error Report

## Error Details
- **Type**: ${report.error.type}
- **Category**: ${report.error.category}
- **Severity**: ${report.error.severity}
- **Timestamp**: ${report.timestamp}

## Error Message
\`\`\`
${report.error.message}
\`\`\`

## Environment
- **Node Version**: ${report.environment.nodeVersion}
- **Platform**: ${report.environment.platform}
- **Architecture**: ${report.environment.arch}
- **Working Directory**: ${report.environment.cwd}

## Suggested Actions
${report.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}

## Next Steps
1. Review the error message and suggested actions above
2. Check the full error report in \`build-error-report.json\`
3. Implement the suggested fixes
4. Retry the build process

## Support
If you continue to experience issues:
- Check the project documentation
- Review recent code changes
- Contact the development team with this error report
`;

    try {
      fs.writeFileSync(summaryPath, summary);
      this.log(`Error summary saved to: ${summaryPath}`, 'info');
    } catch (writeError) {
      this.log(`Could not save error summary: ${writeError.message}`, 'warning');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other modules
module.exports = BuildErrorHandler;

// CLI usage
if (require.main === module) {
  const handler = new BuildErrorHandler();
  
  // Example usage: node build-error-handler.js "npm run build"
  const buildCommand = process.argv[2] || 'npm run build';
  
  handler.retryBuild(buildCommand)
    .then(result => {
      if (result.success) {
        console.log('Build completed successfully!');
        process.exit(0);
      } else {
        console.error('Build failed after all retry attempts');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Build error handler failed:', error);
      process.exit(1);
    });
}