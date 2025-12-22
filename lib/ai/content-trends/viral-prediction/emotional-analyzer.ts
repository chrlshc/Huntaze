/**
 * Emotional Trigger Analyzer
 * 
 * Analyzes content to identify emotional triggers that drive engagement.
 * Uses text analysis, visual cues, and engagement patterns.
 */

import type {
  EmotionalTrigger,
  EmotionalTriggerCategory,
  MultimodalContent,
} from './types';

// ============================================================================
// Emotion Detection Patterns
// ============================================================================

/**
 * Patterns for detecting emotional triggers
 */
const EMOTION_PATTERNS: Record<EmotionalTriggerCategory, {
  keywords: string[];
  visualCues: string[];
  intensity: number;
}> = {
  joy: {
    keywords: ['happy', 'excited', 'amazing', 'love', 'best', 'wonderful', 'celebrate', '🎉', '😊', '❤️'],
    visualCues: ['smiling', 'laughing', 'celebration', 'bright colors', 'upbeat'],
    intensity: 0.8,
  },
  surprise: {
    keywords: ['wow', 'omg', 'shocking', 'unbelievable', 'unexpected', 'plot twist', '😱', '🤯'],
    visualCues: ['wide eyes', 'open mouth', 'sudden reveal', 'transformation'],
    intensity: 0.9,
  },
  anger: {
    keywords: ['angry', 'furious', 'outraged', 'unacceptable', 'disgusting', 'hate', '😡', '🤬'],
    visualCues: ['frowning', 'aggressive gestures', 'red tones', 'confrontational'],
    intensity: 0.85,
  },
  fear: {
    keywords: ['scary', 'terrifying', 'dangerous', 'warning', 'beware', 'horror', '😨', '😰'],
    visualCues: ['dark lighting', 'tense atmosphere', 'jump scares', 'suspense'],
    intensity: 0.75,
  },
  sadness: {
    keywords: ['sad', 'crying', 'heartbreaking', 'devastating', 'loss', 'miss', '😢', '💔'],
    visualCues: ['tears', 'somber lighting', 'slow motion', 'melancholic'],
    intensity: 0.7,
  },
  disgust: {
    keywords: ['gross', 'disgusting', 'nasty', 'eww', 'cringe', 'yuck', '🤢', '🤮'],
    visualCues: ['grimacing', 'turning away', 'unpleasant visuals'],
    intensity: 0.6,
  },
  anticipation: {
    keywords: ['coming soon', 'wait for it', 'can\'t wait', 'excited for', 'countdown', '⏳', '🔜'],
    visualCues: ['teaser shots', 'building tension', 'countdown elements'],
    intensity: 0.7,
  },
  trust: {
    keywords: ['honest', 'real', 'genuine', 'truth', 'promise', 'guarantee', '✅', '💯'],
    visualCues: ['eye contact', 'open body language', 'testimonials'],
    intensity: 0.65,
  },
  curiosity: {
    keywords: ['secret', 'mystery', 'discover', 'find out', 'hidden', 'reveal', '🤔', '❓'],
    visualCues: ['partial reveals', 'blurred elements', 'question marks'],
    intensity: 0.8,
  },
  empathy: {
    keywords: ['understand', 'feel', 'relate', 'same', 'been there', 'support', '🤗', '💕'],
    visualCues: ['emotional expressions', 'intimate moments', 'vulnerability'],
    intensity: 0.75,
  },
  pride: {
    keywords: ['proud', 'achievement', 'accomplished', 'success', 'milestone', 'won', '🏆', '💪'],
    visualCues: ['celebration', 'awards', 'before/after', 'achievement display'],
    intensity: 0.7,
  },
  envy: {
    keywords: ['goals', 'wish', 'jealous', 'want', 'dream', 'luxury', '✨', '💎'],
    visualCues: ['aspirational lifestyle', 'luxury items', 'perfect aesthetics'],
    intensity: 0.65,
  },
};

// ============================================================================
// Timing Detection
// ============================================================================

type EmotionalTiming = 'hook' | 'buildup' | 'climax' | 'resolution' | 'throughout';

// ============================================================================
// Emotional Analyzer Class
// ============================================================================

export class EmotionalAnalyzer {
  private readonly minIntensity: number;

  constructor(minIntensity: number = 0.3) {
    this.minIntensity = minIntensity;
  }

  /**
   * Analyze content for emotional triggers
   */
  analyzeEmotionalTriggers(content: MultimodalContent): EmotionalTrigger[] {
    const triggers: EmotionalTrigger[] = [];
    const textContent = this.extractTextContent(content);
    const visualAnalysis = content.visualAnalysis;

    for (const [category, patterns] of Object.entries(EMOTION_PATTERNS)) {
      const trigger = this.analyzeEmotion(
        category as EmotionalTriggerCategory,
        patterns,
        textContent,
        visualAnalysis,
        content.metadata.duration
      );

      if (trigger && trigger.intensity >= this.minIntensity) {
        triggers.push(trigger);
      }
    }

    // Sort by intensity descending
    return triggers.sort((a, b) => b.intensity - a.intensity);
  }

  /**
   * Analyze a specific emotion category
   */
  private analyzeEmotion(
    category: EmotionalTriggerCategory,
    patterns: typeof EMOTION_PATTERNS[EmotionalTriggerCategory],
    textContent: string,
    visualAnalysis: MultimodalContent['visualAnalysis'],
    _duration?: number
  ): EmotionalTrigger | null {
    const textLower = textContent.toLowerCase();
    
    // Find keyword matches with positions
    const keywordMatches: Array<{ keyword: string; position: number }> = [];
    for (const keyword of patterns.keywords) {
      const position = textLower.indexOf(keyword.toLowerCase());
      if (position !== -1) {
        keywordMatches.push({ keyword, position });
      }
    }

    // Find visual cue matches
    const visualMatches: string[] = [];
    if (visualAnalysis) {
      const visualText = [
        visualAnalysis.denseCaption || '',
        ...(visualAnalysis.detectedElements?.map(e => e.description) || []),
        ...(visualAnalysis.facialExpressions?.map(f => f.expression) || []),
      ].join(' ').toLowerCase();

      for (const cue of patterns.visualCues) {
        if (visualText.includes(cue.toLowerCase())) {
          visualMatches.push(cue);
        }
      }
    }

    // Calculate intensity
    const keywordScore = keywordMatches.length / patterns.keywords.length;
    const visualScore = patterns.visualCues.length > 0 
      ? visualMatches.length / patterns.visualCues.length 
      : 0;
    
    const rawIntensity = (keywordScore * 0.5 + visualScore * 0.5) * patterns.intensity;
    const intensity = Math.min(1, rawIntensity);

    if (intensity < this.minIntensity) {
      return null;
    }

    // Determine timing
    const timing = this.determineTiming(keywordMatches, textContent.length);

    // Generate trigger description
    const trigger = this.generateTriggerDescription(category, keywordMatches, visualMatches);

    // Collect elements
    const elements = [
      ...keywordMatches.map(m => m.keyword),
      ...visualMatches,
    ];

    // Calculate confidence
    const confidence = Math.min(1, (keywordMatches.length + visualMatches.length) / 5);

    return {
      category,
      intensity: Math.round(intensity * 100) / 100,
      trigger,
      timing,
      elements: [...new Set(elements)].slice(0, 5),
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Extract all text content
   */
  private extractTextContent(content: MultimodalContent): string {
    const parts: string[] = [];

    if (content.textContent?.caption) {
      parts.push(content.textContent.caption);
    }
    if (content.textContent?.description) {
      parts.push(content.textContent.description);
    }
    if (content.textContent?.hashtags) {
      parts.push(content.textContent.hashtags.join(' '));
    }
    if (content.visualAnalysis?.denseCaption) {
      parts.push(content.visualAnalysis.denseCaption);
    }
    if (content.visualAnalysis?.ocrText) {
      parts.push(content.visualAnalysis.ocrText);
    }

    return parts.join(' ');
  }

  /**
   * Determine timing based on keyword positions
   */
  private determineTiming(
    matches: Array<{ keyword: string; position: number }>,
    textLength: number
  ): EmotionalTiming {
    if (matches.length === 0) {
      return 'throughout';
    }

    // Check if emotion appears throughout
    const positions = matches.map(m => m.position / textLength);
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    
    if (maxPos - minPos > 0.5) {
      return 'throughout';
    }

    // Determine primary timing
    const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length;
    
    if (avgPos < 0.2) return 'hook';
    if (avgPos < 0.5) return 'buildup';
    if (avgPos < 0.8) return 'climax';
    return 'resolution';
  }

  /**
   * Generate trigger description
   */
  private generateTriggerDescription(
    category: EmotionalTriggerCategory,
    keywordMatches: Array<{ keyword: string; position: number }>,
    _visualMatches: string[]
  ): string {
    const descriptions: Record<EmotionalTriggerCategory, string> = {
      joy: 'Positive emotions and happiness',
      surprise: 'Unexpected elements or reveals',
      anger: 'Frustration or outrage triggers',
      fear: 'Anxiety or concern inducing elements',
      sadness: 'Emotional or melancholic content',
      disgust: 'Aversion or cringe-inducing elements',
      anticipation: 'Building excitement or expectation',
      trust: 'Authenticity and credibility signals',
      curiosity: 'Mystery or information gaps',
      empathy: 'Relatable emotional experiences',
      pride: 'Achievement or success celebration',
      envy: 'Aspirational or desirable content',
    };

    let description = descriptions[category];

    if (keywordMatches.length > 0) {
      const topKeywords = keywordMatches.slice(0, 2).map(m => m.keyword);
      description += ` (${topKeywords.join(', ')})`;
    }

    return description;
  }

  /**
   * Calculate emotional intensity score for content
   */
  calculateEmotionalIntensity(triggers: EmotionalTrigger[]): number {
    if (triggers.length === 0) return 0;

    // Weight by intensity and confidence
    const weightedSum = triggers.reduce((sum, t) => 
      sum + (t.intensity * t.confidence), 0
    );

    // Normalize by number of triggers (diminishing returns)
    const normalizedScore = weightedSum / Math.sqrt(triggers.length);

    return Math.min(1, normalizedScore);
  }

  /**
   * Get dominant emotion from triggers
   */
  getDominantEmotion(triggers: EmotionalTrigger[]): EmotionalTriggerCategory | null {
    if (triggers.length === 0) return null;
    return triggers[0].category;
  }

  /**
   * Analyze emotional arc (for video content)
   */
  analyzeEmotionalArc(
    triggers: EmotionalTrigger[]
  ): { phase: EmotionalTiming; emotions: EmotionalTriggerCategory[] }[] {
    const phases: EmotionalTiming[] = ['hook', 'buildup', 'climax', 'resolution'];
    
    return phases.map(phase => ({
      phase,
      emotions: triggers
        .filter(t => t.timing === phase || t.timing === 'throughout')
        .map(t => t.category),
    }));
  }
}

// ============================================================================
// Exports
// ============================================================================

export const createEmotionalAnalyzer = (minIntensity?: number) => 
  new EmotionalAnalyzer(minIntensity);
