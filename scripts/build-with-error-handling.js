#!/usr/bin/env node

/**
 * Build wrapper with enhanced error handling
 * Provides detailed error messages and suggests fixes for common issues
 * Requirements: 1.4, 4.4, 4.5
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

class BuildErrorHandler {
  constructor() {
    this.buildOutput = [];
    this.errorPatterns = this.initializeErrorPatterns();
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  /**
   * Initialize known error patterns and their solutions
   */
  initializeErrorPatterns() {
    return [
      {
        pattern: /ENOENT.*client-reference-manifest/i,
        name: 'Missing Client Reference Manifest',
        description: 'Next.js cannot find client reference manifest files for route groups',
        solutions: [
          'Ensure outputFileTracingRoot is set in next.config.ts',
          'Add outputFileTracingIncludes for route group manifests',
          'Check that route groups are properly structured with parentheses',
          'Verify client components have "use client" directive at the top',
        ],
        documentation: 'https://nextjs.org/docs/app/building-your-application/deploying#docker-image',
      },
      {
        pattern: /ENOENT.*\.next\/standalone/i,
        name: 'Standalone Output Directory Missing',
        description: 'The standalone output directory was not created',
        solutions: [
          'Verify output: "standalone" is set in next.config.ts',
          'Check that the build completed successfully',
          'Ensure sufficient disk space is available',
          'Try cleaning .next directory and rebuilding',
        ],
        documentation: 'https://nextjs.org/docs/app/api-reference/next-config-js/output',
      },
      {
        pattern: /Module not found|Cannot find module/i,
        name: 'Module Not Found',
        description: 'A required module or dependency is missing',
        solutions: [
          'Run "npm install" to ensure all dependencies are installed',
          'Check that the module is listed in package.json',
          'Verify import paths are correct',
          'Clear node_modules and reinstall: rm -rf node_modules && npm install',
        ],
      },
      {
        pattern: /Type error|TS\d+:/i,
        name: 'TypeScript Error',
        description: 'TypeScript compilation failed',
        solutions: [
          'Fix the type errors shown in the output above',
          'Run "npm run type-check" to see all type errors',
          'Ensure @types packages are installed for third-party libraries',
          'Check tsconfig.json for correct configuration',
        ],
      },
      {
        pattern: /ESLint.*error/i,
        name: 'ESLint Error',
        description: 'Code quality checks failed',
        solutions: [
          'Fix the linting errors shown above',
          'Run "npm run lint" to see all linting issues',
          'Use "npm run lint -- --fix" to auto-fix some issues',
          'Temporarily disable with eslint.ignoreDuringBuilds in next.config.ts (not recommended)',
        ],
      },
      {
        pattern: /out of memory|JavaScript heap out of memory/i,
        name: 'Out of Memory',
        description: 'Build process ran out of memory',
        solutions: [
          'Increase Node.js memory: NODE_OPTIONS="--max-old-space-size=4096" npm run build',
          'Close other applications to free up memory',
          'Consider upgrading your system RAM',
          'Check for memory leaks in your code',
        ],
      },
      {
        pattern: /Route.*already exists/i,
        name: 'Duplicate Route',
        description: 'Multiple files are trying to define the same route',
        solutions: [
          'Check for duplicate page.tsx or route.ts files',
          'Verify route group structure is correct',
          'Remove or rename conflicting route files',
        ],
      },
      {
        pattern: /Invalid.*configuration/i,
        name: 'Invalid Configuration',
        description: 'next.config.ts has invalid settings',
        solutions: [
          'Review next.config.ts for syntax errors',
          'Check that all configuration options are valid for Next.js 15',
          'Refer to Next.js documentation for correct configuration format',
        ],
        documentation: 'https://nextjs.org/docs/app/api-reference/next-config-js',
      },
    ];
  }

  /**
   * Analyze build output for known error patterns
   */
  analyzeErrors() {
    const output = this.buildOutput.join('\n');
    const matchedErrors = [];

    for (const errorPattern of this.errorPatterns) {
      if (errorPattern.pattern.test(output)) {
        matchedErrors.push(errorPattern);
      }
    }

    return matchedErrors;
  }

  /**
   * Display error analysis and solutions
   */
  displayErrorAnalysis(errors) {
    if (errors.length === 0) {
      this.log('\n❌ Build failed but no specific error pattern was recognized.', colors.red);
      this.log('Please review the build output above for details.\n', colors.yellow);
      return;
    }

    this.log('\n' + '═'.repeat(70), colors.red);
    this.log('BUILD ERROR ANALYSIS', colors.red + colors.bold);
    this.log('═'.repeat(70) + '\n', colors.red);

    errors.forEach((error, index) => {
      this.log(`${index + 1}. ${error.name}`, colors.red + colors.bold);
      this.log(`   ${error.description}\n`, colors.yellow);

      this.log('   💡 Suggested Solutions:', colors.cyan);
      error.solutions.forEach((solution, i) => {
        this.log(`      ${i + 1}. ${solution}`, colors.reset);
      });

      if (error.documentation) {
        this.log(`\n   📚 Documentation: ${error.documentation}`, colors.blue);
      }

      if (index < errors.length - 1) {
        this.log('\n' + '─'.repeat(70) + '\n', colors.reset);
      }
    });

    this.log('\n' + '═'.repeat(70) + '\n', colors.red);
  }

  /**
   * Run the build process with error handling
   */
  async runBuild() {
    this.log('\n🔨 Starting Next.js build with error handling...\n', colors.cyan);

    return new Promise((resolve) => {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const buildProcess = spawn(npmCmd, ['run', 'build:next'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: false,
      });

      // Capture stdout
      buildProcess.stdout.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(output);
        this.buildOutput.push(output);
      });

      // Capture stderr
      buildProcess.stderr.on('data', (data) => {
        const output = data.toString();
        process.stderr.write(output);
        this.buildOutput.push(output);
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          this.log('\n✅ Build completed successfully!\n', colors.green);
          resolve(true);
        } else {
          this.log(`\n❌ Build failed with exit code ${code}\n`, colors.red);
          
          // Analyze errors and provide solutions
          const errors = this.analyzeErrors();
          this.displayErrorAnalysis(errors);
          
          // Additional help
          this.log('Need more help?', colors.cyan);
          this.log('  • Check the full build output above', colors.reset);
          this.log('  • Run "node scripts/validate-build-config.js" to check your configuration', colors.reset);
          this.log('  • Review Next.js 15 migration guide if upgrading', colors.reset);
          this.log('  • Search for the error message in Next.js GitHub issues\n', colors.reset);
          
          resolve(false);
        }
      });

      buildProcess.on('error', (error) => {
        this.log(`\n❌ Failed to start build process: ${error.message}\n`, colors.red);
        resolve(false);
      });
    });
  }
}

// Run build handler if called directly
if (require.main === module) {
  const handler = new BuildErrorHandler();
  
  handler.runBuild().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Build handler failed:', error);
    process.exit(1);
  });
}

module.exports = BuildErrorHandler;
