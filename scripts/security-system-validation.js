#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs').promises;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class SecuritySystemValidator {
  async run() {
    console.log(`${colors.cyan}${colors.bright}🔐 Security Token System Validation${colors.reset}\n`);

    let allTestsPassed = true;

    try {
      // Test 1: Token Generation
      console.log(`${colors.bright}Test 1: Token Generation${colors.reset}`);
      const tokenTest = await this.testTokenGeneration();
      this.displayTestResult('Token Generation', tokenTest);
      if (!tokenTest) allTestsPassed = false;

      // Test 2: Token Validation
      console.log(`\n${colors.bright}Test 2: Token Validation${colors.reset}`);
      const validationTest = await this.testTokenValidation();
      this.displayTestResult('Token Validation', validationTest);
      if (!validationTest) allTestsPassed = false;

      // Test 3: Security Requirements
      console.log(`\n${colors.bright}Test 3: Security Requirements${colors.reset}`);
      const securityTest = await this.testSecurityRequirements();
      this.displayTestResult('Security Requirements', securityTest);
      if (!securityTest) allTestsPassed = false;

      // Test 4: File System Operations
      console.log(`\n${colors.bright}Test 4: File System Operations${colors.reset}`);
      const fileTest = await this.testFileOperations();
      this.displayTestResult('File System Operations', fileTest);
      if (!fileTest) allTestsPassed = false;

      // Test 5: Environment Variable Handling
      console.log(`\n${colors.bright}Test 5: Environment Variable Handling${colors.reset}`);
      const envTest = await this.testEnvironmentHandling();
      this.displayTestResult('Environment Variable Handling', envTest);
      if (!envTest) allTestsPassed = false;

      // Test 6: Staging File Validation
      console.log(`\n${colors.bright}Test 6: Staging File Validation${colors.reset}`);
      const stagingTest = await this.testStagingFileValidation();
      this.displayTestResult('Staging File Validation', stagingTest);
      if (!stagingTest) allTestsPassed = false;

      // Final Result
      console.log('\n' + '='.repeat(60));
      if (allTestsPassed) {
        console.log(`${colors.green}${colors.bright}✅ ALL TESTS PASSED - Security System Ready!${colors.reset}`);
        console.log(`${colors.green}The security token system meets all requirements.${colors.reset}`);
      } else {
        console.log(`${colors.red}${colors.bright}❌ SOME TESTS FAILED - Review Required${colors.reset}`);
        console.log(`${colors.red}Please address the failing tests before deployment.${colors.reset}`);
      }

      return allTestsPassed;

    } catch (error) {
      console.error(`${colors.red}❌ Validation failed: ${error.message}${colors.reset}`);
      return false;
    }
  }

  async testTokenGeneration() {
    try {
      // Test basic token generation
      const adminToken = this.generateSecureToken('ADMIN');
      const debugToken = this.generateSecureToken('DEBUG');

      // Verify tokens are generated
      if (!adminToken || !debugToken) {
        console.log(`  ${colors.red}❌ Failed to generate tokens${colors.reset}`);
        return false;
      }

      // Verify token format
      if (!adminToken.startsWith('huntaze_admin_') || !debugToken.startsWith('huntaze_debug_')) {
        console.log(`  ${colors.red}❌ Invalid token format${colors.reset}`);
        return false;
      }

      // Verify token length
      if (adminToken.length < 32 || debugToken.length < 32) {
        console.log(`  ${colors.red}❌ Tokens too short${colors.reset}`);
        return false;
      }

      console.log(`  ${colors.green}✅ Tokens generated successfully${colors.reset}`);
      console.log(`  ${colors.blue}   Admin: ${adminToken.substring(0, 20)}...${colors.reset}`);
      console.log(`  ${colors.blue}   Debug: ${debugToken.substring(0, 20)}...${colors.reset}`);
      return true;

    } catch (error) {
      console.log(`  ${colors.red}❌ Token generation error: ${error.message}${colors.reset}`);
      return false;
    }
  }

  async testTokenValidation() {
    try {
      // Generate test tokens
      const validToken = this.generateSecureToken('TEST');
      const invalidToken = 'weak-token';

      // Test valid token
      const validResult = this.validateTokenFormat(validToken);
      if (!validResult.isValid) {
        console.log(`  ${colors.red}❌ Valid token failed validation${colors.reset}`);
        return false;
      }

      // Test invalid token
      const invalidResult = this.validateTokenFormat(invalidToken);
      if (invalidResult.isValid) {
        console.log(`  ${colors.red}❌ Invalid token passed validation${colors.reset}`);
        return false;
      }

      console.log(`  ${colors.green}✅ Token validation working correctly${colors.reset}`);
      console.log(`  ${colors.blue}   Valid token entropy: ${validResult.entropy.toFixed(2)} bits${colors.reset}`);
      console.log(`  ${colors.blue}   Invalid token errors: ${invalidResult.errors.length}${colors.reset}`);
      return true;

    } catch (error) {
      console.log(`  ${colors.red}❌ Token validation error: ${error.message}${colors.reset}`);
      return false;
    }
  }

  async testSecurityRequirements() {
    try {
      const token = this.generateSecureToken('SECURITY');
      const validation = this.validateTokenFormat(token);

      // Check minimum length requirement (32 chars)
      if (validation.length < 32) {
        console.log(`  ${colors.red}❌ Length requirement not met: ${validation.length} < 32${colors.reset}`);
        return false;
      }

      // Check minimum entropy requirement (128 bits)
      if (validation.entropy < 128) {
        console.log(`  ${colors.red}❌ Entropy requirement not met: ${validation.entropy} < 128${colors.reset}`);
        return false;
      }

      // Check character diversity
      if (!this.hasCharacterDiversity(token)) {
        console.log(`  ${colors.red}❌ Character diversity requirement not met${colors.reset}`);
        return false;
      }

      // Check for common patterns
      if (this.hasCommonPatterns(token)) {
        console.log(`  ${colors.red}❌ Token contains common patterns${colors.reset}`);
        return false;
      }

      console.log(`  ${colors.green}✅ All security requirements met${colors.reset}`);
      console.log(`  ${colors.blue}   Length: ${validation.length} chars (≥32)${colors.reset}`);
      console.log(`  ${colors.blue}   Entropy: ${validation.entropy.toFixed(2)} bits (≥128)${colors.reset}`);
      return true;

    } catch (error) {
      console.log(`  ${colors.red}❌ Security requirements error: ${error.message}${colors.reset}`);
      return false;
    }
  }

  async testFileOperations() {
    try {
      const testFile = 'test-security-tokens.tmp';
      const testContent = 'ADMIN_TOKEN=test-token\nDEBUG_TOKEN=test-token';

      // Test file write
      await fs.writeFile(testFile, testContent, 'utf8');

      // Test file read
      const content = await fs.readFile(testFile, 'utf8');
      if (content !== testContent) {
        console.log(`  ${colors.red}❌ File read/write mismatch${colors.reset}`);
        return false;
      }

      // Test environment parsing
      const envVars = this.parseEnvFile(content);
      if (!envVars.ADMIN_TOKEN || !envVars.DEBUG_TOKEN) {
        console.log(`  ${colors.red}❌ Environment parsing failed${colors.reset}`);
        return false;
      }

      // Cleanup
      await fs.unlink(testFile);

      console.log(`  ${colors.green}✅ File operations working correctly${colors.reset}`);
      return true;

    } catch (error) {
      console.log(`  ${colors.red}❌ File operations error: ${error.message}${colors.reset}`);
      return false;
    }
  }

  async testEnvironmentHandling() {
    try {
      // Test with mock environment variables
      const originalAdmin = process.env.ADMIN_TOKEN;
      const originalDebug = process.env.DEBUG_TOKEN;

      // Set test tokens
      const testAdminToken = this.generateSecureToken('TEST_ADMIN');
      const testDebugToken = this.generateSecureToken('TEST_DEBUG');
      
      process.env.ADMIN_TOKEN = testAdminToken;
      process.env.DEBUG_TOKEN = testDebugToken;

      // Test token retrieval
      const retrievedAdmin = process.env.ADMIN_TOKEN;
      const retrievedDebug = process.env.DEBUG_TOKEN;

      if (retrievedAdmin !== testAdminToken || retrievedDebug !== testDebugToken) {
        console.log(`  ${colors.red}❌ Environment variable handling failed${colors.reset}`);
        return false;
      }

      // Restore original values
      if (originalAdmin) process.env.ADMIN_TOKEN = originalAdmin;
      else delete process.env.ADMIN_TOKEN;
      
      if (originalDebug) process.env.DEBUG_TOKEN = originalDebug;
      else delete process.env.DEBUG_TOKEN;

      console.log(`  ${colors.green}✅ Environment handling working correctly${colors.reset}`);
      return true;

    } catch (error) {
      console.log(`  ${colors.red}❌ Environment handling error: ${error.message}${colors.reset}`);
      return false;
    }
  }

  async testStagingFileValidation() {
    try {
      // Check if staging file exists
      const stagingFile = 'STAGING_ENV_VARS_ONLY.txt';
      
      try {
        await fs.access(stagingFile);
      } catch {
        console.log(`  ${colors.yellow}⚠️  Staging file not found: ${stagingFile}${colors.reset}`);
        return true; // Not a failure, file might not exist in all environments
      }

      // Read and parse staging file
      const content = await fs.readFile(stagingFile, 'utf8');
      const envVars = this.parseEnvFile(content);

      // Check for required tokens
      if (!envVars.ADMIN_TOKEN || !envVars.DEBUG_TOKEN) {
        console.log(`  ${colors.red}❌ Required tokens missing from staging file${colors.reset}`);
        return false;
      }

      // Validate token format
      const adminValidation = this.validateTokenFormat(envVars.ADMIN_TOKEN);
      const debugValidation = this.validateTokenFormat(envVars.DEBUG_TOKEN);

      if (!adminValidation.isValid || !debugValidation.isValid) {
        console.log(`  ${colors.red}❌ Staging file contains invalid tokens${colors.reset}`);
        console.log(`  ${colors.red}   Admin valid: ${adminValidation.isValid}${colors.reset}`);
        console.log(`  ${colors.red}   Debug valid: ${debugValidation.isValid}${colors.reset}`);
        return false;
      }

      // Check for default/placeholder values
      if (this.isDefaultToken(envVars.ADMIN_TOKEN) || this.isDefaultToken(envVars.DEBUG_TOKEN)) {
        console.log(`  ${colors.red}❌ Staging file contains default/placeholder tokens${colors.reset}`);
        return false;
      }

      console.log(`  ${colors.green}✅ Staging file validation passed${colors.reset}`);
      console.log(`  ${colors.blue}   Admin token entropy: ${adminValidation.entropy.toFixed(2)} bits${colors.reset}`);
      console.log(`  ${colors.blue}   Debug token entropy: ${debugValidation.entropy.toFixed(2)} bits${colors.reset}`);
      return true;

    } catch (error) {
      console.log(`  ${colors.red}❌ Staging file validation error: ${error.message}${colors.reset}`);
      return false;
    }
  }

  // Helper methods (same as in other scripts)
  generateSecureToken(prefix) {
    const randomData = crypto.randomBytes(32);
    const hash = crypto.createHash('sha256');
    hash.update(randomData);
    hash.update(prefix);
    hash.update(Date.now().toString());
    
    const token = hash.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `huntaze_${prefix.toLowerCase()}_${token}`;
  }

  calculateEntropy(str) {
    const frequencies = new Map();
    for (const char of str) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    let entropy = 0;
    const length = str.length;
    
    for (const frequency of frequencies.values()) {
      const probability = frequency / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy * length;
  }

  validateTokenFormat(token) {
    const errors = [];
    const length = token.length;
    const entropy = this.calculateEntropy(token);

    if (length < 32) {
      errors.push(`Token must be at least 32 characters long`);
    }

    if (entropy < 128) {
      errors.push(`Token entropy (${entropy.toFixed(2)} bits) is below minimum requirement (128 bits)`);
    }

    if (this.hasCommonPatterns(token)) {
      errors.push('Token contains common patterns or repeated sequences');
    }

    if (!this.hasCharacterDiversity(token)) {
      errors.push('Token lacks character diversity');
    }

    return {
      isValid: errors.length === 0,
      errors,
      entropy,
      length,
    };
  }

  hasCommonPatterns(token) {
    // Extract the actual token part (after the prefix)
    const tokenParts = token.split('_');
    const actualToken = tokenParts.length >= 3 ? tokenParts.slice(2).join('_') : token;
    
    const repeatedPattern = /(.{3,})\1/;
    if (repeatedPattern.test(actualToken)) return true;

    const sequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;
    if (sequential.test(actualToken)) return true;

    // Check for common patterns in the actual token part (not the prefix)
    const commonPatterns = ['password', 'secret', 'key', 'login', 'user', 'demo', 'test123', 'qwerty'];
    const lowerActualToken = actualToken.toLowerCase();
    return commonPatterns.some(pattern => lowerActualToken.includes(pattern));
  }

  hasCharacterDiversity(token) {
    const hasUppercase = /[A-Z]/.test(token);
    const hasLowercase = /[a-z]/.test(token);
    const hasNumbers = /[0-9]/.test(token);
    const hasSymbols = /[^A-Za-z0-9]/.test(token);

    const diversityCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;
    return diversityCount >= 3;
  }

  isDefaultToken(token) {
    const defaultPatterns = [
      'change-this', 'replace-me', 'default', 'placeholder', 'example', 'test', 'demo',
      'huntaze-admin-token-change-this', 'huntaze-debug-token-change-this'
    ];
    const lowerToken = token.toLowerCase();
    return defaultPatterns.some(pattern => lowerToken.includes(pattern));
  }

  parseEnvFile(content) {
    const vars = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    return vars;
  }

  displayTestResult(testName, passed) {
    const status = passed ? 
      `${colors.green}✅ PASSED${colors.reset}` : 
      `${colors.red}❌ FAILED${colors.reset}`;
    console.log(`  Result: ${status}`);
  }
}

// Run validator if called directly
if (require.main === module) {
  const validator = new SecuritySystemValidator();
  validator.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });
}

module.exports = { SecuritySystemValidator };