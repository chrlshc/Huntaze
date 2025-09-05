import crypto from 'crypto';

export interface ModerationResult {
  safe: boolean;
  platform: string;
  labels: ContentLabel[];
  confidence: number;
  warnings: string[];
  recommendations?: string[];
}

export interface ContentLabel {
  name: string;
  confidence: number;
  parentLabels?: string[];
  instances?: Array<{
    boundingBox?: { left: number; top: number; width: number; height: number };
    confidence: number;
  }>;
}

export interface PlatformRules {
  maxNudity: number; // 0-100 threshold
  allowSuggestive: boolean;
  allowPartialNudity: boolean;
  allowArtisticNudity: boolean;
  forbiddenLabels: string[];
  warningLabels: string[];
}

// Platform-specific content rules
const PLATFORM_RULES: Record<string, PlatformRules> = {
  instagram: {
    maxNudity: 0,
    allowSuggestive: true,
    allowPartialNudity: false,
    allowArtisticNudity: false,
    forbiddenLabels: [
      'Explicit Nudity',
      'Nudity',
      'Graphic Violence',
      'Drugs',
      'Weapons',
      'Hate Symbols'
    ],
    warningLabels: [
      'Suggestive',
      'Revealing Clothes',
      'Alcohol',
      'Gambling'
    ]
  },
  tiktok: {
    maxNudity: 0,
    allowSuggestive: false,
    allowPartialNudity: false,
    allowArtisticNudity: false,
    forbiddenLabels: [
      'Explicit Nudity',
      'Nudity',
      'Suggestive',
      'Violence',
      'Drugs',
      'Weapons',
      'Tobacco'
    ],
    warningLabels: [
      'Revealing Clothes',
      'Alcohol',
      'Partial Nudity'
    ]
  },
  reddit: {
    maxNudity: 50, // Depends on subreddit
    allowSuggestive: true,
    allowPartialNudity: true,
    allowArtisticNudity: true,
    forbiddenLabels: [
      'Child Exploitation',
      'Extreme Violence',
      'Hate Symbols'
    ],
    warningLabels: [
      'NSFW Content'
    ]
  },
  onlyfans: {
    maxNudity: 100,
    allowSuggestive: true,
    allowPartialNudity: true,
    allowArtisticNudity: true,
    forbiddenLabels: [
      'Child Exploitation',
      'Non-Consensual Content',
      'Extreme Violence',
      'Illegal Activities'
    ],
    warningLabels: []
  },
  threads: {
    maxNudity: 0,
    allowSuggestive: true,
    allowPartialNudity: false,
    allowArtisticNudity: false,
    forbiddenLabels: [
      'Explicit Nudity',
      'Nudity',
      'Violence',
      'Drugs',
      'Weapons'
    ],
    warningLabels: [
      'Suggestive',
      'Revealing Clothes'
    ]
  }
};

export class ContentModerationService {
  private mockMode: boolean;
  
  constructor(mockMode: boolean = false) {
    this.mockMode = mockMode;
  }

  /**
   * Check image content against platform rules
   */
  async checkImage(
    imageUrl: string | Buffer, 
    platform: string,
    subreddit?: string
  ): Promise<ModerationResult> {
    try {
      // Get platform rules
      const rules = this.getPlatformRules(platform, subreddit);
      
      // Analyze image
      const labels = await this.analyzeImage(imageUrl);
      
      // Check against rules
      const result = this.evaluateContent(labels, rules, platform);
      
      // Add platform-specific recommendations
      if (!result.safe && result.recommendations) {
        result.recommendations = this.getRecommendations(labels, platform);
      }
      
      return result;
    } catch (error) {
      console.error('Content moderation error:', error);
      // Fail closed - mark as unsafe if error
      return {
        safe: false,
        platform,
        labels: [],
        confidence: 0,
        warnings: ['Failed to analyze content - marked unsafe by default']
      };
    }
  }

  /**
   * Batch check multiple images
   */
  async checkBatch(
    images: Array<{ url: string | Buffer; platform: string }>,
    maxConcurrent: number = 5
  ): Promise<ModerationResult[]> {
    const results: ModerationResult[] = [];
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < images.length; i += maxConcurrent) {
      const batch = images.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(img => this.checkImage(img.url, img.platform))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Check if content can be cross-posted
   */
  async checkCrossPosting(
    imageUrl: string | Buffer,
    fromPlatform: string,
    toPlatforms: string[]
  ): Promise<Record<string, ModerationResult>> {
    const results: Record<string, ModerationResult> = {};
    
    // Check source platform
    results[fromPlatform] = await this.checkImage(imageUrl, fromPlatform);
    
    // Check each target platform
    for (const platform of toPlatforms) {
      results[platform] = await this.checkImage(imageUrl, platform);
    }
    
    return results;
  }

  /**
   * Analyze image using vision API (mock or real)
   */
  private async analyzeImage(imageUrl: string | Buffer): Promise<ContentLabel[]> {
    if (this.mockMode) {
      return this.mockAnalysis(imageUrl);
    }
    
    // In production, integrate with AWS Rekognition or Google Vision
    // For now, return mock data
    return this.mockAnalysis(imageUrl);
  }

  /**
   * Mock image analysis for testing
   */
  private mockAnalysis(imageUrl: string | Buffer): ContentLabel[] {
    // Generate consistent mock results based on URL hash
    const hash = crypto.createHash('md5')
      .update(typeof imageUrl === 'string' ? imageUrl : imageUrl.toString())
      .digest('hex');
    
    const hashNum = parseInt(hash.substring(0, 8), 16);
    const isSuggestive = hashNum % 3 === 0;
    const hasPartialNudity = hashNum % 5 === 0;
    const isExplicit = hashNum % 20 === 0;
    
    const labels: ContentLabel[] = [];
    
    if (isExplicit) {
      labels.push({
        name: 'Explicit Nudity',
        confidence: 0.92,
        parentLabels: ['Nudity']
      });
    } else if (hasPartialNudity) {
      labels.push({
        name: 'Partial Nudity',
        confidence: 0.85,
        parentLabels: ['Suggestive']
      });
    } else if (isSuggestive) {
      labels.push({
        name: 'Suggestive',
        confidence: 0.78,
        parentLabels: []
      });
      labels.push({
        name: 'Revealing Clothes',
        confidence: 0.72,
        parentLabels: ['Suggestive']
      });
    }
    
    // Add safe labels
    labels.push({
      name: 'Person',
      confidence: 0.95
    });
    
    return labels;
  }

  /**
   * Get platform rules with subreddit overrides
   */
  private getPlatformRules(platform: string, subreddit?: string): PlatformRules {
    const baseRules = PLATFORM_RULES[platform.toLowerCase()] || PLATFORM_RULES.instagram;
    
    // Special handling for Reddit subreddits
    if (platform === 'reddit' && subreddit) {
      if (this.isNSFWSubreddit(subreddit)) {
        return {
          ...baseRules,
          maxNudity: 100,
          allowSuggestive: true,
          allowPartialNudity: true,
          allowArtisticNudity: true,
          forbiddenLabels: ['Child Exploitation', 'Non-Consensual Content']
        };
      }
    }
    
    return baseRules;
  }

  /**
   * Check if Reddit subreddit is NSFW
   */
  private isNSFWSubreddit(subreddit: string): boolean {
    const nsfwKeywords = ['nsfw', 'gonewild', 'porn', 'xxx', '18', 'adult'];
    const sub = subreddit.toLowerCase();
    return nsfwKeywords.some(keyword => sub.includes(keyword));
  }

  /**
   * Evaluate content against platform rules
   */
  private evaluateContent(
    labels: ContentLabel[],
    rules: PlatformRules,
    platform: string
  ): ModerationResult {
    const warnings: string[] = [];
    let safe = true;
    let maxConfidence = 0;
    
    // Check forbidden labels
    for (const label of labels) {
      maxConfidence = Math.max(maxConfidence, label.confidence);
      
      if (rules.forbiddenLabels.includes(label.name) && label.confidence > 0.7) {
        safe = false;
        warnings.push(`Forbidden content detected: ${label.name} (${(label.confidence * 100).toFixed(0)}% confidence)`);
      } else if (rules.warningLabels.includes(label.name) && label.confidence > 0.7) {
        warnings.push(`Warning: ${label.name} detected (${(label.confidence * 100).toFixed(0)}% confidence)`);
      }
    }
    
    // Check nudity threshold
    const nudityLabels = labels.filter(l => 
      l.name.toLowerCase().includes('nudity') || 
      l.name.toLowerCase().includes('explicit')
    );
    
    for (const nudityLabel of nudityLabels) {
      if (nudityLabel.confidence * 100 > rules.maxNudity) {
        safe = false;
        warnings.push(`Nudity level exceeds platform limits`);
      }
    }
    
    // Check suggestive content
    if (!rules.allowSuggestive) {
      const suggestiveLabels = labels.filter(l => 
        l.name.toLowerCase().includes('suggestive') ||
        l.name.toLowerCase().includes('revealing')
      );
      
      if (suggestiveLabels.length > 0 && suggestiveLabels[0].confidence > 0.6) {
        safe = false;
        warnings.push('Suggestive content not allowed on this platform');
      }
    }
    
    return {
      safe,
      platform,
      labels,
      confidence: maxConfidence,
      warnings,
      recommendations: safe ? undefined : this.getRecommendations(labels, platform)
    };
  }

  /**
   * Get platform-specific recommendations
   */
  private getRecommendations(labels: ContentLabel[], platform: string): string[] {
    const recommendations: string[] = [];
    
    const hasNudity = labels.some(l => l.name.toLowerCase().includes('nudity'));
    const hasSuggestive = labels.some(l => l.name.toLowerCase().includes('suggestive'));
    
    switch (platform) {
      case 'instagram':
        if (hasNudity) {
          recommendations.push('Cover sensitive areas with stickers or blur');
          recommendations.push('Use implied nudity instead of explicit');
          recommendations.push('Post to Stories with "Close Friends" only');
        }
        if (hasSuggestive) {
          recommendations.push('Add more clothing coverage');
          recommendations.push('Adjust pose to be less suggestive');
        }
        break;
        
      case 'tiktok':
        recommendations.push('TikTok has strict content policies');
        recommendations.push('Consider posting to OnlyFans instead');
        recommendations.push('Create a teaser version with more coverage');
        break;
        
      case 'reddit':
        recommendations.push('Post to appropriate NSFW subreddits');
        recommendations.push('Always mark as NSFW');
        recommendations.push('Check subreddit-specific rules');
        break;
        
      case 'onlyfans':
        recommendations.push('This content is suitable for OnlyFans');
        recommendations.push('Consider creating teaser versions for other platforms');
        break;
    }
    
    return recommendations;
  }

  /**
   * Generate safe preview for cross-platform posting
   */
  async generateSafePreview(
    originalImage: string | Buffer,
    targetPlatform: string
  ): Promise<{
    safe: boolean;
    modifications: string[];
  }> {
    // Check original content
    const result = await this.checkImage(originalImage, targetPlatform);
    
    if (result.safe) {
      return { safe: true, modifications: [] };
    }
    
    // Suggest modifications
    const modifications: string[] = [];
    
    const problematicLabels = result.labels.filter(l => 
      PLATFORM_RULES[targetPlatform].forbiddenLabels.includes(l.name)
    );
    
    for (const label of problematicLabels) {
      if (label.instances && label.instances.length > 0) {
        modifications.push(`Blur or cover areas detected as: ${label.name}`);
      }
    }
    
    if (modifications.length === 0) {
      modifications.push('Add strategic cropping or coverage');
      modifications.push('Adjust lighting to reduce explicitness');
      modifications.push('Change pose to be less suggestive');
    }
    
    return { safe: false, modifications };
  }
}

// Export singleton
export const contentModeration = new ContentModerationService();