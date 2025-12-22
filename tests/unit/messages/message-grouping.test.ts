/**
 * Unit Tests for Message Grouping Logic
 * 
 * Tests the grouping algorithm that creates iMessage/WhatsApp-style
 * message blocks for better readability.
 */

import { describe, it, expect } from 'vitest';
import {
  groupMessages,
  processMessagesForGrouping,
  shouldGroupMessages,
  shouldShowDateSeparator,
  getDateSeparatorText,
  formatMessageTime,
  type Message,
} from '../../../lib/messages/message-grouping';

describe('Message Grouping', () => {
  const createMessage = (
    id: string,
    senderId: string,
    senderType: 'creator' | 'fan',
    timestamp: Date,
    content = 'Test message'
  ): Message => ({
    id,
    content,
    timestamp,
    sender: {
      id: senderId,
      name: senderType === 'creator' ? 'Creator' : 'Fan',
      avatar: '/avatar.jpg',
      type: senderType,
    },
  });

  describe('groupMessages', () => {
    it('should create a single group for consecutive messages from same author', () => {
      const now = new Date();
      const messages: Message[] = [
        createMessage('1', 'fan1', 'fan', now),
        createMessage('2', 'fan1', 'fan', new Date(now.getTime() + 1000)),
        createMessage('3', 'fan1', 'fan', new Date(now.getTime() + 2000)),
      ];

      const groups = groupMessages(messages);

      expect(groups).toHaveLength(1);
      expect(groups[0].messages).toHaveLength(3);
      expect(groups[0].author).toBe('fan');
    });

    it('should create separate groups when author changes', () => {
      const now = new Date();
      const messages: Message[] = [
        createMessage('1', 'fan1', 'fan', now),
        createMessage('2', 'fan1', 'fan', new Date(now.getTime() + 1000)),
        createMessage('3', 'creator1', 'creator', new Date(now.getTime() + 2000)),
        createMessage('4', 'creator1', 'creator', new Date(now.getTime() + 3000)),
      ];

      const groups = groupMessages(messages);

      expect(groups).toHaveLength(2);
      expect(groups[0].author).toBe('fan');
      expect(groups[0].messages).toHaveLength(2);
      expect(groups[1].author).toBe('creator');
      expect(groups[1].messages).toHaveLength(2);
    });

    it('should create new group when time gap exceeds 5 minutes', () => {
      const now = new Date();
      const messages: Message[] = [
        createMessage('1', 'fan1', 'fan', now),
        createMessage('2', 'fan1', 'fan', new Date(now.getTime() + 1000)),
        // 6 minutes gap
        createMessage('3', 'fan1', 'fan', new Date(now.getTime() + 6 * 60 * 1000)),
      ];

      const groups = groupMessages(messages);

      expect(groups).toHaveLength(2);
      expect(groups[0].messages).toHaveLength(2);
      expect(groups[1].messages).toHaveLength(1);
    });

    it('should not group system messages', () => {
      const now = new Date();
      const messages: Message[] = [
        createMessage('1', 'fan1', 'fan', now),
        {
          id: '2',
          content: 'System message',
          timestamp: new Date(now.getTime() + 1000),
          sender: {
            id: 'system',
            name: 'System',
            avatar: '',
            type: 'system',
          },
        },
        createMessage('3', 'fan1', 'fan', new Date(now.getTime() + 2000)),
      ];

      const groups = groupMessages(messages);

      expect(groups).toHaveLength(3);
      expect(groups[1].author).toBe('system');
      expect(groups[1].messages).toHaveLength(1);
    });
  });

  describe('processMessagesForGrouping', () => {
    it('should assign correct positions to messages in a group', () => {
      const now = new Date();
      const messages: Message[] = [
        createMessage('1', 'fan1', 'fan', now),
        createMessage('2', 'fan1', 'fan', new Date(now.getTime() + 1000)),
        createMessage('3', 'fan1', 'fan', new Date(now.getTime() + 2000)),
      ];

      const processed = processMessagesForGrouping(messages);

      expect(processed[0].position).toBe('first');
      expect(processed[0].showAvatar).toBe(true);
      expect(processed[0].showTimestamp).toBe(false);

      expect(processed[1].position).toBe('middle');
      expect(processed[1].showAvatar).toBe(false);
      expect(processed[1].showTimestamp).toBe(false);

      expect(processed[2].position).toBe('last');
      expect(processed[2].showAvatar).toBe(false);
      expect(processed[2].showTimestamp).toBe(true);
    });

    it('should mark single message as "single" position', () => {
      const now = new Date();
      const messages: Message[] = [
        createMessage('1', 'fan1', 'fan', now),
        createMessage('2', 'creator1', 'creator', new Date(now.getTime() + 1000)),
      ];

      const processed = processMessagesForGrouping(messages);

      expect(processed[0].position).toBe('single');
      expect(processed[0].showAvatar).toBe(true);
      expect(processed[0].showTimestamp).toBe(true);

      expect(processed[1].position).toBe('single');
      expect(processed[1].showAvatar).toBe(true);
      expect(processed[1].showTimestamp).toBe(true);
    });
  });

  describe('shouldGroupMessages', () => {
    it('should return true for messages from same author within 5 minutes', () => {
      const now = new Date();
      const msg1 = createMessage('1', 'fan1', 'fan', now);
      const msg2 = createMessage('2', 'fan1', 'fan', new Date(now.getTime() + 2 * 60 * 1000));

      expect(shouldGroupMessages(msg1, msg2)).toBe(true);
    });

    it('should return false for messages from different authors', () => {
      const now = new Date();
      const msg1 = createMessage('1', 'fan1', 'fan', now);
      const msg2 = createMessage('2', 'creator1', 'creator', new Date(now.getTime() + 1000));

      expect(shouldGroupMessages(msg1, msg2)).toBe(false);
    });

    it('should return false when time gap exceeds 5 minutes', () => {
      const now = new Date();
      const msg1 = createMessage('1', 'fan1', 'fan', now);
      const msg2 = createMessage('2', 'fan1', 'fan', new Date(now.getTime() + 6 * 60 * 1000));

      expect(shouldGroupMessages(msg1, msg2)).toBe(false);
    });

    it('should return false for system messages', () => {
      const now = new Date();
      const msg1 = createMessage('1', 'fan1', 'fan', now);
      const msg2: Message = {
        id: '2',
        content: 'System message',
        timestamp: new Date(now.getTime() + 1000),
        sender: {
          id: 'system',
          name: 'System',
          avatar: '',
          type: 'system',
        },
      };

      expect(shouldGroupMessages(msg1, msg2)).toBe(false);
    });
  });

  describe('shouldShowDateSeparator', () => {
    it('should return true for first message', () => {
      const now = new Date();
      const msg = createMessage('1', 'fan1', 'fan', now);

      expect(shouldShowDateSeparator(null, msg)).toBe(true);
    });

    it('should return false for messages on same day', () => {
      const now = new Date();
      const msg1 = createMessage('1', 'fan1', 'fan', now);
      const msg2 = createMessage('2', 'fan1', 'fan', new Date(now.getTime() + 2 * 60 * 60 * 1000));

      expect(shouldShowDateSeparator(msg1, msg2)).toBe(false);
    });

    it('should return true for messages on different days', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const msg1 = createMessage('1', 'fan1', 'fan', today);
      const msg2 = createMessage('2', 'fan1', 'fan', tomorrow);

      expect(shouldShowDateSeparator(msg1, msg2)).toBe(true);
    });
  });

  describe('getDateSeparatorText', () => {
    it('should return "Aujourd\'hui" for today', () => {
      const today = new Date();
      expect(getDateSeparatorText(today)).toBe('Aujourd\'hui');
    });

    it('should return "Hier" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getDateSeparatorText(yesterday)).toBe('Hier');
    });

    it('should return formatted date for older messages', () => {
      const oldDate = new Date('2024-01-15');
      const result = getDateSeparatorText(oldDate);
      // Should contain day name and date (actual day depends on locale/timezone)
      expect(result).toMatch(/\d+ janvier/i);
      expect(result.length).toBeGreaterThan(10); // Should be a full date string
    });
  });

  describe('formatMessageTime', () => {
    it('should format time as HH:MM', () => {
      const date = new Date('2024-01-15T16:25:00');
      expect(formatMessageTime(date)).toBe('16:25');
    });

    it('should handle string timestamps', () => {
      const dateString = '2024-01-15T16:25:00';
      expect(formatMessageTime(dateString)).toBe('16:25');
    });
  });
});

describe('Message Grouping Edge Cases', () => {
  const createMessage = (
    id: string,
    senderId: string,
    senderType: 'creator' | 'fan',
    timestamp: Date
  ): Message => ({
    id,
    content: 'Test',
    timestamp,
    sender: {
      id: senderId,
      name: senderType === 'creator' ? 'Creator' : 'Fan',
      avatar: '/avatar.jpg',
      type: senderType,
    },
  });

  it('should handle empty message array', () => {
    const groups = groupMessages([]);
    expect(groups).toHaveLength(0);
  });

  it('should handle single message', () => {
    const now = new Date();
    const messages = [createMessage('1', 'fan1', 'fan', now)];
    const processed = processMessagesForGrouping(messages);

    expect(processed).toHaveLength(1);
    expect(processed[0].position).toBe('single');
    expect(processed[0].showAvatar).toBe(true);
    expect(processed[0].showTimestamp).toBe(true);
  });

  it('should handle alternating authors', () => {
    const now = new Date();
    const messages: Message[] = [
      createMessage('1', 'fan1', 'fan', now),
      createMessage('2', 'creator1', 'creator', new Date(now.getTime() + 1000)),
      createMessage('3', 'fan1', 'fan', new Date(now.getTime() + 2000)),
      createMessage('4', 'creator1', 'creator', new Date(now.getTime() + 3000)),
    ];

    const groups = groupMessages(messages);
    expect(groups).toHaveLength(4);
    groups.forEach(group => {
      expect(group.messages).toHaveLength(1);
    });
  });

  it('should handle messages exactly 5 minutes apart', () => {
    const now = new Date();
    const messages: Message[] = [
      createMessage('1', 'fan1', 'fan', now),
      createMessage('2', 'fan1', 'fan', new Date(now.getTime() + 5 * 60 * 1000)),
    ];

    const groups = groupMessages(messages);
    // Exactly 5 minutes should still be grouped (threshold is >5 minutes)
    expect(groups).toHaveLength(1);
    expect(groups[0].messages).toHaveLength(2);
  });
});
