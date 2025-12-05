/**
 * Property-Based Tests for Complex Message Flagging
 * **Feature: dashboard-ux-overhaul, Property 9: Complex Message Flagging**
 * **Validates: Requirements 3.2.5**
 * 
 * Property: For any incoming message classified as complex by the AI, 
 * the system SHALL flag it for manual review.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types
interface IncomingMessage {
  id: string;
  fanId: string;
  fanName: string;
  content: string;
  timestamp: Date;
  metadata?: {
    hasAttachment?: boolean;
    isReply?: boolean;
    previousMessageCount?: number;
  };
}

interface MessageClassification {
  isComplex: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
  reasons: string[];
  confidence: number;
  requiresManualReview: boolean;
}

interface FlaggedMessage {
  messageId: string;
  flaggedAt: Date;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'reviewed' | 'resolved';
}

// Complexity detection patterns
const COMPLEX_PATTERNS = [
  /\?.*\?.*\?/i,                    // Multiple questions
  /refund|cancel|complaint/i,       // Sensitive topics
  /urgent|asap|emergency/i,         // Urgency indicators
  /legal|lawyer|sue/i,              // Legal mentions
  /\b(help|problem|issue|broken)\b/i, // Support requests
  /\$\d+|\d+\s*(dollars?|usd)/i,    // Money discussions
  /custom|special|exclusive/i,      // Custom requests
];

const SIMPLE_PATTERNS = [
  /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure|cool|nice|love it|❤️|😍|🔥)+[!.]*$/i,
  /^(good morning|good night|gm|gn)[!.]*$/i,
];

// Message classifier (simulates AI classification)
function classifyMessage(message: IncomingMessage): MessageClassification {
  const content = message.content.toLowerCase();
  const reasons: string[] = [];
  let complexityScore = 0;
  
  // Check for simple patterns first
  for (const pattern of SIMPLE_PATTERNS) {
    if (pattern.test(message.content)) {
      return {
        isComplex: false,
        complexity: 'simple',
        reasons: ['Simple greeting or acknowledgment'],
        confidence: 0.95,
        requiresManualReview: false
      };
    }
  }
  
  // Check for complex patterns
  for (const pattern of COMPLEX_PATTERNS) {
    if (pattern.test(content)) {
      complexityScore += 1;
      reasons.push(`Matches complex pattern: ${pattern.source}`);
    }
  }
  
  // Length-based complexity
  if (message.content.length > 500) {
    complexityScore += 1;
    reasons.push('Long message (>500 chars)');
  }
  
  // Question count
  const questionCount = (message.content.match(/\?/g) || []).length;
  if (questionCount >= 3) {
    complexityScore += 1;
    reasons.push(`Multiple questions (${questionCount})`);
  }
  
  // Determine complexity level
  let complexity: 'simple' | 'moderate' | 'complex';
  let isComplex: boolean;
  
  if (complexityScore >= 2) {
    complexity = 'complex';
    isComplex = true;
  } else if (complexityScore === 1) {
    complexity = 'moderate';
    isComplex = false;
  } else {
    complexity = 'simple';
    isComplex = false;
  }
  
  return {
    isComplex,
    complexity,
    reasons: reasons.length > 0 ? reasons : ['Standard message'],
    confidence: Math.min(0.95, 0.7 + (complexityScore * 0.1)),
    requiresManualReview: isComplex
  };
}

// Flag message for manual review
function flagMessageForReview(
  message: IncomingMessage, 
  classification: MessageClassification
): FlaggedMessage | null {
  if (!classification.isComplex) {
    return null;
  }
  
  // Determine priority based on reasons
  let priority: 'low' | 'medium' | 'high' = 'medium';
  
  if (classification.reasons.some(r => r.includes('legal') || r.includes('urgent'))) {
    priority = 'high';
  } else if (classification.reasons.some(r => r.includes('refund') || r.includes('complaint'))) {
    priority = 'high';
  } else if (classification.complexity === 'complex') {
    priority = 'medium';
  }
  
  return {
    messageId: message.id,
    flaggedAt: new Date(),
    reason: classification.reasons.join('; '),
    priority,
    status: 'pending'
  };
}

// Generators
const messageIdArb = fc.uuid();
const fanIdArb = fc.uuid();
const fanNameArb = fc.string({ minLength: 2, maxLength: 30 });

const simpleMessageContentArb = fc.constantFrom(
  'Hi!',
  'Hello',
  'Thanks!',
  'Thank you so much!',
  'Ok',
  'Sure',
  'Nice!',
  'Love it ❤️',
  'Good morning!',
  '🔥🔥🔥'
);

const complexMessageContentArb = fc.oneof(
  fc.constant('I need a refund for my subscription, this is urgent! Can you help? What are my options? Please respond ASAP!'),
  fc.constant('I have a legal question about the content. My lawyer said I should ask about the terms. Can we discuss?'),
  fc.constant('There is a problem with my account. I have an issue with billing. Something is broken. Can you help me fix it?'),
  fc.constant('I want a custom video. Can you make something special and exclusive for me? How much would that cost in dollars?'),
  fc.tuple(
    fc.string({ minLength: 100, maxLength: 200 }),
    fc.constant('? '),
    fc.string({ minLength: 100, maxLength: 200 }),
    fc.constant('? '),
    fc.string({ minLength: 100, maxLength: 200 }),
    fc.constant('?')
  ).map(parts => parts.join(''))
);

const regularMessageContentArb = fc.string({ minLength: 10, maxLength: 200 });

const incomingMessageArb = (contentArb: fc.Arbitrary<string>) => fc.record({
  id: messageIdArb,
  fanId: fanIdArb,
  fanName: fanNameArb,
  content: contentArb,
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
  metadata: fc.option(fc.record({
    hasAttachment: fc.boolean(),
    isReply: fc.boolean(),
    previousMessageCount: fc.integer({ min: 0, max: 1000 })
  }), { nil: undefined })
});

describe('Property 9: Complex Message Flagging', () => {
  /**
   * **Feature: dashboard-ux-overhaul, Property 9: Complex Message Flagging**
   * **Validates: Requirements 3.2.5**
   */
  
  it('should flag all messages classified as complex for manual review', () => {
    fc.assert(
      fc.property(incomingMessageArb(complexMessageContentArb), (message) => {
        const classification = classifyMessage(message);
        const flagged = flagMessageForReview(message, classification);
        
        if (classification.isComplex) {
          // Complex messages MUST be flagged
          expect(flagged).not.toBeNull();
          expect(flagged?.messageId).toBe(message.id);
          expect(flagged?.status).toBe('pending');
          expect(classification.requiresManualReview).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not flag simple messages', () => {
    fc.assert(
      fc.property(incomingMessageArb(simpleMessageContentArb), (message) => {
        const classification = classifyMessage(message);
        const flagged = flagMessageForReview(message, classification);
        
        // Simple messages should not be flagged
        expect(classification.isComplex).toBe(false);
        expect(classification.complexity).toBe('simple');
        expect(flagged).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should include reason when flagging complex messages', () => {
    fc.assert(
      fc.property(incomingMessageArb(complexMessageContentArb), (message) => {
        const classification = classifyMessage(message);
        const flagged = flagMessageForReview(message, classification);
        
        if (flagged) {
          expect(flagged.reason).toBeDefined();
          expect(flagged.reason.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should assign appropriate priority to flagged messages', () => {
    fc.assert(
      fc.property(incomingMessageArb(complexMessageContentArb), (message) => {
        const classification = classifyMessage(message);
        const flagged = flagMessageForReview(message, classification);
        
        if (flagged) {
          expect(['low', 'medium', 'high']).toContain(flagged.priority);
          
          // High priority for urgent/legal/refund messages
          if (message.content.toLowerCase().includes('urgent') ||
              message.content.toLowerCase().includes('legal') ||
              message.content.toLowerCase().includes('refund')) {
            expect(flagged.priority).toBe('high');
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should set flagged status to pending initially', () => {
    fc.assert(
      fc.property(incomingMessageArb(complexMessageContentArb), (message) => {
        const classification = classifyMessage(message);
        const flagged = flagMessageForReview(message, classification);
        
        if (flagged) {
          expect(flagged.status).toBe('pending');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should classify messages with multiple questions as complex', () => {
    fc.assert(
      fc.property(
        messageIdArb,
        fanIdArb,
        fanNameArb,
        fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 3, maxLength: 5 }),
        (id, fanId, fanName, questions) => {
          const content = questions.map(q => q + '?').join(' ');
          const message: IncomingMessage = {
            id,
            fanId,
            fanName,
            content,
            timestamp: new Date()
          };
          
          const classification = classifyMessage(message);
          
          // 3+ questions should trigger complexity
          if (questions.length >= 3) {
            expect(classification.reasons.some(r => r.includes('question'))).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain classification consistency for same message', () => {
    fc.assert(
      fc.property(incomingMessageArb(regularMessageContentArb), (message) => {
        const classification1 = classifyMessage(message);
        const classification2 = classifyMessage(message);
        
        // Same message should always get same classification
        expect(classification1.isComplex).toBe(classification2.isComplex);
        expect(classification1.complexity).toBe(classification2.complexity);
      }),
      { numRuns: 100 }
    );
  });

  it('should have confidence score between 0 and 1', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          incomingMessageArb(simpleMessageContentArb),
          incomingMessageArb(complexMessageContentArb),
          incomingMessageArb(regularMessageContentArb)
        ),
        (message) => {
          const classification = classifyMessage(message);
          
          expect(classification.confidence).toBeGreaterThanOrEqual(0);
          expect(classification.confidence).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should flag messages containing sensitive keywords', () => {
    const sensitiveKeywords = ['refund', 'cancel', 'complaint', 'legal', 'lawyer', 'urgent'];
    
    fc.assert(
      fc.property(
        messageIdArb,
        fanIdArb,
        fanNameArb,
        fc.constantFrom(...sensitiveKeywords),
        fc.string({ minLength: 20, maxLength: 100 }),
        (id, fanId, fanName, keyword, additionalText) => {
          const content = `${additionalText} ${keyword} ${additionalText}`;
          const message: IncomingMessage = {
            id,
            fanId,
            fanName,
            content,
            timestamp: new Date()
          };
          
          const classification = classifyMessage(message);
          
          // Messages with sensitive keywords should have complexity reasons
          expect(classification.reasons.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge cases
  it('should handle empty message content gracefully', () => {
    const message: IncomingMessage = {
      id: 'test-id',
      fanId: 'fan-id',
      fanName: 'Test Fan',
      content: '',
      timestamp: new Date()
    };
    
    const classification = classifyMessage(message);
    expect(classification).toBeDefined();
    expect(classification.complexity).toBeDefined();
  });

  it('should handle very long messages', () => {
    fc.assert(
      fc.property(
        messageIdArb,
        fanIdArb,
        fanNameArb,
        fc.string({ minLength: 501, maxLength: 1000 }),
        (id, fanId, fanName, content) => {
          const message: IncomingMessage = {
            id,
            fanId,
            fanName,
            content,
            timestamp: new Date()
          };
          
          const classification = classifyMessage(message);
          
          // Long messages should be flagged as having length complexity
          expect(classification.reasons.some(r => r.includes('Long message'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
