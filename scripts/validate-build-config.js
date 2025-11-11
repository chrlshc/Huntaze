#!/usr/bin/env node

/**
 * Pre-build validator for Next.js standalone builds
 * Validates configuration compatibility and route group structure
 * Requirements: 4.1, 4.2
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class BuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(`✗ ERROR: ${message}`, colors.red);
  }

  warning(message) {
    this.warnings.push(message);
    this.log(`⚠ WARNING: ${message}`, colors.yellow);
  }

  success(message) {
    this.log(`✓ ${message}`, colors.green);
  }

  info(message) {
    this.log(`ℹ ${message}`, colors.cyan);
  }

  suggest(message) {
    this.suggestions.push(message);
    this.log(`💡 SUGGESTION: ${message}`, colors.blue);
  }

  /**
   * Validate Next.js configuration file
   */
  validateNextConfig() {
    this.info('Validating Next.js configuration...');
    
    const configPath = path.join(process.cwd(), 'next.config.ts');
    
    if (!fs.existsSync(configPath)) {
      this.error('next.config.ts not found');
      return false;
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      
      // Check for standalone output
      if (!configContent.includes("output: 'standalone'") && 
          !configContent.includes('output: "standalone"')) {
        this.warning('Standalone output mode not detected in config');
        this.suggest('Add "output: \'standalone\'" to next.config.ts for deployment');
      } else {
        this.success('Standalone output mode configured');
      }

      // Check for outputFileTracingRoot
      if (configContent.includes('outputFileTracingRoot')) {
        this.success('File tracing root configured');
      } else {
        this.warning('outputFileTracingRoot not configured');
        this.suggest('Add "outputFileTracingRoot: process.cwd()" to help with route group file tracing');
      }

      // Check for experimental features that might conflict
      if (configContent.includes('experimental:')) {
        this.info('Experimental features detected - reviewing...');
        
        if (configContent.includes('outputFileTracingIncludes')) {
          this.success('Custom file tracing includes configured');
        }
      }

      // Check for webpack configuration
      if (configContent.includes('webpack:')) {
        this.success('Custom webpack configuration detected');
      }

      return true;
    } catch (error) {
      this.error(`Failed to read next.config.ts: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate route group structure in app directory
   */
  validateRouteGroups() {
    this.info('Validating route group structure...');
    
    const appDir = path.join(process.cwd(), 'app');
    
    if (!fs.existsSync(appDir)) {
      this.error('app directory not found');
      return false;
    }

    const routeGroups = this.findRouteGroups(appDir);
    
    if (routeGroups.length === 0) {
      this.info('No route groups found');
      return true;
    }

    this.info(`Found ${routeGroups.length} route group(s)`);
    
    routeGroups.forEach(group => {
      this.info(`  - ${group.name} (${group.path})`);
      
      // Check for client components in route groups
      const clientComponents = this.findClientComponents(group.fullPath);
      
      if (clientComponents.length > 0) {
        this.warning(`Route group "${group.name}" contains ${clientComponents.length} client component(s)`);
        clientComponents.forEach(comp => {
          this.info(`    - ${comp}`);
        });
        this.suggest(`Ensure client reference manifests are properly generated for "${group.name}"`);
      }
    });

    return true;
  }

  /**
   * Find all route groups in a directory
   */
  findRouteGroups(dir, basePath = '') {
    const routeGroups = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const name = entry.name;
          
          // Route groups are wrapped in parentheses
          if (name.startsWith('(') && name.endsWith(')')) {
            const fullPath = path.join(dir, name);
            const relativePath = path.join(basePath, name);
            
            routeGroups.push({
              name,
              path: relativePath,
              fullPath,
            });
          }
          
          // Recursively search subdirectories
          const subPath = path.join(dir, name);
          const subGroups = this.findRouteGroups(subPath, path.join(basePath, name));
          routeGroups.push(...subGroups);
        }
      }
    } catch (error) {
      this.warning(`Failed to read directory ${dir}: ${error.message}`);
    }
    
    return routeGroups;
  }

  /**
   * Find client components in a directory
   */
  findClientComponents(dir) {
    const clientComponents = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
          const filePath = path.join(dir, entry.name);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Check for 'use client' directive
          if (content.includes("'use client'") || content.includes('"use client"')) {
            clientComponents.push(entry.name);
          }
        } else if (entry.isDirectory()) {
          const subPath = path.join(dir, entry.name);
          const subComponents = this.findClientComponents(subPath);
          clientComponents.push(...subComponents.map(c => `${entry.name}/${c}`));
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
    
    return clientComponents;
  }

  /**
   * Check Node.js and npm versions
   */
  validateEnvironment() {
    this.info('Validating build environment...');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      this.error(`Node.js ${nodeVersion} is too old. Next.js 15 requires Node.js 18.17 or higher`);
    } else {
      this.success(`Node.js ${nodeVersion} is compatible`);
    }

    // Check for package.json
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        
        if (pkg.dependencies && pkg.dependencies.next) {
          this.success(`Next.js version: ${pkg.dependencies.next}`);
        }
        
        // Check for required dependencies
        const requiredDeps = ['react', 'react-dom'];
        requiredDeps.forEach(dep => {
          if (pkg.dependencies && pkg.dependencies[dep]) {
            this.success(`${dep} installed`);
          } else {
            this.error(`Missing required dependency: ${dep}`);
          }
        });
      } catch (error) {
        this.warning(`Failed to parse package.json: ${error.message}`);
      }
    } else {
      this.error('package.json not found');
    }
  }

  /**
   * Run all validations
   */
  async validate() {
    this.log('\n🔍 Next.js Build Configuration Validator\n', colors.cyan);
    
    this.validateEnvironment();
    this.log('');
    
    this.validateNextConfig();
    this.log('');
    
    this.validateRouteGroups();
    this.log('');
    
    // Summary
    this.log('═'.repeat(60), colors.cyan);
    this.log('VALIDATION SUMMARY', colors.cyan);
    this.log('═'.repeat(60), colors.cyan);
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('\n✓ All checks passed! Build configuration looks good.\n', colors.green);
      return true;
    }
    
    if (this.errors.length > 0) {
      this.log(`\n✗ ${this.errors.length} error(s) found:\n`, colors.red);
      this.errors.forEach((err, i) => {
        this.log(`  ${i + 1}. ${err}`, colors.red);
      });
    }
    
    if (this.warnings.length > 0) {
      this.log(`\n⚠ ${this.warnings.length} warning(s):\n`, colors.yellow);
      this.warnings.forEach((warn, i) => {
        this.log(`  ${i + 1}. ${warn}`, colors.yellow);
      });
    }
    
    if (this.suggestions.length > 0) {
      this.log(`\n💡 ${this.suggestions.length} suggestion(s):\n`, colors.blue);
      this.suggestions.forEach((sug, i) => {
        this.log(`  ${i + 1}. ${sug}`, colors.blue);
      });
    }
    
    this.log('');
    
    if (this.errors.length > 0) {
      this.log('❌ Build validation failed. Please fix the errors above before building.\n', colors.red);
      return false;
    }
    
    this.log('⚠️  Build validation passed with warnings. Review suggestions above.\n', colors.yellow);
    return true;
  }
}

// Run validator if called directly
if (require.main === module) {
  const validator = new BuildValidator();
  
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = BuildValidator;
