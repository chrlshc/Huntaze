#!/usr/bin/env node

/**
 * Pre-build validation script for Amplify deployments
 * Validates environment variables, dependencies, and build prerequisites
 */

const fs = require('fs');
const path = require('path');

class PreBuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.recommendations = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  validateEnvironment() {
    this.log('Validating environment variables...');
    
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV',
      'NEXT_PUBLIC_APP_URL'
    ];

    const criticalVars = [
      'DATABASE_URL',
      'JWT_SECRET'
    ];

    const optionalVars = [
      'REDIS_URL',
      'AZURE_OPENAI_API_KEY',
      'AZURE_OPENAI_ENDPOINT',
      'TOKEN_ENCRYPTION_KEY',
      'SESSION_SECRET',
      'ENCRYPTION_KEY'
    ];

    let missingRequired = [];
    let missingCritical = [];
    let missingOptional = [];

    // Check required variables
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missingRequired.push(varName);
        if (criticalVars.includes(varName)) {
          missingCritical.push(varName);
        }
      }
    });

    // Check optional variables
    optionalVars.forEach(varName => {
      if (!process.env[varName]) {
        missingOptional.push(varName);
      }
    });

    // Critical errors
    if (missingCritical.length > 0) {
      this.errors.push({
        type: 'environment',
        message: `Critical environment variables missing: ${missingCritical.join(', ')}`,
        resolution: 'Configure these variables in Amplify Console Environment Variables section'
      });
    }

    // Required warnings
    const nonCriticalMissing = missingRequired.filter(v => !criticalVars.includes(v));
    if (nonCriticalMissing.length > 0) {
      this.warnings.push({
        type: 'environment',
        message: `Required environment variables missing: ${nonCriticalMissing.join(', ')}`,
        resolution: 'Add these variables for proper application functionality'
      });
    }

    // Optional info
    if (missingOptional.length > 0) {
      this.log(`Optional variables not set: ${missingOptional.join(', ')}`, 'info');
    }

    // Validate environment variable formats
    this.validateEnvironmentFormats();

    // Check for environment-specific requirements
    this.validateEnvironmentSpecificRequirements();

    this.log(`Environment validation complete. Found ${this.errors.length} errors, ${this.warnings.length} warnings`);
  }

  validateEnvironmentFormats() {
    // Database URL validation
    if (process.env.DATABASE_URL) {
      if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
        this.errors.push({
          type: 'environment',
          message: 'DATABASE_URL must be a valid PostgreSQL connection string',
          resolution: 'Ensure DATABASE_URL starts with postgresql://'
        });
      } else {
        // Check if URL contains required components
        try {
          const url = new URL(process.env.DATABASE_URL);
          if (!url.hostname || !url.username || !url.password) {
            this.warnings.push({
              type: 'environment',
              message: 'DATABASE_URL may be missing required components (host, username, password)',
              resolution: 'Verify DATABASE_URL contains all required connection parameters'
            });
          }
        } catch (error) {
          this.errors.push({
            type: 'environment',
            message: 'DATABASE_URL format is invalid',
            resolution: 'Provide a valid PostgreSQL connection string'
          });
        }
      }
    }

    // App URL validation
    if (process.env.NEXT_PUBLIC_APP_URL) {
      if (!process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
        this.warnings.push({
          type: 'environment',
          message: 'NEXT_PUBLIC_APP_URL should use HTTPS for production',
          resolution: 'Update NEXT_PUBLIC_APP_URL to use https:// protocol'
        });
      }
      
      try {
        new URL(process.env.NEXT_PUBLIC_APP_URL);
      } catch (error) {
        this.errors.push({
          type: 'environment',
          message: 'NEXT_PUBLIC_APP_URL is not a valid URL',
          resolution: 'Provide a valid URL for NEXT_PUBLIC_APP_URL'
        });
      }
    }

    // JWT Secret validation
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      this.warnings.push({
        type: 'environment',
        message: 'JWT_SECRET should be at least 32 characters long for security',
        resolution: 'Generate a longer JWT secret for better security'
      });
    }

    // Redis URL validation
    if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('redis://')) {
      this.warnings.push({
        type: 'environment',
        message: 'REDIS_URL should start with redis:// protocol',
        resolution: 'Update REDIS_URL to use proper Redis connection format'
      });
    }

    // Azure OpenAI validation
    if (process.env.AZURE_OPENAI_ENDPOINT && !process.env.AZURE_OPENAI_API_KEY) {
      this.warnings.push({
        type: 'environment',
        message: 'AZURE_OPENAI_ENDPOINT is set but AZURE_OPENAI_API_KEY is missing',
        resolution: 'Add AZURE_OPENAI_API_KEY to enable Azure OpenAI functionality'
      });
    }
  }

  validateEnvironmentSpecificRequirements() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    if (nodeEnv === 'production') {
      // Production-specific validations
      const productionRequired = [
        'DATABASE_URL',
        'JWT_SECRET',
        'NEXT_PUBLIC_APP_URL'
      ];
      
      const missingProd = productionRequired.filter(varName => !process.env[varName]);
      if (missingProd.length > 0) {
        this.errors.push({
          type: 'environment',
          message: `Production environment missing critical variables: ${missingProd.join(', ')}`,
          resolution: 'All production variables must be configured for deployment'
        });
      }

      // Check for development-only values in production
      if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
        this.errors.push({
          type: 'environment',
          message: 'NEXT_PUBLIC_APP_URL contains localhost in production environment',
          resolution: 'Update NEXT_PUBLIC_APP_URL to use production domain'
        });
      }
    }

    // Check for conflicting environment settings
    if (process.env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION !== '1') {
      this.recommendations.push('Consider setting SKIP_ENV_VALIDATION=1 for production builds to improve performance');
    }
  }

  validateDependencies() {
    this.log('Validating dependencies...');

    // Check if package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.errors.push({
        type: 'dependency',
        message: 'package.json not found',
        resolution: 'Ensure package.json exists in the project root'
      });
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Validate package.json structure
      this.validatePackageJsonStructure(packageJson);
      
      // Check for critical dependencies
      this.validateCriticalDependencies(packageJson);
      
      // Check version compatibility
      this.validateVersionCompatibility(packageJson);
      
      // Check for security vulnerabilities
      this.validateSecurityConsiderations(packageJson);
      
      // Check lock files
      this.validateLockFiles();

    } catch (error) {
      this.errors.push({
        type: 'dependency',
        message: `Failed to parse package.json: ${error.message}`,
        resolution: 'Fix package.json syntax errors'
      });
    }

    this.log(`Dependency validation complete`);
  }

  validatePackageJsonStructure(packageJson) {
    // Check required fields
    const requiredFields = ['name', 'version', 'scripts'];
    const missingFields = requiredFields.filter(field => !packageJson[field]);
    
    if (missingFields.length > 0) {
      this.warnings.push({
        type: 'dependency',
        message: `package.json missing recommended fields: ${missingFields.join(', ')}`,
        resolution: 'Add missing fields to package.json for better project management'
      });
    }

    // Check for build script
    if (!packageJson.scripts?.build) {
      this.errors.push({
        type: 'dependency',
        message: 'No build script found in package.json',
        resolution: 'Add a build script to package.json scripts section'
      });
    }

    // Check for start script
    if (!packageJson.scripts?.start) {
      this.warnings.push({
        type: 'dependency',
        message: 'No start script found in package.json',
        resolution: 'Consider adding a start script for production deployment'
      });
    }
  }

  validateCriticalDependencies(packageJson) {
    const criticalDeps = ['next', 'react', 'react-dom'];
    const missingDeps = criticalDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missingDeps.length > 0) {
      this.errors.push({
        type: 'dependency',
        message: `Critical dependencies missing: ${missingDeps.join(', ')}`,
        resolution: 'Install missing dependencies with npm install'
      });
    }

    // Check for TypeScript setup if .ts files exist
    const hasTypeScript = fs.existsSync(path.join(process.cwd(), 'tsconfig.json')) ||
                         fs.existsSync(path.join(process.cwd(), 'next.config.ts'));
    
    if (hasTypeScript) {
      const tsRequired = ['typescript', '@types/react', '@types/node'];
      const missingTs = tsRequired.filter(dep => 
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );
      
      if (missingTs.length > 0) {
        this.warnings.push({
          type: 'dependency',
          message: `TypeScript project missing dependencies: ${missingTs.join(', ')}`,
          resolution: 'Install TypeScript dependencies for proper type checking'
        });
      }
    }

    // Check for essential build tools
    const buildTools = ['postcss', 'tailwindcss'];
    const missingBuildTools = buildTools.filter(tool => 
      !packageJson.dependencies?.[tool] && !packageJson.devDependencies?.[tool]
    );
    
    if (missingBuildTools.length > 0) {
      this.log(`Optional build tools not found: ${missingBuildTools.join(', ')}`, 'info');
    }
  }

  validateVersionCompatibility(packageJson) {
    // Check Next.js version compatibility
    const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next;
    if (nextVersion) {
      const versionNumber = nextVersion.replace(/[^\d.]/g, '');
      const majorVersion = parseInt(versionNumber.split('.')[0]);
      
      if (majorVersion < 13) {
        this.warnings.push({
          type: 'dependency',
          message: `Next.js version ${nextVersion} is outdated`,
          resolution: 'Consider upgrading to Next.js 13+ for better performance and features'
        });
      } else if (majorVersion >= 15) {
        this.log(`Using Next.js ${majorVersion} - latest version detected`, 'info');
      }
    }

    // Check React version compatibility
    const reactVersion = packageJson.dependencies?.react || packageJson.devDependencies?.react;
    if (reactVersion) {
      const versionNumber = reactVersion.replace(/[^\d.]/g, '');
      const majorVersion = parseInt(versionNumber.split('.')[0]);
      
      if (majorVersion < 18) {
        this.warnings.push({
          type: 'dependency',
          message: `React version ${reactVersion} may not be compatible with latest Next.js`,
          resolution: 'Consider upgrading to React 18+ for better compatibility'
        });
      }
    }

    // Check Node.js version compatibility with dependencies
    const nodeVersion = process.version;
    const majorNodeVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (nextVersion && majorNodeVersion < 18) {
      this.errors.push({
        type: 'dependency',
        message: `Node.js ${nodeVersion} may not be compatible with Next.js ${nextVersion}`,
        resolution: 'Upgrade to Node.js 18+ for Next.js 13+ compatibility'
      });
    }
  }

  validateSecurityConsiderations(packageJson) {
    // Check for known problematic packages (this is a basic check)
    const problematicPackages = ['node-sass']; // node-sass is deprecated
    const foundProblematic = problematicPackages.filter(pkg => 
      packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]
    );
    
    if (foundProblematic.length > 0) {
      this.warnings.push({
        type: 'dependency',
        message: `Deprecated packages found: ${foundProblematic.join(', ')}`,
        resolution: 'Consider replacing deprecated packages with modern alternatives'
      });
    }

    // Check for excessive number of dependencies
    const totalDeps = Object.keys(packageJson.dependencies || {}).length + 
                     Object.keys(packageJson.devDependencies || {}).length;
    
    if (totalDeps > 100) {
      this.warnings.push({
        type: 'dependency',
        message: `Large number of dependencies (${totalDeps}) may impact build performance`,
        resolution: 'Review and remove unused dependencies to improve build times'
      });
    }
  }

  validateLockFiles() {
    const packageLockPath = path.join(process.cwd(), 'package-lock.json');
    const yarnLockPath = path.join(process.cwd(), 'yarn.lock');
    
    const hasPackageLock = fs.existsSync(packageLockPath);
    const hasYarnLock = fs.existsSync(yarnLockPath);
    
    if (!hasPackageLock && !hasYarnLock) {
      this.warnings.push({
        type: 'dependency',
        message: 'No lock file found (package-lock.json or yarn.lock)',
        resolution: 'Run npm install or yarn install to generate a lock file for consistent builds'
      });
    } else if (hasPackageLock && hasYarnLock) {
      this.warnings.push({
        type: 'dependency',
        message: 'Both package-lock.json and yarn.lock found',
        resolution: 'Remove one lock file to avoid conflicts between package managers'
      });
    } else if (hasPackageLock) {
      this.log('Using npm (package-lock.json found)', 'info');
    } else if (hasYarnLock) {
      this.log('Using Yarn (yarn.lock found)', 'info');
    }
  }

  validateBuildPrerequisites() {
    this.log('Validating build prerequisites...');

    // Check Node.js version and compatibility
    this.validateNodeJsVersion();
    
    // Check build configuration files
    this.validateBuildConfiguration();
    
    // Check system resources
    this.validateSystemResources();
    
    // Check build environment
    this.validateBuildEnvironment();
    
    // Check for common build issues
    this.validateCommonBuildIssues();

    this.log(`Build prerequisites validation complete`);
  }

  validateNodeJsVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    const minorVersion = parseInt(nodeVersion.slice(1).split('.')[1]);
    
    if (majorVersion < 18) {
      this.errors.push({
        type: 'configuration',
        message: `Node.js version ${nodeVersion} is not supported`,
        resolution: 'Upgrade to Node.js 18+ for Next.js 13+ compatibility'
      });
    } else if (majorVersion === 18 && minorVersion < 17) {
      this.warnings.push({
        type: 'configuration',
        message: `Node.js ${nodeVersion} is supported but consider upgrading to 18.17+`,
        resolution: 'Upgrade to Node.js 18.17+ for better performance and security'
      });
    } else {
      this.log(`Node.js version ${nodeVersion} is compatible`);
    }

    // Check npm version
    try {
      const { execSync } = require('child_process');
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      const npmMajor = parseInt(npmVersion.split('.')[0]);
      
      if (npmMajor < 8) {
        this.warnings.push({
          type: 'configuration',
          message: `npm version ${npmVersion} is outdated`,
          resolution: 'Upgrade npm with: npm install -g npm@latest'
        });
      } else {
        this.log(`npm version ${npmVersion} is compatible`);
      }
    } catch (error) {
      this.warnings.push({
        type: 'configuration',
        message: 'Could not determine npm version',
        resolution: 'Ensure npm is properly installed and accessible'
      });
    }
  }

  validateBuildConfiguration() {
    // Check for Next.js config
    const nextConfigPaths = [
      'next.config.js',
      'next.config.mjs',
      'next.config.ts'
    ];

    const nextConfigFile = nextConfigPaths.find(configPath => 
      fs.existsSync(path.join(process.cwd(), configPath))
    );

    if (!nextConfigFile) {
      this.warnings.push({
        type: 'configuration',
        message: 'No Next.js configuration file found',
        resolution: 'Consider adding next.config.js for build optimizations'
      });
    } else {
      this.log(`Found Next.js config: ${nextConfigFile}`);
      
      // Basic validation of Next.js config
      try {
        const configPath = path.join(process.cwd(), nextConfigFile);
        const configContent = fs.readFileSync(configPath, 'utf8');
        
        // Check for common configuration issues
        if (configContent.includes('experimental')) {
          this.log('Experimental features detected in Next.js config', 'info');
        }
        
        if (configContent.includes('output:') && configContent.includes('export')) {
          this.log('Static export configuration detected', 'info');
        }
      } catch (error) {
        this.warnings.push({
          type: 'configuration',
          message: `Could not read Next.js config: ${error.message}`,
          resolution: 'Ensure Next.js config file is readable and properly formatted'
        });
      }
    }

    // Check for TypeScript config
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      this.log('TypeScript configuration found');
      
      try {
        const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
        
        // Check for strict mode
        if (!tsConfig.compilerOptions?.strict) {
          this.recommendations.push('Enable TypeScript strict mode for better type safety');
        }
        
        // Check for incremental compilation
        if (!tsConfig.compilerOptions?.incremental) {
          this.recommendations.push('Enable TypeScript incremental compilation for faster builds');
        }
      } catch (error) {
        this.warnings.push({
          type: 'configuration',
          message: 'TypeScript config file has syntax errors',
          resolution: 'Fix tsconfig.json syntax errors'
        });
      }
    }

    // Check for Tailwind CSS config
    const tailwindConfigPaths = [
      'tailwind.config.js',
      'tailwind.config.ts',
      'tailwind.config.mjs'
    ];

    const hasTailwindConfig = tailwindConfigPaths.some(configPath => 
      fs.existsSync(path.join(process.cwd(), configPath))
    );

    if (hasTailwindConfig) {
      this.log('Tailwind CSS configuration found');
    }
  }

  validateSystemResources() {
    const os = require('os');
    
    // Check available memory
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryGB = Math.round(totalMemory / (1024 * 1024 * 1024));
    const freeMemoryGB = Math.round(freeMemory / (1024 * 1024 * 1024));
    
    this.log(`System memory: ${memoryGB}GB total, ${freeMemoryGB}GB free`);
    
    if (memoryGB < 4) {
      this.warnings.push({
        type: 'configuration',
        message: `Available memory (${memoryGB}GB) may be insufficient for large builds`,
        resolution: 'Consider optimizing build process or increasing memory allocation'
      });
    } else if (freeMemoryGB < 2) {
      this.warnings.push({
        type: 'configuration',
        message: `Low free memory (${freeMemoryGB}GB) may cause build issues`,
        resolution: 'Close unnecessary applications or increase available memory'
      });
    }

    // Check CPU cores
    const cpuCores = os.cpus().length;
    this.log(`CPU cores: ${cpuCores}`);
    
    if (cpuCores < 2) {
      this.warnings.push({
        type: 'configuration',
        message: `Limited CPU cores (${cpuCores}) may slow down builds`,
        resolution: 'Consider using a machine with more CPU cores for faster builds'
      });
    }

    // Check disk space (basic check)
    try {
      const stats = fs.statSync(process.cwd());
      this.log('Workspace directory accessible');
    } catch (error) {
      this.errors.push({
        type: 'configuration',
        message: 'Cannot access workspace directory',
        resolution: 'Ensure proper file system permissions'
      });
    }
  }

  validateBuildEnvironment() {
    // Check CI environment
    const isCI = process.env.CI === 'true' || process.env.CONTINUOUS_INTEGRATION === 'true';
    if (isCI) {
      this.log('CI environment detected');
      
      // CI-specific validations
      if (!process.env.NODE_ENV) {
        this.recommendations.push('Set NODE_ENV=production in CI environment');
      }
    }

    // Check Amplify environment
    const isAmplify = process.env.AWS_AMPLIFY_WEBHOOK_URL || process.env._LIVE_UPDATES;
    if (isAmplify) {
      this.log('AWS Amplify environment detected');
      
      // Amplify-specific validations
      if (!process.env.AMPLIFY_MONOREPO_APP_ROOT) {
        this.log('Single-app Amplify deployment detected');
      }
    }

    // Check for common environment issues
    if (process.env.NODE_OPTIONS && process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
      const memoryLimit = process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1];
      if (memoryLimit) {
        this.log(`Node.js memory limit set to ${memoryLimit}MB`);
      }
    }
  }

  validateCommonBuildIssues() {
    // Check for common problematic files
    const problematicFiles = [
      '.DS_Store',
      'Thumbs.db',
      'desktop.ini'
    ];

    const foundProblematic = problematicFiles.filter(file => 
      fs.existsSync(path.join(process.cwd(), file))
    );

    if (foundProblematic.length > 0) {
      this.warnings.push({
        type: 'configuration',
        message: `System files found: ${foundProblematic.join(', ')}`,
        resolution: 'Add these files to .gitignore to avoid build issues'
      });
    }

    // Check for .env files
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production'
    ];

    const foundEnvFiles = envFiles.filter(file => 
      fs.existsSync(path.join(process.cwd(), file))
    );

    if (foundEnvFiles.length > 0) {
      this.log(`Environment files found: ${foundEnvFiles.join(', ')}`);
      
      // Check if .env files are in .gitignore
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        const envInGitignore = foundEnvFiles.some(file => 
          gitignoreContent.includes(file) || gitignoreContent.includes('.env*')
        );
        
        if (!envInGitignore) {
          this.warnings.push({
            type: 'configuration',
            message: 'Environment files may not be properly ignored by git',
            resolution: 'Ensure .env files are listed in .gitignore'
          });
        }
      }
    }

    // Check for node_modules in git
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignoreContent.includes('node_modules')) {
          this.warnings.push({
            type: 'configuration',
            message: 'node_modules directory should be in .gitignore',
            resolution: 'Add node_modules to .gitignore file'
          });
        }
      }
    }
  }

  reportValidationResults() {
    this.log('=== VALIDATION SUMMARY ===');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('✅ All validations passed successfully!', 'info');
      return true;
    }

    if (this.errors.length > 0) {
      this.log(`Found ${this.errors.length} critical error(s):`, 'error');
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. [${error.type.toUpperCase()}] ${error.message}`, 'error');
        this.log(`   Resolution: ${error.resolution}`, 'error');
      });
    }

    if (this.warnings.length > 0) {
      this.log(`Found ${this.warnings.length} warning(s):`, 'warning');
      this.warnings.forEach((warning, index) => {
        this.log(`${index + 1}. [${warning.type.toUpperCase()}] ${warning.message}`, 'warning');
        this.log(`   Resolution: ${warning.resolution}`, 'warning');
      });
    }

    if (this.recommendations.length > 0) {
      this.log('Recommendations:', 'info');
      this.recommendations.forEach((rec, index) => {
        this.log(`${index + 1}. ${rec}`, 'info');
      });
    }

    // Return false if there are critical errors
    return this.errors.length === 0;
  }

  async run() {
    this.log('Starting pre-build validation...');
    
    try {
      this.validateEnvironment();
      this.validateDependencies();
      this.validateBuildPrerequisites();
      
      const success = this.reportValidationResults();
      
      if (!success) {
        this.log('Pre-build validation failed. Please fix the errors above.', 'error');
        process.exit(1);
      }
      
      this.log('Pre-build validation completed successfully!', 'info');
      return true;
      
    } catch (error) {
      this.log(`Validation failed with error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new PreBuildValidator();
  validator.run().catch(error => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
}

module.exports = PreBuildValidator;