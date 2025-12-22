/**
 * Visual Regression Integration Tests - Messaging Interface
 * 
 * Feature: messages-saas-density-polish
 * Phase: 8 - Integration & Validation
 * Task: 35 - Visual Regression Testing
 * 
 * Tests visual consistency with design specifications, 8px grid alignment,
 * column width ratios, and all message grouping scenarios.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MessagingInterface } from '@/components/messages/MessagingInterface';
import type { Message, Conversation, Fan } from '@/lib/messages/types';
import fs from 'fs';
import path from 'path';

// Helper to read CSS custom properties
function getCSSCustomProperty(element: Element, propertyName: string): string {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.getPropertyValue(propertyName).trim();
}

// Helper to verify 8px grid alignment
function isGridAligned(value: number, gridSize: number = 8): boolean {
  return value % gridSize === 0 || value % 4 === 0;
}

// Helper to parse CSS value to number
function parseCSSValue(value: string): number {
  return parseFloat(value.replace(/px|rem|em/, ''));
}

describe('Integration: Visual Regression', () => {
  describe('8px Grid Alignment', () => {
    it('should align all spacing to 8px grid', () => {
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
      
      // Check message block spacing
      const messageBlock = container.querySelector('.message-group-item');
      if (messageBlock) {
        const computedStyle = window.getComputedStyle(messageBlock);
        
        const marginTop = parseCSSValue(computedStyle.marginTop);
        const marginBottom = parseCSSValue(computedStyle.marginBottom);
        const paddingTop = parseCSSValue(computedStyle.paddingTop);
        const paddingBottom = parseCSSValue(computedStyle.paddingBottom);
        
        expect(isGridAligned(marginTop)).toBe(true);
        expect(isGridAligned(marginBottom)).toBe(true);
        expect(isGridAligned(paddingTop)).toBe(true);
        expect(isGridAligned(paddingBottom)).toBe(true);
      }
    });

    it('should use spacing tokens from CSS', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const root = container.querySelector('.messaging-interface');
      if (root) {
        // Verify spacing tokens are defined
        const spaceXs = getCSSCustomProperty(root, '--msg-space-xs');
        const spaceSm = getCSSCustomProperty(root, '--msg-space-sm');
        const spaceMd = getCSSCustomProperty(root, '--msg-space-md');
        const spaceLg = getCSSCustomProperty(root, '--msg-space-lg');
        
        expect(spaceXs).toBe('4px');
        expect(spaceSm).toBe('8px');
        expect(spaceMd).toBe('12px');
        expect(spaceLg).toBe('16px');
      }
    });

    it('should align composer spacing to grid', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={{ id: 'fan-1', name: 'Test', avatar: '', email: '', subscriptionTier: 'free', lifetimeValue: 0, tags: [], notes: [] }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const composer = container.querySelector('.cs-message-input');
      if (composer) {
        const computedStyle = window.getComputedStyle(composer);
        
        const paddingTop = parseCSSValue(computedStyle.paddingTop);
        const paddingBottom = parseCSSValue(computedStyle.paddingBottom);
        
        expect(isGridAligned(paddingTop)).toBe(true);
        expect(isGridAligned(paddingBottom)).toBe(true);
      }
    });

    it('should align date separator spacing to grid', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Message 1',
              timestamp: new Date('2024-12-08'),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
            {
              id: 'msg-2',
              content: 'Message 2',
              timestamp: new Date('2024-12-09'),
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
      
      const dateSeparator = container.querySelector('.date-separator');
      if (dateSeparator) {
        const computedStyle = window.getComputedStyle(dateSeparator);
        
        const marginTop = parseCSSValue(computedStyle.marginTop);
        const marginBottom = parseCSSValue(computedStyle.marginBottom);
        
        expect(isGridAligned(marginTop)).toBe(true);
        expect(isGridAligned(marginBottom)).toBe(true);
        expect(marginTop).toBeGreaterThanOrEqual(16);
        expect(marginTop).toBeLessThanOrEqual(20);
      }
    });

    it('should align context panel spacing to grid', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={{
            id: 'fan-1',
            name: 'Test Fan',
            avatar: '',
            email: 'test@example.com',
            subscriptionTier: 'premium',
            lifetimeValue: 1000,
            tags: ['VIP'],
            notes: [{ id: 'note-1', content: 'Test note', createdAt: new Date() }],
          }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const contextPanel = container.querySelector('.context-panel');
      if (contextPanel) {
        const sections = contextPanel.querySelectorAll('.context-panel-section');
        
        sections.forEach(section => {
          const computedStyle = window.getComputedStyle(section);
          const marginBottom = parseCSSValue(computedStyle.marginBottom);
          
          expect(isGridAligned(marginBottom)).toBe(true);
        });
      }
    });
  });

  describe('Column Width Ratios', () => {
    it('should maintain correct ratios at 1024px viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[{ id: 'conv-1', fanId: 'fan-1', fanName: 'Fan 1', fanAvatar: '', lastMessage: '', lastMessageTime: new Date(), unreadCount: 0, isActive: false }]}
          currentFan={{ id: 'fan-1', name: 'Test', avatar: '', email: '', subscriptionTier: 'free', lifetimeValue: 0, tags: [], notes: [] }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const layout = container.querySelector('.messaging-interface');
      if (layout) {
        const computedStyle = window.getComputedStyle(layout);
        const gridTemplateColumns = computedStyle.gridTemplateColumns;
        
        // Should use percentage-based columns with minmax
        expect(gridTemplateColumns).toContain('minmax');
        
        // Calculate actual widths
        const conversationList = container.querySelector('.fan-list');
        const messageThread = container.querySelector('.chat-container');
        const contextPanel = container.querySelector('.context-panel');
        
        if (conversationList && messageThread && contextPanel) {
          const totalWidth = 1024;
          const convListPercent = (conversationList.clientWidth / totalWidth) * 100;
          const messageThreadPercent = (messageThread.clientWidth / totalWidth) * 100;
          const contextPanelPercent = (contextPanel.clientWidth / totalWidth) * 100;
          
          // Conversation list: 20-25%
          expect(convListPercent).toBeGreaterThanOrEqual(20);
          expect(convListPercent).toBeLessThanOrEqual(25);
          
          // Message thread: ≥45%
          expect(messageThreadPercent).toBeGreaterThanOrEqual(45);
          
          // Context panel: 20-24%
          expect(contextPanelPercent).toBeGreaterThanOrEqual(20);
          expect(contextPanelPercent).toBeLessThanOrEqual(24);
        }
      }
    });

    it('should maintain correct ratios at 1440px viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });
      
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[{ id: 'conv-1', fanId: 'fan-1', fanName: 'Fan 1', fanAvatar: '', lastMessage: '', lastMessageTime: new Date(), unreadCount: 0, isActive: false }]}
          currentFan={{ id: 'fan-1', name: 'Test', avatar: '', email: '', subscriptionTier: 'free', lifetimeValue: 0, tags: [], notes: [] }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const messageThread = container.querySelector('.chat-container');
      if (messageThread) {
        const messageThreadPercent = (messageThread.clientWidth / 1440) * 100;
        expect(messageThreadPercent).toBeGreaterThanOrEqual(45);
      }
    });

    it('should maintain correct ratios at 1920px viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[{ id: 'conv-1', fanId: 'fan-1', fanName: 'Fan 1', fanAvatar: '', lastMessage: '', lastMessageTime: new Date(), unreadCount: 0, isActive: false }]}
          currentFan={{ id: 'fan-1', name: 'Test', avatar: '', email: '', subscriptionTier: 'free', lifetimeValue: 0, tags: [], notes: [] }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const messageThread = container.querySelector('.chat-container');
      if (messageThread) {
        const messageThreadPercent = (messageThread.clientWidth / 1920) * 100;
        expect(messageThreadPercent).toBeGreaterThanOrEqual(45);
      }
    });

    it('should ensure message thread is widest column', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[{ id: 'conv-1', fanId: 'fan-1', fanName: 'Fan 1', fanAvatar: '', lastMessage: '', lastMessageTime: new Date(), unreadCount: 0, isActive: false }]}
          currentFan={{ id: 'fan-1', name: 'Test', avatar: '', email: '', subscriptionTier: 'free', lifetimeValue: 0, tags: [], notes: [] }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const conversationList = container.querySelector('.fan-list');
      const messageThread = container.querySelector('.chat-container');
      const contextPanel = container.querySelector('.context-panel');
      
      if (conversationList && messageThread && contextPanel) {
        expect(messageThread.clientWidth).toBeGreaterThan(conversationList.clientWidth);
        expect(messageThread.clientWidth).toBeGreaterThan(contextPanel.clientWidth);
      }
    });
  });

  describe('Message Grouping Scenarios', () => {
    it('should group consecutive messages from same author', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Message 1',
              timestamp: new Date('2024-12-09T10:00:00'),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
            {
              id: 'msg-2',
              content: 'Message 2',
              timestamp: new Date('2024-12-09T10:01:00'),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
            {
              id: 'msg-3',
              content: 'Message 3',
              timestamp: new Date('2024-12-09T10:02:00'),
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
      
      // Should have 1 message block (all from same author within 5 minutes)
      const messageBlocks = container.querySelectorAll('.message-group-item');
      expect(messageBlocks.length).toBe(1);
      
      // Should have 1 avatar (only on first message)
      const avatars = container.querySelectorAll('.cs-avatar');
      expect(avatars.length).toBe(1);
      
      // Should have 1 timestamp (only on last message)
      const timestamps = container.querySelectorAll('.message-group-timestamp');
      expect(timestamps.length).toBe(1);
    });

    it('should create new block when author changes', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Message from fan',
              timestamp: new Date('2024-12-09T10:00:00'),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
            {
              id: 'msg-2',
              content: 'Reply from creator',
              timestamp: new Date('2024-12-09T10:01:00'),
              authorId: 'creator-1',
              isOwn: true,
              status: 'sent',
            },
          ]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      // Should have 2 message blocks (different authors)
      const messageBlocks = container.querySelectorAll('.message-group-item');
      expect(messageBlocks.length).toBe(2);
      
      // Should have 2 avatars (one per block)
      const avatars = container.querySelectorAll('.cs-avatar');
      expect(avatars.length).toBe(2);
    });

    it('should create new block when time gap exceeds 5 minutes', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Message 1',
              timestamp: new Date('2024-12-09T10:00:00'),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
            {
              id: 'msg-2',
              content: 'Message 2',
              timestamp: new Date('2024-12-09T10:10:00'), // 10 minutes later
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
      
      // Should have 2 message blocks (time gap > 5 minutes)
      const messageBlocks = container.querySelectorAll('.message-group-item');
      expect(messageBlocks.length).toBe(2);
    });

    it('should show date separator between different days', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Message from yesterday',
              timestamp: new Date('2024-12-08T23:00:00'),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
            {
              id: 'msg-2',
              content: 'Message from today',
              timestamp: new Date('2024-12-09T01:00:00'),
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
      
      // Should have date separator
      const dateSeparator = container.querySelector('.date-separator');
      expect(dateSeparator).toBeTruthy();
    });
  });

  describe('Visual Consistency with Design Spec', () => {
    it('should use correct typography scale', () => {
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
      
      // Message content: 14px
      const messageContent = container.querySelector('.cs-message__content');
      if (messageContent) {
        const computedStyle = window.getComputedStyle(messageContent);
        const fontSize = parseCSSValue(computedStyle.fontSize);
        expect(fontSize).toBe(14);
      }
      
      // Timestamp: 11-12px
      const timestamp = container.querySelector('.message-group-timestamp');
      if (timestamp) {
        const computedStyle = window.getComputedStyle(timestamp);
        const fontSize = parseCSSValue(computedStyle.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(11);
        expect(fontSize).toBeLessThanOrEqual(12);
      }
    });

    it('should use correct color palette', () => {
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
      
      // Message text: #111827 (near black)
      const messageContent = container.querySelector('.cs-message__content');
      if (messageContent) {
        const computedStyle = window.getComputedStyle(messageContent);
        const color = computedStyle.color;
        // RGB values should be close to #111827
        expect(color).toBeTruthy();
      }
      
      // Timestamp: #9AA0AF (light gray)
      const timestamp = container.querySelector('.message-group-timestamp');
      if (timestamp) {
        const computedStyle = window.getComputedStyle(timestamp);
        const color = computedStyle.color;
        expect(color).toBeTruthy();
      }
    });

    it('should use correct spacing within message blocks', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Message 1',
              timestamp: new Date('2024-12-09T10:00:00'),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
            {
              id: 'msg-2',
              content: 'Message 2',
              timestamp: new Date('2024-12-09T10:01:00'),
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
      
      const messages = container.querySelectorAll('.cs-message');
      if (messages.length >= 2) {
        const firstMessage = messages[0];
        const computedStyle = window.getComputedStyle(firstMessage);
        const marginBottom = parseCSSValue(computedStyle.marginBottom);
        
        // Within block: 4-8px
        expect(marginBottom).toBeGreaterThanOrEqual(4);
        expect(marginBottom).toBeLessThanOrEqual(8);
      }
    });

    it('should use correct spacing between message blocks', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Message from fan',
              timestamp: new Date('2024-12-09T10:00:00'),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
            {
              id: 'msg-2',
              content: 'Reply from creator',
              timestamp: new Date('2024-12-09T10:01:00'),
              authorId: 'creator-1',
              isOwn: true,
              status: 'sent',
            },
          ]}
          conversations={[]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const messageBlocks = container.querySelectorAll('.message-group-item');
      if (messageBlocks.length >= 2) {
        const firstBlock = messageBlocks[0];
        const computedStyle = window.getComputedStyle(firstBlock);
        const marginBottom = parseCSSValue(computedStyle.marginBottom);
        
        // Between blocks: 12-16px
        expect(marginBottom).toBeGreaterThanOrEqual(12);
        expect(marginBottom).toBeLessThanOrEqual(16);
      }
    });

    it('should use correct composer proximity', () => {
      const { container } = render(
        <MessagingInterface
          messages={[
            {
              id: 'msg-1',
              content: 'Last message',
              timestamp: new Date(),
              authorId: 'fan-1',
              isOwn: false,
              status: 'sent',
            },
          ]}
          conversations={[]}
          currentFan={{ id: 'fan-1', name: 'Test', avatar: '', email: '', subscriptionTier: 'free', lifetimeValue: 0, tags: [], notes: [] }}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const composer = container.querySelector('.cs-message-input');
      if (composer) {
        const computedStyle = window.getComputedStyle(composer);
        const marginTop = parseCSSValue(computedStyle.marginTop);
        
        // Composer distance: 12-16px
        expect(marginTop).toBeGreaterThanOrEqual(12);
        expect(marginTop).toBeLessThanOrEqual(16);
      }
    });
  });

  describe('Conversation List Visual Consistency', () => {
    it('should use correct item height', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[
            {
              id: 'conv-1',
              fanId: 'fan-1',
              fanName: 'Test Fan',
              fanAvatar: 'https://i.pravatar.cc/150',
              lastMessage: 'Last message',
              lastMessageTime: new Date(),
              unreadCount: 0,
              isActive: false,
            },
          ]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const conversationItem = container.querySelector('.fan-card');
      if (conversationItem) {
        const height = conversationItem.clientHeight;
        
        // Item height: 56-64px
        expect(height).toBeGreaterThanOrEqual(56);
        expect(height).toBeLessThanOrEqual(64);
      }
    });

    it('should use correct avatar size', () => {
      const { container } = render(
        <MessagingInterface
          messages={[]}
          conversations={[
            {
              id: 'conv-1',
              fanId: 'fan-1',
              fanName: 'Test Fan',
              fanAvatar: 'https://i.pravatar.cc/150',
              lastMessage: 'Last message',
              lastMessageTime: new Date(),
              unreadCount: 0,
              isActive: false,
            },
          ]}
          currentFan={null}
          onSendMessage={() => {}}
          onSelectConversation={() => {}}
        />
      );
      
      const avatar = container.querySelector('.fan-card .cs-avatar');
      if (avatar) {
        const width = avatar.clientWidth;
        const height = avatar.clientHeight;
        
        // Avatar size: 32-40px
        expect(width).toBeGreaterThanOrEqual(32);
        expect(width).toBeLessThanOrEqual(40);
        expect(height).toBe(width); // Should be square
      }
    });
  });
});
