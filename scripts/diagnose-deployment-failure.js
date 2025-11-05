#!/usr/bin/env node

/**
 * Deployment Failure Diagnostic Tool
 * Comprehensive troubleshooting and analysis for deployment failures
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class DeploymentDiagnostic {
  constructor() {
    this.diagnosticResults = {
      timestamp: new Date().toISOString(),
      environment: this.getEnvironmentInfo(),
      checks: [],
      errors: [],
      warnings: [],
      recommendations: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        CI: process.env.CI,
        AWS_REGION: process.env.AWS_REGION,
        AMPLIFY_APP_ID: process.env.AMPLIFY_APP_ID
      }
    };
  }

  async runDiagnostics() {
    this.log('Starting deployment failure diagnostics...', 'info');

    try {
      // Run all diagnostic checks
      await this.checkProjectStructure();
      await this.checkDependencies();
      await this.checkEnvironmentVariables();
      await this.checkBuildConfiguration();
      await this.checkNetworkConnectivity();
      await this.checkAmplifyConfiguration();
      await this.checkBuildArtifacts();
      await this.checkDeploymentLogs();
      await this.checkResourceLimits();
      await this.checkSecurityConfiguration();

      // Generate recommendations
      this.generateRecommendations();

      // Create diagnostic report
      this.generateDiagnosticReport();

      this.log('Diagnostic analysis completed', 'success');
      return this.diagnosticResults;

    } catch (error) {
      this.log(`Diagnostic failed: ${error.message}`, 'error');
      this.diagnosticResults.errors.push({
        type: 'DIAGNOSTIC_ERROR',
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async checkProjectStructure() {
    this.log('Checking project structure...', 'info');
    
    const check = {
      name: 'Project Structure',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      // Check essential files
      const essentialFiles = [
        'package.json',
        'next.config.ts',
        'amplify.yml',
        '.env.example'
      ];

      const missingFiles = essentialFiles.filter(file => 
        !fs.existsSync(path.join(process.cwd(), file))
      );

      if (missingFiles.length > 0) {
        check.issues.push({
          type: 'MISSING_FILES',
          message: `Missing essential files: ${missingFiles.join(', ')}`,
          severity: 'HIGH'
        });
      }

      // Check directory structure
      const essentialDirs = ['app', 'components', 'lib', 'public'];
      const missingDirs = essentialDirs.filter(dir => 
        !fs.existsSync(path.join(process.cwd(), dir))
      );

      if (missingDirs.length > 0) {
        check.issues.push({
          type: 'MISSING_DIRECTORIES',
          message: `Missing directories: ${missingDirs.join(', ')}`,
          severity: 'MEDIUM'
        });
      }

      // Check package.json structure
      if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (!packageJson.scripts || !packageJson.scripts.build) {
          check.issues.push({
            type: 'MISSING_BUILD_SCRIPT',
            message: 'No build script found in package.json',
            severity: 'HIGH'
          });
        }

        if (!packageJson.dependencies || !packageJson.dependencies.next) {
          check.issues.push({
            type: 'MISSING_NEXT_DEPENDENCY',
            message: 'Next.js not found in dependencies',
            severity: 'HIGH'
          });
        }

        check.details.packageJson = {
          name: packageJson.name,
          version: packageJson.version,
          scripts: Object.keys(packageJson.scripts || {}),
          dependencies: Object.keys(packageJson.dependencies || {}),
          devDependencies: Object.keys(packageJson.devDependencies || {})
        };
      }

      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Project structure check failed: ${error.message}`, 'error');
    }
  }

  async checkDependencies() {
    this.log('Checking dependencies...', 'info');
    
    const check = {
      name: 'Dependencies',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      // Check if node_modules exists
      if (!fs.existsSync('node_modules')) {
        check.issues.push({
          type: 'MISSING_NODE_MODULES',
          message: 'node_modules directory not found',
          severity: 'HIGH'
        });
      }

      // Check package-lock.json
      if (!fs.existsSync('package-lock.json')) {
        check.issues.push({
          type: 'MISSING_PACKAGE_LOCK',
          message: 'package-lock.json not found',
          severity: 'MEDIUM'
        });
      }

      // Run npm audit
      try {
        const auditOutput = execSync('npm audit --json', { 
          stdio: 'pipe', 
          encoding: 'utf8',
          timeout: 30000
        });
        
        const auditResult = JSON.parse(auditOutput);
        
        if (auditResult.metadata && auditResult.metadata.vulnerabilities) {
          const vulns = auditResult.metadata.vulnerabilities;
          const totalVulns = vulns.high + vulns.critical;
          
          if (totalVulns > 0) {
            check.issues.push({
              type: 'SECURITY_VULNERABILITIES',
              message: `Found ${totalVulns} high/critical vulnerabilities`,
              severity: 'MEDIUM'
            });
          }
          
          check.details.vulnerabilities = vulns;
        }
      } catch (auditError) {
        check.issues.push({
          type: 'AUDIT_FAILED',
          message: 'npm audit failed to run',
          severity: 'LOW'
        });
      }

      // Check for dependency conflicts
      try {
        execSync('npm ls', { stdio: 'pipe', timeout: 30000 });
      } catch (lsError) {
        check.issues.push({
          type: 'DEPENDENCY_CONFLICTS',
          message: 'Dependency tree has conflicts',
          severity: 'HIGH'
        });
      }

      // Check critical dependencies versions
      if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Check Next.js version
        if (deps.next) {
          const nextVersion = deps.next.replace(/[^0-9.]/g, '');
          if (nextVersion && parseFloat(nextVersion) < 13) {
            check.issues.push({
              type: 'OUTDATED_NEXTJS',
              message: `Next.js version ${nextVersion} is outdated`,
              severity: 'MEDIUM'
            });
          }
        }

        // Check React version
        if (deps.react) {
          const reactVersion = deps.react.replace(/[^0-9.]/g, '');
          if (reactVersion && parseFloat(reactVersion) < 18) {
            check.issues.push({
              type: 'OUTDATED_REACT',
              message: `React version ${reactVersion} is outdated`,
              severity: 'MEDIUM'
            });
          }
        }

        check.details.dependencies = deps;
      }

      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Dependencies check failed: ${error.message}`, 'error');
    }
  }

  async checkEnvironmentVariables() {
    this.log('Checking environment variables...', 'info');
    
    const check = {
      name: 'Environment Variables',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      // Check for .env.example
      if (!fs.existsSync('.env.example')) {
        check.issues.push({
          type: 'MISSING_ENV_EXAMPLE',
          message: '.env.example file not found',
          severity: 'MEDIUM'
        });
      }

      // Critical environment variables
      const criticalVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];

      const missingCriticalVars = criticalVars.filter(varName => !process.env[varName]);
      
      if (missingCriticalVars.length > 0) {
        check.issues.push({
          type: 'MISSING_CRITICAL_ENV_VARS',
          message: `Missing critical variables: ${missingCriticalVars.join(', ')}`,
          severity: 'HIGH'
        });
      }

      // Check OAuth variables
      const oauthPlatforms = ['INSTAGRAM', 'TIKTOK', 'REDDIT'];
      const missingOAuthVars = [];

      oauthPlatforms.forEach(platform => {
        const clientId = `${platform}_CLIENT_ID`;
        const clientSecret = `${platform}_CLIENT_SECRET`;
        
        if (!process.env[clientId] || !process.env[clientSecret]) {
          missingOAuthVars.push(`${platform} OAuth credentials`);
        }
      });

      if (missingOAuthVars.length > 0) {
        check.issues.push({
          type: 'MISSING_OAUTH_VARS',
          message: `Missing OAuth variables: ${missingOAuthVars.join(', ')}`,
          severity: 'MEDIUM'
        });
      }

      // Check for weak secrets
      if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
        check.issues.push({
          type: 'WEAK_SECRET',
          message: 'NEXTAUTH_SECRET is too short (should be 32+ characters)',
          severity: 'HIGH'
        });
      }

      // Check URL formats
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.match(/^(postgresql|postgres|mysql):\/\/.+/)) {
        check.issues.push({
          type: 'INVALID_DATABASE_URL',
          message: 'DATABASE_URL format appears invalid',
          severity: 'HIGH'
        });
      }

      if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.match(/^https?:\/\/.+/)) {
        check.issues.push({
          type: 'INVALID_NEXTAUTH_URL',
          message: 'NEXTAUTH_URL format appears invalid',
          severity: 'HIGH'
        });
      }

      check.details.envVarsCount = Object.keys(process.env).length;
      check.details.criticalVarsPresent = criticalVars.filter(varName => process.env[varName]);
      
      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Environment variables check failed: ${error.message}`, 'error');
    }
  }

  async checkBuildConfiguration() {
    this.log('Checking build configuration...', 'info');
    
    const check = {
      name: 'Build Configuration',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      // Check amplify.yml
      if (fs.existsSync('amplify.yml')) {
        const yaml = require('js-yaml');
        const amplifyConfig = yaml.load(fs.readFileSync('amplify.yml', 'utf8'));
        
        if (!amplifyConfig.frontend || !amplifyConfig.frontend.phases) {
          check.issues.push({
            type: 'INVALID_AMPLIFY_CONFIG',
            message: 'amplify.yml missing required frontend.phases configuration',
            severity: 'HIGH'
          });
        }

        if (!amplifyConfig.frontend.phases.build || !amplifyConfig.frontend.phases.build.commands) {
          check.issues.push({
            type: 'MISSING_BUILD_COMMANDS',
            message: 'amplify.yml missing build commands',
            severity: 'HIGH'
          });
        }

        check.details.amplifyConfig = amplifyConfig;
      } else {
        check.issues.push({
          type: 'MISSING_AMPLIFY_CONFIG',
          message: 'amplify.yml file not found',
          severity: 'HIGH'
        });
      }

      // Check next.config.ts
      if (fs.existsSync('next.config.ts')) {
        try {
          // Try to validate the config file syntax
          execSync('node -c next.config.ts', { stdio: 'pipe' });
        } catch (syntaxError) {
          check.issues.push({
            type: 'INVALID_NEXT_CONFIG',
            message: 'next.config.ts has syntax errors',
            severity: 'HIGH'
          });
        }
      } else if (fs.existsSync('next.config.js')) {
        try {
          execSync('node -c next.config.js', { stdio: 'pipe' });
        } catch (syntaxError) {
          check.issues.push({
            type: 'INVALID_NEXT_CONFIG',
            message: 'next.config.js has syntax errors',
            severity: 'HIGH'
          });
        }
      } else {
        check.issues.push({
          type: 'MISSING_NEXT_CONFIG',
          message: 'next.config.ts/js file not found',
          severity: 'MEDIUM'
        });
      }

      // Check TypeScript configuration
      if (fs.existsSync('tsconfig.json')) {
        try {
          const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
          
          if (!tsConfig.compilerOptions) {
            check.issues.push({
              type: 'INVALID_TSCONFIG',
              message: 'tsconfig.json missing compilerOptions',
              severity: 'MEDIUM'
            });
          }
        } catch (parseError) {
          check.issues.push({
            type: 'INVALID_TSCONFIG_JSON',
            message: 'tsconfig.json has invalid JSON syntax',
            severity: 'HIGH'
          });
        }
      }

      // Check for build optimization scripts
      const optimizationScripts = [
        'scripts/amplify-build-optimizer.js',
        'scripts/pre-build-validation.js'
      ];

      const missingOptimizationScripts = optimizationScripts.filter(script => 
        !fs.existsSync(script)
      );

      if (missingOptimizationScripts.length > 0) {
        check.issues.push({
          type: 'MISSING_OPTIMIZATION_SCRIPTS',
          message: `Missing optimization scripts: ${missingOptimizationScripts.join(', ')}`,
          severity: 'LOW'
        });
      }

      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Build configuration check failed: ${error.message}`, 'error');
    }
  }

  async checkNetworkConnectivity() {
    this.log('Checking network connectivity...', 'info');
    
    const check = {
      name: 'Network Connectivity',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      const endpoints = [
        { name: 'NPM Registry', url: 'https://registry.npmjs.org' },
        { name: 'GitHub', url: 'https://api.github.com' },
        { name: 'AWS', url: 'https://aws.amazon.com' }
      ];

      const connectivityResults = [];

      for (const endpoint of endpoints) {
        try {
          const startTime = Date.now();
          await this.checkEndpoint(endpoint.url);
          const responseTime = Date.now() - startTime;
          
          connectivityResults.push({
            name: endpoint.name,
            url: endpoint.url,
            status: 'success',
            responseTime
          });
        } catch (error) {
          connectivityResults.push({
            name: endpoint.name,
            url: endpoint.url,
            status: 'failed',
            error: error.message
          });
          
          check.issues.push({
            type: 'CONNECTIVITY_FAILURE',
            message: `Cannot connect to ${endpoint.name}: ${error.message}`,
            severity: 'MEDIUM'
          });
        }
      }

      check.details.connectivity = connectivityResults;
      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Network connectivity check failed: ${error.message}`, 'error');
    }
  }

  async checkEndpoint(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, { timeout: 10000 }, (response) => {
        if (response.statusCode >= 200 && response.statusCode < 400) {
          resolve(response.statusCode);
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
        response.resume();
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  async checkAmplifyConfiguration() {
    this.log('Checking Amplify configuration...', 'info');
    
    const check = {
      name: 'Amplify Configuration',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      // Check Amplify CLI
      try {
        const amplifyVersion = execSync('amplify --version', { 
          stdio: 'pipe', 
          encoding: 'utf8',
          timeout: 10000
        });
        check.details.amplifyVersion = amplifyVersion.trim();
      } catch (error) {
        check.issues.push({
          type: 'AMPLIFY_CLI_NOT_FOUND',
          message: 'Amplify CLI not found or not working',
          severity: 'HIGH'
        });
      }

      // Check Amplify project initialization
      if (fs.existsSync('.amplify')) {
        const amplifyDir = fs.readdirSync('.amplify');
        check.details.amplifyFiles = amplifyDir;
        
        if (!amplifyDir.includes('backend')) {
          check.issues.push({
            type: 'AMPLIFY_NOT_INITIALIZED',
            message: 'Amplify project appears not to be properly initialized',
            severity: 'MEDIUM'
          });
        }
      } else {
        check.issues.push({
          type: 'AMPLIFY_NOT_INITIALIZED',
          message: '.amplify directory not found',
          severity: 'HIGH'
        });
      }

      // Check AWS credentials
      const awsEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'];
      const missingAwsVars = awsEnvVars.filter(varName => !process.env[varName]);
      
      if (missingAwsVars.length > 0) {
        check.issues.push({
          type: 'MISSING_AWS_CREDENTIALS',
          message: `Missing AWS credentials: ${missingAwsVars.join(', ')}`,
          severity: 'HIGH'
        });
      }

      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Amplify configuration check failed: ${error.message}`, 'error');
    }
  }

  async checkBuildArtifacts() {
    this.log('Checking build artifacts...', 'info');
    
    const check = {
      name: 'Build Artifacts',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      const nextDir = path.join(process.cwd(), '.next');
      
      if (fs.existsSync(nextDir)) {
        const nextContents = fs.readdirSync(nextDir);
        check.details.nextContents = nextContents;
        
        // Check for required directories
        const requiredDirs = ['static', 'server'];
        const missingDirs = requiredDirs.filter(dir => !nextContents.includes(dir));
        
        if (missingDirs.length > 0) {
          check.issues.push({
            type: 'MISSING_BUILD_DIRECTORIES',
            message: `Missing build directories: ${missingDirs.join(', ')}`,
            severity: 'HIGH'
          });
        }

        // Check BUILD_ID
        if (!fs.existsSync(path.join(nextDir, 'BUILD_ID'))) {
          check.issues.push({
            type: 'MISSING_BUILD_ID',
            message: 'BUILD_ID file not found',
            severity: 'HIGH'
          });
        }

        // Check manifest files
        const manifestFiles = ['build-manifest.json', 'prerender-manifest.json'];
        const missingManifests = manifestFiles.filter(file => 
          !fs.existsSync(path.join(nextDir, file))
        );
        
        if (missingManifests.length > 0) {
          check.issues.push({
            type: 'MISSING_MANIFESTS',
            message: `Missing manifest files: ${missingManifests.join(', ')}`,
            severity: 'MEDIUM'
          });
        }

        // Calculate build size
        const buildSize = this.calculateDirectorySize(nextDir);
        check.details.buildSizeMB = Math.round(buildSize / (1024 * 1024));
        
        if (check.details.buildSizeMB > 500) {
          check.issues.push({
            type: 'LARGE_BUILD_SIZE',
            message: `Build size is very large: ${check.details.buildSizeMB}MB`,
            severity: 'MEDIUM'
          });
        }

      } else {
        check.issues.push({
          type: 'NO_BUILD_ARTIFACTS',
          message: '.next directory not found - build may have failed',
          severity: 'HIGH'
        });
      }

      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Build artifacts check failed: ${error.message}`, 'error');
    }
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += this.calculateDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible files
    }
    
    return totalSize;
  }

  async checkDeploymentLogs() {
    this.log('Checking deployment logs...', 'info');
    
    const check = {
      name: 'Deployment Logs',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      // Check for common log locations
      const logLocations = [
        'deployment-logs',
        'logs',
        '.amplify/logs',
        'amplify-build.log'
      ];

      const foundLogs = [];
      
      for (const logLocation of logLocations) {
        if (fs.existsSync(logLocation)) {
          if (fs.statSync(logLocation).isDirectory()) {
            const logFiles = fs.readdirSync(logLocation);
            foundLogs.push({ location: logLocation, files: logFiles });
          } else {
            foundLogs.push({ location: logLocation, type: 'file' });
          }
        }
      }

      check.details.foundLogs = foundLogs;

      if (foundLogs.length === 0) {
        check.issues.push({
          type: 'NO_DEPLOYMENT_LOGS',
          message: 'No deployment logs found for analysis',
          severity: 'LOW'
        });
      }

      // Analyze recent logs if available
      for (const logInfo of foundLogs) {
        if (logInfo.files) {
          const recentLogs = logInfo.files
            .filter(file => file.endsWith('.log'))
            .slice(-3); // Last 3 log files
          
          for (const logFile of recentLogs) {
            const logPath = path.join(logInfo.location, logFile);
            try {
              const logContent = fs.readFileSync(logPath, 'utf8');
              
              // Look for error patterns
              const errorPatterns = [
                /error/i,
                /failed/i,
                /exception/i,
                /timeout/i,
                /out of memory/i
              ];
              
              const foundErrors = errorPatterns.filter(pattern => 
                pattern.test(logContent)
              );
              
              if (foundErrors.length > 0) {
                check.issues.push({
                  type: 'ERRORS_IN_LOGS',
                  message: `Errors found in ${logFile}`,
                  severity: 'MEDIUM'
                });
              }
            } catch (readError) {
              // Ignore read errors
            }
          }
        }
      }

      check.status = check.issues.length === 0 ? 'passed' : 'warning';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Deployment logs check failed: ${error.message}`, 'error');
    }
  }

  async checkResourceLimits() {
    this.log('Checking resource limits...', 'info');
    
    const check = {
      name: 'Resource Limits',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memoryUsage.heapUsed / (1024 * 1024));
      
      check.details.memoryUsage = {
        heapUsed: memoryUsageMB,
        heapTotal: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
        external: Math.round(memoryUsage.external / (1024 * 1024))
      };

      // Check Node.js memory limit
      const nodeOptions = process.env.NODE_OPTIONS || '';
      const memoryLimitMatch = nodeOptions.match(/--max-old-space-size=(\d+)/);
      
      if (memoryLimitMatch) {
        const memoryLimit = parseInt(memoryLimitMatch[1]);
        check.details.memoryLimit = memoryLimit;
        
        if (memoryLimit < 2048) {
          check.issues.push({
            type: 'LOW_MEMORY_LIMIT',
            message: `Memory limit is low: ${memoryLimit}MB`,
            severity: 'MEDIUM'
          });
        }
      } else {
        check.issues.push({
          type: 'NO_MEMORY_LIMIT_SET',
          message: 'No explicit memory limit set',
          severity: 'LOW'
        });
      }

      // Check disk space (if possible)
      try {
        const diskUsage = execSync('df -h .', { 
          stdio: 'pipe', 
          encoding: 'utf8',
          timeout: 5000
        });
        
        check.details.diskUsage = diskUsage.trim();
        
        // Parse disk usage to check for low space
        const lines = diskUsage.split('\n');
        if (lines.length > 1) {
          const usageMatch = lines[1].match(/(\d+)%/);
          if (usageMatch) {
            const usagePercent = parseInt(usageMatch[1]);
            if (usagePercent > 90) {
              check.issues.push({
                type: 'LOW_DISK_SPACE',
                message: `Disk usage is high: ${usagePercent}%`,
                severity: 'HIGH'
              });
            }
          }
        }
      } catch (diskError) {
        // Disk check not available on this system
      }

      check.status = check.issues.length === 0 ? 'passed' : 'warning';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Resource limits check failed: ${error.message}`, 'error');
    }
  }

  async checkSecurityConfiguration() {
    this.log('Checking security configuration...', 'info');
    
    const check = {
      name: 'Security Configuration',
      status: 'unknown',
      details: {},
      issues: []
    };

    try {
      // Check for sensitive files in version control
      const sensitiveFiles = [
        '.env',
        '.env.local',
        '.env.production',
        'aws-credentials.json',
        'service-account.json'
      ];

      const exposedFiles = sensitiveFiles.filter(file => 
        fs.existsSync(file) && !this.isFileGitIgnored(file)
      );

      if (exposedFiles.length > 0) {
        check.issues.push({
          type: 'SENSITIVE_FILES_EXPOSED',
          message: `Sensitive files not in .gitignore: ${exposedFiles.join(', ')}`,
          severity: 'HIGH'
        });
      }

      // Check .gitignore
      if (fs.existsSync('.gitignore')) {
        const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
        
        const requiredIgnores = ['.env', 'node_modules', '.next'];
        const missingIgnores = requiredIgnores.filter(pattern => 
          !gitignoreContent.includes(pattern)
        );
        
        if (missingIgnores.length > 0) {
          check.issues.push({
            type: 'INCOMPLETE_GITIGNORE',
            message: `Missing .gitignore patterns: ${missingIgnores.join(', ')}`,
            severity: 'MEDIUM'
          });
        }
      } else {
        check.issues.push({
          type: 'MISSING_GITIGNORE',
          message: '.gitignore file not found',
          severity: 'MEDIUM'
        });
      }

      // Check for hardcoded secrets in code
      const codeFiles = this.findCodeFiles();
      const secretPatterns = [
        /password\s*=\s*["'][^"'<>]+["']/i,
        /secret\s*=\s*["'][^"'<>]+["']/i,
        /key\s*=\s*["'][^"'<>]+["']/i,
        /token\s*=\s*["'][^"'<>]+["']/i
      ];

      let hardcodedSecretsFound = 0;
      
      for (const file of codeFiles.slice(0, 50)) { // Check first 50 files
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const pattern of secretPatterns) {
            if (pattern.test(content)) {
              hardcodedSecretsFound++;
              break;
            }
          }
        } catch (readError) {
          // Ignore read errors
        }
      }

      if (hardcodedSecretsFound > 0) {
        check.issues.push({
          type: 'HARDCODED_SECRETS',
          message: `Potential hardcoded secrets found in ${hardcodedSecretsFound} files`,
          severity: 'HIGH'
        });
      }

      check.details.checkedFiles = codeFiles.length;
      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      this.diagnosticResults.checks.push(check);

    } catch (error) {
      check.status = 'error';
      check.error = error.message;
      this.diagnosticResults.checks.push(check);
      this.log(`Security configuration check failed: ${error.message}`, 'error');
    }
  }

  isFileGitIgnored(filePath) {
    try {
      execSync(`git check-ignore ${filePath}`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  findCodeFiles() {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
    const codeFiles = [];
    
    const scanDirectory = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDirectory(filePath);
          } else if (stats.isFile() && codeExtensions.some(ext => file.endsWith(ext))) {
            codeFiles.push(filePath);
          }
        }
      } catch (error) {
        // Ignore directory scan errors
      }
    };
    
    scanDirectory(process.cwd());
    return codeFiles;
  }

  generateRecommendations() {
    this.log('Generating recommendations...', 'info');
    
    const highSeverityIssues = [];
    const mediumSeverityIssues = [];
    
    this.diagnosticResults.checks.forEach(check => {
      check.issues?.forEach(issue => {
        if (issue.severity === 'HIGH') {
          highSeverityIssues.push({ check: check.name, issue });
        } else if (issue.severity === 'MEDIUM') {
          mediumSeverityIssues.push({ check: check.name, issue });
        }
      });
    });

    // Generate specific recommendations
    if (highSeverityIssues.length > 0) {
      this.diagnosticResults.recommendations.push({
        priority: 'HIGH',
        title: 'Critical Issues Require Immediate Attention',
        description: 'The following critical issues must be resolved before deployment can succeed:',
        actions: highSeverityIssues.map(item => `${item.check}: ${item.issue.message}`)
      });
    }

    if (mediumSeverityIssues.length > 0) {
      this.diagnosticResults.recommendations.push({
        priority: 'MEDIUM',
        title: 'Performance and Reliability Improvements',
        description: 'These issues may impact deployment performance or reliability:',
        actions: mediumSeverityIssues.map(item => `${item.check}: ${item.issue.message}`)
      });
    }

    // General recommendations
    this.diagnosticResults.recommendations.push({
      priority: 'LOW',
      title: 'General Best Practices',
      description: 'Consider implementing these best practices:',
      actions: [
        'Regularly update dependencies to latest stable versions',
        'Monitor build performance and optimize as needed',
        'Implement comprehensive error logging and monitoring',
        'Set up automated testing for deployment processes',
        'Review and update security configurations regularly'
      ]
    });
  }

  generateDiagnosticReport() {
    const reportPath = path.join(process.cwd(), 'deployment-diagnostic-report.json');
    const summaryPath = path.join(process.cwd(), 'deployment-diagnostic-summary.md');
    
    try {
      // Save detailed JSON report
      fs.writeFileSync(reportPath, JSON.stringify(this.diagnosticResults, null, 2));
      this.log(`Detailed diagnostic report saved to: ${reportPath}`, 'info');
      
      // Generate human-readable summary
      const summary = this.generateMarkdownSummary();
      fs.writeFileSync(summaryPath, summary);
      this.log(`Diagnostic summary saved to: ${summaryPath}`, 'info');
      
    } catch (error) {
      this.log(`Could not save diagnostic report: ${error.message}`, 'warning');
    }
  }

  generateMarkdownSummary() {
    const passedChecks = this.diagnosticResults.checks.filter(check => check.status === 'passed').length;
    const failedChecks = this.diagnosticResults.checks.filter(check => check.status === 'failed').length;
    const errorChecks = this.diagnosticResults.checks.filter(check => check.status === 'error').length;
    
    let summary = `# Deployment Diagnostic Report

**Generated:** ${this.diagnosticResults.timestamp}
**Environment:** ${this.diagnosticResults.environment.platform} ${this.diagnosticResults.environment.arch}
**Node Version:** ${this.diagnosticResults.environment.nodeVersion}

## Summary
- ✅ **Passed:** ${passedChecks} checks
- ❌ **Failed:** ${failedChecks} checks
- 🔥 **Errors:** ${errorChecks} checks

## Check Results
`;

    this.diagnosticResults.checks.forEach(check => {
      const statusEmoji = check.status === 'passed' ? '✅' : 
                         check.status === 'failed' ? '❌' : 
                         check.status === 'error' ? '🔥' : '⚠️';
      
      summary += `\n### ${statusEmoji} ${check.name}\n`;
      
      if (check.issues && check.issues.length > 0) {
        summary += '\n**Issues:**\n';
        check.issues.forEach(issue => {
          const severityEmoji = issue.severity === 'HIGH' ? '🔴' : 
                               issue.severity === 'MEDIUM' ? '🟡' : '🟢';
          summary += `- ${severityEmoji} ${issue.message}\n`;
        });
      }
      
      if (check.error) {
        summary += `\n**Error:** ${check.error}\n`;
      }
    });

    summary += '\n## Recommendations\n';
    
    this.diagnosticResults.recommendations.forEach(rec => {
      const priorityEmoji = rec.priority === 'HIGH' ? '🔴' : 
                           rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      
      summary += `\n### ${priorityEmoji} ${rec.title}\n`;
      summary += `${rec.description}\n\n`;
      
      rec.actions.forEach(action => {
        summary += `- ${action}\n`;
      });
    });

    summary += `\n## Next Steps
1. Address all HIGH priority issues first
2. Review and implement MEDIUM priority recommendations
3. Re-run diagnostics after making changes
4. Proceed with deployment once critical issues are resolved

For detailed information, see the full diagnostic report: \`deployment-diagnostic-report.json\`
`;

    return summary;
  }
}

// CLI usage
if (require.main === module) {
  const diagnostic = new DeploymentDiagnostic();
  
  diagnostic.runDiagnostics()
    .then(results => {
      const failedChecks = results.checks.filter(check => 
        check.status === 'failed' || check.status === 'error'
      ).length;
      
      if (failedChecks > 0) {
        console.log(`\n❌ Diagnostic completed with ${failedChecks} failed checks`);
        console.log('Review the diagnostic report for detailed information.');
        process.exit(1);
      } else {
        console.log('\n✅ All diagnostic checks passed!');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('Diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = DeploymentDiagnostic;