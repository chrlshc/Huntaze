#!/usr/bin/env node

/**
 * Pre-commit Validation Script for Amplify Environment Variables
 * Validates configuration files before they are committed to Git
 */

const { ValidationEngine } = require('../../lib/amplify-env-vars/validationEngine');
const { logger } = require('../../lib/amplify-env-vars/logger');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PreCommitValidator {
  constructor() {
    this.validator = new ValidationEngine();
    this.configDir = 'config/amplify-env-vars';
  }

  /**
   * Get list of staged configuration files
   */
  getStagedConfigFiles() {
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return output
        .split('\n')
        .filter(file => file.startsWith(this.configDir) && file.length > 0)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'));
    } catch (error) {
      logger.error('Failed to get staged files:', error);
      return [];
    }
  }

  /**
   * Validate a single configuration file
   */
  async validateConfigFile(filePath) {
    try {
      console.log(`   Validating ${filePath}...`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  File ${filePath} was deleted`);
        return true; // Allow deletion
      }

      // Validate file format and content
      const result = await this.validator.validateFile(filePath);
      
      if (result.isValid) {
        console.log(`   ✅ ${filePath} - Valid`);
        return true;
      } else {
        console.log(`   ❌ ${filePath} - Invalid`);
        result.errors.forEach(error => {
          console.log(`      - ${error.message}`);
        });
        return false;
      }
    } catch (error) {
      console.log(`   ❌ ${filePath} - Validation error: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for sensitive data in configuration files
   */
  checkForSensitiveData(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const sensitivePatterns = [
        /password:\s*["']?[^"'\s]+["']?/i,
        /secret:\s*["']?[^"'\s]+["']?/i,
        /key:\s*["']?sk-[a-zA-Z0-9]{48}["']?/i,
        /token:\s*["']?[^"'\s]+["']?/i,
        /api_key:\s*["']?[^"'\s]+["']?/i
      ];

      const violations = [];
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(line) && !line.includes('your-') && !line.includes('example-')) {
            violations.push({
              line: index + 1,
              content: line.trim(),
              type: 'Potential sensitive data'
            });
          }
        });
      });

      return violations;
    } catch (error) {
      logger.error(`Failed to check sensitive data in ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Validate commit message format
   */
  validateCommitMessage() {
    try {
      // Get commit message from Git
      const commitMessage = execSync('git log --format=%B -n 1 HEAD', { encoding: 'utf8' }).trim();
      
      // Check if commit message follows conventional format for config changes
      const configChangePattern = /^(config|feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/;
      
      if (!configChangePattern.test(commitMessage)) {
        console.log('⚠️  Commit message should follow conventional format:');
        console.log('   config: description of configuration change');
        console.log('   feat(env): add new environment variables');
        console.log('   fix(config): correct database URL format');
        return false;
      }

      return true;
    } catch (error) {
      // If we can't get the commit message, don't fail the validation
      logger.warn('Could not validate commit message:', error.message);
      return true;
    }
  }

  /**
   * Run all pre-commit validations
   */
  async runValidation() {
    console.log('🔍 Running pre-commit validation for Amplify environment variables...\n');

    const stagedFiles = this.getStagedConfigFiles();
    
    if (stagedFiles.length === 0) {
      console.log('ℹ️  No configuration files staged for commit');
      return true;
    }

    console.log(`📋 Found ${stagedFiles.length} configuration file(s) to validate:\n`);

    let allValid = true;
    const sensitiveDataViolations = [];

    // Validate each staged file
    for (const file of stagedFiles) {
      const isValid = await this.validateConfigFile(file);
      if (!isValid) {
        allValid = false;
      }

      // Check for sensitive data
      const violations = this.checkForSensitiveData(file);
      if (violations.length > 0) {
        sensitiveDataViolations.push({ file, violations });
      }
    }

    // Report sensitive data violations
    if (sensitiveDataViolations.length > 0) {
      console.log('\n⚠️  Potential sensitive data detected:');
      sensitiveDataViolations.forEach(({ file, violations }) => {
        console.log(`\n   ${file}:`);
        violations.forEach(violation => {
          console.log(`     Line ${violation.line}: ${violation.content}`);
        });
      });
      console.log('\n   Please ensure no real credentials are committed to version control.');
      console.log('   Use placeholder values like "your-api-key" or "example-secret".');
      allValid = false;
    }

    // Validate commit message format
    const commitMessageValid = this.validateCommitMessage();
    if (!commitMessageValid) {
      allValid = false;
    }

    console.log('\n' + '='.repeat(60));
    
    if (allValid) {
      console.log('✅ All validations passed! Commit can proceed.');
      return true;
    } else {
      console.log('❌ Validation failed! Please fix the issues above before committing.');
      console.log('\nTips:');
      console.log('- Use configuration templates from config/amplify-env-vars/');
      console.log('- Validate files manually: node scripts/amplify-env-vars/validate-env-vars.js <file>');
      console.log('- Check documentation: config/amplify-env-vars/README.md');
      return false;
    }
  }
}

// Main execution
async function main() {
  const validator = new PreCommitValidator();
  
  try {
    const isValid = await validator.runValidation();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Pre-commit validation failed with error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PreCommitValidator };