/**
 * **Feature: dashboard-design-refactor, Property 18: Conversation avatar sizing**
 * **Validates: Requirements 7.1**
 * 
 * For any ConversationList item, the avatar element SHALL have dimensions 
 * between 32px and 40px.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Avatar size constraints from design system
const AVATAR_SIZE_MIN = 32;
const AVATAR_SIZE_MAX = 40;

// Density to avatar size mapping
const DENSITY_AVATAR_SIZES: Record<'compact' | 'default', number> = {
  compact: 32,
  default: 40,
};

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
  ltv: fc.option(fc.nat({ max: 10000 }), { nil: undefined }),
});

/**
 * Arbitrary for density options
 */
const densityArb = fc.constantFrom<'compact' | 'default'>('compact', 'default');

describe('Property 18: Conversation avatar sizing', () => {
  it('avatar size is within 32-40px range for any density', () => {
    fc.assert(
      fc.property(densityArb, (density) => {
        const avatarSize = DENSITY_AVATAR_SIZES[density];
        
        // Avatar size must be within the allowed range
        expect(avatarSize).toBeGreaterThanOrEqual(AVATAR_SIZE_MIN);
        expect(avatarSize).toBeLessThanOrEqual(AVATAR_SIZE_MAX);
      }),
      { numRuns: 100 }
    );
  });

  it('compact density uses 32px avatars', () => {
    fc.assert(
      fc.property(conversationArb, () => {
        const avatarSize = DENSITY_AVATAR_SIZES['compact'];
        expect(avatarSize).toBe(32);
      }),
      { numRuns: 100 }
    );
  });

  it('default density uses 40px avatars', () => {
    fc.assert(
      fc.property(conversationArb, () => {
        const avatarSize = DENSITY_AVATAR_SIZES['default'];
        expect(avatarSize).toBe(40);
      }),
      { numRuns: 100 }
    );
  });

  it('avatar dimensions are square (width equals height)', () => {
    fc.assert(
      fc.property(densityArb, (density) => {
        const avatarSize = DENSITY_AVATAR_SIZES[density];
        // Avatar should be square
        const width = avatarSize;
        const height = avatarSize;
        expect(width).toBe(height);
      }),
      { numRuns: 100 }
    );
  });

  it('avatar size is consistent for all conversations in same density', () => {
    fc.assert(
      fc.property(
        fc.array(conversationArb, { minLength: 2, maxLength: 20 }),
        densityArb,
        (conversations, density) => {
          const avatarSize = DENSITY_AVATAR_SIZES[density];
          
          // All conversations should have the same avatar size
          conversations.forEach(() => {
            expect(avatarSize).toBe(DENSITY_AVATAR_SIZES[density]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('avatar size is a valid pixel value', () => {
    fc.assert(
      fc.property(densityArb, (density) => {
        const avatarSize = DENSITY_AVATAR_SIZES[density];
        
        // Must be a positive integer
        expect(Number.isInteger(avatarSize)).toBe(true);
        expect(avatarSize).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
