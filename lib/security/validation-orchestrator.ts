/**
 * Validation Orchestrator
 * 
 * Coordinates validation across multiple OAuth platforms
 */

import { OAuthValidators, type OAuthValidationResult } from './oauth-validators';

export type ValidationResult = OAuthValidationResult;

export class ValidationOrchestrator {
  private validators = new OAuthValidators();
  private cache: Map<string, { result: ValidationResult; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Validate credentials for a single platform
   */
  async validatePlatform(platform: string, credentials: any): Promise<ValidationResult> {
    const cacheKey = `${platform}:${JSON.stringify(credentials)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result;
    }

    // Validate based on platform
    let result: ValidationResult;
    
    switch (platform) {
      case 'tiktok':
        result = await this.validators.validateTikTok(credentials);
        break;
      
      case 'instagram':
        result = await this.validators.validateInstagram(credentials);
        break;
      
      case 'reddit':
        result = await this.validators.validateReddit(credentials);
        break;
      
      default:
        result = {
          platform,
          isValid: false,
          errors: ['Unknown platform'],
          warnings: [],
          details: {
            message: `Unknown platform: ${platform}`,
          },
        };
    }

    // Cache result
    this.cache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  }

  /**
   * Validate credentials for multiple platforms
   */
  async validateMultiplePlatforms(platforms: Record<string, any>): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};

    // Validate all platforms in parallel
    const validations = Object.entries(platforms).map(async ([platform, credentials]) => {
      const result = await this.validatePlatform(platform, credentials);
      return { platform, result };
    });

    const completed = await Promise.all(validations);

    // Build results object
    for (const { platform, result } of completed) {
      results[platform] = result;
    }

    return results;
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
