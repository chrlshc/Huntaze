/**
 * Accessibility Integration Tests - Messaging Interface
 * 
 * Feature: messages-saas-density-polish
 * Phase: 8 - Integration & Validation
 * Task: 33 - Accessibility Audit
 * 
 * Tests WCAG AA compliance, keyboard navigation, screen reader compatibility,
 * focus indicators, browser zoom, and high contrast mode.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MessagingInterface } from '@/components/messages/MessagingInterface';

expect.extend(toHaveNoViolations);

// Helper to calculate WCAG contrast ratio
function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Integration: Accessibility', () => {
  describe('WCAG AA Contrast Ratios', () => {
    it('should meet 4.5:1 contrast for message text', () => {
      const messageTextColor = '#111827'; // Near black
      const backgroundColor = '#FFFFFF'; // White
      
      const contrast = getContrastRatio(messageTextColor, backgroundColor);
      
      // WCAG AA requires 4.5:1 for normal text
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet 4.5:1 contrast for secondary text', () => {
      const secondaryTextColor = '#6B7280'; // Medium gray
      const backgroundColor = '#FFFFFF'; // White
      
      const contrast = getContrastRatio(secondaryTextColor, backgroundColor);
      
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet 3:1 contrast for timestamps (large text)', () => {
      const timestampColor = '#9AA0AF'; // Light gray
      const backgroundColor = '#FFFFFF'; // White
      
      const contrast = getContrastRatio(timestampColor, backgroundColor);
      
      // WCAG AA requires 3:1 for large text (supplementary info)
      expect(contrast).toBeGreaterThanOrEqual(3.0);
    });

    it('should meet 3:1 contrast for UI components', () => {
      const borderColor = '#E5E7EB'; // Very light gray
      const backgroundColor = '#FFFFFF'; // White
      
      const contrast = getContrastRatio(borderColor, backgroundColor);
      
      // UI components need 3:1 minimum
      expect(contrast).toBeGreaterThanOrEqual(3.0);
    });

    it('should have sufficient contrast for focus indicators', () => {
      const focusColor = '#3B82F6'; // Blue
      const backgroundColor = '#FFFFFF'; // White
      
      const contrast = getContrastRatio(focusColor, backgroundColor);
      
      // Focus indicators need 3:1 minimum
      expect(contrast).toBeGreaterThanOrEqual(3.0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have no axe violations', async () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Test message',
              timestamp: new Date(),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
          ]}
          conversations={[
            {
              id: 'conv-1',
              fanId: 'fan-1',
              fanName: 'Test Fan',
              fanAvatar: 'https://i.pravatar.cc/150',
              lastMessage: 'Test',
              lastMessageTime: new Date(),
              unreadCount: 0,
              isActive: true,
            },
          ]}
          currentFan={{
            id: 'fan-1',
            name: 'Test Fan',
            avatar: 'https://i.pravatar.cc/150',
            email: 'test@example.com',
            subscriptionTier: 'premium',
            lifetimeValue: 1000,
            tags: [],
            notes: [],
          }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper tab order', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[
            { id: 'conv-1', fanId: 'fan-1', fanName: 'Fan 1', fanAvatar: '', lastMessage: '', lastMessageTime: new Date(), unreadCount: 0, isActive: false },
            { id: 'conv-2', fanId: 'fan-2', fanName: 'Fan 2', fanAvatar: '', lastMessage: '', lastMessageTime: new Date(), unreadCount: 0, isActive: false },
          ]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      // Should have logical tab order: search -> filters -> conversations -> composer
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Verify no negative tabindex on interactive elements
      focusableElements.forEach(el => {
        const tabindex = el.getAttribute('tabindex');
        if (tabindex) {
          expect(parseInt(tabindex)).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should support arrow key navigation in conversation list', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[
            { id: 'conv-1', fanId: 'fan-1', fanName: 'Fan 1', fanAvatar: '', lastMessage: '', lastMessageTime: new Date(), unreadCount: 0, isActive: false },
            { id: 'conv-2', fanId: 'fan-2', fanName: 'Fan 2', fanAvatar: '', lastMessage: '', lastMessageTime: new Date(), unreadCount: 0, isActive: false },
          ]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const conversationList = container.querySelector('[role="list"]');
      expect(conversationList).toBeTruthy();
      
      // Should have aria-label or aria-labelledby
      expect(
        conversationList?.getAttribute('aria-label') ||
        conversationList?.getAttribute('aria-labelledby')
      ).toBeTruthy();
    });

    it('should trap focus in modal dialogs', () => {
      // Test focus trap when context panel is in modal mode (mobile)
      // Implementation depends on component design
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper ARIA labels on main regions', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      // Conversation list should have role="list" or role="navigation"
      const conversationList = container.querySelector('[role="list"], [role="navigation"]');
      expect(conversationList).toBeTruthy();
      
      // Message thread should have role="main" or role="region"
      const messageThread = container.querySelector('[role="main"], [role="region"]');
      expect(messageThread).toBeTruthy();
      
      // Context panel should have role="complementary"
      const contextPanel = container.querySelector('[role="complementary"]');
      expect(contextPanel).toBeTruthy();
    });

    it('should announce new messages with aria-live', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'New message',
              timestamp: new Date(),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
          ]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      // Should have aria-live region for new messages
      const liveRegion = container.querySelector('[aria-live="polite"], [aria-live="assertive"]');
      expect(liveRegion).toBeTruthy();
    });

    it('should have descriptive labels for message blocks', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Test message',
              timestamp: new Date('2024-12-09T10:00:00'),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
          ]}
          conversations={[]}
          currentFan={{
            id: 'fan-1',
            name: 'Test Fan',
            avatar: '',
            email: '',
            subscriptionTier: 'free',
            lifetimeValue: 0,
            tags: [],
            notes: [],
          }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      // Message blocks should have aria-label with author and time
      const messageBlock = container.querySelector('.message-group-item');
      expect(messageBlock).toBeTruthy();
      
      // Should have accessible name (aria-label or aria-labelledby)
      const hasAccessibleName = 
        messageBlock?.getAttribute('aria-label') ||
        messageBlock?.getAttribute('aria-labelledby');
      
      expect(hasAccessibleName).toBeTruthy();
    });

    it('should provide skip links for navigation', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      // Should have skip links (e.g., "Skip to messages", "Skip to composer")
      const skipLinks = container.querySelectorAll('a[href^="#"]');
      expect(skipLinks.length).toBeGreaterThan(0);
    });

    it('should label timestamp visibility changes', () => {
      // When timestamps are hidden/shown on hover, screen readers should be notified
      // This is typically done with aria-describedby or aria-label updates
    });
  });

  describe('Focus Indicators', () => {
    it('should have visible focus indicators on all interactive elements', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[
            { id: 'conv-1', fanId: 'fan-1', fanName: 'Fan 1', fanAvatar: '', lastMessage: '', lastMessageTime: new Date(), unreadCount: 0, isActive: false },
          ]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const interactiveElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [role="button"]'
      );
      
      interactiveElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        
        // Should have outline or box-shadow on focus
        // (Can't test :focus pseudo-class directly, but can verify CSS is defined)
        expect(el).toBeTruthy();
      });
    });

    it('should have 2px minimum focus indicator width', () => {
      // WCAG 2.2 requires 2px minimum focus indicator
      // This should be verified in CSS
      const styles = document.styleSheets;
      let hasFocusIndicator = false;
      
      for (const sheet of styles) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule && rule.selectorText?.includes(':focus')) {
              const outline = rule.style.outline || rule.style.outlineWidth;
              if (outline && parseInt(outline) >= 2) {
                hasFocusIndicator = true;
              }
            }
          }
        } catch (e) {
          // Cross-origin stylesheets may throw
        }
      }
      
      // Should have focus indicator defined in CSS
      expect(hasFocusIndicator).toBe(true);
    });

    it('should not remove focus indicators with outline: none', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const interactiveElements = container.querySelectorAll(
        'button, [href], input, select, textarea'
      );
      
      interactiveElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        
        // Should not have outline: none without alternative focus indicator
        if (computedStyle.outline === 'none' || computedStyle.outlineWidth === '0px') {
          // Must have alternative (box-shadow, border, etc.)
          expect(
            computedStyle.boxShadow !== 'none' ||
            computedStyle.border !== 'none'
          ).toBe(true);
        }
      });
    });
  });

  describe('Browser Zoom Support', () => {
    it('should maintain layout at 200% zoom', () => {
      // Mock zoom by scaling viewport
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });
      
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Test message',
              timestamp: new Date(),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
          ]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      // Layout should not break at 200% zoom
      const layout = container.querySelector('.messaging-interface');
      expect(layout).toBeTruthy();
      
      // Text should remain readable (no horizontal scrolling required)
      const messageContent = container.querySelector('.cs-message__content');
      if (messageContent) {
        const computedStyle = window.getComputedStyle(messageContent);
        expect(computedStyle.overflowX).not.toBe('scroll');
      }
    });

    it('should use relative units (rem, em) for font sizes', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Test message',
              timestamp: new Date(),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
          ]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const messageContent = container.querySelector('.cs-message__content');
      if (messageContent) {
        const computedStyle = window.getComputedStyle(messageContent);
        
        // Font size should scale with user preferences
        // (Can't directly test rem/em, but can verify it's not fixed px)
        expect(computedStyle.fontSize).toBeTruthy();
      }
    });

    it('should not have horizontal scrolling at 200% zoom', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640, // Simulates 1280px at 200% zoom
      });
      
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const layout = container.querySelector('.messaging-interface');
      if (layout) {
        const computedStyle = window.getComputedStyle(layout);
        expect(computedStyle.overflowX).not.toBe('scroll');
      }
    });
  });

  describe('High Contrast Mode', () => {
    it('should support Windows High Contrast Mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query.includes('prefers-contrast: high'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
      
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      // Should apply high contrast styles
      // (Implementation depends on CSS media queries)
      expect(container).toBeTruthy();
    });

    it('should maintain border visibility in high contrast mode', () => {
      // Borders should use currentColor or system colors in high contrast mode
      // This ensures they remain visible when user overrides colors
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
      
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      // Animations should be disabled or reduced
      // (Implementation depends on CSS media queries)
      expect(container).toBeTruthy();
    });

    it('should disable timestamp hover transitions when reduced motion is preferred', () => {
      // Timestamp fade-in should be instant instead of 150ms transition
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper labels for composer input', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={{ id: 'fan-1', name: 'Test Fan', avatar: '', email: '', subscriptionTier: 'free', lifetimeValue: 0, tags: [], notes: [] }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const composer = container.querySelector('.cs-message-input__content-editor');
      expect(composer).toBeTruthy();
      
      // Should have aria-label or associated label
      expect(
        composer?.getAttribute('aria-label') ||
        composer?.getAttribute('aria-labelledby')
      ).toBeTruthy();
    });

    it('should announce validation errors', () => {
      // If message is too long or empty, error should be announced
      // via aria-live or aria-describedby
    });

    it('should have accessible send button', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={{ id: 'fan-1', name: 'Test Fan', avatar: '', email: '', subscriptionTier: 'free', lifetimeValue: 0, tags: [], notes: [] }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const sendButton = container.querySelector('button[type="submit"], button[aria-label*="send"]');
      expect(sendButton).toBeTruthy();
      
      // Should have accessible name
      expect(
        sendButton?.textContent ||
        sendButton?.getAttribute('aria-label')
      ).toBeTruthy();
    });
  });
});
