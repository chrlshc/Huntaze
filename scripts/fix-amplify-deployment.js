#!/usr/bin/env node

/**
 * Fix Amplify Deployment Issues
 * Diagnoses and fixes common Amplify deployment problems
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AmplifyDeploymentFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async diagnoseIssues() {
    this.log('🔍 Diagnosing Amplify deployment issues...');
    
    // Check 1: Verify Next.js configuration
    this.checkNextConfig();
    
    // Check 2: Verify build artifacts
    this.checkBuildArtifacts();
    
    // Check 3: Check Amplify configuration
    this.checkAmplifyConfig();
    
    // Check 4: Check environment variables
    this.checkEnvironmentVariables();
    
    // Check 5: Check API routes structure
    this.checkApiRoutes();
    
    // Check 6: Check package.json scripts
    this.checkPackageScripts();
    
    this.log(`Found ${this.issues.length} potential issues`);
    return this.issues;
  }

  checkNextConfig() {
    this.log('Checking Next.js configuration...');
    
    const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
    if (!fs.existsSync(nextConfigPath)) {
      this.issues.push({
        type: 'config',
        severity: 'error',
        message: 'next.config.ts not found',
        fix: 'createNextConfig'
      });
      return;
    }

    try {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Check for problematic export configuration
      if (configContent.includes("output: 'export'") && !configContent.includes('isExport')) {
        this.issues.push({
          type: 'config',
          severity: 'error',
          message: 'Static export enabled without proper conditions',
          fix: 'fixNextConfigExport'
        });
      }

      // Check for missing standalone configuration
      if (!configContent.includes('standalone')) {
        this.issues.push({
          type: 'config',
          severity: 'warning',
          message: 'Standalone output not configured for Amplify',
          fix: 'addStandaloneConfig'
        });
      }

      this.log('Next.js configuration checked');
    } catch (error) {
      this.issues.push({
        type: 'config',
        severity: 'error',
        message: `Cannot read next.config.ts: ${error.message}`,
        fix: 'fixNextConfigSyntax'
      });
    }
  }

  checkBuildArtifacts() {
    this.log('Checking build artifacts...');
    
    const nextDir = path.join(process.cwd(), '.next');
    if (!fs.existsSync(nextDir)) {
      this.issues.push({
        type: 'build',
        severity: 'error',
        message: 'No build artifacts found (.next directory missing)',
        fix: 'runBuild'
      });
      return;
    }

    // Check for required build files
    const requiredFiles = [
      '.next/BUILD_ID',
      '.next/static',
      '.next/server'
    ];

    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(process.cwd(), file))
    );

    if (missingFiles.length > 0) {
      this.issues.push({
        type: 'build',
        severity: 'error',
        message: `Missing build artifacts: ${missingFiles.join(', ')}`,
        fix: 'runBuild'
      });
    }

    this.log('Build artifacts checked');
  }

  checkAmplifyConfig() {
    this.log('Checking Amplify configuration...');
    
    const amplifyConfigPath = path.join(process.cwd(), 'amplify.yml');
    if (!fs.existsSync(amplifyConfigPath)) {
      this.issues.push({
        type: 'amplify',
        severity: 'warning',
        message: 'amplify.yml not found',
        fix: 'createAmplifyConfig'
      });
      return;
    }

    try {
      const configContent = fs.readFileSync(amplifyConfigPath, 'utf8');
      
      // Check for proper build commands
      if (!configContent.includes('npm ci') && !configContent.includes('npm install')) {
        this.issues.push({
          type: 'amplify',
          severity: 'warning',
          message: 'No dependency installation in amplify.yml',
          fix: 'fixAmplifyBuildCommands'
        });
      }

      // Check for build optimization
      if (!configContent.includes('next build') && !configContent.includes('amplify-build-optimizer')) {
        this.issues.push({
          type: 'amplify',
          severity: 'warning',
          message: 'No Next.js build command in amplify.yml',
          fix: 'fixAmplifyBuildCommands'
        });
      }

      this.log('Amplify configuration checked');
    } catch (error) {
      this.issues.push({
        type: 'amplify',
        severity: 'error',
        message: `Cannot read amplify.yml: ${error.message}`,
        fix: 'fixAmplifyConfigSyntax'
      });
    }
  }

  checkEnvironmentVariables() {
    this.log('Checking environment variables...');
    
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXT_PUBLIC_APP_URL'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.issues.push({
        type: 'environment',
        severity: 'error',
        message: `Missing required environment variables: ${missingVars.join(', ')}`,
        fix: 'configureEnvironmentVariables'
      });
    }

    // Check for localhost URLs in production
    if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
      this.issues.push({
        type: 'environment',
        severity: 'error',
        message: 'NEXT_PUBLIC_APP_URL contains localhost in production',
        fix: 'fixProductionUrls'
      });
    }

    this.log('Environment variables checked');
  }

  checkApiRoutes() {
    this.log('Checking API routes structure...');
    
    const apiDir = path.join(process.cwd(), 'app/api');
    if (!fs.existsSync(apiDir)) {
      this.issues.push({
        type: 'api',
        severity: 'error',
        message: 'API routes directory not found',
        fix: 'createApiRoutes'
      });
      return;
    }

    // Check for auth routes
    const authDir = path.join(apiDir, 'auth');
    if (!fs.existsSync(authDir)) {
      this.issues.push({
        type: 'api',
        severity: 'error',
        message: 'Auth API routes not found',
        fix: 'createAuthRoutes'
      });
    } else {
      // Check for specific auth routes
      const requiredAuthRoutes = ['login', 'register'];
      const missingAuthRoutes = requiredAuthRoutes.filter(route => 
        !fs.existsSync(path.join(authDir, route, 'route.ts'))
      );
      
      if (missingAuthRoutes.length > 0) {
        this.issues.push({
          type: 'api',
          severity: 'error',
          message: `Missing auth routes: ${missingAuthRoutes.join(', ')}`,
          fix: 'createMissingAuthRoutes'
        });
      }
    }

    this.log('API routes structure checked');
  }

  checkPackageScripts() {
    this.log('Checking package.json scripts...');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.issues.push({
        type: 'package',
        severity: 'error',
        message: 'package.json not found',
        fix: 'createPackageJson'
      });
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for required scripts
      const requiredScripts = ['build', 'start'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
      
      if (missingScripts.length > 0) {
        this.issues.push({
          type: 'package',
          severity: 'error',
          message: `Missing package.json scripts: ${missingScripts.join(', ')}`,
          fix: 'addRequiredScripts'
        });
      }

      this.log('Package.json scripts checked');
    } catch (error) {
      this.issues.push({
        type: 'package',
        severity: 'error',
        message: `Cannot read package.json: ${error.message}`,
        fix: 'fixPackageJsonSyntax'
      });
    }
  }

  async applyFixes() {
    this.log('🔧 Applying fixes...');
    
    for (const issue of this.issues) {
      if (issue.severity === 'error') {
        await this.applyFix(issue);
      }
    }

    this.log(`Applied ${this.fixes.length} fixes`);
    return this.fixes;
  }

  async applyFix(issue) {
    this.log(`Fixing: ${issue.message}`);
    
    try {
      switch (issue.fix) {
        case 'fixNextConfigExport':
          await this.fixNextConfigExport();
          break;
        case 'runBuild':
          await this.runBuild();
          break;
        case 'createAmplifyConfig':
          await this.createAmplifyConfig();
          break;
        case 'fixAmplifyBuildCommands':
          await this.fixAmplifyBuildCommands();
          break;
        case 'configureEnvironmentVariables':
          await this.configureEnvironmentVariables();
          break;
        case 'fixProductionUrls':
          await this.fixProductionUrls();
          break;
        default:
          this.log(`No fix available for: ${issue.fix}`, 'warning');
      }
    } catch (error) {
      this.log(`Failed to apply fix ${issue.fix}: ${error.message}`, 'error');
    }
  }

  async fixNextConfigExport() {
    const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
    let configContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Fix static export configuration
    configContent = configContent.replace(
      /output:\s*'export'/g,
      "output: isExport ? 'export' : 'standalone'"
    );
    
    // Ensure isExport variable is defined
    if (!configContent.includes('const isExport')) {
      configContent = configContent.replace(
        /import type { NextConfig } from 'next';/,
        `import type { NextConfig } from 'next';\n\nconst isExport = process.env.NEXT_OUTPUT_EXPORT === '1';`
      );
    }
    
    fs.writeFileSync(nextConfigPath, configContent);
    this.fixes.push('Fixed Next.js export configuration');
    this.log('✅ Fixed Next.js export configuration');
  }

  async runBuild() {
    this.log('Running Next.js build...');
    
    try {
      // Clean previous build
      const nextDir = path.join(process.cwd(), '.next');
      if (fs.existsSync(nextDir)) {
        fs.rmSync(nextDir, { recursive: true, force: true });
      }
      
      // Run build
      execSync('npm run build', { stdio: 'inherit' });
      this.fixes.push('Rebuilt application');
      this.log('✅ Build completed successfully');
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async createAmplifyConfig() {
    const amplifyConfig = `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "Installing dependencies..."
        - npm ci --prefer-offline --no-audit
    build:
      commands:
        - echo "Building application..."
        - export NODE_OPTIONS="--max-old-space-size=4096"
        - export SKIP_ENV_VALIDATION=1
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
`;

    fs.writeFileSync(path.join(process.cwd(), 'amplify.yml'), amplifyConfig);
    this.fixes.push('Created amplify.yml configuration');
    this.log('✅ Created amplify.yml configuration');
  }

  async fixAmplifyBuildCommands() {
    const amplifyConfigPath = path.join(process.cwd(), 'amplify.yml');
    let configContent = fs.readFileSync(amplifyConfigPath, 'utf8');
    
    // Ensure proper build commands
    if (!configContent.includes('npm run build')) {
      configContent = configContent.replace(
        /build:\s*\n\s*commands:/,
        `build:
      commands:
        - echo "Building application..."
        - export NODE_OPTIONS="--max-old-space-size=4096"
        - export SKIP_ENV_VALIDATION=1
        - npm run build`
      );
    }
    
    fs.writeFileSync(amplifyConfigPath, configContent);
    this.fixes.push('Fixed Amplify build commands');
    this.log('✅ Fixed Amplify build commands');
  }

  async configureEnvironmentVariables() {
    this.log('Environment variables need to be configured in Amplify Console', 'warning');
    this.log('Go to: Amplify Console > App Settings > Environment Variables', 'info');
    this.log('Required variables:', 'info');
    this.log('- DATABASE_URL: PostgreSQL connection string', 'info');
    this.log('- JWT_SECRET: Random secret key (32+ characters)', 'info');
    this.log('- NEXT_PUBLIC_APP_URL: Your Amplify app URL', 'info');
    
    this.fixes.push('Provided environment variable configuration instructions');
  }

  async fixProductionUrls() {
    this.log('Production URLs need to be updated in Amplify Console', 'warning');
    this.log('Update NEXT_PUBLIC_APP_URL to use your Amplify domain', 'info');
    this.log('Example: https://d2gmcfr71gawhz.amplifyapp.com', 'info');
    
    this.fixes.push('Provided production URL configuration instructions');
  }

  generateFixReport() {
    this.log('=== FIX REPORT ===');
    
    if (this.issues.length === 0) {
      this.log('✅ No issues found - deployment should be working correctly');
      return;
    }

    this.log(`Found ${this.issues.length} issues:`);
    this.issues.forEach((issue, index) => {
      const severity = issue.severity === 'error' ? '🔴' : '🟡';
      this.log(`${index + 1}. ${severity} [${issue.type.toUpperCase()}] ${issue.message}`);
    });

    if (this.fixes.length > 0) {
      this.log(`\nApplied ${this.fixes.length} fixes:`);
      this.fixes.forEach((fix, index) => {
        this.log(`${index + 1}. ✅ ${fix}`);
      });
    }

    // Provide next steps
    this.log('\n=== NEXT STEPS ===');
    this.log('1. Commit and push changes to trigger new Amplify build');
    this.log('2. Check Amplify Console for build logs');
    this.log('3. Verify environment variables are configured');
    this.log('4. Test the deployed application');
  }

  async run() {
    try {
      this.log('🚀 Starting Amplify deployment fix...');
      
      await this.diagnoseIssues();
      await this.applyFixes();
      this.generateFixReport();
      
      this.log('🎉 Amplify deployment fix completed!');
      return true;
      
    } catch (error) {
      this.log(`Deployment fix failed: ${error.message}`, 'error');
      return false;
    }
  }
}

// Run fixer if this script is executed directly
if (require.main === module) {
  const fixer = new AmplifyDeploymentFixer();
  fixer.run().catch(error => {
    console.error('Deployment fix failed:', error);
    process.exit(1);
  });
}

module.exports = AmplifyDeploymentFixer;