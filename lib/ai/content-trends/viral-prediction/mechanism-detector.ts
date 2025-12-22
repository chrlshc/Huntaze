/**
 * Viral Mechanism Detector
 * 
 * Detects and analyzes viral mechanisms in content using AI-powered analysis.
 * Identifies patterns like authenticity, controversy, humor, surprise, and social proof.
 */

import type {
  ViralMechanism,
  ViralMechanismType,
  MultimodalContent,
  DissonanceAnalysis,
} from './types';

// ============================================================================
// Mechanism Detection Patterns
// ============================================================================

/**
 * Pattern definitions for each viral mechanism type
 */
const MECHANISM_PATTERNS: Record<ViralMechanismType, {
  keywords: string[];
  visualIndicators: string[];
  engagementSignals: string[];
  weight: number;
}> = {
  authenticity: {
    keywords: ['real', 'honest', 'truth', 'genuine', 'raw', 'unfiltered', 'behind the scenes', 'day in my life'],
    visualIndicators: ['natural lighting', 'unedited', 'selfie style', 'casual setting'],
    engagementSignals: ['high comment ratio', 'personal stories in comments'],
    weight: 1.2,
  },
  controversy: {
    keywords: ['unpopular opinion', 'hot take', 'controversial', 'debate', 'disagree', 'fight me'],
    visualIndicators: ['reaction shots', 'split screen debates'],
    engagementSignals: ['high comment ratio', 'polarized reactions', 'shares for debate'],
    weight: 1.5,
  },
  humor: {
    keywords: ['funny', 'lol', 'comedy', 'joke', 'meme', 'parody', 'skit'],
    visualIndicators: ['comedic timing', 'exaggerated expressions', 'meme format'],
    engagementSignals: ['high share ratio', 'tag friends comments'],
    weight: 1.3,
  },
  surprise: {
    keywords: ['plot twist', 'unexpected', 'wait for it', 'you won\'t believe', 'shocking'],
    visualIndicators: ['reveal moment', 'before/after', 'transformation'],
    engagementSignals: ['high completion rate', 'rewatches'],
    weight: 1.4,
  },
  social_proof: {
    keywords: ['everyone', 'trending', 'viral', 'millions', 'famous', 'celebrity'],
    visualIndicators: ['crowd shots', 'testimonials', 'user generated content'],
    engagementSignals: ['duets', 'stitches', 'trend participation'],
    weight: 1.1,
  },
  curiosity_gap: {
    keywords: ['secret', 'hack', 'trick', 'how to', 'why', 'what happens when'],
    visualIndicators: ['teaser shots', 'partial reveals', 'cliffhangers'],
    engagementSignals: ['high watch time', 'saves for later'],
    weight: 1.3,
  },
  emotional_resonance: {
    keywords: ['feel', 'heart', 'cry', 'emotional', 'touching', 'beautiful'],
    visualIndicators: ['emotional expressions', 'intimate moments', 'storytelling'],
    engagementSignals: ['emotional comments', 'shares with personal messages'],
    weight: 1.4,
  },
  relatability: {
    keywords: ['same', 'me too', 'relatable', 'when you', 'pov', 'that feeling when'],
    visualIndicators: ['everyday situations', 'common experiences'],
    engagementSignals: ['high engagement from target demo', 'tag comments'],
    weight: 1.2,
  },
  aspiration: {
    keywords: ['goals', 'dream', 'luxury', 'success', 'lifestyle', 'motivation'],
    visualIndicators: ['aspirational settings', 'achievement moments', 'transformation'],
    engagementSignals: ['saves', 'follows', 'inspiration comments'],
    weight: 1.1,
  },
  fear_of_missing_out: {
    keywords: ['limited', 'exclusive', 'only', 'last chance', 'don\'t miss', 'trending now'],
    visualIndicators: ['urgency cues', 'countdown', 'scarcity indicators'],
    engagementSignals: ['quick engagement', 'shares with urgency'],
    weight: 1.2,
  },
  nostalgia: {
    keywords: ['remember', 'throwback', 'childhood', 'old school', 'classic', 'back in the day'],
    visualIndicators: ['retro aesthetics', 'vintage filters', 'period references'],
    engagementSignals: ['memory sharing comments', 'generational engagement'],
    weight: 1.1,
  },
  outrage: {
    keywords: ['unacceptable', 'wrong', 'injustice', 'exposed', 'called out', 'cancelled'],
    visualIndicators: ['evidence presentation', 'reaction shots', 'receipts'],
    engagementSignals: ['high share ratio', 'call to action engagement'],
    weight: 1.4,
  },
  inspiration: {
    keywords: ['inspiring', 'motivational', 'never give up', 'you can do it', 'believe'],
    visualIndicators: ['achievement moments', 'journey documentation', 'before/after'],
    engagementSignals: ['saves', 'shares with encouragement'],
    weight: 1.2,
  },
  educational_value: {
    keywords: ['learn', 'tip', 'tutorial', 'how to', 'explained', 'guide', 'facts'],
    visualIndicators: ['demonstrations', 'step by step', 'infographics'],
    engagementSignals: ['saves', 'bookmarks', 'follow for more comments'],
    weight: 1.0,
  },
};

// ============================================================================
// Mechanism Detector Class
// ============================================================================

export class MechanismDetector {
  private readonly minConfidence: number;

  constructor(minConfidence: number = 0.3) {
    this.minConfidence = minConfidence;
  }

  /**
   * Detect all viral mechanisms in content
   */
  detectMechanisms(content: MultimodalContent): ViralMechanism[] {
    const mechanisms: ViralMechanism[] = [];
    const textContent = this.extractTextContent(content);
    const visualElements = content.visualAnalysis?.detectedElements || [];

    for (const [type, patterns] of Object.entries(MECHANISM_PATTERNS)) {
      const mechanism = this.analyzeMechanism(
        type as ViralMechanismType,
        patterns,
        textContent,
        visualElements,
        content.engagement
      );

      if (mechanism && mechanism.strength >= this.minConfidence) {
        mechanisms.push(mechanism);
      }
    }

    // Sort by strength descending
    return mechanisms.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Analyze a specific mechanism type
   */
  private analyzeMechanism(
    type: ViralMechanismType,
    patterns: typeof MECHANISM_PATTERNS[ViralMechanismType],
    textContent: string,
    visualElements: Array<{ type: string; description: string }>,
    engagement: MultimodalContent['engagement']
  ): ViralMechanism | null {
    const textLower = textContent.toLowerCase();
    
    // Calculate keyword matches
    const keywordMatches = patterns.keywords.filter(kw => 
      textLower.includes(kw.toLowerCase())
    );
    const keywordScore = keywordMatches.length / patterns.keywords.length;

    // Calculate visual indicator matches
    const visualDescriptions = visualElements.map(v => v.description.toLowerCase()).join(' ');
    const visualMatches = patterns.visualIndicators.filter(vi =>
      visualDescriptions.includes(vi.toLowerCase())
    );
    const visualScore = patterns.visualIndicators.length > 0 
      ? visualMatches.length / patterns.visualIndicators.length 
      : 0;

    // Calculate engagement signal score
    const engagementScore = this.calculateEngagementScore(engagement, patterns.engagementSignals);

    // Combined strength with weights
    const rawStrength = (keywordScore * 0.4) + (visualScore * 0.3) + (engagementScore * 0.3);
    const strength = Math.min(1, rawStrength * patterns.weight);

    if (strength < this.minConfidence) {
      return null;
    }

    // Calculate replicability
    const replicabilityFactor = this.calculateReplicability(type, keywordMatches, visualMatches);

    // Generate description
    const description = this.generateDescription(type, keywordMatches, visualMatches);

    // Collect examples
    const examples = [...keywordMatches.slice(0, 3), ...visualMatches.slice(0, 2)];

    return {
      type,
      strength: Math.round(strength * 100) / 100,
      description,
      replicabilityFactor: Math.round(replicabilityFactor * 100) / 100,
      examples,
    };
  }

  /**
   * Extract all text content from multimodal content
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
   * Calculate engagement score based on signals
   */
  private calculateEngagementScore(
    engagement: MultimodalContent['engagement'],
    signals: string[]
  ): number {
    let score = 0;
    const signalCount = signals.length;

    for (const signal of signals) {
      if (signal.includes('comment ratio') && engagement.engagementRate > 0.05) {
        score += 1;
      }
      if (signal.includes('share ratio') && engagement.shares / engagement.views > 0.01) {
        score += 1;
      }
      if (signal.includes('high engagement') && engagement.engagementRate > 0.1) {
        score += 1;
      }
      if (signal.includes('saves') && engagement.engagementRate > 0.08) {
        score += 0.5;
      }
    }

    return signalCount > 0 ? Math.min(1, score / signalCount) : 0;
  }

  /**
   * Calculate replicability factor for a mechanism
   */
  private calculateReplicability(
    type: ViralMechanismType,
    keywordMatches: string[],
    visualMatches: string[]
  ): number {
    // Base replicability by type
    const baseReplicability: Record<ViralMechanismType, number> = {
      authenticity: 0.7,
      controversy: 0.5,
      humor: 0.6,
      surprise: 0.7,
      social_proof: 0.4,
      curiosity_gap: 0.8,
      emotional_resonance: 0.6,
      relatability: 0.8,
      aspiration: 0.5,
      fear_of_missing_out: 0.7,
      nostalgia: 0.7,
      outrage: 0.4,
      inspiration: 0.7,
      educational_value: 0.9,
    };

    let replicability = baseReplicability[type];

    // Adjust based on specificity of matches
    if (keywordMatches.length > 3) {
      replicability += 0.1; // More specific patterns are easier to replicate
    }
    if (visualMatches.length > 2) {
      replicability += 0.1;
    }

    return Math.min(1, replicability);
  }

  /**
   * Generate human-readable description
   */
  private generateDescription(
    type: ViralMechanismType,
    keywordMatches: string[],
    _visualMatches: string[]
  ): string {
    const descriptions: Record<ViralMechanismType, string> = {
      authenticity: 'Content leverages authentic, unfiltered presentation to build trust and connection',
      controversy: 'Content uses controversial or polarizing elements to drive engagement and debate',
      humor: 'Content employs humor and comedic elements to increase shareability',
      surprise: 'Content creates unexpected moments or reveals to maintain viewer attention',
      social_proof: 'Content leverages social validation and trending status to build credibility',
      curiosity_gap: 'Content creates information gaps that compel viewers to watch until the end',
      emotional_resonance: 'Content triggers strong emotional responses that drive engagement',
      relatability: 'Content presents relatable situations that viewers identify with',
      aspiration: 'Content showcases aspirational lifestyle or achievements',
      fear_of_missing_out: 'Content creates urgency through exclusivity or time-limited elements',
      nostalgia: 'Content evokes nostalgic feelings and shared memories',
      outrage: 'Content exposes wrongdoing or injustice to drive action',
      inspiration: 'Content motivates and inspires viewers toward positive action',
      educational_value: 'Content provides valuable information or teaches new skills',
    };

    let description = descriptions[type];

    if (keywordMatches.length > 0) {
      description += `. Key elements: ${keywordMatches.slice(0, 3).join(', ')}`;
    }

    return description;
  }

  /**
   * Analyze cognitive dissonance in content
   */
  analyzeCognitiveDissonance(content: MultimodalContent): DissonanceAnalysis {
    const textContent = this.extractTextContent(content).toLowerCase();
    
    // Dissonance patterns
    const dissonancePatterns = {
      expectation_violation: ['but actually', 'plot twist', 'you thought', 'surprise', 'unexpected'],
      belief_challenge: ['myth', 'wrong', 'actually', 'truth is', 'contrary to'],
      identity_conflict: ['as a', 'even though', 'despite being', 'shouldn\'t but'],
      value_contradiction: ['guilty pleasure', 'know I shouldn\'t', 'bad but', 'wrong but'],
    };

    let strongestType: DissonanceAnalysis['type'] | undefined;
    let maxStrength = 0;
    const elements: string[] = [];

    for (const [type, patterns] of Object.entries(dissonancePatterns)) {
      const matches = patterns.filter(p => textContent.includes(p));
      const strength = matches.length / patterns.length;
      
      if (strength > maxStrength) {
        maxStrength = strength;
        strongestType = type as DissonanceAnalysis['type'];
        elements.push(...matches);
      }
    }

    // Check visual dissonance (contrast, juxtaposition)
    const visualAnalysis = content.visualAnalysis;
    if (visualAnalysis?.editingDynamics?.transitionTypes?.includes('contrast')) {
      maxStrength += 0.2;
    }

    const isPresent = maxStrength >= 0.2;

    return {
      isPresent,
      type: isPresent ? strongestType : undefined,
      strength: Math.min(1, maxStrength),
      description: isPresent 
        ? `Content creates cognitive dissonance through ${strongestType?.replace('_', ' ')}`
        : 'No significant cognitive dissonance detected',
      elements: [...new Set(elements)],
      resolution: isPresent ? this.detectResolution(textContent) : undefined,
    };
  }

  /**
   * Detect if dissonance is resolved in content
   */
  private detectResolution(text: string): string | undefined {
    const resolutionPatterns = [
      'the answer is',
      'here\'s why',
      'the solution',
      'turns out',
      'the truth is',
      'actually',
    ];

    for (const pattern of resolutionPatterns) {
      if (text.includes(pattern)) {
        return `Dissonance resolved through explanation/reveal`;
      }
    }

    return undefined;
  }
}

// ============================================================================
// Exports
// ============================================================================

export const createMechanismDetector = (minConfidence?: number) => 
  new MechanismDetector(minConfidence);
