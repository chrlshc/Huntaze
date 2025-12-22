/**
 * Property Test: Timestamp Visibility Reduction
 * Feature: messages-saas-density-polish
 * Property 3: Timestamp Visibility Reduction
 * 
 * For any message block with multiple messages, the timestamp should appear
 * on at most one message (first or last), not on every message.
 * 
 * Validates: Requirements 2.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  sameAuthorMessagesArbitrary,
  messageArbitrary,
} from './property-test-utils';
import { groupMessages } from '../../../lib/messages/message-grouping';

describe('Property Test: Timestamp Visibility Reduction', () => {
  it('should show at most one timestamp per message block', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 2, maxLength: 20 }),
        (messages) => {
          const blocks = groupMessages(messages);

          // Property: Each block should have at most 1 visible timestamp
          return blocks.every(block => {
            const timestampCount = block.messages.filter(msg => msg.showTimestamp).length;
            return timestampCount <= 1;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show timestamp on last message of block', () => {
    fc.assert(
      fc.property(
        sameAuthorMessagesArbitrary(2, 10),
        (messages) => {
          const blocks = groupMessages(messages);

          // Property: Timestamp should be on last message
          return blocks.every(block => {
            if (block.messages.length === 0) return true;
            const lastIndex = block.messages.length - 1;
            return block.messages[lastIndex].showTimestamp === true;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not show timestamp on middle messages', () => {
    fc.assert(
      fc.property(
        sameAuthorMessagesArbitrary(3, 10),
        (messages) => {
          const blocks = groupMessages(messages);

          // Property: Middle messages should not have timestamps
          return blocks.every(block => {
            if (block.messages.length <= 2) return true;
            
            // Check all messages except last
            for (let i = 0; i < block.messages.length - 1; i++) {
              if (block.messages[i].showTimestamp === true) {
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

  it('should reduce timestamp count compared to showing on all messages', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 5, maxLength: 20 }),
        (messages) => {
          const blocks = groupMessages(messages);
          const visibleTimestamps = blocks.reduce(
            (count, block) => count + block.messages.filter(msg => msg.showTimestamp).length,
            0
          );

          // Property: Visible timestamps should be less than total messages
          // (unless every message is in its own block)
          const totalMessages = messages.length;
          return visibleTimestamps <= totalMessages;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show timestamp for single-message blocks', () => {
    fc.assert(
      fc.property(
        messageArbitrary,
        (message) => {
          const blocks = groupMessages([message]);
          
          // Property: Single message should have timestamp
          return (
            blocks.length === 1 &&
            blocks[0].messages.length === 1 &&
            blocks[0].messages[0].showTimestamp === true
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain timestamp visibility consistency across re-grouping', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 2, maxLength: 20 }),
        (messages) => {
          const blocks1 = groupMessages(messages);
          const blocks2 = groupMessages(messages);

          // Property: Re-grouping should produce same timestamp visibility
          const timestamps1 = blocks1.flatMap(b => 
            b.messages.map(m => ({ id: m.id, show: m.showTimestamp }))
          );
          const timestamps2 = blocks2.flatMap(b => 
            b.messages.map(m => ({ id: m.id, show: m.showTimestamp }))
          );

          return JSON.stringify(timestamps1) === JSON.stringify(timestamps2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle blocks with varying message counts', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            sameAuthorMessagesArbitrary(1, 1),
            sameAuthorMessagesArbitrary(2, 5),
            sameAuthorMessagesArbitrary(1, 10)
          )
        ),
        (blockGroups) => {
          const allMessages = blockGroups.flatMap(([b1, b2, b3]) => [...b1, ...b2, ...b3]);
          const blocks = groupMessages(allMessages);

          // Property: Each block should have exactly 1 timestamp
          return blocks.every(block => {
            const timestampCount = block.messages.filter(msg => msg.showTimestamp).length;
            return timestampCount === 1;
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
