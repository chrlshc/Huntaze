/**
 * Message Grouping Utilities
 * 
 * Handles grouping messages by sender to avoid avatar repetition
 * and managing message display positions (first, middle, last)
 */

export interface Message {
  id: string;
  content: string;
  timestamp: string | Date;
  sender: {
    id: string;
    name: string;
    avatar: string;
    type: 'creator' | 'fan';
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ProcessedMessage extends Message {
  position: 'first' | 'middle' | 'last' | 'single';
  showTimestamp: boolean;
  showAvatar: boolean;
}

/**
 * Process messages for grouping by sender
 * 
 * Groups consecutive messages from the same sender and marks:
 * - position: first, middle, last, or single message in group
 * - showAvatar: whether to display avatar (only for first message)
 * - showTimestamp: whether to display timestamp (only for last message)
 */
export function processMessagesForGrouping(messages: Message[]): ProcessedMessage[] {
  if (messages.length === 0) return [];

  const processed: ProcessedMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const current = messages[i];
    const previous = i > 0 ? messages[i - 1] : null;
    const next = i < messages.length - 1 ? messages[i + 1] : null;

    // Check if sender changed
    const senderChanged = !previous || previous.sender.id !== current.sender.id;
    const nextSenderChanges = !next || next.sender.id !== current.sender.id;

    // Determine position in group
    let position: 'first' | 'middle' | 'last' | 'single';
    if (senderChanged && nextSenderChanges) {
      position = 'single';
    } else if (senderChanged) {
      position = 'first';
    } else if (nextSenderChanges) {
      position = 'last';
    } else {
      position = 'middle';
    }

    // Show avatar only for first message in group
    const showAvatar = position === 'first' || position === 'single';

    // Show timestamp only for last message in group
    const showTimestamp = position === 'last' || position === 'single';

    processed.push({
      ...current,
      position,
      showAvatar,
      showTimestamp,
    });
  }

  return processed;
}

/**
 * Format message timestamp for display
 * 
 * Formats timestamps as:
 * - Today: "14:30"
 * - Yesterday: "Yesterday 14:30"
 * - This week: "Mon 14:30"
 * - Older: "12/15/2024"
 */
export function formatMessageTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();

  // Check if today
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;
  }

  // Check if this week (last 7 days)
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (date > weekAgo) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Older than a week
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

/**
 * Get message status icon
 * 
 * Returns appropriate icon for message status:
 * - sending: spinner
 * - sent: single checkmark
 * - delivered: double checkmark
 * - read: double checkmark (different styling)
 */
export function getMessageStatusIcon(status?: string): string {
  switch (status) {
    case 'sending':
      return '⏳';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return '✓✓';
    default:
      return '';
  }
}

/**
 * Check if messages are from same sender
 */
export function isSameSender(msg1: Message, msg2: Message): boolean {
  return msg1.sender.id === msg2.sender.id;
}

/**
 * Group messages by sender
 * 
 * Returns array of message groups where each group contains
 * consecutive messages from the same sender
 */
export interface MessageGroup {
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderType: 'creator' | 'fan';
  messages: Message[];
}

export function groupMessagesBySender(messages: Message[]): MessageGroup[] {
  if (messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const message of messages) {
    if (!currentGroup || currentGroup.senderId !== message.sender.id) {
      // Start new group
      currentGroup = {
        senderId: message.sender.id,
        senderName: message.sender.name,
        senderAvatar: message.sender.avatar,
        senderType: message.sender.type,
        messages: [message],
      };
      groups.push(currentGroup);
    } else {
      // Add to current group
      currentGroup.messages.push(message);
    }
  }

  return groups;
}
