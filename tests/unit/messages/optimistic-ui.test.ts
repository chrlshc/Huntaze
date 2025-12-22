/**
 * Unit Tests for Optimistic UI System
 * Tests immediate feedback and rollback on failure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import OptimisticUIManager, { OptimisticMessage } from '@/lib/messages/optimistic-ui';

describe('OptimisticUIManager', () => {
  let manager: OptimisticUIManager;
  let onMessageUpdate: ReturnType<typeof vi.fn>;
  let onMessageRemove: ReturnType<typeof vi.fn>;

  const mockSender = {
    id: 'user-1',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    type: 'creator' as const,
  };

  beforeEach(() => {
    onMessageUpdate = vi.fn();
    onMessageRemove = vi.fn();
    manager = new OptimisticUIManager(onMessageUpdate, onMessageRemove);
  });

  describe('createOptimisticMessage', () => {
    it('should create optimistic message with correct properties', () => {
      const message = manager.createOptimisticMessage(
        'conv-1',
        'Test message',
        mockSender
      );

      expect(message).toMatchObject({
        conversationId: 'conv-1',
        content: 'Test message',
        sender: mockSender,
        status: 'sending',
        isOptimistic: true,
      });
      expect(message.id).toBeDefined();
      expect(message.tempId).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should generate unique temp IDs', () => {
      const message1 = manager.createOptimisticMessage('conv-1', 'Message 1', mockSender);
      const message2 = manager.createOptimisticMessage('conv-1', 'Message 2', mockSender);

      expect(message1.tempId).not.toBe(message2.tempId);
    });

    it('should call onMessageUpdate when creating message', () => {
      const message = manager.createOptimisticMessage('conv-1', 'Test', mockSender);

      expect(onMessageUpdate).toHaveBeenCalledTimes(1);
      expect(onMessageUpdate).toHaveBeenCalledWith(message);
    });

    it('should add message to pending messages', () => {
      const message = manager.createOptimisticMessage('conv-1', 'Test', mockSender);

      expect(manager.isPending(message.tempId)).toBe(true);
    });
  });

  describe('confirmMessage', () => {
    it('should update message with server response', () => {
      const optimisticMessage = manager.createOptimisticMessage('conv-1', 'Test', mockSender);
      onMessageUpdate.mockClear();

      const serverResponse = {
        id: 'server-msg-1',
        timestamp: new Date(),
      };

      manager.confirmMessage(optimisticMessage.tempId, serverResponse);

      expect(onMessageUpdate).toHaveBeenCalledTimes(1);
      const updatedMessage = onMessageUpdate.mock.calls[0][0];
      expect(updatedMessage).toMatchObject({
        id: 'server-msg-1',
        status: 'sent',
        isOptimistic: false,
      });
    });

    it('should remove message from pending after confirmation', () => {
      const optimisticMessage = manager.createOptimisticMessage('conv-1', 'Test', mockSender);

      manager.confirmMessage(optimisticMessage.tempId, { id: 'server-1' });

      expect(manager.isPending(optimisticMessage.tempId)).toBe(false);
    });

    it('should handle confirmation of non-existent message gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      manager.confirmMessage('non-existent-id', { id: 'server-1' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('markAsFailed', () => {
    it('should mark message as failed', () => {
      const optimisticMessage = manager.createOptimisticMessage('conv-1', 'Test', mockSender);
      onMessageUpdate.mockClear();

      const error = new Error('Network error');
      manager.markAsFailed(optimisticMessage.tempId, error);

      expect(onMessageUpdate).toHaveBeenCalledTimes(1);
      const failedMessage = onMessageUpdate.mock.calls[0][0];
      expect(failedMessage.status).toBe('failed');
    });

    it('should keep message in pending after failure', () => {
      const optimisticMessage = manager.createOptimisticMessage('conv-1', 'Test', mockSender);

      manager.markAsFailed(optimisticMessage.tempId, new Error('Test'));

      expect(manager.isPending(optimisticMessage.tempId)).toBe(true);
    });

    it('should handle marking non-existent message as failed gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      manager.markAsFailed('non-existent-id', new Error('Test'));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('retryMessage', () => {
    it('should retry sending failed message', async () => {
      const optimisticMessage = manager.createOptimisticMessage('conv-1', 'Test', mockSender);
      manager.markAsFailed(optimisticMessage.tempId, new Error('Test'));
      onMessageUpdate.mockClear();

      const sendFunction = vi.fn().mockResolvedValue({ id: 'server-1' });

      const result = await manager.retryMessage(optimisticMessage.tempId, sendFunction);

      expect(result.success).toBe(true);
      expect(sendFunction).toHaveBeenCalledWith(expect.objectContaining({
        tempId: optimisticMessage.tempId,
      }));
    });

    it('should update status to sending during retry', async () => {
      const optimisticMessage = manager.createOptimisticMessage('conv-1', 'Test', mockSender);
      manager.markAsFailed(optimisticMessage.tempId, new Error('Test'));
      onMessageUpdate.mockClear();

      const sendFunction = vi.fn().mockImplementation(() => {
        // Check status during send
        const calls = onMessageUpdate.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0].status).toBe('sending');
        return Promise.resolve({ id: 'server-1' });
      });

      await manager.retryMessage(optimisticMessage.tempId, sendFunction);
    });

    it('should mark as failed again if retry fails', async () => {
      const optimisticMessage = manager.createOptimisticMessage('conv-1', 'Test', mockSender);
      onMessageUpdate.mockClear();

      const sendFunction = vi.fn().mockRejectedValue(new Error('Retry failed'));

      const result = await manager.retryMessage(optimisticMessage.tempId, sendFunction);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      const failedMessage = onMessageUpdate.mock.calls[onMessageUpdate.mock.calls.length - 1][0];
      expect(failedMessage.status).toBe('failed');
    });

    it('should return error for non-existent message', async () => {
      const sendFunction = vi.fn();

      const result = await manager.retryMessage('non-existent-id', sendFunction);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Message not found');
      expect(sendFunction).not.toHaveBeenCalled();
    });
  });

  describe('removeMessage', () => {
    it('should remove message from pending', () => {
      const optimisticMessage = manager.createOptimisticMessage('conv-1', 'Test', mockSender);

      manager.removeMessage(optimisticMessage.tempId);

      expect(manager.isPending(optimisticMessage.tempId)).toBe(false);
    });

    it('should call onMessageRemove', () => {
      const optimisticMessage = manager.createOptimisticMessage('conv-1', 'Test', mockSender);

      manager.removeMessage(optimisticMessage.tempId);

      expect(onMessageRemove).toHaveBeenCalledWith(optimisticMessage.tempId);
    });
  });

  describe('getPendingMessages', () => {
    it('should return all pending messages', () => {
      const message1 = manager.createOptimisticMessage('conv-1', 'Message 1', mockSender);
      const message2 = manager.createOptimisticMessage('conv-1', 'Message 2', mockSender);

      const pending = manager.getPendingMessages();

      expect(pending).toHaveLength(2);
      expect(pending).toContainEqual(expect.objectContaining({ tempId: message1.tempId }));
      expect(pending).toContainEqual(expect.objectContaining({ tempId: message2.tempId }));
    });

    it('should return empty array when no pending messages', () => {
      const pending = manager.getPendingMessages();

      expect(pending).toEqual([]);
    });
  });

  describe('clearAll', () => {
    it('should remove all pending messages', () => {
      manager.createOptimisticMessage('conv-1', 'Message 1', mockSender);
      manager.createOptimisticMessage('conv-1', 'Message 2', mockSender);

      manager.clearAll();

      expect(manager.getPendingMessages()).toHaveLength(0);
    });

    it('should call onMessageRemove for each message', () => {
      const message1 = manager.createOptimisticMessage('conv-1', 'Message 1', mockSender);
      const message2 = manager.createOptimisticMessage('conv-1', 'Message 2', mockSender);
      onMessageRemove.mockClear();

      manager.clearAll();

      expect(onMessageRemove).toHaveBeenCalledTimes(2);
      expect(onMessageRemove).toHaveBeenCalledWith(message1.tempId);
      expect(onMessageRemove).toHaveBeenCalledWith(message2.tempId);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete success flow', async () => {
      // Create optimistic message
      const message = manager.createOptimisticMessage('conv-1', 'Test', mockSender);
      expect(message.status).toBe('sending');

      // Confirm with server
      manager.confirmMessage(message.tempId, { id: 'server-1' });
      
      expect(manager.isPending(message.tempId)).toBe(false);
      expect(onMessageUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'server-1',
          status: 'sent',
          isOptimistic: false,
        })
      );
    });

    it('should handle failure and retry flow', async () => {
      // Create and fail
      const message = manager.createOptimisticMessage('conv-1', 'Test', mockSender);
      manager.markAsFailed(message.tempId, new Error('Network error'));

      // Retry successfully
      const sendFunction = vi.fn().mockResolvedValue({ id: 'server-1' });
      const result = await manager.retryMessage(message.tempId, sendFunction);

      expect(result.success).toBe(true);
      expect(manager.isPending(message.tempId)).toBe(false);
    });

    it('should handle failure and delete flow', () => {
      // Create and fail
      const message = manager.createOptimisticMessage('conv-1', 'Test', mockSender);
      manager.markAsFailed(message.tempId, new Error('Network error'));

      // User deletes failed message
      manager.removeMessage(message.tempId);

      expect(manager.isPending(message.tempId)).toBe(false);
      expect(onMessageRemove).toHaveBeenCalledWith(message.tempId);
    });
  });
});
