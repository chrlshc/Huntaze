import { securityTokenGenerator, SecurityTokens, TokenValidationResult } from './securityTokenGenerator';
import { tokenBackupService, TokenBackup } from './tokenBackupService';

export interface SecurityTokenValidationReport {
  isValid: boolean;
  adminToken: TokenValidationResult;
  debugToken: TokenValidationResult;
  recommendations: string[];
  securityScore: number;
}

export interface TokenRotationResult {
  success: boolean;
  newTokens?: SecurityTokens;
  backupId?: string;
  error?: string;
}

export class SecurityTokenService {
  /**
   * Validate current production tokens
   */
  async validateProductionTokens(): Promise<SecurityTokenValidationReport> {
    const adminToken = process.env.ADMIN_TOKEN || '';
    const debugToken = process.env.DEBUG_TOKEN || '';

    if (!adminToken || !debugToken) {
      return {
        isValid: false,
        adminToken: {
          isValid: false,
          errors: ['Admin token not found in environment variables'],
          entropy: 0,
          length: 0,
        },
        debugToken: {
          isValid: false,
          errors: ['Debug token not found in environment variables'],
          entropy: 0,
          length: 0,
        },
        recommendations: [
          'Generate new security tokens immediately',
          'Ensure ADMIN_TOKEN and DEBUG_TOKEN are set in environment variables',
          'Create a backup of any existing valid tokens before regeneration',
        ],
        securityScore: 0,
      };
    }

    const adminValidation = securityTokenGenerator.validateTokenFormat(adminToken);
    const debugValidation = securityTokenGenerator.validateTokenFormat(debugToken);

    const recommendations = this.generateRecommendations(adminValidation, debugValidation);
    const securityScore = this.calculateSecurityScore(adminValidation, debugValidation);

    return {
      isValid: adminValidation.isValid && debugValidation.isValid,
      adminToken: adminValidation,
      debugToken: debugValidation,
      recommendations,
      securityScore,
    };
  }

  /**
   * Generate new security tokens with automatic backup
   */
  async rotateSecurityTokens(createBackup: boolean = true): Promise<TokenRotationResult> {
    try {
      let backupId: string | undefined;

      // Create backup of existing tokens if requested
      if (createBackup) {
        const currentTokens = await this.getCurrentTokens();
        if (currentTokens.adminToken && currentTokens.debugToken) {
          const securityTokens: SecurityTokens = {
            adminToken: currentTokens.adminToken,
            debugToken: currentTokens.debugToken,
            generatedAt: new Date(),
            entropy: securityTokenGenerator.calculateEntropy(currentTokens.adminToken),
          };

          backupId = await tokenBackupService.createBackup(securityTokens, 'rotation');
        }
      }

      // Generate new tokens
      const newTokens = securityTokenGenerator.generateSecurityTokens();

      return {
        success: true,
        newTokens,
        backupId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if tokens need rotation based on security criteria
   */
  async shouldRotateTokens(): Promise<{
    shouldRotate: boolean;
    reasons: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const validation = await this.validateProductionTokens();
    const reasons: string[] = [];
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check if tokens are missing
    if (!validation.isValid) {
      if (validation.adminToken.errors.some(e => e.includes('not found')) ||
          validation.debugToken.errors.some(e => e.includes('not found'))) {
        reasons.push('Security tokens are missing from environment');
        urgency = 'critical';
      }
    }

    // Check security score
    if (validation.securityScore < 50) {
      reasons.push('Security score is below acceptable threshold');
      urgency = urgency === 'critical' ? 'critical' : 'high';
    } else if (validation.securityScore < 75) {
      reasons.push('Security score could be improved');
      urgency = urgency === 'critical' || urgency === 'high' ? urgency : 'medium';
    }

    // Check for specific security issues
    const allErrors = [...validation.adminToken.errors, ...validation.debugToken.errors];
    
    if (allErrors.some(e => e.includes('entropy'))) {
      reasons.push('Tokens have insufficient entropy');
      urgency = urgency === 'critical' ? 'critical' : 'high';
    }

    if (allErrors.some(e => e.includes('common patterns'))) {
      reasons.push('Tokens contain predictable patterns');
      urgency = urgency === 'critical' ? 'critical' : 'medium';
    }

    if (allErrors.some(e => e.includes('character diversity'))) {
      reasons.push('Tokens lack character diversity');
      urgency = urgency === 'critical' || urgency === 'high' ? urgency : 'medium';
    }

    // Check for default/placeholder tokens
    const currentTokens = await this.getCurrentTokens();
    if (this.isDefaultToken(currentTokens.adminToken) || this.isDefaultToken(currentTokens.debugToken)) {
      reasons.push('Default or placeholder tokens detected');
      urgency = 'critical';
    }

    return {
      shouldRotate: reasons.length > 0,
      reasons,
      urgency,
    };
  }

  /**
   * Get security health status
   */
  async getSecurityHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const validation = await this.validateProductionTokens();
    const rotationCheck = await this.shouldRotateTokens();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (rotationCheck.urgency === 'critical') {
      status = 'critical';
    } else if (rotationCheck.urgency === 'high' || validation.securityScore < 75) {
      status = 'warning';
    }

    return {
      status,
      score: validation.securityScore,
      issues: rotationCheck.reasons,
      recommendations: validation.recommendations,
    };
  }

  /**
   * Audit security token configuration
   */
  async auditTokenConfiguration(): Promise<{
    configurationIssues: string[];
    environmentVariables: {
      adminTokenSet: boolean;
      debugTokenSet: boolean;
      encryptionKeySet: boolean;
    };
    backupStatus: {
      hasBackups: boolean;
      backupCount: number;
      lastBackup?: Date;
    };
  }> {
    const configurationIssues: string[] = [];
    
    // Check environment variables
    const adminTokenSet = !!process.env.ADMIN_TOKEN;
    const debugTokenSet = !!process.env.DEBUG_TOKEN;
    const encryptionKeySet = !!process.env.TOKEN_ENCRYPTION_KEY;

    if (!adminTokenSet) {
      configurationIssues.push('ADMIN_TOKEN environment variable is not set');
    }

    if (!debugTokenSet) {
      configurationIssues.push('DEBUG_TOKEN environment variable is not set');
    }

    if (!encryptionKeySet) {
      configurationIssues.push('TOKEN_ENCRYPTION_KEY environment variable is not set');
    }

    // Check backup status
    const backups = await tokenBackupService.listBackups();
    const backupStatus = {
      hasBackups: backups.length > 0,
      backupCount: backups.length,
      lastBackup: backups.length > 0 ? 
        new Date(Math.max(...backups.map(b => new Date(b.createdAt).getTime()))) : 
        undefined,
    };

    if (!backupStatus.hasBackups) {
      configurationIssues.push('No token backups found - create backups for disaster recovery');
    }

    return {
      configurationIssues,
      environmentVariables: {
        adminTokenSet,
        debugTokenSet,
        encryptionKeySet,
      },
      backupStatus,
    };
  }

  /**
   * Get current tokens from environment
   */
  private async getCurrentTokens(): Promise<{ adminToken: string; debugToken: string }> {
    return {
      adminToken: process.env.ADMIN_TOKEN || '',
      debugToken: process.env.DEBUG_TOKEN || '',
    };
  }

  /**
   * Check if token is a default/placeholder value
   */
  private isDefaultToken(token: string): boolean {
    const defaultPatterns = [
      'change-this',
      'replace-me',
      'default',
      'placeholder',
      'example',
      'test',
      'demo',
      'huntaze-admin-token-change-this',
      'huntaze-debug-token-change-this',
    ];

    const lowerToken = token.toLowerCase();
    return defaultPatterns.some(pattern => lowerToken.includes(pattern));
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(
    adminValidation: TokenValidationResult,
    debugValidation: TokenValidationResult
  ): string[] {
    const recommendations: string[] = [];

    if (!adminValidation.isValid || !debugValidation.isValid) {
      recommendations.push('Regenerate invalid security tokens immediately');
    }

    if (adminValidation.entropy < 150 || debugValidation.entropy < 150) {
      recommendations.push('Use tokens with higher entropy for better security');
    }

    if (adminValidation.length < 40 || debugValidation.length < 40) {
      recommendations.push('Consider using longer tokens for enhanced security');
    }

    recommendations.push('Rotate security tokens regularly (every 90 days)');
    recommendations.push('Store tokens securely and never commit them to version control');
    recommendations.push('Monitor token usage and audit access logs regularly');
    recommendations.push('Create regular backups of valid tokens');

    return recommendations;
  }

  /**
   * Calculate overall security score
   */
  private calculateSecurityScore(
    adminValidation: TokenValidationResult,
    debugValidation: TokenValidationResult
  ): number {
    let score = 0;

    // Base score for valid tokens
    if (adminValidation.isValid) score += 25;
    if (debugValidation.isValid) score += 25;

    // Entropy bonus
    const avgEntropy = (adminValidation.entropy + debugValidation.entropy) / 2;
    if (avgEntropy >= 200) score += 20;
    else if (avgEntropy >= 150) score += 15;
    else if (avgEntropy >= 100) score += 10;

    // Length bonus
    const avgLength = (adminValidation.length + debugValidation.length) / 2;
    if (avgLength >= 50) score += 15;
    else if (avgLength >= 40) score += 10;
    else if (avgLength >= 32) score += 5;

    // Penalty for errors
    const totalErrors = adminValidation.errors.length + debugValidation.errors.length;
    score -= totalErrors * 5;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }
}

// Export singleton instance
export const securityTokenService = new SecurityTokenService();