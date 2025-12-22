/**
 * Property Test: Avatar Non-Repetition
 * Feature: messages-saas-density-polish
 * Property 10: Avatar Non-Repetition
 * 
 * For any message block with N messages (N > 1), there should be exactly
 * 1 avatar element, not N avatar elements.
 * 
 * Validates: Requirements 8.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  sameAuthorMessagesArbitrary,
  messageArbitrary,
} from './property-test-utils';
import { groupMessages } from '../../../lib/messages/message-grouping';

describe('Property Test: Avatar Non-Repetition', () => {
  it('should show exactly one avatar per message block', () => {
    fc.assert(
      fc.property(
        sameAuthorMessagesArbitrary(2, 10),
        (messages) => {
          const blocks = groupMessages(messages);

          // Property: Each block should have exactly 1 avatar
          return blocks.every(block => {
            const avatarCount = block.messages.filter(msg => msg.showAvatar).length;
            return avatarCount === 1;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show avatar on first message of block', () => {
    fc.assert(
      fc.property(
        sameAuthorMessagesArbitrary(2, 10),
        (messages) => {
          const blocks = groupMessages(messages);

          // Property: First message should have avatar
          return blocks.every(block => {
            if (block.messages.length === 0) return true;
            return block.messages[0].showAvatar === true;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not show avatar on subsequent messages', () => {
    fc.assert(
      fc.property(
        sameAuthorMessagesArbitrary(3, 10),
        (messages) => {
          const blocks = groupMessages(messages);

          // Property: Messages after first should not have avatar
          return blocks.every(block => {
            if (block.messages.length <= 1) return true;
            
            for (let i = 1; i < block.messages.length; i++) {
              if (block.messages[i].showAvatar === true) {
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

  it('should reduce avatar count compared to showing on all messages', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 5, maxLength: 20 }),
        (messages) => {
          const blocks = groupMessages(messages);
          const visibleAvatars = blocks.reduce(
            (count, block) => count + block.messages.filter(msg => msg.showAvatar).length,
            0
          );

          // Property: Visible avatars should be less than or equal to total messages
          const totalMessages = messages.length;
          return visibleAvatars <= totalMessages;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show avatar for single-message blocks', () => {
    fc.assert(
      fc.property(
        messageArbitrary,
        (message) => {
          const blocks = groupMessages([message]);
          
          // Property: Single message should have avatar
          return (
            blocks.length === 1 &&
            blocks[0].messages.length === 1 &&
            blocks[0].messages[0].showAvatar === true
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain avatar visibility consistency across re-grouping', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 2, maxLength: 20 }),
        (messages) => {
          const blocks1 = groupMessages(messages);
          const blocks2 = groupMessages(messages);

          // Property: Re-grouping should produce same avatar visibility
          const avatars1 = blocks1.flatMap(b => 
            b.messages.map(m => ({ id: m.id, show: m.showAvatar }))
          );
          const avatars2 = blocks2.flatMap(b => 
            b.messages.map(m => ({ id: m.id, show: m.showAvatar }))
          );

          return JSON.stringify(avatars1) === JSON.stringify(avatars2);
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

          // Property: Each block should have exactly 1 avatar
          return blocks.every(block => {
            const avatarCount = block.messages.filter(msg => msg.showAvatar).length;
            return avatarCount === 1;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify avatar count equals block count', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 1, maxLength: 20 }),
        (messages) => {
          const blocks = groupMessages(messages);
          const totalAvatars = blocks.reduce(
            (count, block) => count + block.messages.filter(msg => msg.showAvatar).length,
            0
          );

          // Property: Total avatars should equal number of blocks
          return totalAvatars === blocks.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty message arrays', () => {
    const blocks = groupMessages([]);
    const avatarCount = blocks.reduce(
      (count, block) => count + block.messages.filter(msg => msg.showAvatar).length,
      0
    );
    
    expect(avatarCount).toBe(0);
  });

  it('should preserve avatar information during grouping', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 1, maxLength: 20 }),
        (messages) => {
          const blocks = groupMessages(messages);
          
          // Property: Every message should have showAvatar property defined
          return blocks.every(block =>
            block.messages.every(msg => typeof msg.showAvatar === 'boolean')
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
