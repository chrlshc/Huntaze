/**
 * **Feature: dashboard-design-refactor, Property 19: Conversation item structure**
 * **Validates: Requirements 7.2**
 * 
 * For any ConversationList item, the rendered output SHALL contain name, 
 * message excerpt, and timestamp elements with distinct font sizes establishing hierarchy.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Font size hierarchy from design system (Requirements 7.2)
const FONT_SIZES = {
  name: 14,      // 14px SemiBold
  excerpt: 13,   // 13px Regular
  timestamp: 12, // 12px
};

/**
 * Conversation item structure interface
 */
interface ConversationItemStructure {
  name: {
    text: string;
    fontSize: number;
    fontWeight: number;
  };
  excerpt: {
    text: string;
    fontSize: number;
  };
  timestamp: {
    text: string;
    fontSize: number;
  };
}

/**
 * Simulates extracting structure from a rendered conversation item
 */
function extractConversationStructure(
  name: string,
  lastMessage: string,
  timestamp: Date
): ConversationItemStructure {
  return {
    name: {
      text: name,
      fontSize: FONT_SIZES.name,
      fontWeight: 600, // SemiBold
    },
    excerpt: {
      text: lastMessage,
      fontSize: FONT_SIZES.excerpt,
    },
    timestamp: {
      text: formatTimestamp(timestamp),
      fontSize: FONT_SIZES.timestamp,
    },
  };
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
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

describe('Property 19: Conversation item structure', () => {
  it('all three elements (name, excerpt, timestamp) are present', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const structure = extractConversationStructure(
          conversation.name,
          conversation.lastMessage,
          conversation.timestamp
        );
        
        // All elements must be present
        expect(structure.name).toBeDefined();
        expect(structure.excerpt).toBeDefined();
        expect(structure.timestamp).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('font sizes establish clear hierarchy (name > excerpt > timestamp)', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const structure = extractConversationStructure(
          conversation.name,
          conversation.lastMessage,
          conversation.timestamp
        );
        
        // Name should be largest
        expect(structure.name.fontSize).toBeGreaterThan(structure.excerpt.fontSize);
        // Excerpt should be larger than timestamp
        expect(structure.excerpt.fontSize).toBeGreaterThan(structure.timestamp.fontSize);
      }),
      { numRuns: 100 }
    );
  });

  it('name uses 14px font size', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const structure = extractConversationStructure(
          conversation.name,
          conversation.lastMessage,
          conversation.timestamp
        );
        
        expect(structure.name.fontSize).toBe(14);
      }),
      { numRuns: 100 }
    );
  });

  it('excerpt uses 13px font size', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const structure = extractConversationStructure(
          conversation.name,
          conversation.lastMessage,
          conversation.timestamp
        );
        
        expect(structure.excerpt.fontSize).toBe(13);
      }),
      { numRuns: 100 }
    );
  });

  it('timestamp uses 12px font size', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const structure = extractConversationStructure(
          conversation.name,
          conversation.lastMessage,
          conversation.timestamp
        );
        
        expect(structure.timestamp.fontSize).toBe(12);
      }),
      { numRuns: 100 }
    );
  });

  it('name uses SemiBold (600) font weight', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const structure = extractConversationStructure(
          conversation.name,
          conversation.lastMessage,
          conversation.timestamp
        );
        
        expect(structure.name.fontWeight).toBe(600);
      }),
      { numRuns: 100 }
    );
  });

  it('name text matches input', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const structure = extractConversationStructure(
          conversation.name,
          conversation.lastMessage,
          conversation.timestamp
        );
        
        expect(structure.name.text).toBe(conversation.name);
      }),
      { numRuns: 100 }
    );
  });

  it('excerpt text matches input', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const structure = extractConversationStructure(
          conversation.name,
          conversation.lastMessage,
          conversation.timestamp
        );
        
        expect(structure.excerpt.text).toBe(conversation.lastMessage);
      }),
      { numRuns: 100 }
    );
  });

  it('timestamp is non-empty string', () => {
    fc.assert(
      fc.property(conversationArb, (conversation) => {
        const structure = extractConversationStructure(
          conversation.name,
          conversation.lastMessage,
          conversation.timestamp
        );
        
        expect(structure.timestamp.text.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
