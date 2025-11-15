/**
 * Messages Read API - Test Fixtures
 * 
 * Reusable test data for messages integration tests
 */

export interface MockUser {
  userId: string;
  email: string;
  name: string;
}

export interface MockMessage {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockThread {
  id: string;
  userId: string;
  fanId: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: MockMessage[];
}

// ============================================================================
// Mock Users
// ============================================================================

export const mockUsers: Record<string, MockUser> = {
  creator1: {
    userId: 'user_creator_1',
    email: 'creator1@example.com',
    name: 'Creator One',
  },
  creator2: {
    userId: 'user_creator_2',
    email: 'creator2@example.com',
    name: 'Creator Two',
  },
  fan1: {
    userId: 'user_fan_1',
    email: 'fan1@example.com',
    name: 'Fan One',
  },
};

// ============================================================================
// Mock Messages
// ============================================================================

export const mockMessages: Record<string, MockMessage> = {
  unread1: {
    id: 'msg_unread_1',
    threadId: 'thread_1',
    userId: 'user_creator_1',
    content: 'Hey! How are you?',
    read: false,
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
  },
  unread2: {
    id: 'msg_unread_2',
    threadId: 'thread_1',
    userId: 'user_creator_1',
    content: 'Are you there?',
    read: false,
    createdAt: '2025-01-01T10:05:00.000Z',
    updatedAt: '2025-01-01T10:05:00.000Z',
  },
  read1: {
    id: 'msg_read_1',
    threadId: 'thread_2',
    userId: 'user_creator_1',
    content: 'Thanks for your message!',
    read: true,
    readAt: '2025-01-01T09:00:00.000Z',
    createdAt: '2025-01-01T08:00:00.000Z',
    updatedAt: '2025-01-01T09:00:00.000Z',
  },
};

// ============================================================================
// Mock Threads
// ============================================================================

export const mockThreads: Record<string, MockThread> = {
  thread1: {
    id: 'thread_1',
    userId: 'user_creator_1',
    fanId: 'user_fan_1',
    lastMessageAt: '2025-01-01T10:05:00.000Z',
    unreadCount: 2,
    messages: [mockMessages.unread1, mockMessages.unread2],
  },
  thread2: {
    id: 'thread_2',
    userId: 'user_creator_1',
    fanId: 'user_fan_1',
    lastMessageAt: '2025-01-01T08:00:00.000Z',
    unreadCount: 0,
    messages: [mockMessages.read1],
  },
};

// ============================================================================
// Factory Functions
// ============================================================================

export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    userId: `user_${Date.now()}`,
    email: `user${Date.now()}@example.com`,
    name: 'Test User',
    ...overrides,
  };
}

export function createMockMessage(overrides?: Partial<MockMessage>): MockMessage {
  const now = new Date().toISOString();
  return {
    id: `msg_${Date.now()}`,
    threadId: `thread_${Date.now()}`,
    userId: 'user_creator_1',
    content: 'Test message',
    read: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockThread(overrides?: Partial<MockThread>): MockThread {
  return {
    id: `thread_${Date.now()}`,
    userId: 'user_creator_1',
    fanId: 'user_fan_1',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    messages: [],
    ...overrides,
  };
}

// ============================================================================
// Test Scenarios
// ============================================================================

export const testScenarios = {
  // Successful mark as read
  successfulMarkRead: {
    user: mockUsers.creator1,
    threadId: 'thread_1',
    expectedStatus: 200,
    expectedResponse: {
      message: {
        id: 'thread_1',
        read: true,
        readAt: expect.any(String),
      },
    },
  },

  // Message not found
  messageNotFound: {
    user: mockUsers.creator1,
    threadId: 'nonexistent_thread',
    expectedStatus: 404,
    expectedResponse: {
      error: 'Message not found',
    },
  },

  // Unauthorized access
  unauthorizedAccess: {
    user: null,
    threadId: 'thread_1',
    expectedStatus: 401,
    expectedResponse: {
      error: 'Not authenticated',
    },
  },

  // Already read message
  alreadyRead: {
    user: mockUsers.creator1,
    threadId: 'thread_2',
    expectedStatus: 200,
    expectedResponse: {
      message: {
        id: 'thread_2',
        read: true,
        readAt: expect.any(String),
      },
    },
  },

  // Cross-user access attempt
  crossUserAccess: {
    user: mockUsers.creator2,
    threadId: 'thread_1', // Belongs to creator1
    expectedStatus: 404,
    expectedResponse: {
      error: 'Message not found',
    },
  },
};

// ============================================================================
// Response Validators
// ============================================================================

export function validateSuccessResponse(response: any): boolean {
  return (
    response.message &&
    typeof response.message.id === 'string' &&
    typeof response.message.read === 'boolean' &&
    (response.message.readAt === undefined ||
      typeof response.message.readAt === 'string')
  );
}

export function validateErrorResponse(response: any): boolean {
  return response.error && typeof response.error === 'string';
}

// ============================================================================
// Rate Limiting Test Data
// ============================================================================

export const rateLimitScenarios = {
  normalUsage: {
    requestCount: 10,
    timeWindow: 1000, // 1 second
    expectedSuccess: 10,
    expectedRateLimited: 0,
  },
  burstTraffic: {
    requestCount: 100,
    timeWindow: 1000, // 1 second
    expectedSuccess: 60, // Assuming 60 req/min limit
    expectedRateLimited: 40,
  },
  sustainedLoad: {
    requestCount: 200,
    timeWindow: 5000, // 5 seconds
    expectedSuccess: 200, // Should all succeed over time
    expectedRateLimited: 0,
  },
};

// ============================================================================
// Concurrent Access Test Data
// ============================================================================

export const concurrentScenarios = {
  sameThread: {
    threadId: 'thread_concurrent_1',
    concurrentRequests: 5,
    expectedAllSuccess: true,
  },
  differentThreads: {
    threadIds: ['thread_1', 'thread_2', 'thread_3', 'thread_4', 'thread_5'],
    concurrentRequests: 5,
    expectedAllSuccess: true,
  },
  mixedOperations: {
    operations: [
      { type: 'read', threadId: 'thread_1' },
      { type: 'read', threadId: 'thread_2' },
      { type: 'read', threadId: 'thread_1' }, // Duplicate
      { type: 'read', threadId: 'thread_3' },
      { type: 'read', threadId: 'thread_1' }, // Duplicate
    ],
    expectedAllSuccess: true,
  },
};

// ============================================================================
// Edge Case Test Data
// ============================================================================

export const edgeCases = {
  emptyThreadId: {
    threadId: '',
    expectedStatus: 404,
  },
  veryLongThreadId: {
    threadId: 'thread_' + 'a'.repeat(1000),
    expectedStatus: 404,
  },
  specialCharacters: {
    threadId: 'thread_<script>alert("xss")</script>',
    expectedStatus: 404,
  },
  unicodeCharacters: {
    threadId: 'thread_你好_🎉',
    expectedStatus: 404,
  },
  sqlInjection: {
    threadId: "thread_1'; DROP TABLE messages; --",
    expectedStatus: 404,
  },
  nullByte: {
    threadId: 'thread_1\0',
    expectedStatus: 404,
  },
};

// ============================================================================
// Performance Benchmarks
// ============================================================================

export const performanceBenchmarks = {
  singleRequest: {
    maxDuration: 100, // ms
    description: 'Single mark read request',
  },
  burstRequests: {
    requestCount: 10,
    maxDuration: 500, // ms
    description: '10 concurrent mark read requests',
  },
  sustainedLoad: {
    requestCount: 100,
    maxDuration: 5000, // ms
    description: '100 sequential mark read requests',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function generateBulkMessages(count: number, userId: string): MockMessage[] {
  return Array.from({ length: count }, (_, i) =>
    createMockMessage({
      id: `msg_bulk_${i}`,
      threadId: `thread_bulk_${i}`,
      userId,
      content: `Bulk message ${i}`,
      read: false,
    })
  );
}

export function generateBulkThreads(count: number, userId: string): MockThread[] {
  return Array.from({ length: count }, (_, i) =>
    createMockThread({
      id: `thread_bulk_${i}`,
      userId,
      fanId: `fan_${i}`,
      unreadCount: Math.floor(Math.random() * 10),
    })
  );
}

export function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  return fn().then((result) => ({
    result,
    duration: Date.now() - start,
  }));
}
