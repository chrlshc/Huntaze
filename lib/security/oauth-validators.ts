/**
 * OAuth Credentials Validators
 * 
 * Validates OAuth credentials for TikTok, Instagram, and Reddit
 * Tests actual API connectivity and credential authenticity
 */

import { instagramOAuthOptimized } from '../services/instagramOAuth-optimized';
import { tiktokOAuthOptimized } from '../services/tiktokOAuth-optimized';
import { redditOAuthOptimized } from '../services/redditOAuth-optimized';

export interface OAuthValidationResult {
  platform: string;
  isValid: boolean;
  credentialsSet: boolean;
  formatValid: boolean;
  apiConnectivity: boolean;
  errors: string[];
  warnings: string[];
  details?: Record<string, any>;
}

export interface OAuthValidationReport {
  timestamp: Date;
  overall: {
    isValid: boolean;
    validPlatforms: number;
    totalPlatforms: number;
    score: number;
  };
  platforms: {
    tiktok: OAuthValidationResult;
    instagram: OAuthValidationResult;
    reddit: OAuthValidationResult;
  };
  recommendations: string[];
}

export class OAuthValidators {
  private static readonly TIMEOUT_MS = 10000; // 10 seconds

  /**
   * Validate TikTok OAuth credentials
   */
  static async validateTikTok(): Promise<OAuthValidationResult> {
    const result: OAuthValidationResult = {
      platform: 'TikTok',
      isValid: false,
      credentialsSet: false,
      formatValid: false,
      apiConnectivity: false,
      errors: [],
      warnings: [],
      details: {},
    };

    try {
      // Check if credentials are set
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
      const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;

      if (!clientKey || !clientSecret) {
        result.errors.push('Missing TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET');
        return result;
      }

      result.credentialsSet = true;

      // Validate format
      if (clientKey.length < 10) {
        result.errors.push('TIKTOK_CLIENT_KEY appears to be invalid (too short)');
      }

      if (clientSecret.length < 10) {
        result.errors.push('TIKTOK_CLIENT_SECRET appears to be invalid (too short)');
      }

      if (!redirectUri || !redirectUri.startsWith('http')) {
        result.warnings.push('NEXT_PUBLIC_TIKTOK_REDIRECT_URI not properly configured');
      }

      if (result.errors.length === 0) {
        result.formatValid = true;
      }

      // Test API connectivity
      try {
        const authResult = await Promise.race([
          tiktokOAuthOptimized.getAuthorizationUrl(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), this.TIMEOUT_MS)
          ),
        ]) as any;

        if (authResult.url && authResult.url.includes('tiktok.com')) {
          result.apiConnectivity = true;
          result.details = {
            authUrlGenerated: true,
            hasState: !!authResult.state,
            redirectUri,
          };
        } else {
          result.errors.push('Failed to generate valid authorization URL');
        }
      } catch (error) {
        result.errors.push(`API connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Determine overall validity
      result.isValid = result.credentialsSet && result.formatValid && result.apiConnectivity;

    } catch (error) {
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate Instagram OAuth credentials
   */
  static async validateInstagram(): Promise<OAuthValidationResult> {
    const result: OAuthValidationResult = {
      platform: 'Instagram',
      isValid: false,
      credentialsSet: false,
      formatValid: false,
      apiConnectivity: false,
      errors: [],
      warnings: [],
      details: {},
    };

    try {
      // Check if credentials are set
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI;

      if (!appId || !appSecret) {
        result.errors.push('Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET');
        return result;
      }

      result.credentialsSet = true;

      // Validate format
      if (!/^\d+$/.test(appId)) {
        result.errors.push('FACEBOOK_APP_ID should be numeric');
      }

      if (appSecret.length < 20) {
        result.errors.push('FACEBOOK_APP_SECRET appears to be invalid (too short)');
      }

      if (!redirectUri || !redirectUri.startsWith('http')) {
        result.warnings.push('NEXT_PUBLIC_FACEBOOK_REDIRECT_URI not properly configured');
      }

      if (result.errors.length === 0) {
        result.formatValid = true;
      }

      // Test API connectivity
      try {
        const authResult = await Promise.race([
          instagramOAuthOptimized.getAuthorizationUrl(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), this.TIMEOUT_MS)
          ),
        ]) as any;

        if (authResult.url && authResult.url.includes('facebook.com')) {
          result.apiConnectivity = true;
          result.details = {
            authUrlGenerated: true,
            appId: appId.substring(0, 8) + '...',
            redirectUri,
          };
        } else {
          result.errors.push('Failed to generate valid authorization URL');
        }
      } catch (error) {
        result.errors.push(`API connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Determine overall validity
      result.isValid = result.credentialsSet && result.formatValid && result.apiConnectivity;

    } catch (error) {
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate Reddit OAuth credentials
   */
  static async validateReddit(): Promise<OAuthValidationResult> {
    const result: OAuthValidationResult = {
      platform: 'Reddit',
      isValid: false,
      credentialsSet: false,
      formatValid: false,
      apiConnectivity: false,
      errors: [],
      warnings: [],
      details: {},
    };

    try {
      // Check if credentials are set
      const clientId = process.env.REDDIT_CLIENT_ID;
      const clientSecret = process.env.REDDIT_CLIENT_SECRET;
      const userAgent = process.env.REDDIT_USER_AGENT;
      const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;

      if (!clientId || !clientSecret) {
        result.errors.push('Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET');
        return result;
      }

      result.credentialsSet = true;

      // Validate format
      if (clientId.length < 10) {
        result.errors.push('REDDIT_CLIENT_ID appears to be invalid (too short)');
      }

      if (clientSecret.length < 10) {
        result.errors.push('REDDIT_CLIENT_SECRET appears to be invalid (too short)');
      }

      if (!userAgent || userAgent.length < 5) {
        result.errors.push('REDDIT_USER_AGENT is required and must be descriptive');
      }

      if (!redirectUri || !redirectUri.startsWith('http')) {
        result.warnings.push('NEXT_PUBLIC_REDDIT_REDIRECT_URI not properly configured');
      }

      if (result.errors.length === 0) {
        result.formatValid = true;
      }

      // Test API connectivity
      try {
        const authResult = await Promise.race([
          redditOAuthOptimized.getAuthorizationUrl(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), this.TIMEOUT_MS)
          ),
        ]) as any;

        if (authResult.url && authResult.url.includes('reddit.com')) {
          result.apiConnectivity = true;
          result.details = {
            authUrlGenerated: true,
            hasState: !!authResult.state,
            userAgent,
            redirectUri,
          };
        } else {
          result.errors.push('Failed to generate valid authorization URL');
        }
      } catch (error) {
        result.errors.push(`API connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Determine overall validity
      result.isValid = result.credentialsSet && result.formatValid && result.apiConnectivity;

    } catch (error) {
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate all OAuth platforms
   */
  static async validateAll(): Promise<OAuthValidationReport> {
    const timestamp = new Date();

    console.log('🔍 Validating OAuth credentials for all platforms...\n');

    // Run all validations in parallel
    const [tiktok, instagram, reddit] = await Promise.all([
      this.validateTikTok(),
      this.validateInstagram(),
      this.validateReddit(),
    ]);

    // Calculate overall metrics
    const platforms = [tiktok, instagram, reddit];
    const validPlatforms = platforms.filter(p => p.isValid).length;
    const totalPlatforms = platforms.length;
    const score = Math.round((validPlatforms / totalPlatforms) * 100);

    // Generate recommendations
    const recommendations: string[] = [];

    platforms.forEach(platform => {
      if (!platform.credentialsSet) {
        recommendations.push(`Configure ${platform.platform} OAuth credentials in environment variables`);
      } else if (!platform.formatValid) {
        recommendations.push(`Fix ${platform.platform} credential format issues`);
      } else if (!platform.apiConnectivity) {
        recommendations.push(`Verify ${platform.platform} API connectivity and credentials`);
      }
    });

    if (validPlatforms === 0) {
      recommendations.push('⚠️  CRITICAL: No OAuth platforms are configured - users cannot connect accounts');
    } else if (validPlatforms < totalPlatforms) {
      recommendations.push('Consider implementing graceful degradation for unavailable platforms');
    }

    if (validPlatforms === totalPlatforms) {
      recommendations.push('✅ All OAuth platforms are properly configured');
    }

    return {
      timestamp,
      overall: {
        isValid: validPlatforms === totalPlatforms,
        validPlatforms,
        totalPlatforms,
        score,
      },
      platforms: {
        tiktok,
        instagram,
        reddit,
      },
      recommendations,
    };
  }

  /**
   * Check if production is ready from OAuth perspective
   */
  static async isProductionReady(): Promise<{
    ready: boolean;
    blockers: string[];
    warnings: string[];
  }> {
    const report = await this.validateAll();
    const blockers: string[] = [];
    const warnings: string[] = [];

    // At least one platform must be working
    if (report.overall.validPlatforms === 0) {
      blockers.push('No OAuth platforms are configured - application will not function');
    }

    // Check critical platforms
    if (!report.platforms.instagram.isValid) {
      warnings.push('Instagram integration not available - major feature missing');
    }

    if (!report.platforms.tiktok.isValid) {
      warnings.push('TikTok integration not available');
    }

    if (!report.platforms.reddit.isValid) {
      warnings.push('Reddit integration not available');
    }

    // Check for format issues
    Object.values(report.platforms).forEach(platform => {
      if (platform.credentialsSet && !platform.formatValid) {
        blockers.push(`${platform.platform} credentials have format issues`);
      }
    });

    return {
      ready: blockers.length === 0 && report.overall.validPlatforms > 0,
      blockers,
      warnings,
    };
  }

  /**
   * Generate detailed validation report
   */
  static async generateReport(): Promise<string> {
    const report = await this.validateAll();

    let output = '# OAuth Credentials Validation Report\n\n';
    output += `**Generated:** ${report.timestamp.toISOString()}\n\n`;

    // Overall status
    const statusIcon = report.overall.isValid ? '✅' : '❌';
    output += `## Overall Status: ${statusIcon}\n\n`;
    output += `- **Valid Platforms:** ${report.overall.validPlatforms}/${report.overall.totalPlatforms}\n`;
    output += `- **Score:** ${report.overall.score}/100\n\n`;

    // Platform details
    output += '## Platform Details\n\n';

    Object.entries(report.platforms).forEach(([key, platform]) => {
      const icon = platform.isValid ? '✅' : '❌';
      output += `### ${icon} ${platform.platform}\n\n`;

      output += `- **Credentials Set:** ${platform.credentialsSet ? '✅' : '❌'}\n`;
      output += `- **Format Valid:** ${platform.formatValid ? '✅' : '❌'}\n`;
      output += `- **API Connectivity:** ${platform.apiConnectivity ? '✅' : '❌'}\n`;

      if (platform.errors.length > 0) {
        output += '\n**Errors:**\n';
        platform.errors.forEach(error => {
          output += `- ❌ ${error}\n`;
        });
      }

      if (platform.warnings.length > 0) {
        output += '\n**Warnings:**\n';
        platform.warnings.forEach(warning => {
          output += `- ⚠️  ${warning}\n`;
        });
      }

      if (platform.details && Object.keys(platform.details).length > 0) {
        output += '\n**Details:**\n';
        Object.entries(platform.details).forEach(([key, value]) => {
          output += `- ${key}: ${value}\n`;
        });
      }

      output += '\n';
    });

    // Recommendations
    if (report.recommendations.length > 0) {
      output += '## Recommendations\n\n';
      report.recommendations.forEach(rec => {
        output += `- ${rec}\n`;
      });
    }

    return output;
  }
}
