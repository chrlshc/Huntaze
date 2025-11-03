export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  score: number; // 0-100
}

export const contentValidationService = {
  validateContent(content: {
    text?: string;
    mediaAssets?: Array<{ type: string; url: string; alt_text?: string; width?: number; height?: number }>;
    platforms?: string[];
  }): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Text validation
    if (content.text) {
      // Check for broken links
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = content.text.match(urlRegex) || [];
      
      urls.forEach(url => {
        // Simple check for common broken link patterns
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          issues.push({
            type: 'warning',
            field: 'text',
            message: `Local URL detected: ${url}`,
            suggestion: 'Replace with production URL before publishing'
          });
        }
        
        if (url.endsWith('/') && url.split('/').length > 4) {
          issues.push({
            type: 'info',
            field: 'text',
            message: 'URL ends with trailing slash',
            suggestion: 'Consider removing trailing slash for cleaner URLs'
          });
        }
      });

      // Check for excessive capitalization
      const words = content.text.split(/\s+/);
      const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase());
      if (capsWords.length > words.length * 0.3) {
        issues.push({
          type: 'warning',
          field: 'text',
          message: 'Excessive use of capital letters detected',
          suggestion: 'Consider using normal case for better readability'
        });
      }

      // Check for spelling/grammar indicators (simple)
      if (content.text.includes('  ')) {
        issues.push({
          type: 'info',
          field: 'text',
          message: 'Multiple consecutive spaces detected',
          suggestion: 'Remove extra spaces'
        });
      }

      // Check for common typos
      const commonTypos = ['teh', 'recieve', 'occured', 'seperate', 'definately'];
      const lowerText = content.text.toLowerCase();
      commonTypos.forEach(typo => {
        if (lowerText.includes(typo)) {
          issues.push({
            type: 'warning',
            field: 'text',
            message: `Possible typo detected: "${typo}"`,
            suggestion: 'Check spelling'
          });
        }
      });
    }

    // Media validation
    if (content.mediaAssets && content.mediaAssets.length > 0) {
      content.mediaAssets.forEach((media, index) => {
        // Check for missing alt text on images
        if (media.type === 'image' && !media.alt_text) {
          issues.push({
            type: 'error',
            field: `media[${index}]`,
            message: 'Image is missing alt text',
            suggestion: 'Add descriptive alt text for accessibility'
          });
        }

        // Check image resolution
        if (media.type === 'image' && media.width && media.height) {
          if (media.width < 600 || media.height < 600) {
            issues.push({
              type: 'warning',
              field: `media[${index}]`,
              message: `Low resolution image (${media.width}x${media.height})`,
              suggestion: 'Use higher resolution images for better quality'
            });
          }

          // Check aspect ratio
          const aspectRatio = media.width / media.height;
          if (aspectRatio < 0.5 || aspectRatio > 2) {
            issues.push({
              type: 'info',
              field: `media[${index}]`,
              message: 'Unusual aspect ratio detected',
              suggestion: 'Verify image displays correctly on all platforms'
            });
          }
        }
      });
    }

    // Platform-specific validation
    if (content.platforms && content.platforms.length === 0) {
      issues.push({
        type: 'warning',
        field: 'platforms',
        message: 'No platforms selected',
        suggestion: 'Select at least one platform to publish to'
      });
    }

    // Calculate validation score
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const infoCount = issues.filter(i => i.type === 'info').length;

    let score = 100;
    score -= errorCount * 20;
    score -= warningCount * 10;
    score -= infoCount * 5;
    score = Math.max(0, score);

    return {
      isValid: errorCount === 0,
      issues,
      score
    };
  },

  validateAccessibility(content: {
    text?: string;
    mediaAssets?: Array<{ type: string; alt_text?: string }>;
  }): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for alt text on all images
    if (content.mediaAssets) {
      const imagesWithoutAlt = content.mediaAssets.filter(
        m => m.type === 'image' && !m.alt_text
      );

      if (imagesWithoutAlt.length > 0) {
        issues.push({
          type: 'error',
          field: 'accessibility',
          message: `${imagesWithoutAlt.length} image(s) missing alt text`,
          suggestion: 'Add descriptive alt text for screen readers'
        });
      }
    }

    // Check for emoji overuse (can be problematic for screen readers)
    if (content.text) {
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      const emojis = content.text.match(emojiRegex) || [];
      const words = content.text.split(/\s+/).length;

      if (emojis.length > words * 0.2) {
        issues.push({
          type: 'warning',
          field: 'accessibility',
          message: 'High emoji usage detected',
          suggestion: 'Consider reducing emojis for better screen reader experience'
        });
      }
    }

    // Check for color-only information (we can't detect this perfectly, but check for common patterns)
    if (content.text && /\b(red|green|blue|yellow)\b/i.test(content.text)) {
      issues.push({
        type: 'info',
        field: 'accessibility',
        message: 'Color references detected in text',
        suggestion: 'Ensure information is not conveyed by color alone'
      });
    }

    return issues;
  },

  validateLinks(text: string): Promise<ValidationIssue[]> {
    return new Promise((resolve) => {
      const issues: ValidationIssue[] = [];
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = text.match(urlRegex) || [];

      // Note: In a real implementation, you would actually check if URLs are accessible
      // For now, we'll do basic validation
      urls.forEach(url => {
        try {
          new URL(url);
        } catch {
          issues.push({
            type: 'error',
            field: 'links',
            message: `Invalid URL format: ${url}`,
            suggestion: 'Check URL syntax'
          });
        }
      });

      resolve(issues);
    });
  },

  getValidationSummary(result: ValidationResult): string {
    if (result.score === 100) {
      return '✅ Perfect! No issues found.';
    } else if (result.score >= 80) {
      return '✓ Good! Minor improvements suggested.';
    } else if (result.score >= 60) {
      return '⚠️ Fair. Several issues need attention.';
    } else {
      return '❌ Poor. Multiple critical issues found.';
    }
  }
};
