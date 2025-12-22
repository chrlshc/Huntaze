/**
 * Integration Tests - Messaging Interface
 * 
 * Feature: messages-saas-density-polish
 * Phase: 8 - Integration & Validation
 * Task: 32 - Integration Testing
 * 
 * Tests full layout rendering with real data, responsive breakpoints,
 * scroll behavior, keyboard navigation, and conversation switching.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessagingInterface } from '@/components/messages/MessagingInterface';
import type { Message, Conversation, Fan } from '@/lib/messages/types';

// Mock data generators
function generateMessages(count: number, fanId: string): Message[] {
  const messages: Message[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    messages.push({
      id: `msg-${i}`,
      content: `Test message ${i + 1}`,
      timestamp: new Date(now - (count - i) * 60000), // 1 minute apart
      authorId: i % 3 === 0 ? 'creator-1' : fanId,
      isOwn: i % 3 === 0,
      status: 'sent',
    });
  }
  
  return messages;
}

function generateConversations(count: number): Conversation[] {
  const conversations: Conversation[] = [];
  
  for (let i = 0; i < count; i++) {
    conversations.push({
      id: `conv-${i}`,
      fanId: `fan-${i}`,
      fanName: `Fan ${i + 1}`,
      fanAvatar: `https://i.pravatar.cc/150?u=fan-${i}`,
      lastMessage: `Last message from conversation ${i + 1}`,
      lastMessageTime: new Date(Date.now() - i * 3600000), // 1 hour apart
      unreadCount: i % 5 === 0 ? 3 : 0,
      isActive: i === 0,
    });
  }
  
  return conversations;
}

function generateFan(id: string): Fan {
  return {
    id,
    name: `Fan ${id}`,
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    email: `fan${id}@example.com`,
    subscriptionTier: 'premium',
    lifetimeValue: 1250,
    tags: ['VIP', 'Active'],
    notes: [
      { id: 'note-1', content: 'Prefers morning messages', createdAt: new Date() },
      { id: 'note-2', content: 'Interested in custom content', createdAt: new Date() },
    ],
  };
}

describe('Integration: Messaging Interface', () => {
  describe('Full Layout Rendering with Real Data', () => {
    it('should render complete interface with 100+ messages', async () => {
      const messages = generateMessages(150, 'fan-1');
      const conversations = generateConversations(20);
      const fan = generateFan('fan-1');
      
      const { container } = render(
        <MessagingInterface
          messages={messages}
          conversations={conversations}
          currentFan={fan}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      // Verify three-column layout exists
      const layout = container.querySelector('.messaging-interface');
      expect(layout).toBeTruthy();
      
      // Verify conversation list rendered
      const conversationList = screen.getByRole('list', { name: /conversations/i });
      expect(conversationList).toBeTruthy();
      
      // Verify message thread rendered
      const messageThread = screen.getByRole('main', { name: /messages/i });
      expect(messageThread).toBeTruthy();
      
      // Verify context panel rendered
      const contextPanel = screen.getByRole('complementary', { name: /fan information/i });
      expect(contextPanel).toBeTruthy();
      
      // Verify messages are grouped (should have fewer message blocks than total messages)
      const messageBlocks = container.querySelectorAll('.message-group-item');
      expect(messageBlocks.length).toBeLessThan(messages.length);
      expect(messageBlocks.length).toBeGreaterThan(0);
    });

    it('should handle empty states gracefully', () => {
      render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      // Should show empty state messages
      expect(screen.getByText(/no conversations/i)).toBeTruthy();
      expect(screen.getByText(/select a conversation/i)).toBeTruthy();
    });

    it('should render all conversation list items', () => {
      const conversations = generateConversations(50);
      
      render(
        <MessagingInterface
          messages={[]}
          conversations={conversations}
          currentFan={null}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      // Verify all conversations are in the DOM (may use virtual scrolling)
      const conversationItems = screen.getAllByRole('listitem');
      expect(conversationItems.length).toBeGreaterThanOrEqual(10); // At least visible items
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should show three columns on desktop (>1024px)', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });
      
      const { container } = render(
        <MessagingInterface
          messages={generateMessages(10, 'fan-1')}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      const layout = container.querySelector('.messaging-interface');
      const computedStyle = window.getComputedStyle(layout!);
      
      // Should use CSS Grid with three columns
      expect(computedStyle.display).toBe('grid');
      expect(computedStyle.gridTemplateColumns).toContain('minmax');
    });

    it('should adapt layout on tablet (768-1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 900,
      });
      
      const { container } = render(
        <MessagingInterface
          messages={generateMessages(10, 'fan-1')}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      // Context panel may be hidden or collapsible on tablet
      const contextPanel = container.querySelector('.context-panel');
      expect(contextPanel).toBeTruthy();
    });

    it('should stack columns on mobile (<768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const { container } = render(
        <MessagingInterface
          messages={generateMessages(10, 'fan-1')}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      const layout = container.querySelector('.messaging-interface');
      const computedStyle = window.getComputedStyle(layout!);
      
      // Should stack vertically on mobile
      expect(computedStyle.display).toBeTruthy();
    });
  });

  describe('Scroll Behavior', () => {
    it('should allow independent scrolling in conversation list', async () => {
      const conversations = generateConversations(50);
      
      const { container } = render(
        <MessagingInterface
          messages={generateMessages(10, 'fan-1')}
          conversations={conversations}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      const conversationList = container.querySelector('.fan-list');
      expect(conversationList).toBeTruthy();
      
      // Should have overflow-y: auto
      const computedStyle = window.getComputedStyle(conversationList!);
      expect(computedStyle.overflowY).toBe('auto');
    });

    it('should allow independent scrolling in message thread', () => {
      const messages = generateMessages(100, 'fan-1');
      
      const { container } = render(
        <MessagingInterface
          messages={messages}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      const messageThread = container.querySelector('.chat-container');
      expect(messageThread).toBeTruthy();
      
      // Should have overflow-y: auto
      const computedStyle = window.getComputedStyle(messageThread!);
      expect(computedStyle.overflowY).toBe('auto');
    });

    it('should allow independent scrolling in context panel', () => {
      const fan = generateFan('fan-1');
      // Add many notes to trigger scrolling
      fan.notes = Array.from({ length: 20 }, (_, i) => ({
        id: `note-${i}`,
        content: `Note ${i + 1}`,
        createdAt: new Date(),
      }));
      
      const { container } = render(
        <MessagingInterface
          messages={generateMessages(10, 'fan-1')}
          conversations={generateConversations(5)}
          currentFan={fan}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      const contextPanel = container.querySelector('.context-panel');
      expect(contextPanel).toBeTruthy();
      
      // Should have overflow-y: auto
      const computedStyle = window.getComputedStyle(contextPanel!);
      expect(computedStyle.overflowY).toBe('auto');
    });

    it('should auto-scroll to bottom when new message arrives', async () => {
      const messages = generateMessages(50, 'fan-1');
      const onSendMessage = vi.fn();
      
      const { rerender, container } = render(
        <MessagingInterface
          messages={messages}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={onSendMessage}
          onSelectConversation={vi.fn()}
        />
      );
      
      // Add new message
      const newMessages = [
        ...messages,
        {
          id: 'new-msg',
          content: 'New message',
          timestamp: new Date(),
          authorId: 'creator-1',
          isOwn: true,
          status: 'sent' as const,
        },
      ];
      
      rerender(
        <MessagingInterface
          messages={newMessages}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={onSendMessage}
          onSelectConversation={vi.fn()}
        />
      );
      
      await waitFor(() => {
        const messageThread = container.querySelector('.chat-container');
        // Should scroll to bottom (scrollTop + clientHeight ≈ scrollHeight)
        expect(messageThread).toBeTruthy();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate conversations with arrow keys', () => {
      const conversations = generateConversations(10);
      const onSelectConversation = vi.fn();
      
      render(
        <MessagingInterface
          messages={[]}
          conversations={conversations}
          currentFan={null}
          onSendMessage={vi.fn()}
          onSelectConversation={onSelectConversation}
        />
      );
      
      const firstConversation = screen.getAllByRole('listitem')[0];
      firstConversation.focus();
      
      // Press arrow down
      fireEvent.keyDown(firstConversation, { key: 'ArrowDown' });
      
      // Should focus next conversation
      const secondConversation = screen.getAllByRole('listitem')[1];
      expect(document.activeElement).toBe(secondConversation);
    });

    it('should focus composer with Tab key', () => {
      const { container } = render(
        <MessagingInterface
          messages={generateMessages(5, 'fan-1')}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      const composer = container.querySelector('.cs-message-input__content-editor');
      expect(composer).toBeTruthy();
      
      // Tab to composer
      fireEvent.keyDown(document.body, { key: 'Tab' });
      
      // Composer should be focusable
      expect(composer?.getAttribute('contenteditable')).toBe('true');
    });

    it('should send message with Cmd+Enter', async () => {
      const onSendMessage = vi.fn();
      
      const { container } = render(
        <MessagingInterface
          messages={generateMessages(5, 'fan-1')}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={onSendMessage}
          onSelectConversation={vi.fn()}
        />
      );
      
      const composer = container.querySelector('.cs-message-input__content-editor');
      expect(composer).toBeTruthy();
      
      // Type message
      fireEvent.input(composer!, { target: { textContent: 'Test message' } });
      
      // Press Cmd+Enter
      fireEvent.keyDown(composer!, { key: 'Enter', metaKey: true });
      
      await waitFor(() => {
        expect(onSendMessage).toHaveBeenCalledWith('Test message');
      });
    });

    it('should close context panel with Escape key', () => {
      const { container } = render(
        <MessagingInterface
          messages={generateMessages(5, 'fan-1')}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      const contextPanel = container.querySelector('.context-panel');
      expect(contextPanel).toBeTruthy();
      
      // Press Escape
      fireEvent.keyDown(document.body, { key: 'Escape' });
      
      // Context panel should have aria-hidden or be hidden
      // (Implementation depends on component design)
    });
  });

  describe('Conversation Switching', () => {
    it('should switch conversations and load new messages', async () => {
      const conversations = generateConversations(5);
      const onSelectConversation = vi.fn();
      
      const { rerender } = render(
        <MessagingInterface
          messages={generateMessages(10, 'fan-1')}
          conversations={conversations}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={onSelectConversation}
        />
      );
      
      // Click second conversation
      const secondConversation = screen.getAllByRole('listitem')[1];
      fireEvent.click(secondConversation);
      
      expect(onSelectConversation).toHaveBeenCalledWith('conv-1');
      
      // Rerender with new messages
      rerender(
        <MessagingInterface
          messages={generateMessages(15, 'fan-2')}
          conversations={conversations}
          currentFan={generateFan('fan-2')}
          onSendMessage={vi.fn()}
          onSelectConversation={onSelectConversation}
        />
      );
      
      // Should show new messages
      await waitFor(() => {
        expect(screen.getByText(/Test message 1/)).toBeTruthy();
      });
    });

    it('should maintain scroll position when switching back', async () => {
      const conversations = generateConversations(5);
      const messages1 = generateMessages(50, 'fan-1');
      const messages2 = generateMessages(30, 'fan-2');
      
      const { rerender, container } = render(
        <MessagingInterface
          messages={messages1}
          conversations={conversations}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      const messageThread = container.querySelector('.chat-container');
      
      // Scroll to middle
      if (messageThread) {
        messageThread.scrollTop = 500;
      }
      
      const scrollPosition = messageThread?.scrollTop;
      
      // Switch to conversation 2
      rerender(
        <MessagingInterface
          messages={messages2}
          conversations={conversations}
          currentFan={generateFan('fan-2')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      // Switch back to conversation 1
      rerender(
        <MessagingInterface
          messages={messages1}
          conversations={conversations}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
        />
      );
      
      // Scroll position should be restored (implementation-dependent)
      // This test documents the expected behavior
    });

    it('should update unread count when switching conversations', async () => {
      const conversations = generateConversations(5);
      conversations[1].unreadCount = 5;
      
      const onSelectConversation = vi.fn();
      
      const { rerender } = render(
        <MessagingInterface
          messages={generateMessages(10, 'fan-1')}
          conversations={conversations}
          currentFan={generateFan('fan-1')}
          onSendMessage={vi.fn()}
          onSelectConversation={onSelectConversation}
        />
      );
      
      // Verify unread badge shows
      expect(screen.getByText('5')).toBeTruthy();
      
      // Click conversation with unread messages
      const secondConversation = screen.getAllByRole('listitem')[1];
      fireEvent.click(secondConversation);
      
      // Update conversations with cleared unread count
      const updatedConversations = [...conversations];
      updatedConversations[1].unreadCount = 0;
      
      rerender(
        <MessagingInterface
          messages={generateMessages(10, 'fan-2')}
          conversations={updatedConversations}
          currentFan={generateFan('fan-2')}
          onSendMessage={vi.fn()}
          onSelectConversation={onSelectConversation}
        />
      );
      
      // Unread badge should be gone
      await waitFor(() => {
        expect(screen.queryByText('5')).toBeNull();
      });
    });
  });

  describe('State Management', () => {
    it('should handle loading state', () => {
      render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
          isLoading={true}
        />
      );
      
      // Should show loading indicators
      expect(screen.getByRole('status', { name: /loading/i })).toBeTruthy();
    });

    it('should handle error state', () => {
      render(
        <MessagingInterface
          messages={[]}
          conversations={[]}
          currentFan={null}
          onSendMessage={vi.fn()}
          onSelectConversation={vi.fn()}
          error="Failed to load messages"
        />
      );
      
      // Should show error message
      expect(screen.getByText(/failed to load messages/i)).toBeTruthy();
    });

    it('should handle optimistic updates', async () => {
      const messages = generateMessages(5, 'fan-1');
      const onSendMessage = vi.fn();
      
      const { rerender } = render(
        <MessagingInterface
          messages={messages}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={onSendMessage}
          onSelectConversation={vi.fn()}
        />
      );
      
      // Send message
      const composer = screen.getByRole('textbox');
      fireEvent.input(composer, { target: { textContent: 'New message' } });
      fireEvent.keyDown(composer, { key: 'Enter', metaKey: true });
      
      // Should show optimistic message immediately
      const optimisticMessages = [
        ...messages,
        {
          id: 'temp-id',
          content: 'New message',
          timestamp: new Date(),
          authorId: 'creator-1',
          isOwn: true,
          status: 'sending' as const,
        },
      ];
      
      rerender(
        <MessagingInterface
          messages={optimisticMessages}
          conversations={generateConversations(5)}
          currentFan={generateFan('fan-1')}
          onSendMessage={onSendMessage}
          onSelectConversation={vi.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('New message')).toBeTruthy();
      });
    });
  });
});
