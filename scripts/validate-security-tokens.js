#!/usr/bin/env node

const { securityTokenService } = require('../lib/security/securityTokenService');
const { securityTokenGenerator } = require('../lib/security/securityTokenGenerator');

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

class SecurityTokenValidator {
  async run() {
    console.log(`${colors.cyan}${colors.bright}🔍 Security Token Validation Report${colors.reset}\n`);

    try {
      // 1. Validate current production tokens
      await this.validateCurrentTokens();
      
      // 2. Check if rotation is needed
      await this.checkRotationNeeds();
      
      // 3. Audit configuration
      await this.auditConfiguration();
      
      // 4. Get overall health status
      await this.getHealthStatus();
      
      // 5. Test token generation
      await this.testTokenGeneration();

    } catch (error) {
      console.error(`${colors.red}❌ Validation failed: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  async validateCurrentTokens() {
    console.log(`${colors.bright}📋 Current Token Validation${colors.reset}`);
    console.log('─'.repeat(50));

    const validation = await securityTokenService.validateProductionTokens();

    // Admin token status
    console.log(`\n${colors.bright}Admin Token:${colors.reset}`);
    this.displayTokenValidation(validation.adminToken);

    // Debug token status
    console.log(`\n${colors.bright}Debug Token:${colors.reset}`);
    this.displayTokenValidation(validation.debugToken);

    // Overall status
    console.log(`\n${colors.bright}Overall Status:${colors.reset}`);
    if (validation.isValid) {
      console.log(`${colors.green}✅ All tokens are valid${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Token validation failed${colors.reset}`);
    }

    console.log(`${colors.bright}Security Score:${colors.reset} ${this.getScoreColor(validation.securityScore)}${validation.securityScore}/100${colors.reset}`);

    if (validation.recommendations.length > 0) {
      console.log(`\n${colors.bright}Recommendations:${colors.reset}`);
      validation.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
  }

  async checkRotationNeeds() {
    console.log(`\n\n${colors.bright}🔄 Token Rotation Assessment${colors.reset}`);
    console.log('─'.repeat(50));

    const rotationCheck = await securityTokenService.shouldRotateTokens();

    console.log(`${colors.bright}Should Rotate:${colors.reset} ${rotationCheck.shouldRotate ? 
      `${colors.red}Yes${colors.reset}` : 
      `${colors.green}No${colors.reset}`}`);
    
    console.log(`${colors.bright}Urgency:${colors.reset} ${this.getUrgencyColor(rotationCheck.urgency)}${rotationCheck.urgency.toUpperCase()}${colors.reset}`);

    if (rotationCheck.reasons.length > 0) {
      console.log(`\n${colors.bright}Reasons:${colors.reset}`);
      rotationCheck.reasons.forEach(reason => {
        console.log(`  • ${colors.yellow}${reason}${colors.reset}`);
      });
    }
  }

  async auditConfiguration() {
    console.log(`\n\n${colors.bright}⚙️  Configuration Audit${colors.reset}`);
    console.log('─'.repeat(50));

    const audit = await securityTokenService.auditTokenConfiguration();

    // Environment variables
    console.log(`\n${colors.bright}Environment Variables:${colors.reset}`);
    console.log(`  ADMIN_TOKEN: ${audit.environmentVariables.adminTokenSet ? 
      `${colors.green}✅ Set${colors.reset}` : 
      `${colors.red}❌ Missing${colors.reset}`}`);
    console.log(`  DEBUG_TOKEN: ${audit.environmentVariables.debugTokenSet ? 
      `${colors.green}✅ Set${colors.reset}` : 
      `${colors.red}❌ Missing${colors.reset}`}`);
    console.log(`  TOKEN_ENCRYPTION_KEY: ${audit.environmentVariables.encryptionKeySet ? 
      `${colors.green}✅ Set${colors.reset}` : 
      `${colors.red}❌ Missing${colors.reset}`}`);

    // Backup status
    console.log(`\n${colors.bright}Backup Status:${colors.reset}`);
    console.log(`  Has Backups: ${audit.backupStatus.hasBackups ? 
      `${colors.green}✅ Yes${colors.reset}` : 
      `${colors.red}❌ No${colors.reset}`}`);
    console.log(`  Backup Count: ${audit.backupStatus.backupCount}`);
    if (audit.backupStatus.lastBackup) {
      console.log(`  Last Backup: ${audit.backupStatus.lastBackup.toISOString()}`);
    }

    // Configuration issues
    if (audit.configurationIssues.length > 0) {
      console.log(`\n${colors.bright}Configuration Issues:${colors.reset}`);
      audit.configurationIssues.forEach(issue => {
        console.log(`  • ${colors.red}${issue}${colors.reset}`);
      });
    }
  }

  async getHealthStatus() {
    console.log(`\n\n${colors.bright}🏥 Security Health Status${colors.reset}`);
    console.log('─'.repeat(50));

    const health = await securityTokenService.getSecurityHealthStatus();

    console.log(`${colors.bright}Status:${colors.reset} ${this.getHealthColor(health.status)}${health.status.toUpperCase()}${colors.reset}`);
    console.log(`${colors.bright}Score:${colors.reset} ${this.getScoreColor(health.score)}${health.score}/100${colors.reset}`);

    if (health.issues.length > 0) {
      console.log(`\n${colors.bright}Issues:${colors.reset}`);
      health.issues.forEach(issue => {
        console.log(`  • ${colors.yellow}${issue}${colors.reset}`);
      });
    }

    if (health.recommendations.length > 0) {
      console.log(`\n${colors.bright}Recommendations:${colors.reset}`);
      health.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
  }

  async testTokenGeneration() {
    console.log(`\n\n${colors.bright}🧪 Token Generation Test${colors.reset}`);
    console.log('─'.repeat(50));

    try {
      // Test token generation
      const tokens = securityTokenGenerator.generateSecurityTokens();
      
      console.log(`${colors.green}✅ Token generation successful${colors.reset}`);
      console.log(`Admin Token Length: ${tokens.adminToken.length}`);
      console.log(`Debug Token Length: ${tokens.debugToken.length}`);
      console.log(`Entropy: ${tokens.entropy.toFixed(2)} bits`);

      // Test validation
      const validation = securityTokenGenerator.validateExistingTokens(
        tokens.adminToken,
        tokens.debugToken
      );

      console.log(`Validation Result: ${validation.overall ? 
        `${colors.green}✅ Valid${colors.reset}` : 
        `${colors.red}❌ Invalid${colors.reset}`}`);

    } catch (error) {
      console.log(`${colors.red}❌ Token generation failed: ${error.message}${colors.reset}`);
    }
  }

  displayTokenValidation(validation) {
    if (validation.isValid) {
      console.log(`  Status: ${colors.green}✅ Valid${colors.reset}`);
      console.log(`  Length: ${validation.length} characters`);
      console.log(`  Entropy: ${validation.entropy.toFixed(2)} bits`);
    } else {
      console.log(`  Status: ${colors.red}❌ Invalid${colors.reset}`);
      validation.errors.forEach(error => {
        console.log(`    • ${colors.red}${error}${colors.reset}`);
      });
    }
  }

  getScoreColor(score) {
    if (score >= 80) return colors.green;
    if (score >= 60) return colors.yellow;
    return colors.red;
  }

  getUrgencyColor(urgency) {
    switch (urgency) {
      case 'critical': return colors.red;
      case 'high': return colors.red;
      case 'medium': return colors.yellow;
      case 'low': return colors.green;
      default: return colors.reset;
    }
  }

  getHealthColor(status) {
    switch (status) {
      case 'healthy': return colors.green;
      case 'warning': return colors.yellow;
      case 'critical': return colors.red;
      default: return colors.reset;
    }
  }
}

// Run validator if called directly
if (require.main === module) {
  const validator = new SecurityTokenValidator();
  validator.run().catch(console.error);
}

module.exports = { SecurityTokenValidator };