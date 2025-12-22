/**
 * Optimistic UI System for Message Sending
 * Provides immediate feedback with rollback on failure
 */

import { v4 as uuidv4 } from 'uuid';

export interface OptimisticMessage {
  id: string;
  tempId: string;
  conversationId: string;
  content: string;
  timestamp: Date;
  sender: {
    id: string;
    name: string;
    avatar: string;
    type: 'creator' | 'fan';
  };
  status: 'sending' | 'sent' | 'failed';
  isOptimistic: boolean;
}

export interface MessageSendResult {
  success: boolean;
  message?: OptimisticMessage;
  error?: Error;
}

export class OptimisticUIManager {
  private pendingMessages: Map<string, OptimisticMessage> = new Map();
  private onMessageUpdate: (message: OptimisticMessage) => void;
  private onMessageRemove: (tempId: string) => void;

  constructor(
    onMessageUpdate: (message: OptimisticMessage) => void,
    onMessageRemove: (tempId: string) => void
  ) {
    this.onMessageUpdate = onMessageUpdate;
    this.onMessageRemove = onMessageRemove;
  }

  /**
   * Create a temporary message for optimistic UI
   */
  createOptimisticMessage(
    conversationId: string,
    content: string,
    sender: OptimisticMessage['sender']
  ): OptimisticMessage {
    const tempId = `temp-${uuidv4()}`;
    
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      tempId,
      conversationId,
      content,
      timestamp: new Date(),
      sender,
      status: 'sending',
      isOptimistic: true,
    };

    this.pendingMessages.set(tempId, optimisticMessage);
    this.onMessageUpdate(optimisticMessage);

    return optimisticMessage;
  }

  /**
   * Update optimistic message with server response
   */
  confirmMessage(tempId: string, serverMessage: Partial<OptimisticMessage>): void {
    const optimisticMessage = this.pendingMessages.get(tempId);
    
    if (!optimisticMessage) {
      console.warn(`No optimistic message found for tempId: ${tempId}`);
      return;
    }

    const confirmedMessage: OptimisticMessage = {
      ...optimisticMessage,
      ...serverMessage,
      id: serverMessage.id || optimisticMessage.id,
      status: 'sent',
      isOptimistic: false,
    };

    this.pendingMessages.delete(tempId);
    this.onMessageUpdate(confirmedMessage);
  }

  /**
   * Mark message as failed and provide retry option
   */
  markAsFailed(tempId: string, error: Error): void {
    const optimisticMessage = this.pendingMessages.get(tempId);
    
    if (!optimisticMessage) {
      console.warn(`No optimistic message found for tempId: ${tempId}`);
      return;
    }

    const failedMessage: OptimisticMessage = {
      ...optimisticMessage,
      status: 'failed',
    };

    this.onMessageUpdate(failedMessage);
  }

  /**
   * Retry sending a failed message
   */
  async retryMessage(
    tempId: string,
    sendFunction: (message: OptimisticMessage) => Promise<Partial<OptimisticMessage>>
  ): Promise<MessageSendResult> {
    const message = this.pendingMessages.get(tempId);
    
    if (!message) {
      return {
        success: false,
        error: new Error('Message not found'),
      };
    }

    // Update status to sending
    const retryingMessage: OptimisticMessage = {
      ...message,
      status: 'sending',
    };
    this.onMessageUpdate(retryingMessage);

    try {
      const serverMessage = await sendFunction(message);
      this.confirmMessage(tempId, serverMessage);
      
      return {
        success: true,
        message: { ...message, ...serverMessage, status: 'sent', isOptimistic: false },
      };
    } catch (error) {
      this.markAsFailed(tempId, error as Error);
      
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Remove a failed message (user chose to delete)
   */
  removeMessage(tempId: string): void {
    this.pendingMessages.delete(tempId);
    this.onMessageRemove(tempId);
  }

  /**
   * Get all pending messages
   */
  getPendingMessages(): OptimisticMessage[] {
    return Array.from(this.pendingMessages.values());
  }

  /**
   * Check if a message is pending
   */
  isPending(tempId: string): boolean {
    return this.pendingMessages.has(tempId);
  }

  /**
   * Clear all pending messages (e.g., on logout)
   */
  clearAll(): void {
    const tempIds = Array.from(this.pendingMessages.keys());
    tempIds.forEach(tempId => this.removeMessage(tempId));
  }
}

/**
 * Hook-friendly wrapper for React components
 */
export function createOptimisticUIHook() {
  let manager: OptimisticUIManager | null = null;

  return {
    initialize: (
      onMessageUpdate: (message: OptimisticMessage) => void,
      onMessageRemove: (tempId: string) => void
    ) => {
      manager = new OptimisticUIManager(onMessageUpdate, onMessageRemove);
      return manager;
    },
    
    getInstance: () => {
      if (!manager) {
        throw new Error('OptimisticUIManager not initialized');
      }
      return manager;
    },
  };
}

export default OptimisticUIManager;
