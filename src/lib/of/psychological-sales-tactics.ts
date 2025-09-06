// Psychological Sales Tactics - What REALLY makes fans buy
// Based on real psychology & what top 1% creators use

export interface SalesTactic {
  id: string;
  name: string;
  description: string;
  examples: string[];
  effectiveness: 'high' | 'medium' | 'low';
  riskLevel: 'safe' | 'moderate' | 'aggressive';
  bestFor: string[];
}

export const PSYCHOLOGICAL_TACTICS: Record<string, SalesTactic> = {
  // URGENCY & SCARCITY
  fomo: {
    id: 'fomo',
    name: 'FOMO (Fear of Missing Out)',
    description: 'Create urgency with limited time/quantity',
    examples: [
      'Only keeping this up for 1 hour! ⏰',
      'First 5 fans only at this price',
      'Deleting at midnight! Last chance',
      'Flash sale - 30 mins only!'
    ],
    effectiveness: 'high',
    riskLevel: 'safe',
    bestFor: ['ppv', 'limited_content', 'sales']
  },

  scarcity: {
    id: 'scarcity',
    name: 'Artificial Scarcity',
    description: 'Make content seem exclusive and rare',
    examples: [
      'Only made 10 of these videos',
      'VIP content - only for my top fans',
      'This is too hot, might delete later',
      'Exclusive - won\'t post this anywhere else'
    ],
    effectiveness: 'high',
    riskLevel: 'moderate',
    bestFor: ['custom_content', 'vip_fans']
  },

  // SOCIAL PROOF
  social_proof: {
    id: 'social_proof',
    name: 'Social Proof',
    description: 'Show that others are buying/enjoying',
    examples: [
      '23 fans already unlocked this 🔥',
      'My VIPs are loving this one',
      'Getting so many messages about this video',
      'Top seller this week!'
    ],
    effectiveness: 'medium',
    riskLevel: 'safe',
    bestFor: ['new_fans', 'fence_sitters']
  },

  // PSYCHOLOGICAL PRICING
  price_anchoring: {
    id: 'price_anchoring',
    name: 'Price Anchoring',
    description: 'Make current price seem like a deal',
    examples: [
      'Usually $50, but for you $25',
      'My most expensive vid is $100, this is only $30',
      'Tomorrow it goes back to $40',
      'VIP price: $20 (reg $35)'
    ],
    effectiveness: 'high',
    riskLevel: 'safe',
    bestFor: ['all_fans']
  },

  bundle_deal: {
    id: 'bundle_deal',
    name: 'Bundle Economics',
    description: 'Package multiple items for perceived value',
    examples: [
      '3 videos for $40 (usually $60!)',
      'Get the whole set for less',
      'Buy 2 get 1 free this weekend',
      'Complete collection - save 40%'
    ],
    effectiveness: 'medium',
    riskLevel: 'safe',
    bestFor: ['big_spenders', 'collectors']
  },

  // EMOTIONAL TRIGGERS
  personal_connection: {
    id: 'personal_connection',
    name: 'Personal Connection',
    description: 'Make fan feel special and chosen',
    examples: [
      'Made this thinking of you specifically',
      'You inspired me to film this',
      'Only sending to my favorites',
      'This reminds me of what you said'
    ],
    effectiveness: 'high',
    riskLevel: 'safe',
    bestFor: ['regulars', 'vip_fans']
  },

  curiosity_gap: {
    id: 'curiosity_gap',
    name: 'Curiosity Gap',
    description: 'Tease without revealing everything',
    examples: [
      'You won\'t believe what happens at 3:45 😱',
      'I did something I\'ve NEVER done before',
      'The ending will blow your mind',
      'Finally tried that thing you suggested...'
    ],
    effectiveness: 'high',
    riskLevel: 'safe',
    bestFor: ['all_fans']
  },

  // RECIPROCITY
  reciprocity: {
    id: 'reciprocity',
    name: 'Reciprocity Principle',
    description: 'Give something to get something',
    examples: [
      'Here\'s a free preview because you\'re amazing',
      'You tipped yesterday so here\'s a discount',
      'Thanks for being loyal - special price',
      'Free pic, but the video is 🔥'
    ],
    effectiveness: 'medium',
    riskLevel: 'safe',
    bestFor: ['loyal_fans', 'recent_tippers']
  },

  // COMMITMENT & CONSISTENCY
  foot_in_door: {
    id: 'foot_in_door',
    name: 'Foot in the Door',
    description: 'Start small, escalate gradually',
    examples: [
      'Just $5 for a teaser',
      'Try my content starting at $10',
      'Small tip = special surprise',
      'Start with this, you\'ll want more'
    ],
    effectiveness: 'medium',
    riskLevel: 'safe',
    bestFor: ['new_fans', 'non_buyers']
  },

  // LOSS AVERSION
  loss_aversion: {
    id: 'loss_aversion',
    name: 'Loss Aversion',
    description: 'Fear of losing > desire to gain',
    examples: [
      'Your discount expires in 1 hour',
      'Removing this tomorrow - last chance',
      'You\'ll regret missing this',
      'Don\'t let this slip away'
    ],
    effectiveness: 'high',
    riskLevel: 'moderate',
    bestFor: ['fence_sitters', 'past_buyers']
  },

  // AUTHORITY & EXPERTISE
  authority: {
    id: 'authority',
    name: 'Authority/Expertise',
    description: 'Position as expert/best in niche',
    examples: [
      'Top 0.5% for a reason',
      'I know exactly what you need',
      'Trust me, this is my best work',
      '5 years perfecting this'
    ],
    effectiveness: 'medium',
    riskLevel: 'safe',
    bestFor: ['new_fans', 'niche_content']
  },

  // SEXUAL PSYCHOLOGY
  tease_denial: {
    id: 'tease_denial',
    name: 'Tease & Denial',
    description: 'Build anticipation through teasing',
    examples: [
      'Want to see what\'s under this? 😏',
      'I\'m being so naughty... wanna watch?',
      'You\'re not ready for this',
      'Can you handle what I\'m about to show?'
    ],
    effectiveness: 'high',
    riskLevel: 'moderate',
    bestFor: ['engaged_fans', 'regulars']
  }
};

// Generate sales message with tactics
export class PsychologicalSalesEngine {
  // Combine multiple tactics for maximum effect
  generateSalesMessage(
    tactics: string[],
    context: {
      contentType: 'ppv' | 'custom' | 'bundle' | 'tip';
      price: number;
      fanType: 'new' | 'regular' | 'vip' | 'inactive';
      previousPurchases: number;
    }
  ): string {
    const messages: string[] = [];
    
    // Add tactics in effective order
    tactics.forEach(tacticId => {
      const tactic = PSYCHOLOGICAL_TACTICS[tacticId];
      if (tactic) {
        const example = this.selectBestExample(tactic, context);
        messages.push(example);
      }
    });
    
    // Combine with natural flow
    return this.combineMessages(messages, context);
  }
  
  private selectBestExample(tactic: SalesTactic, context: any): string {
    // Filter examples suitable for context
    let suitable = tactic.examples;
    
    // Customize based on fan type
    if (context.fanType === 'new' && tactic.id === 'social_proof') {
      return suitable[0]; // Show others are buying
    }
    
    if (context.fanType === 'vip' && tactic.id === 'personal_connection') {
      return suitable[0]; // Most personal option
    }
    
    // Random from suitable
    return suitable[Math.floor(Math.random() * suitable.length)];
  }
  
  private combineMessages(messages: string[], context: any): string {
    // Smart combination based on context
    if (context.contentType === 'ppv') {
      return messages.join(' ');
    }
    
    // Natural flow for different types
    return messages.join(' ');
  }
  
  // Get recommended tactics for situation
  recommendTactics(
    fanProfile: {
      lifetimeValue: number;
      lastPurchase: Date | null;
      responseRate: number;
      fanType: string;
    }
  ): string[] {
    const recommended: string[] = [];
    
    // High value fans - personal connection
    if (fanProfile.lifetimeValue >= 100) {
      recommended.push('personal_connection', 'scarcity');
    }
    
    // Inactive fans - loss aversion
    if (fanProfile.lastPurchase && this.daysSince(fanProfile.lastPurchase) > 14) {
      recommended.push('loss_aversion', 'fomo');
    }
    
    // New fans - social proof
    if (!fanProfile.lastPurchase) {
      recommended.push('social_proof', 'foot_in_door', 'curiosity_gap');
    }
    
    // Always include price anchoring
    recommended.push('price_anchoring');
    
    return [...new Set(recommended)]; // Remove duplicates
  }
  
  private daysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Track effectiveness
  async trackTacticPerformance(
    tacticId: string,
    sent: number,
    converted: number,
    revenue: number
  ): Promise<void> {
    // In production, store in database
    console.log(`Tactic ${tacticId}: ${(converted/sent*100).toFixed(1)}% conversion, $${revenue}`);
  }
}

// Ethical boundaries - what NOT to do
export const ETHICAL_BOUNDARIES = {
  avoid: [
    'Threatening to expose personal info',
    'Fake emergencies or sob stories',
    'Manipulating mental health issues',
    'False promises about meeting IRL',
    'Targeting known addiction issues'
  ],
  
  guidelines: [
    'Be playfully persuasive, not manipulative',
    'Create real urgency, not fake emergencies',
    'Use FOMO for content, not personal attacks',
    'Keep it sexy and fun, not desperate',
    'Respect when fans say no'
  ]
};

export const psychologicalSales = new PsychologicalSalesEngine();