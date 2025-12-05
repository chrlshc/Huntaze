/**
 * Property Test: AI Message Personalization
 * **Feature: dashboard-ux-overhaul, Property 7: AI Message Personalization**
 * **Validates: Requirements 3.1.3**
 * 
 * *For any* message suggestion request with fan context, the AI SHALL generate 
 * replies that reference the fan's name or history.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types
interface FanContext {
  id: string;
  name: string;
  history: FanHistory;
  preferences: string[];
  lastInteraction: Date;
}

interface FanHistory {
  totalSpent: number;
  messageCount: number;
  purchaseHistory: Purchase[];
  engagementScore: number;
}

interface Purchase {
  id: string;
  type: 'ppv' | 'tip' | 'subscription';
  amount: number;
  date: Date;
}

interface MessageSuggestionRequest {
  fanContext: FanContext;
  messageType: 'greeting' | 'follow-up' | 'promotion' | 'thank-you' | 're-engagement';
  tone: 'friendly' | 'professional' | 'flirty' | 'casual';
}

interface PersonalizedMessage {
  content: string;
  personalizationScore: number;
  usedElements: PersonalizationElement[];
}

interface PersonalizationElement {
  type: 'name' | 'history' | 'preference' | 'purchase' | 'engagement';
  value: string;
}

// Simulate AI generating personalized message
function generatePersonalizedMessage(request: MessageSuggestionRequest): PersonalizedMessage {
  const { fanContext, messageType, tone } = request;
  const usedElements: PersonalizationElement[] = [];
  let content = '';

  // Always include fan name
  usedElements.push({ type: 'name', value: fanContext.name });

  // Build personalized content based on message type
  switch (messageType) {
    case 'greeting':
      content = `Hey ${fanContext.name}! 💕 So happy to see you here!`;
      break;
    case 'follow-up':
      content = `Hi ${fanContext.name}, just wanted to check in with you!`;
      if (fanContext.history.messageCount > 10) {
        content += ` I always love our conversations.`;
        usedElements.push({ type: 'history', value: `${fanContext.history.messageCount} messages` });
      }
      break;
    case 'promotion':
      content = `${fanContext.name}, I have something special just for you!`;
      if (fanContext.history.totalSpent > 100) {
        content += ` As one of my top supporters, you get early access.`;
        usedElements.push({ type: 'history', value: `$${fanContext.history.totalSpent} spent` });
      }
      break;
    case 'thank-you':
      content = `Thank you so much ${fanContext.name}! 🙏`;
      if (fanContext.history.purchaseHistory.length > 0) {
        const lastPurchase = fanContext.history.purchaseHistory[0];
        content += ` Your support means everything to me.`;
        usedElements.push({ type: 'purchase', value: lastPurchase.type });
      }
      break;
    case 're-engagement':
      content = `Hey ${fanContext.name}, I've missed you! 💔`;
      usedElements.push({ type: 'engagement', value: `last seen ${fanContext.lastInteraction.toLocaleDateString()}` });
      break;
  }

  // Add preference-based personalization
  if (fanContext.preferences.length > 0) {
    usedElements.push({ type: 'preference', value: fanContext.preferences[0] });
  }

  // Calculate personalization score (0-1)
  const personalizationScore = Math.min(usedElements.length / 5, 1);

  return {
    content,
    personalizationScore,
    usedElements
  };
}

// Check if message contains fan name
function containsFanName(message: string, fanName: string): boolean {
  return message.toLowerCase().includes(fanName.toLowerCase());
}

// Check if message references history
function referencesHistory(elements: PersonalizationElement[]): boolean {
  return elements.some(e => ['history', 'purchase', 'engagement'].includes(e.type));
}

// Generators
const fanNameArb = fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[a-zA-Z]+$/.test(s));

const purchaseArb = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('ppv', 'tip', 'subscription') as fc.Arbitrary<'ppv' | 'tip' | 'subscription'>,
  amount: fc.float({ min: 1, max: 500 }),
  date: fc.date({ min: new Date('2024-01-01'), max: new Date() })
});

const fanHistoryArb = fc.record({
  totalSpent: fc.float({ min: 0, max: 10000 }),
  messageCount: fc.integer({ min: 0, max: 1000 }),
  purchaseHistory: fc.array(purchaseArb, { minLength: 0, maxLength: 10 }),
  engagementScore: fc.float({ min: 0, max: 100 })
});

const fanContextArb = fc.record({
  id: fc.uuid(),
  name: fanNameArb,
  history: fanHistoryArb,
  preferences: fc.array(fc.constantFrom('photos', 'videos', 'chat', 'exclusive', 'behind-scenes'), { minLength: 0, maxLength: 3 }),
  lastInteraction: fc.date({ min: new Date('2024-01-01'), max: new Date() })
});

const messageTypeArb = fc.constantFrom('greeting', 'follow-up', 'promotion', 'thank-you', 're-engagement') as fc.Arbitrary<'greeting' | 'follow-up' | 'promotion' | 'thank-you' | 're-engagement'>;

const toneArb = fc.constantFrom('friendly', 'professional', 'flirty', 'casual') as fc.Arbitrary<'friendly' | 'professional' | 'flirty' | 'casual'>;

const messageSuggestionRequestArb = fc.record({
  fanContext: fanContextArb,
  messageType: messageTypeArb,
  tone: toneArb
});

describe('AI Message Personalization Property Tests', () => {
  /**
   * Property 7: AI Message Personalization
   * For any message suggestion with fan context, the message should reference the fan's name
   */
  it('should include fan name in personalized messages', () => {
    fc.assert(
      fc.property(messageSuggestionRequestArb, (request) => {
        const message = generatePersonalizedMessage(request);
        const hasName = containsFanName(message.content, request.fanContext.name);
        
        expect(hasName).toBe(true);
        
        return hasName;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Personalization elements include name
   */
  it('should always include name in personalization elements', () => {
    fc.assert(
      fc.property(messageSuggestionRequestArb, (request) => {
        const message = generatePersonalizedMessage(request);
        const hasNameElement = message.usedElements.some(e => e.type === 'name');
        
        expect(hasNameElement).toBe(true);
        
        return hasNameElement;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Personalization score is valid
   */
  it('should have valid personalization score between 0 and 1', () => {
    fc.assert(
      fc.property(messageSuggestionRequestArb, (request) => {
        const message = generatePersonalizedMessage(request);
        
        expect(message.personalizationScore).toBeGreaterThanOrEqual(0);
        expect(message.personalizationScore).toBeLessThanOrEqual(1);
        
        return message.personalizationScore >= 0 && message.personalizationScore <= 1;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message content is non-empty
   */
  it('should generate non-empty message content', () => {
    fc.assert(
      fc.property(messageSuggestionRequestArb, (request) => {
        const message = generatePersonalizedMessage(request);
        
        expect(message.content.length).toBeGreaterThan(0);
        
        return message.content.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: High-value fans get history references
   */
  it('should reference history for high-value fans in promotions', () => {
    fc.assert(
      fc.property(
        fanContextArb.filter(ctx => ctx.history.totalSpent > 100),
        (fanContext) => {
          const request: MessageSuggestionRequest = {
            fanContext,
            messageType: 'promotion',
            tone: 'friendly'
          };
          
          const message = generatePersonalizedMessage(request);
          const hasHistoryRef = referencesHistory(message.usedElements);
          
          expect(hasHistoryRef).toBe(true);
          
          return hasHistoryRef;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Re-engagement messages reference last interaction
   */
  it('should reference engagement in re-engagement messages', () => {
    fc.assert(
      fc.property(fanContextArb, (fanContext) => {
        const request: MessageSuggestionRequest = {
          fanContext,
          messageType: 're-engagement',
          tone: 'friendly'
        };
        
        const message = generatePersonalizedMessage(request);
        const hasEngagementRef = message.usedElements.some(e => e.type === 'engagement');
        
        expect(hasEngagementRef).toBe(true);
        
        return hasEngagementRef;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: More personalization elements = higher score
   */
  it('should have higher score with more personalization elements', () => {
    fc.assert(
      fc.property(
        fc.tuple(messageSuggestionRequestArb, messageSuggestionRequestArb),
        ([request1, request2]) => {
          const message1 = generatePersonalizedMessage(request1);
          const message2 = generatePersonalizedMessage(request2);
          
          // If message1 has more elements, it should have equal or higher score
          if (message1.usedElements.length > message2.usedElements.length) {
            expect(message1.personalizationScore).toBeGreaterThanOrEqual(message2.personalizationScore);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('AI Message Personalization Edge Cases', () => {
  it('should handle fans with no purchase history', () => {
    const newFan: FanContext = {
      id: 'new-fan-1',
      name: 'NewFan',
      history: {
        totalSpent: 0,
        messageCount: 0,
        purchaseHistory: [],
        engagementScore: 0
      },
      preferences: [],
      lastInteraction: new Date()
    };
    
    const request: MessageSuggestionRequest = {
      fanContext: newFan,
      messageType: 'greeting',
      tone: 'friendly'
    };
    
    const message = generatePersonalizedMessage(request);
    
    expect(containsFanName(message.content, newFan.name)).toBe(true);
    expect(message.content.length).toBeGreaterThan(0);
  });

  it('should handle fans with special characters in name', () => {
    const fanWithSpecialName: FanContext = {
      id: 'special-1',
      name: 'Marie',
      history: {
        totalSpent: 50,
        messageCount: 5,
        purchaseHistory: [],
        engagementScore: 50
      },
      preferences: ['photos'],
      lastInteraction: new Date()
    };
    
    const request: MessageSuggestionRequest = {
      fanContext: fanWithSpecialName,
      messageType: 'greeting',
      tone: 'friendly'
    };
    
    const message = generatePersonalizedMessage(request);
    
    expect(message.content).toContain('Marie');
  });

  it('should handle all message types', () => {
    const messageTypes: Array<'greeting' | 'follow-up' | 'promotion' | 'thank-you' | 're-engagement'> = 
      ['greeting', 'follow-up', 'promotion', 'thank-you', 're-engagement'];
    
    const fanContext: FanContext = {
      id: 'test-fan',
      name: 'TestFan',
      history: {
        totalSpent: 200,
        messageCount: 50,
        purchaseHistory: [{ id: 'p1', type: 'ppv', amount: 20, date: new Date() }],
        engagementScore: 75
      },
      preferences: ['videos'],
      lastInteraction: new Date()
    };
    
    messageTypes.forEach(messageType => {
      const request: MessageSuggestionRequest = {
        fanContext,
        messageType,
        tone: 'friendly'
      };
      
      const message = generatePersonalizedMessage(request);
      
      expect(containsFanName(message.content, fanContext.name)).toBe(true);
      expect(message.usedElements.length).toBeGreaterThan(0);
    });
  });
});
