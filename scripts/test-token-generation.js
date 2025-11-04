#!/usr/bin/env node

const crypto = require('crypto');

// Simple test implementation to verify our token generation logic
class TestSecurityTokenGenerator {
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

  calculateEntropy(str) {
    const frequencies = new Map();
    
    // Count character frequencies
    for (const char of str) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    // Calculate Shannon entropy
    let entropy = 0;
    const length = str.length;
    
    for (const frequency of frequencies.values()) {
      const probability = frequency / length;
      entropy -= probability * Math.log2(probability);
    }

    // Convert to bits
    return entropy * length;
  }

  generateSecurityTokens() {
    const adminToken = this.generateSecureToken('ADMIN');
    const debugToken = this.generateSecureToken('DEBUG');
    const entropy = this.calculateEntropy(adminToken);

    return {
      adminToken,
      debugToken,
      generatedAt: new Date(),
      entropy,
    };
  }

  validateTokenFormat(token) {
    const errors = [];
    const length = token.length;
    const entropy = this.calculateEntropy(token);

    // Check minimum length
    if (length < 32) {
      errors.push(`Token must be at least 32 characters long`);
    }

    // Check entropy
    if (entropy < 128) {
      errors.push(`Token entropy (${entropy.toFixed(2)} bits) is below minimum requirement (128 bits)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      entropy,
      length,
    };
  }
}

// Test the token generation
console.log('🔐 Testing Security Token Generation\n');

const generator = new TestSecurityTokenGenerator();

try {
  // Generate tokens
  const tokens = generator.generateSecurityTokens();
  
  console.log('✅ Token generation successful!');
  console.log('─'.repeat(50));
  console.log(`Admin Token: ${tokens.adminToken.substring(0, 20)}...`);
  console.log(`Debug Token: ${tokens.debugToken.substring(0, 20)}...`);
  console.log(`Admin Token Length: ${tokens.adminToken.length} characters`);
  console.log(`Debug Token Length: ${tokens.debugToken.length} characters`);
  console.log(`Entropy: ${tokens.entropy.toFixed(2)} bits`);
  console.log(`Generated at: ${tokens.generatedAt}`);

  // Validate tokens
  console.log('\n🔍 Validating generated tokens...');
  const adminValidation = generator.validateTokenFormat(tokens.adminToken);
  const debugValidation = generator.validateTokenFormat(tokens.debugToken);

  console.log(`Admin Token Valid: ${adminValidation.isValid ? '✅ Yes' : '❌ No'}`);
  console.log(`Debug Token Valid: ${debugValidation.isValid ? '✅ Yes' : '❌ No'}`);

  if (!adminValidation.isValid) {
    console.log('Admin Token Errors:');
    adminValidation.errors.forEach(error => console.log(`  • ${error}`));
  }

  if (!debugValidation.isValid) {
    console.log('Debug Token Errors:');
    debugValidation.errors.forEach(error => console.log(`  • ${error}`));
  }

  // Test with current environment tokens
  console.log('\n🔍 Checking current environment tokens...');
  const currentAdminToken = process.env.ADMIN_TOKEN || '';
  const currentDebugToken = process.env.DEBUG_TOKEN || '';

  if (currentAdminToken && currentDebugToken) {
    const currentAdminValidation = generator.validateTokenFormat(currentAdminToken);
    const currentDebugValidation = generator.validateTokenFormat(currentDebugToken);

    console.log(`Current Admin Token Valid: ${currentAdminValidation.isValid ? '✅ Yes' : '❌ No'}`);
    console.log(`Current Debug Token Valid: ${currentDebugValidation.isValid ? '✅ Yes' : '❌ No'}`);

    if (!currentAdminValidation.isValid || !currentDebugValidation.isValid) {
      console.log('\n⚠️  Current tokens need to be regenerated!');
    }
  } else {
    console.log('❌ No current tokens found in environment variables');
    console.log('   ADMIN_TOKEN and DEBUG_TOKEN need to be set');
  }

  console.log('\n✅ Security token system test completed successfully!');

} catch (error) {
  console.error('❌ Token generation test failed:', error.message);
  process.exit(1);
}