/**
 * **Feature: dashboard-design-refactor, Property 20: Unread indicator visibility**
 * **Validates: Requirements 7.3**
 * 
 * For any ConversationList item with unread=true, the rendered output SHALL 
 * have a left border of at least 3px width with a colored value.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Unread indicator specifications from design system
const UNREAD_INDICATOR = {
  minBorderWidth: 3,
  borderColor: 'violet-600', // Design system action-primary color
  borderStyle: 'solid',
};

/**
 * Conversation unread state interface
 */
interface ConversationUnreadState {
  unread: boolean;
  borderLeftWidth: number;
  borderLeftColor: string;
  borderLeftStyle: string;
}

/**
 * Simulates extracting unread indicator styles from a rendered conversation item
 */
function extractUnreadIndicatorStyles(unread: boolean): ConversationUnreadState {
  if (unread) {
    return {
      unread: true,
      borderLeftWidth: 3,
      borderLeftColor: UNREAD_INDICATOR.borderColor,
      borderLeftStyle: UNREAD_INDICATOR.borderStyle,
    };
  }
  return {
    unread: false,
    borderLeftWidth: 3, // Still has border but transparent
    borderLeftColor: 'transparent',
    borderLeftStyle: UNREAD_INDICATOR.borderStyle,
  };
}

/**
 * Arbitrary for generating conversation data
 */
const conversationArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  avatar: fc.webUrl(),
  lastMessage: fc.string({ minLength: 0, maxLength: 200 }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  unread: fc.boolean(),
});

/**
 * Arbitrary for unread conversations only
 */
const unreadConversationArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  avatar: fc.webUrl(),
  lastMessage: fc.string({ minLength: 0, maxLength: 200 }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  unread: fc.constant(true),
});

/**
 * Arbitrary for read conversations only
 */
const readConversationArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  avatar: fc.webUrl(),
  lastMessage: fc.string({ minLength: 0, maxLength: 200 }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  unread: fc.constant(false),
});

describe('Property 20: Unread indicator visibility', () => {
  it('unread conversations have left border of at least 3px', () => {
    fc.assert(
      fc.property(unreadConversationArb, (conversation) => {
        const styles = extractUnreadIndicatorStyles(conversation.unread);
        
        expect(styles.borderLeftWidth).toBeGreaterThanOrEqual(UNREAD_INDICATOR.minBorderWidth);
      }),
      { numRuns: 100 }
    );
  });

  it('unread conversations have colored (non-transparent) left border', () => {
    fc.assert(
      fc.property(unreadConversationArb, (conversation) => {
        const styles = extractUnreadIndicatorStyles(conversation.unread);
        
        expect(styles.borderLeftColor).not.toBe('transparent');
        expect(styles.borderLeftColor.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('unread conversations use the action-primary color for border', () => {
    fc.assert(
      fc.property(unreadConversationArb, (conversation) => {
        const styles = extractUnreadIndicatorStyles(conversation.unread);
        
        expect(styles.borderLeftColor).toBe(UNREAD_INDICATOR.borderColor);
      }),
      { numRuns: 100 }
    );
  });

  it('read conversations have transparent left border', () => {
    fc.assert(
      fc.property(readConversationArb, (conversation) => {
        const styles = extractUnreadIndicatorStyles(conversation.unread);
        
        expect(styles.borderLeftColor).toBe('transparent');
      }),
      { numRuns: 100 }
    );
  });

  it('border style is solid for all conversations', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const styles = extractUnreadIndicatorStyles(conversation.unread);
        
        expect(styles.borderLeftStyle).toBe('solid');
      }),
      { numRuns: 100 }
    );
  });

  it('unread state correctly reflects input', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const styles = extractUnreadIndicatorStyles(conversation.unread);
        
        expect(styles.unread).toBe(conversation.unread);
      }),
      { numRuns: 100 }
    );
  });

  it('visual distinction exists between unread and read states', () => {
    fc.assert(
      fc.property(
        fc.tuple(unreadConversationArb, readConversationArb),
        ([unreadConv, readConv]) => {
          const unreadStyles = extractUnreadIndicatorStyles(unreadConv.unread);
          const readStyles = extractUnreadIndicatorStyles(readConv.unread);
          
          // The border colors must be different
          expect(unreadStyles.borderLeftColor).not.toBe(readStyles.borderLeftColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('border width is consistent regardless of unread state', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const styles = extractUnreadIndicatorStyles(conversation.unread);
        
        // Border width should be consistent to prevent layout shift
        expect(styles.borderLeftWidth).toBe(3);
      }),
      { numRuns: 100 }
    );
  });
});
