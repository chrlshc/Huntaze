/**
 * Property Test: Message Block Grouping Consistency
 * Feature: messages-saas-density-polish
 * Property 1: Message Block Grouping Consistency
 * 
 * For any sequence of messages from the same author within the time threshold,
 * grouping them into a message block should result in the avatar and timestamp
 * appearing only on the first message.
 * 
 * Validates: Requirements 1.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  messageArbitrary,
  sameAuthorMessagesArbitrary,
  groupMessagesByAuthor,
  sortMessagesByTime,
  type Message,
} from './property-test-utils';
import { groupMessages } from '../../../lib/messages/message-grouping';

describe('Property Test: Message Block Grouping Consistency', () => {
  it('should group consecutive messages from same author within time threshold', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 2, maxLength: 20 }),
        (messages) => {
          const sorted = sortMessagesByTime(messages);
          const blocks = groupMessages(sorted);

          // Property: Each block should have consistent author
          return blocks.every(block =>
            block.messages.every(msg => msg.author.id === block.messages[0].author.id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show avatar only on first message of each block', () => {
    fc.assert(
      fc.property(
        sameAuthorMessagesArbitrary(2, 10),
        (messages) => {
          const blocks = groupMessages(messages);

          // Property: Only first message should have showAvatar = true
          return blocks.every(block => {
            const avatarCount = block.messages.filter(msg => msg.showAvatar).length;
            return avatarCount === 1 && block.messages[0].showAvatar === true;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show timestamp only on last message of each block', () => {
    fc.assert(
      fc.property(
        sameAuthorMessagesArbitrary(2, 10),
        (messages) => {
          const blocks = groupMessages(messages);

          // Property: Only last message should have showTimestamp = true
          return blocks.every(block => {
            const timestampCount = block.messages.filter(msg => msg.showTimestamp).length;
            const lastIndex = block.messages.length - 1;
            return (
              timestampCount === 1 &&
              block.messages[lastIndex].showTimestamp === true
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create new block when author changes', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 3, maxLength: 20 }),
        (messages) => {
          const sorted = sortMessagesByTime(messages);
          const blocks = groupMessages(sorted);

          // Property: Adjacent blocks should have different authors
          for (let i = 1; i < blocks.length; i++) {
            const prevAuthor = blocks[i - 1].messages[0].author.id;
            const currAuthor = blocks[i].messages[0].author.id;
            if (prevAuthor === currAuthor) {
              // If same author, check time gap is > 5 minutes
              const prevTime = blocks[i - 1].messages[blocks[i - 1].messages.length - 1].timestamp;
              const currTime = blocks[i].messages[0].timestamp;
              const gapMs = currTime.getTime() - prevTime.getTime();
              if (gapMs <= 300000) {
                // Should have been grouped
                return false;
              }
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create new block when time gap exceeds threshold', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(messageArbitrary, { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 6, max: 60 }) // minutes gap
        ),
        ([messages, gapMinutes]) => {
          // Create two messages from same author with large time gap
          if (messages.length === 0) return true;

          const author = messages[0].author;
          const baseTime = new Date('2024-12-09T10:00:00');
          
          const msg1: Message = {
            ...messages[0],
            author,
            timestamp: baseTime,
          };

          const msg2: Message = {
            ...messages[0],
            id: 'msg2',
            author,
            timestamp: new Date(baseTime.getTime() + gapMinutes * 60000),
          };

          const blocks = groupMessages([msg1, msg2]);

          // Property: Should create separate blocks if gap > 5 minutes
          if (gapMinutes > 5) {
            return blocks.length === 2;
          } else {
            return blocks.length === 1;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain message order within blocks', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 2, maxLength: 20 }),
        (messages) => {
          const sorted = sortMessagesByTime(messages);
          const blocks = groupMessages(sorted);

          // Property: Messages within each block should be in chronological order
          return blocks.every(block => {
            for (let i = 1; i < block.messages.length; i++) {
              const prevTime = block.messages[i - 1].timestamp.getTime();
              const currTime = block.messages[i].timestamp.getTime();
              if (prevTime > currTime) {
                return false;
              }
            }
            return true;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty message arrays', () => {
    const blocks = groupMessages([]);
    expect(blocks).toEqual([]);
  });

  it('should handle single message', () => {
    fc.assert(
      fc.property(
        messageArbitrary,
        (message) => {
          const blocks = groupMessages([message]);
          return (
            blocks.length === 1 &&
            blocks[0].messages.length === 1 &&
            blocks[0].messages[0].showAvatar === true &&
            blocks[0].messages[0].showTimestamp === true
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve message properties during grouping', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 1, maxLength: 20 }),
        (messages) => {
          const blocks = groupMessages(messages);
          const flattenedMessages = blocks.flatMap(block => block.messages);

          // Property: All original messages should be present
          return flattenedMessages.length === messages.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});
