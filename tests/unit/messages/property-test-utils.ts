/**
 * Property-Based Testing Utilities for Messages SaaS Density & Polish
 * 
 * This file provides arbitraries (random data generators) and utilities
 * for property-based testing using fast-check.
 */

import * as fc from 'fast-check';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Author {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  author: Author;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'failed';
}

export interface MessageBlock {
  author: Author;
  messages: Message[];
  timestamp: Date;
  isOwn: boolean;
}

export interface Conversation {
  id: string;
  fanId: string;
  fanName: string;
  avatarUrl: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isActive: boolean;
}

// ============================================================================
// Arbitraries (Random Data Generators)
// ============================================================================

/**
 * Generates random Author objects
 */
export const authorArbitrary: fc.Arbitrary<Author> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 20 }),
  avatarUrl: fc.webUrl(),
});

/**
 * Generates random Message objects
 */
export const messageArbitrary: fc.Arbitrary<Message> = fc.record({
  id: fc.uuid(),
  content: fc.lorem({ maxCount: 50 }),
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
  author: authorArbitrary,
  isOwn: fc.boolean(),
  status: fc.option(fc.constantFrom('sending', 'sent', 'failed'), { nil: undefined }),
});

/**
 * Generates random Conversation objects
 */
export const conversationArbitrary: fc.Arbitrary<Conversation> = fc.record({
  id: fc.uuid(),
  fanId: fc.uuid(),
  fanName: fc.string({ minLength: 3, maxLength: 20 }),
  avatarUrl: fc.webUrl(),
  lastMessage: fc.lorem({ maxCount: 20 }),
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
  unreadCount: fc.integer({ min: 0, max: 99 }),
  isActive: fc.boolean(),
});

/**
 * Generates a sequence of messages from the same author
 * Useful for testing message grouping
 */
export const sameAuthorMessagesArbitrary = (
  minLength: number = 2,
  maxLength: number = 10
): fc.Arbitrary<Message[]> => {
  return fc.tuple(
    authorArbitrary,
    fc.array(
      fc.record({
        id: fc.uuid(),
        content: fc.lorem({ maxCount: 50 }),
        timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        isOwn: fc.boolean(),
        status: fc.option(fc.constantFrom('sending', 'sent', 'failed'), { nil: undefined }),
      }),
      { minLength, maxLength }
    )
  ).map(([author, messages]) => 
    messages.map(msg => ({ ...msg, author }))
  );
};

/**
 * Generates messages with controlled time gaps
 * Useful for testing time-based grouping
 */
export const messagesWithTimeGapsArbitrary = (
  baseTime: Date = new Date('2024-12-09T10:00:00'),
  maxGapMinutes: number = 10
): fc.Arbitrary<Message[]> => {
  return fc.array(
    fc.record({
      id: fc.uuid(),
      content: fc.lorem({ maxCount: 50 }),
      minutesAfterBase: fc.integer({ min: 0, max: maxGapMinutes }),
      author: authorArbitrary,
      isOwn: fc.boolean(),
    }),
    { minLength: 2, maxLength: 20 }
  ).map(messages => 
    messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: new Date(baseTime.getTime() + msg.minutesAfterBase * 60000),
      author: msg.author,
      isOwn: msg.isOwn,
    }))
  );
};

/**
 * Generates viewport widths for responsive testing
 */
export const viewportWidthArbitrary: fc.Arbitrary<number> = fc.integer({
  min: 1024,
  max: 3840,
});

/**
 * Generates spacing values (for testing grid compliance)
 */
export const spacingValueArbitrary: fc.Arbitrary<number> = fc.integer({
  min: 0,
  max: 100,
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if a value is aligned to the 8px grid (multiple of 4)
 */
export function isGridAligned(value: number): boolean {
  return value % 4 === 0;
}

/**
 * Calculates WCAG contrast ratio between two colors
 * @param color1 Hex color (e.g., '#111827')
 * @param color2 Hex color (e.g., '#FFFFFF')
 */
export function calculateContrast(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if messages have a day boundary between them
 */
export function hasDayBoundary(messages: Message[]): boolean {
  if (messages.length < 2) return false;

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1].timestamp;
    const curr = messages[i].timestamp;
    
    if (prev.toDateString() !== curr.toDateString()) {
      return true;
    }
  }

  return false;
}

/**
 * Sorts messages by timestamp (ascending)
 */
export function sortMessagesByTime(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Groups messages by author and time threshold
 */
export function groupMessagesByAuthor(
  messages: Message[],
  maxTimeBetweenMs: number = 300000 // 5 minutes
): MessageBlock[] {
  const sorted = sortMessagesByTime(messages);
  const blocks: MessageBlock[] = [];
  let currentBlock: MessageBlock | null = null;

  for (const message of sorted) {
    const shouldStartNewBlock =
      !currentBlock ||
      currentBlock.author.id !== message.author.id ||
      message.timestamp.getTime() - currentBlock.timestamp.getTime() > maxTimeBetweenMs;

    if (shouldStartNewBlock) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        author: message.author,
        messages: [message],
        timestamp: message.timestamp,
        isOwn: message.isOwn,
      };
    } else {
      currentBlock.messages.push(message);
    }
  }

  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

/**
 * Extracts spacing values from CSS string
 * @param cssText CSS text containing margin/padding declarations
 */
export function extractSpacingValues(cssText: string): number[] {
  const spacingRegex = /(?:margin|padding)(?:-(?:top|right|bottom|left))?:\s*(\d+)px/g;
  const values: number[] = [];
  let match;

  while ((match = spacingRegex.exec(cssText)) !== null) {
    values.push(parseInt(match[1], 10));
  }

  return values;
}

/**
 * Checks if all spacing values in CSS are grid-aligned
 */
export function areAllSpacingsGridAligned(cssText: string): boolean {
  const values = extractSpacingValues(cssText);
  return values.every(isGridAligned);
}
