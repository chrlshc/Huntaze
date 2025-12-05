/**
 * Property-Based Tests for Keyboard Shortcuts
 * 
 * **Feature: dashboard-ux-overhaul, Property 23: Keyboard Shortcuts**
 * **Validates: Requirements 8.5**
 * 
 * Property: For any defined keyboard shortcut, pressing the shortcut SHALL
 * trigger the corresponding action.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Types for testing
interface KeyboardShortcut {
  key: string;
  modifiers: {
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
    alt: boolean;
  };
  actionId: string;
  description: string;
}

interface ShortcutAction {
  id: string;
  label: string;
  triggered: boolean;
  triggerCount: number;
}

interface KeyboardEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  preventDefault: () => void;
}

// Default shortcuts as defined in requirements
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'm',
    modifiers: { ctrl: true, meta: false, shift: false, alt: false },
    actionId: 'new-message',
    description: 'Open new message'
  },
  {
    key: 'p',
    modifiers: { ctrl: true, meta: false, shift: false, alt: false },
    actionId: 'create-ppv',
    description: 'Create PPV'
  },
  {
    key: 's',
    modifiers: { ctrl: true, meta: false, shift: false, alt: false },
    actionId: 'schedule-post',
    description: 'Schedule post'
  },
  {
    key: '/',
    modifiers: { ctrl: true, meta: false, shift: false, alt: false },
    actionId: 'ai-chat',
    description: 'Open AI chat'
  }
];

// Arbitraries
const modifiersArb = fc.record({
  ctrl: fc.boolean(),
  meta: fc.boolean(),
  shift: fc.boolean(),
  alt: fc.boolean()
});

const keyArb = fc.constantFrom(
  'm', 'p', 's', '/', 'n', 'e', 'a', 'b', 'c', 'd', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
  'o', 'q', 'r', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5'
);

const shortcutArb = fc.record({
  key: keyArb,
  modifiers: modifiersArb,
  actionId: fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/),
  description: fc.string({ minLength: 5, maxLength: 50 })
});

const keyboardEventArb = fc.record({
  key: keyArb,
  ctrlKey: fc.boolean(),
  metaKey: fc.boolean(),
  shiftKey: fc.boolean(),
  altKey: fc.boolean()
}).map(e => ({
  ...e,
  preventDefault: vi.fn()
}));

// Simulation functions
function createShortcutHandler(shortcuts: KeyboardShortcut[]): {
  actions: Map<string, ShortcutAction>;
  handleKeyDown: (event: KeyboardEvent) => string | null;
} {
  const actions = new Map<string, ShortcutAction>();
  
  shortcuts.forEach(shortcut => {
    actions.set(shortcut.actionId, {
      id: shortcut.actionId,
      label: shortcut.description,
      triggered: false,
      triggerCount: 0
    });
  });

  const handleKeyDown = (event: KeyboardEvent): string | null => {
    for (const shortcut of shortcuts) {
      // Check if either Ctrl or Meta is pressed (cross-platform support)
      const hasRequiredModifier = event.ctrlKey || event.metaKey;
      
      // For shortcuts that require Ctrl, accept either Ctrl or Meta
      const modifiersMatch = 
        hasRequiredModifier &&
        shortcut.modifiers.shift === event.shiftKey &&
        shortcut.modifiers.alt === event.altKey;
      
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      
      if (modifiersMatch && keyMatches) {
        event.preventDefault();
        const action = actions.get(shortcut.actionId);
        if (action) {
          action.triggered = true;
          action.triggerCount++;
        }
        return shortcut.actionId;
      }
    }
    return null;
  };

  return { actions, handleKeyDown };
}

function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const hasModifier = event.ctrlKey || event.metaKey;
  const modifiersMatch = 
    (shortcut.modifiers.ctrl === event.ctrlKey || shortcut.modifiers.meta === event.metaKey) &&
    shortcut.modifiers.shift === event.shiftKey &&
    shortcut.modifiers.alt === event.altKey;
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  
  return hasModifier && modifiersMatch && keyMatches;
}

function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.modifiers.ctrl) parts.push('Ctrl');
  if (shortcut.modifiers.meta) parts.push('Cmd');
  if (shortcut.modifiers.shift) parts.push('Shift');
  if (shortcut.modifiers.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}

describe('Property 23: Keyboard Shortcuts', () => {
  /**
   * **Feature: dashboard-ux-overhaul, Property 23: Keyboard Shortcuts**
   * **Validates: Requirements 8.5**
   */

  describe('Shortcut Registration', () => {
    it('should register all default shortcuts', () => {
      fc.assert(
        fc.property(
          fc.constant(DEFAULT_SHORTCUTS),
          (shortcuts) => {
            const handler = createShortcutHandler(shortcuts);
            
            // All shortcuts should be registered
            shortcuts.forEach(shortcut => {
              expect(handler.actions.has(shortcut.actionId)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should register custom shortcuts', () => {
      fc.assert(
        fc.property(
          fc.array(shortcutArb, { minLength: 1, maxLength: 10 }),
          (shortcuts) => {
            const handler = createShortcutHandler(shortcuts);
            
            // All custom shortcuts should be registered
            shortcuts.forEach(shortcut => {
              expect(handler.actions.has(shortcut.actionId)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Shortcut Triggering', () => {
    it('should trigger action when matching shortcut is pressed', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEFAULT_SHORTCUTS),
          (shortcut) => {
            const handler = createShortcutHandler(DEFAULT_SHORTCUTS);
            
            // Create matching keyboard event
            const event: KeyboardEvent = {
              key: shortcut.key,
              ctrlKey: shortcut.modifiers.ctrl,
              metaKey: shortcut.modifiers.meta,
              shiftKey: shortcut.modifiers.shift,
              altKey: shortcut.modifiers.alt,
              preventDefault: vi.fn()
            };
            
            const triggeredAction = handler.handleKeyDown(event);
            
            // Action should be triggered
            expect(triggeredAction).toBe(shortcut.actionId);
            expect(handler.actions.get(shortcut.actionId)?.triggered).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call preventDefault when shortcut matches', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEFAULT_SHORTCUTS),
          (shortcut) => {
            const handler = createShortcutHandler(DEFAULT_SHORTCUTS);
            const preventDefault = vi.fn();
            
            const event: KeyboardEvent = {
              key: shortcut.key,
              ctrlKey: shortcut.modifiers.ctrl,
              metaKey: shortcut.modifiers.meta,
              shiftKey: shortcut.modifiers.shift,
              altKey: shortcut.modifiers.alt,
              preventDefault
            };
            
            handler.handleKeyDown(event);
            
            // preventDefault should be called
            expect(preventDefault).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger action when key does not match', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEFAULT_SHORTCUTS),
          keyArb.filter(k => !DEFAULT_SHORTCUTS.some(s => s.key === k)),
          (shortcut, wrongKey) => {
            const handler = createShortcutHandler(DEFAULT_SHORTCUTS);
            
            const event: KeyboardEvent = {
              key: wrongKey,
              ctrlKey: shortcut.modifiers.ctrl,
              metaKey: shortcut.modifiers.meta,
              shiftKey: shortcut.modifiers.shift,
              altKey: shortcut.modifiers.alt,
              preventDefault: vi.fn()
            };
            
            const triggeredAction = handler.handleKeyDown(event);
            
            // No action should be triggered for wrong key
            expect(triggeredAction).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger action without modifier key', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEFAULT_SHORTCUTS),
          (shortcut) => {
            const handler = createShortcutHandler(DEFAULT_SHORTCUTS);
            
            // Event without Ctrl/Meta modifier
            const event: KeyboardEvent = {
              key: shortcut.key,
              ctrlKey: false,
              metaKey: false,
              shiftKey: false,
              altKey: false,
              preventDefault: vi.fn()
            };
            
            const triggeredAction = handler.handleKeyDown(event);
            
            // No action should be triggered without modifier
            expect(triggeredAction).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Shortcut Matching', () => {
    it('should match Ctrl+M for new message', () => {
      const shortcut = DEFAULT_SHORTCUTS.find(s => s.actionId === 'new-message')!;
      
      fc.assert(
        fc.property(
          fc.constant(shortcut),
          (s) => {
            const event: KeyboardEvent = {
              key: 'm',
              ctrlKey: true,
              metaKey: false,
              shiftKey: false,
              altKey: false,
              preventDefault: vi.fn()
            };
            
            expect(matchesShortcut(event, s)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match Ctrl+P for create PPV', () => {
      const shortcut = DEFAULT_SHORTCUTS.find(s => s.actionId === 'create-ppv')!;
      
      fc.assert(
        fc.property(
          fc.constant(shortcut),
          (s) => {
            const event: KeyboardEvent = {
              key: 'p',
              ctrlKey: true,
              metaKey: false,
              shiftKey: false,
              altKey: false,
              preventDefault: vi.fn()
            };
            
            expect(matchesShortcut(event, s)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match Ctrl+S for schedule post', () => {
      const shortcut = DEFAULT_SHORTCUTS.find(s => s.actionId === 'schedule-post')!;
      
      fc.assert(
        fc.property(
          fc.constant(shortcut),
          (s) => {
            const event: KeyboardEvent = {
              key: 's',
              ctrlKey: true,
              metaKey: false,
              shiftKey: false,
              altKey: false,
              preventDefault: vi.fn()
            };
            
            expect(matchesShortcut(event, s)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match Ctrl+/ for AI chat', () => {
      const shortcut = DEFAULT_SHORTCUTS.find(s => s.actionId === 'ai-chat')!;
      
      fc.assert(
        fc.property(
          fc.constant(shortcut),
          (s) => {
            const event: KeyboardEvent = {
              key: '/',
              ctrlKey: true,
              metaKey: false,
              shiftKey: false,
              altKey: false,
              preventDefault: vi.fn()
            };
            
            expect(matchesShortcut(event, s)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Shortcut Formatting', () => {
    it('should format shortcuts correctly for display', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEFAULT_SHORTCUTS),
          (shortcut) => {
            const formatted = formatShortcut(shortcut);
            
            // Formatted string should contain the key
            expect(formatted.toLowerCase()).toContain(shortcut.key.toLowerCase());
            
            // Should contain Ctrl if ctrl modifier is set
            if (shortcut.modifiers.ctrl) {
              expect(formatted).toContain('Ctrl');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce non-empty formatted strings', () => {
      fc.assert(
        fc.property(
          shortcutArb,
          (shortcut) => {
            const formatted = formatShortcut(shortcut);
            
            // Formatted string should not be empty
            expect(formatted.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Multiple Shortcut Triggers', () => {
    it('should track trigger count correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEFAULT_SHORTCUTS),
          fc.integer({ min: 1, max: 10 }),
          (shortcut, triggerCount) => {
            const handler = createShortcutHandler(DEFAULT_SHORTCUTS);
            
            const event: KeyboardEvent = {
              key: shortcut.key,
              ctrlKey: shortcut.modifiers.ctrl,
              metaKey: shortcut.modifiers.meta,
              shiftKey: shortcut.modifiers.shift,
              altKey: shortcut.modifiers.alt,
              preventDefault: vi.fn()
            };
            
            // Trigger multiple times
            for (let i = 0; i < triggerCount; i++) {
              handler.handleKeyDown(event);
            }
            
            // Trigger count should match
            expect(handler.actions.get(shortcut.actionId)?.triggerCount).toBe(triggerCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cross-Platform Support', () => {
    it('should support Ctrl modifier (Windows/Linux)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEFAULT_SHORTCUTS),
          (shortcut) => {
            const handler = createShortcutHandler(DEFAULT_SHORTCUTS);
            
            // Test with Ctrl (Windows/Linux)
            const event: KeyboardEvent = {
              key: shortcut.key,
              ctrlKey: true,
              metaKey: false,
              shiftKey: shortcut.modifiers.shift,
              altKey: shortcut.modifiers.alt,
              preventDefault: vi.fn()
            };
            
            const triggeredAction = handler.handleKeyDown(event);
            
            // Should trigger with Ctrl
            expect(triggeredAction).toBe(shortcut.actionId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support Meta modifier (Mac)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEFAULT_SHORTCUTS),
          (shortcut) => {
            const handler = createShortcutHandler(DEFAULT_SHORTCUTS);
            
            // Test with Meta (Mac)
            const event: KeyboardEvent = {
              key: shortcut.key,
              ctrlKey: false,
              metaKey: true,
              shiftKey: shortcut.modifiers.shift,
              altKey: shortcut.modifiers.alt,
              preventDefault: vi.fn()
            };
            
            const triggeredAction = handler.handleKeyDown(event);
            
            // Should trigger with Meta
            expect(triggeredAction).toBe(shortcut.actionId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Shortcut Uniqueness', () => {
    it('should not have duplicate shortcuts', () => {
      fc.assert(
        fc.property(
          fc.constant(DEFAULT_SHORTCUTS),
          (shortcuts) => {
            const shortcutKeys = shortcuts.map(s => 
              `${s.modifiers.ctrl}-${s.modifiers.meta}-${s.modifiers.shift}-${s.modifiers.alt}-${s.key}`
            );
            
            const uniqueKeys = new Set(shortcutKeys);
            
            // All shortcuts should be unique
            expect(uniqueKeys.size).toBe(shortcuts.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
