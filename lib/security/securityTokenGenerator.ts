import { randomBytes, createHash } from 'crypto';

export interface SecurityTokens {
  adminToken: string;
  debugToken: string;
  generatedAt: Date;
  expiresAt?: Date;
  entropy: number;
}

export interface TokenValidationResult {
  isValid: boolean;
  errors: string[];
  entropy: number;
  length: number;
}

export class SecurityTokenGenerator {
  private static readonly MIN_TOKEN_LENGTH = 32;
  private static readonly MIN_ENTROPY_BITS = 128;

  /**
   * Generate a cryptographically secure admin token
   */
  generateAdminToken(): string {
    return this.generateSecureToken('ADMIN');
  }

  /**
   * Generate a cryptographically secure debug token
   */
  generateDebugToken(): string {
    return this.generateSecureToken('DEBUG');
  }

  /**
   * Generate both admin and debug tokens
   */
  generateSecurityTokens(): SecurityTokens {
    const adminToken = this.generateAdminToken();
    const debugToken = this.generateDebugToken();
    const entropy = this.calculateEntropy(adminToken);

    return {
      adminToken,
      debugToken,
      generatedAt: new Date(),
      entropy,
    };
  }

  /**
   * Validate token entropy and format
   */
  validateTokenEntropy(token: string): boolean {
    const entropy = this.calculateEntropy(token);
    return entropy >= SecurityTokenGenerator.MIN_ENTROPY_BITS;
  }

  /**
   * Validate token format and requirements
   */
  validateTokenFormat(token: string): TokenValidationResult {
    const errors: string[] = [];
    const length = token.length;
    const entropy = this.calculateEntropy(token);

    // Check minimum length
    if (length < SecurityTokenGenerator.MIN_TOKEN_LENGTH) {
      errors.push(`Token must be at least ${SecurityTokenGenerator.MIN_TOKEN_LENGTH} characters long`);
    }

    // Check entropy
    if (entropy < SecurityTokenGenerator.MIN_ENTROPY_BITS) {
      errors.push(`Token entropy (${entropy.toFixed(2)} bits) is below minimum requirement (${SecurityTokenGenerator.MIN_ENTROPY_BITS} bits)`);
    }

    // Check for common patterns
    if (this.hasCommonPatterns(token)) {
      errors.push('Token contains common patterns or repeated sequences');
    }

    // Check character diversity
    if (!this.hasCharacterDiversity(token)) {
      errors.push('Token lacks character diversity (should include uppercase, lowercase, numbers, and symbols)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      entropy,
      length,
    };
  }

  /**
   * Generate a secure token with prefix
   */
  private generateSecureToken(prefix: string): string {
    // Generate 32 bytes of random data (256 bits)
    const randomData = randomBytes(32);
    
    // Create a hash for additional entropy mixing
    const hash = createHash('sha256');
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

  /**
   * Calculate Shannon entropy of a string
   */
  private calculateEntropy(str: string): number {
    const frequencies = new Map<string, number>();
    
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

  /**
   * Check for common patterns in token
   */
  private hasCommonPatterns(token: string): boolean {
    // Extract the actual token part (after the prefix)
    const tokenParts = token.split('_');
    const actualToken = tokenParts.length >= 3 ? tokenParts.slice(2).join('_') : token;
    
    // Check for repeated sequences in the actual token part
    const repeatedPattern = /(.{3,})\1/;
    if (repeatedPattern.test(actualToken)) {
      return true;
    }

    // Check for sequential characters in the actual token part
    const sequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;
    if (sequential.test(actualToken)) {
      return true;
    }

    // Check for common words or patterns in the actual token part (not the prefix)
    const commonPatterns = [
      'password', 'secret', 'key', 'login', 'user', 'demo', 
      'test123', 'qwerty', 'huntaze'
    ];
    
    const lowerActualToken = actualToken.toLowerCase();
    return commonPatterns.some(pattern => lowerActualToken.includes(pattern));
  }

  /**
   * Check for character diversity
   */
  private hasCharacterDiversity(token: string): boolean {
    const hasUppercase = /[A-Z]/.test(token);
    const hasLowercase = /[a-z]/.test(token);
    const hasNumbers = /[0-9]/.test(token);
    const hasSymbols = /[^A-Za-z0-9]/.test(token);

    // Require at least 3 out of 4 character types
    const diversityCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols]
      .filter(Boolean).length;
    
    return diversityCount >= 3;
  }

  /**
   * Validate existing tokens against security requirements
   */
  validateExistingTokens(adminToken: string, debugToken: string): {
    admin: TokenValidationResult;
    debug: TokenValidationResult;
    overall: boolean;
  } {
    const adminValidation = this.validateTokenFormat(adminToken);
    const debugValidation = this.validateTokenFormat(debugToken);

    return {
      admin: adminValidation,
      debug: debugValidation,
      overall: adminValidation.isValid && debugValidation.isValid,
    };
  }
}

// Export singleton instance
export const securityTokenGenerator = new SecurityTokenGenerator();