// AI Personality Training - Learn from the creator's ACTUAL style

import { db } from '@/lib/db';
import { of_messages } from '@/lib/db/schema';
// Lightweight stubs to avoid optional dependency during local builds
const eq = (...args: any[]) => ({} as any);
const and = (...args: any[]) => ({} as any);
const desc = (x: any) => x;

export interface PersonalityProfile {
  id: string;
  name: string;
  description: string;
  
  // Learned patterns from creator
  vocabulary: {
    greetings: string[];
    endearments: string[];
    teases: string[];
    emojis: string[];
    phrases: string[];
  };
  
  // Writing style
  style: {
    punctuation: 'minimal' | 'normal' | 'excessive'; // "hey..." vs "Hey!" vs "HEYYYY!!!"
    capitalization: 'lowercase' | 'normal' | 'random'; // "hey babe" vs "Hey babe" vs "hey BABE"
    messageLength: 'short' | 'medium' | 'long';
    typos: boolean; // Intentional typos for authenticity
    doubleTexting: boolean; // Send multiple messages in a row
  };
  
  // Conversation patterns
  patterns: {
    openingLines: string[];
    ppvPitch: string[];
    complimentStyle: string[];
    rejectionHandling: string[];
  };
  
  // Learned from actual sales
  salesTactics: {
    scarcity: boolean; // "Only 3 spots left"
    fomo: boolean; // "Ends tonight"
    personalTouch: boolean; // "Made this thinking of you"
    priceAnchoring: boolean; // Start high, offer discount
  };
}

export class PersonalityTrainingService {
  // Learn from creator's actual messages
  async trainFromHistory(
    accountId: string,
    creatorMessages: string[]
  ): Promise<PersonalityProfile> {
    // Analyze creator's real messages
    const analysis = this.analyzeWritingStyle(creatorMessages);
    
    return {
      id: `personality_${accountId}`,
      name: 'Custom AI Twin',
      description: 'Learned from your actual messaging style',
      
      vocabulary: {
        greetings: this.extractPatterns(creatorMessages, /^(hey|hi|hello|sup|heyy+).*/i),
        endearments: this.extractPatterns(creatorMessages, /\b(babe|baby|love|honey|daddy|sweetheart|hun)\b/i),
        teases: this.extractPatterns(creatorMessages, /(wanna see|can't wait to show|you'll love|guess what)/i),
        emojis: this.extractEmojis(creatorMessages),
        phrases: this.extractCommonPhrases(creatorMessages)
      },
      
      style: {
        punctuation: analysis.punctuation,
        capitalization: analysis.capitalization,
        messageLength: analysis.avgLength < 50 ? 'short' : analysis.avgLength < 100 ? 'medium' : 'long',
        typos: analysis.hasTypos,
        doubleTexting: analysis.multipleMessages > 30
      },
      
      patterns: {
        openingLines: this.extractOpenings(creatorMessages),
        ppvPitch: this.extractPPVPitches(creatorMessages),
        complimentStyle: this.extractCompliments(creatorMessages),
        rejectionHandling: this.extractRejectionResponses(creatorMessages)
      },
      
      salesTactics: {
        scarcity: creatorMessages.some(m => /only \d+ left|last chance|ending soon/i.test(m)),
        fomo: creatorMessages.some(m => /tonight only|expires|don't miss/i.test(m)),
        personalTouch: creatorMessages.some(m => /just for you|thinking of you|specially for/i.test(m)),
        priceAnchoring: creatorMessages.some(m => /usually \$|normally|discount|% off/i.test(m))
      }
    };
  }
  
  private analyzeWritingStyle(messages: string[]): any {
    const analysis = {
      punctuation: 'normal' as 'normal' | 'excessive' | 'minimal',
      capitalization: 'normal' as 'normal' | 'lowercase' | 'random',
      avgLength: 0,
      hasTypos: false,
      multipleMessages: 0
    };
    
    // Check for excessive punctuation
    const exclamationCount = messages.filter(m => (m.match(/!/g) || []).length > 2).length;
    const ellipsisCount = messages.filter(m => m.includes('...')).length;
    
    if (exclamationCount > messages.length * 0.3) analysis.punctuation = 'excessive';
    else if (ellipsisCount > messages.length * 0.2) analysis.punctuation = 'minimal';
    
    // Check capitalization style
    const lowercaseCount = messages.filter(m => m === m.toLowerCase()).length;
    const randomCapsCount = messages.filter(m => /[a-z][A-Z]|[A-Z]{2,}[a-z]/.test(m)).length;
    
    if (lowercaseCount > messages.length * 0.7) analysis.capitalization = 'lowercase';
    else if (randomCapsCount > messages.length * 0.2) analysis.capitalization = 'random';
    
    // Average length
    analysis.avgLength = messages.reduce((sum, m) => sum + m.length, 0) / messages.length;
    
    // Check for intentional typos
    const commonTypos = ['ur', 'u', 'thx', 'pls', 'rn', 'tmrw', 'prolly'];
    analysis.hasTypos = messages.some(m => commonTypos.some(typo => m.includes(typo)));
    
    return analysis;
  }
  
  private extractPatterns(messages: string[], regex: RegExp): string[] {
    const patterns = new Set<string>();
    messages.forEach(m => {
      const matches = m.match(regex);
      if (matches) patterns.add(matches[0]);
    });
    return Array.from(patterns).slice(0, 10);
  }
  
  private extractEmojis(messages: string[]): string[] {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/gu;
    const emojiCount = new Map<string, number>();
    
    messages.forEach(m => {
      const emojis = m.match(emojiRegex) || [];
      emojis.forEach(emoji => {
        emojiCount.set(emoji, (emojiCount.get(emoji) || 0) + 1);
      });
    });
    
    return Array.from(emojiCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([emoji]) => emoji);
  }
  
  private extractCommonPhrases(messages: string[]): string[] {
    // Extract 3-5 word phrases that appear multiple times
    const phrases = new Map<string, number>();
    
    messages.forEach(m => {
      const words = m.toLowerCase().split(/\s+/);
      for (let i = 0; i <= words.length - 3; i++) {
        const phrase = words.slice(i, i + 3).join(' ');
        if (phrase.length > 10) {
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    });
    
    return Array.from(phrases.entries())
      .filter(([_, count]) => count > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase]) => phrase);
  }
  
  private extractOpenings(messages: string[]): string[] {
    // Get first messages in conversations
    return messages
      .filter(m => /^(hey|hi|hello|sup|good|how)/i.test(m))
      .slice(0, 10);
  }
  
  private extractPPVPitches(messages: string[]): string[] {
    return messages
      .filter(m => /\$\d+|unlock|tip|ppv|exclusive|special/i.test(m))
      .slice(0, 10);
  }
  
  private extractCompliments(messages: string[]): string[] {
    return messages
      .filter(m => /(sexy|hot|cute|beautiful|handsome|amazing|love your|like your)/i.test(m))
      .slice(0, 10);
  }
  
  private extractRejectionResponses(messages: string[]): string[] {
    return messages
      .filter(m => /(no worries|maybe later|understand|all good|let me know)/i.test(m))
      .slice(0, 5);
  }
  
  // Generate message in creator's style
  async generateInStyle(
    profile: PersonalityProfile,
    messageType: 'greeting' | 'ppv' | 'followup' | 'compliment',
    context?: any
  ): Promise<string> {
    let baseMessage = '';
    
    switch (messageType) {
      case 'greeting':
        baseMessage = this.randomFrom(profile.patterns.openingLines);
        break;
      case 'ppv':
        baseMessage = this.randomFrom(profile.patterns.ppvPitch);
        break;
      case 'compliment':
        baseMessage = this.randomFrom(profile.patterns.complimentStyle);
        break;
    }
    
    // Apply style
    if (profile.style.capitalization === 'lowercase') {
      baseMessage = baseMessage.toLowerCase();
    } else if (profile.style.capitalization === 'random') {
      baseMessage = this.randomizeCapitalization(baseMessage);
    }
    
    // Add emojis
    if (profile.vocabulary.emojis.length > 0 && Math.random() > 0.3) {
      baseMessage += ' ' + this.randomFrom(profile.vocabulary.emojis);
    }
    
    // Add typos if that's their style
    if (profile.style.typos && Math.random() > 0.7) {
      baseMessage = this.addTypos(baseMessage);
    }
    
    return baseMessage;
  }
  
  private randomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  private randomizeCapitalization(text: string): string {
    return text.split(' ').map(word => {
      if (Math.random() > 0.7) {
        return word.toUpperCase();
      }
      return word;
    }).join(' ');
  }
  
  private addTypos(text: string): string {
    const typoMap: Record<string, string> = {
      'you': 'u',
      'your': 'ur',
      'thanks': 'thx',
      'please': 'pls',
      'right now': 'rn',
      'tomorrow': 'tmrw',
      'probably': 'prolly'
    };
    
    let result = text;
    Object.entries(typoMap).forEach(([correct, typo]) => {
      if (Math.random() > 0.5) {
        result = result.replace(new RegExp(`\\b${correct}\\b`, 'gi'), typo);
      }
    });
    
    return result;
  }
}

export const personalityTraining = new PersonalityTrainingService();
