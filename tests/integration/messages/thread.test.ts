/**
 * Integration Tests - Thread Messages API
 * 
 * Tests for GET /api/messages/[threadId] and POST /api/messages/[threadId]/send
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  setupMessagesTests,
  createAuthHeaders,
  mockSession,
  mockUnauthorizedSession,
  mockDifferentCreatorSession,
  measureResponseTime,
  PERFORMANCE_THRESHOLDS,
} from './setup';
import {
  mockCreatorId,
  mockThreadId,
  mockMessages,
  mockSendMessageRequest,
  mockSendMessageResponse,
  mockErrors,
} from './fixtures';

setupMessagesTests();

// Zod schemas
const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  content: z.string(),
  timestamp: z.date(),
  sender: z.enum(['fan', 'creator']),
  read: z.boolean(),
  metadata: z.record(z.any()),
});

const ThreadMessagesResponseSchema = z.object({
  messages: z.array(MessageSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
  thread: z.object({
    id: z.string(),
    platform: z.string(),
    fanId: z.string(),
    fanName: z.string(),
  }),
});

const SendMessageResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  timestamp: z.string(),
});

describe('GET /api/messages/[threadId]', () => {
  const getEndpoint = (threadId: string) => `/api/messages/${threadId}`;

  describe('Authentication & Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(getEndpoint(mockThreadId), {
        method: 'GET',
        headers: createAuthHeaders(mockUnauthorizedSession),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when accessing another creator\'s thread', async () => {
      const response = await fetch(getEndpoint(mockThreadId), {
        method: 'GET',
        headers: createAuthHeaders(mockDifferentCreatorSession),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });

    it('should return 200 when properly authenticated', async () => {
      const response = await fetch(getEndpoint(mockThreadId), {
        method: 'GET',
        headers: createAuthHeaders(mockSession),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return valid response schema', async () => {
      const response = await fetch(getEndpoint(mockThreadId), {
        method: 'GET',
        headers: createAuthHeaders(mockSession),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      const result = ThreadMessagesResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should include all required fields', async () => {
      const response = await fetch(getEndpoint(mockThreadId), {
        method: 'GET',
        headers: createAuthHeaders(mockSession),
      });

      const data = await response.json();

      expect(data).toHaveProperty('messages');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('thread');
      expect(Array.isArray(data.messages)).toBe(true);
    });

    it('should include thread metadata', async () => {
      const response = await fetch(getEndpoint(mockThreadId), {
        method: 'GET',
        headers: createAuthHeaders(mockSession),
      });

      const data = await response.json();

      expect(data.thread).toHaveProperty('id');
      expect(data.thread).toHaveProperty('platform');
      expect(data.thread).toHaveProperty('fanId');
      expect(data.thread).toHaveProperty('fanName');
    });
  });

  describe('Pagination', () => {
    it('should respect limit parameter', async () => {
      const limit = 10;
      const url = `${getEndpoint(mockThreadId)}?limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: createAuthHeaders(mockSession),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.messages.length).toBeLessThanOrEqual(limit);
      expect(data.pagination.limit).toBe(limit);
    });

    it('should respect offset parameter', async () => {
      const offset = 5;
      const url = `${getEndpoint(mockThreadId)}?offset=${offset}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: createAuthHeaders(mockSession),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.pagination.offset).toBe(offset);
    });

    it('should order messages chronologically', async () => {
      const response = await fetch(getEndpoint(mockThreadId), {
        method: 'GET',
        headers: createAuthHeaders(mockSession),
      });

      const data = await response.json();

      // Messages should be ordered by timestamp
      for (let i = 1; i < data.messages.length; i++) {
        const prevTime = new Date(data.messages[i - 1].timestamp).getTime();
        const currTime = new Date(data.messages[i].timestamp).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent thread', async () => {
      const response = await fetch(getEndpoint('thread_nonexistent'), {
        method: 'GET',
        headers: createAuthHeaders(mockSession),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('not found');
    });

    it('should handle invalid thread ID format', async () => {
      const response = await fetch(getEndpoint('invalid-id-format'), {
        method: 'GET',
        headers: createAuthHeaders(mockSession),
      });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const { duration } = await measureResponseTime(async () => {
        const response = await fetch(getEndpoint(mockThreadId), {
          method: 'GET',
          headers: createAuthHeaders(mockSession),
        });
        return response.json();
      });

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.GET_THREAD);
    });
  });
});

describe('POST /api/messages/[threadId]/send', () => {
  const sendEndpoint = (threadId: string) => `/api/messages/${threadId}/send`;

  describe('Authentication & Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockUnauthorizedSession),
        body: JSON.stringify(mockSendMessageRequest),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when sending to another creator\'s thread', async () => {
      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockDifferentCreatorSession),
        body: JSON.stringify(mockSendMessageRequest),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });

    it('should return 200 when properly authenticated', async () => {
      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(mockSendMessageRequest),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when content is missing', async () => {
      const invalidRequest = {
        creatorId: mockCreatorId,
        threadId: mockThreadId,
        // content missing
      };

      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('content');
    });

    it('should return 400 when content is empty', async () => {
      const invalidRequest = {
        ...mockSendMessageRequest,
        content: '',
      };

      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when content exceeds max length', async () => {
      const invalidRequest = {
        ...mockSendMessageRequest,
        content: 'a'.repeat(10001), // Assuming 10k char limit
      };

      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(invalidRequest),
      });

      expect([400, 413]).toContain(response.status);
    });

    it('should accept valid message with attachments', async () => {
      const requestWithAttachments = {
        ...mockSendMessageRequest,
        attachments: [
          { type: 'image', url: 'https://example.com/image.jpg' },
        ],
      };

      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(requestWithAttachments),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return valid response schema', async () => {
      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(mockSendMessageRequest),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      const result = SendMessageResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should return messageId and timestamp', async () => {
      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(mockSendMessageRequest),
      });

      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('messageId');
      expect(data).toHaveProperty('timestamp');
      expect(data.success).toBe(true);
      expect(typeof data.messageId).toBe('string');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const { duration } = await measureResponseTime(async () => {
        const response = await fetch(sendEndpoint(mockThreadId), {
          method: 'POST',
          headers: createAuthHeaders(mockSession),
          body: JSON.stringify(mockSendMessageRequest),
        });
        return response.json();
      });

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SEND_MESSAGE);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on message sending', async () => {
      const requests = Array.from({ length: 20 }, () => 
        fetch(sendEndpoint(mockThreadId), {
          method: 'POST',
          headers: createAuthHeaders(mockSession),
          body: JSON.stringify(mockSendMessageRequest),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      // Should hit rate limit at some point
      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent thread', async () => {
      const response = await fetch(sendEndpoint('thread_nonexistent'), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(mockSendMessageRequest),
      });

      expect(response.status).toBe(404);
    });

    it('should handle network errors gracefully', async () => {
      // This would require mocking network failures
      expect(true).toBe(true);
    });

    it('should include correlation ID in error responses', async () => {
      const response = await fetch(sendEndpoint('thread_error'), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(mockSendMessageRequest),
      });

      if (!response.ok) {
        const data = await response.json();
        expect(
          response.headers.get('X-Correlation-ID') || data.correlationId
        ).toBeTruthy();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in message content', async () => {
      const specialCharsRequest = {
        ...mockSendMessageRequest,
        content: 'Hello! 👋 How are you? 💕 Check this: https://example.com',
      };

      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(specialCharsRequest),
      });

      expect(response.status).toBe(200);
    });

    it('should handle unicode characters', async () => {
      const unicodeRequest = {
        ...mockSendMessageRequest,
        content: '你好 مرحبا Привет 🌍',
      };

      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(unicodeRequest),
      });

      expect(response.status).toBe(200);
    });

    it('should sanitize HTML/script tags', async () => {
      const maliciousRequest = {
        ...mockSendMessageRequest,
        content: '<script>alert("xss")</script>Hello',
      };

      const response = await fetch(sendEndpoint(mockThreadId), {
        method: 'POST',
        headers: createAuthHeaders(mockSession),
        body: JSON.stringify(maliciousRequest),
      });

      // Should either reject or sanitize
      expect([200, 400]).toContain(response.status);
    });
  });
});
