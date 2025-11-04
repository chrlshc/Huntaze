#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

class StagingTokenUpdater {
  constructor() {
    this.stagingFile = 'STAGING_ENV_VARS_ONLY.txt';
  }

  async run() {
    console.log(`${colors.cyan}${colors.bright}🔐 Updating Staging Environment Tokens${colors.reset}\n`);

    try {
      // Generate new secure tokens
      const tokens = this.generateSecureTokens();
      
      // Display new tokens
      this.displayTokens(tokens);
      
      // Update staging file
      await this.updateStagingFile(tokens);
      
      console.log(`\n${colors.green}✅ Staging tokens updated successfully!${colors.reset}`);
      console.log(`${colors.yellow}⚠️  Remember to deploy these changes to AWS Amplify${colors.reset}`);
      
    } catch (error) {
      console.error(`${colors.red}❌ Failed to update staging tokens: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  generateSecureTokens() {
    const adminToken = this.generateSecureToken('ADMIN');
    const debugToken = this.generateSecureToken('DEBUG');
    
    return {
      adminToken,
      debugToken,
      generatedAt: new Date(),
    };
  }

  generateSecureToken(prefix) {
    // Generate 32 bytes of random data (256 bits)
    const randomData = crypto.randomBytes(32);
    
    // Create a hash for additional entropy mixing
    const hash = crypto.createHash('sha256');
    hash.update(randomData);
    hash.update(prefix);
    hash.update(Date.now().toString());
    
    // Convert to base64 and clean up for URL safety
    const token = hash.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Add prefix for identification
    return `huntaze_${prefix.toLowerCase()}_${token}`;
  }

  displayTokens(tokens) {
    console.log('🔑 Generated New Security Tokens:');
    console.log('─'.repeat(60));
    console.log(`${colors.bright}Admin Token:${colors.reset}`);
    console.log(`${colors.green}${tokens.adminToken}${colors.reset}`);
    console.log(`\n${colors.bright}Debug Token:${colors.reset}`);
    console.log(`${colors.green}${tokens.debugToken}${colors.reset}`);
    console.log(`\n${colors.bright}Generated:${colors.reset} ${tokens.generatedAt.toISOString()}`);
    console.log(`${colors.bright}Admin Token Length:${colors.reset} ${tokens.adminToken.length} characters`);
    console.log(`${colors.bright}Debug Token Length:${colors.reset} ${tokens.debugToken.length} characters`);
  }

  async updateStagingFile(tokens) {
    try {
      // Read current staging file
      const content = await fs.readFile(this.stagingFile, 'utf8');
      
      // Update token values
      let updatedContent = content;
      updatedContent = this.updateEnvVariable(updatedContent, 'ADMIN_TOKEN', tokens.adminToken);
      updatedContent = this.updateEnvVariable(updatedContent, 'DEBUG_TOKEN', tokens.debugToken);
      
      // Create backup of original file
      const backupFile = `${this.stagingFile}.backup.${Date.now()}`;
      await fs.writeFile(backupFile, content, 'utf8');
      console.log(`\n${colors.yellow}📄 Backup created: ${backupFile}${colors.reset}`);
      
      // Write updated content
      await fs.writeFile(this.stagingFile, updatedContent, 'utf8');
      console.log(`${colors.green}📄 Updated: ${this.stagingFile}${colors.reset}`);
      
      // Verify the update
      await this.verifyUpdate(tokens);
      
    } catch (error) {
      throw new Error(`Failed to update staging file: ${error.message}`);
    }
  }

  updateEnvVariable(content, key, value) {
    const lines = content.split('\n');
    let found = false;
    
    // Update existing variable
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith(`${key}=`)) {
        lines[i] = `${key}=${value}`;
        found = true;
        break;
      }
    }
    
    // Add new variable if not found
    if (!found) {
      lines.push(`${key}=${value}`);
    }
    
    return lines.join('\n');
  }

  async verifyUpdate(tokens) {
    try {
      const content = await fs.readFile(this.stagingFile, 'utf8');
      const envVars = this.parseEnvFile(content);
      
      const adminTokenMatch = envVars.ADMIN_TOKEN === tokens.adminToken;
      const debugTokenMatch = envVars.DEBUG_TOKEN === tokens.debugToken;
      
      console.log(`\n${colors.bright}Verification:${colors.reset}`);
      console.log(`Admin Token: ${adminTokenMatch ? 
        `${colors.green}✅ Updated${colors.reset}` : 
        `${colors.red}❌ Failed${colors.reset}`}`);
      console.log(`Debug Token: ${debugTokenMatch ? 
        `${colors.green}✅ Updated${colors.reset}` : 
        `${colors.red}❌ Failed${colors.reset}`}`);
      
      if (!adminTokenMatch || !debugTokenMatch) {
        throw new Error('Token verification failed');
      }
      
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
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
}

// Run updater if called directly
if (require.main === module) {
  const updater = new StagingTokenUpdater();
  updater.run().catch(console.error);
}

module.exports = { StagingTokenUpdater };