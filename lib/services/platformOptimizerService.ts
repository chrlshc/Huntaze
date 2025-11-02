import { PLATFORM_REQUIREMENTS, PlatformRequirements } from '../config/platformRequirements';

export interface ValidationWarning {
  type: 'error' | 'warning';
  field: 'text' | 'image' | 'video' | 'hashtags';
  message: string;
}

export interface OptimizationResult {
  platform: string;
  isValid: boolean;
  warnings: ValidationWarning[];
  optimizedText?: string;
  suggestedChanges?: string[];
  optimizedImageUrl?: string;
}

export interface ImageOptimizationOptions {
  imageBuffer?: Buffer;
  imageUrl?: string;
  targetPlatform: string;
  aspectRatio?: { width: number; height: number };
}

export const platformOptimizerService = {
  validateContent(platform: string, content: { text?: string; imageSize?: number; videoSize?: number; videoDuration?: number; hashtagCount?: number }): OptimizationResult {
    const requirements = PLATFORM_REQUIREMENTS[platform.toLowerCase()];
    if (!requirements) {
      return { platform, isValid: false, warnings: [{ type: 'error', field: 'text', message: 'Platform not supported' }] };
    }

    const warnings: ValidationWarning[] = [];
    let optimizedText = content.text;
    const suggestedChanges: string[] = [];

    if (content.text) {
      if (content.text.length > requirements.text.maxLength) {
        warnings.push({ type: 'error', field: 'text', message: `Text exceeds ${requirements.text.maxLength} characters (current: ${content.text.length})` });
        optimizedText = this.truncateText(content.text, requirements.text.maxLength);
        suggestedChanges.push(`Shorten text to ${requirements.text.maxLength} characters`);
      }
      if (requirements.text.minLength && content.text.length < requirements.text.minLength) {
        warnings.push({ type: 'warning', field: 'text', message: `Text is shorter than recommended ${requirements.text.minLength} characters` });
      }
    }

    if (content.imageSize && requirements.image) {
      const maxSizeBytes = requirements.image.maxSizeMB * 1024 * 1024;
      if (content.imageSize > maxSizeBytes) {
        warnings.push({ type: 'error', field: 'image', message: `Image size exceeds ${requirements.image.maxSizeMB}MB` });
        suggestedChanges.push(`Compress image to under ${requirements.image.maxSizeMB}MB`);
      }
    }

    if (content.videoSize && requirements.video) {
      const maxSizeBytes = requirements.video.maxSizeMB * 1024 * 1024;
      if (content.videoSize > maxSizeBytes) {
        warnings.push({ type: 'error', field: 'video', message: `Video size exceeds ${requirements.video.maxSizeMB}MB` });
        suggestedChanges.push(`Compress video to under ${requirements.video.maxSizeMB}MB`);
      }
    }

    if (content.videoDuration && requirements.video) {
      if (content.videoDuration > requirements.video.maxDurationSeconds) {
        warnings.push({ type: 'error', field: 'video', message: `Video duration exceeds ${requirements.video.maxDurationSeconds}s` });
        suggestedChanges.push(`Trim video to ${requirements.video.maxDurationSeconds} seconds`);
      }
      if (requirements.video.minDurationSeconds && content.videoDuration < requirements.video.minDurationSeconds) {
        warnings.push({ type: 'warning', field: 'video', message: `Video is shorter than recommended ${requirements.video.minDurationSeconds}s` });
      }
    }

    if (content.hashtagCount && requirements.hashtags) {
      if (content.hashtagCount > requirements.hashtags.max) {
        warnings.push({ type: 'error', field: 'hashtags', message: `Too many hashtags (max: ${requirements.hashtags.max})` });
        suggestedChanges.push(`Reduce hashtags to ${requirements.hashtags.max}`);
      }
      if (content.hashtagCount < requirements.hashtags.recommended) {
        warnings.push({ type: 'warning', field: 'hashtags', message: `Consider adding more hashtags (recommended: ${requirements.hashtags.recommended})` });
      }
    }

    return {
      platform: requirements.name,
      isValid: warnings.filter(w => w.type === 'error').length === 0,
      warnings,
      optimizedText,
      suggestedChanges
    };
  },

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    // Smart truncation with word boundaries
    const truncated = text.substring(0, maxLength - 3);
    
    // Find the last complete word
    const lastSpace = truncated.lastIndexOf(' ');
    const lastPunctuation = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
      truncated.lastIndexOf(',')
    );
    
    // Use the last word boundary (space or punctuation)
    const cutPoint = Math.max(lastSpace, lastPunctuation);
    
    if (cutPoint > maxLength * 0.7) {
      // Only use word boundary if we're not losing too much text
      return truncated.substring(0, cutPoint).trim() + '...';
    }
    
    return truncated.trim() + '...';
  },

  calculateOptimalDimensions(
    currentWidth: number,
    currentHeight: number,
    targetPlatform: string,
    aspectRatio?: { width: number; height: number }
  ): { width: number; height: number; needsResize: boolean } {
    const requirements = PLATFORM_REQUIREMENTS[targetPlatform.toLowerCase()];
    if (!requirements?.image) {
      return { width: currentWidth, height: currentHeight, needsResize: false };
    }

    let targetWidth = currentWidth;
    let targetHeight = currentHeight;
    let needsResize = false;

    // Apply aspect ratio if specified
    if (aspectRatio) {
      const targetRatio = aspectRatio.width / aspectRatio.height;
      const currentRatio = currentWidth / currentHeight;

      if (Math.abs(currentRatio - targetRatio) > 0.01) {
        needsResize = true;
        if (currentRatio > targetRatio) {
          // Image is wider, adjust width
          targetWidth = Math.round(currentHeight * targetRatio);
        } else {
          // Image is taller, adjust height
          targetHeight = Math.round(currentWidth / targetRatio);
        }
      }
    }

    // Ensure minimum dimensions
    if (requirements.image.minWidth && targetWidth < requirements.image.minWidth) {
      const scale = requirements.image.minWidth / targetWidth;
      targetWidth = requirements.image.minWidth;
      targetHeight = Math.round(targetHeight * scale);
      needsResize = true;
    }

    if (requirements.image.minHeight && targetHeight < requirements.image.minHeight) {
      const scale = requirements.image.minHeight / targetHeight;
      targetHeight = Math.round(targetHeight * scale);
      targetWidth = Math.round(targetWidth * scale);
      needsResize = true;
    }

    return { width: targetWidth, height: targetHeight, needsResize };
  },

  getImageResizeRecommendation(
    imageWidth: number,
    imageHeight: number,
    platform: string
  ): string | null {
    const requirements = PLATFORM_REQUIREMENTS[platform.toLowerCase()];
    if (!requirements?.image) return null;

    const recommendations: string[] = [];

    if (requirements.image.minWidth && imageWidth < requirements.image.minWidth) {
      recommendations.push(`Increase width to at least ${requirements.image.minWidth}px`);
    }

    if (requirements.image.minHeight && imageHeight < requirements.image.minHeight) {
      recommendations.push(`Increase height to at least ${requirements.image.minHeight}px`);
    }

    // Check aspect ratios
    const currentRatio = imageWidth / imageHeight;
    const matchingRatio = requirements.image.aspectRatios.find(ar => {
      const ratio = ar.width / ar.height;
      return Math.abs(currentRatio - ratio) < 0.1;
    });

    if (!matchingRatio && requirements.image.aspectRatios.length > 0) {
      const ratioLabels = requirements.image.aspectRatios.map(ar => ar.label).join(', ');
      recommendations.push(`Consider using one of these aspect ratios: ${ratioLabels}`);
    }

    return recommendations.length > 0 ? recommendations.join('. ') : null;
  },

  validateMultiplePlatforms(platforms: string[], content: any): Record<string, OptimizationResult> {
    const results: Record<string, OptimizationResult> = {};
    platforms.forEach(platform => {
      results[platform] = this.validateContent(platform, content);
    });
    return results;
  },

  getPlatformRequirements(platform: string): PlatformRequirements | null {
    return PLATFORM_REQUIREMENTS[platform.toLowerCase()] || null;
  }
};
