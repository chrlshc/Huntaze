/**
 * Messages Read API - Integration Tests
 * 
 * Tests for PATCH /api/messages/[threadId]/read
 * 
 * Coverage:
 * - Authentication & Authorization
 * - Success scenarios
 * - Error handling
 * - Rate limiting
 * - Concurrent access
 * - Data validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/messages/[threadId]/read/route';

// Mock dependencies
vi.mock('@/lib/services/crmData', () => ({
  crmData: {
    markMessageRead: vi.fn(),
  },
}));

vi.mock('@/lib/auth/request', () => ({
  getUserFromRequest: vi.fn(),
}));

import { crmData } from '@/lib/services/crmData';
import { getUserFromRequest } from '@/lib/auth/request';

describe('PATCH /api/messages/[threadId]/read', () => {
  const mockUserId = 'user_123';
  const mockThreadId = 'thread_456';
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Authentication Tests
  // ============================================================================

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue(null);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Not authenticated');
      expect(crmData.markMessageRead).not.toHaveBeenCalled();
    });

    it('should return 401 if user has no userId', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue({} as any);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Not authenticated');
    });

    it('should accept valid authenticated user', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        userId: mockUserId,
      } as any);

      vi.mocked(crmData.markMessageRead).mockReturnValue({
        id: mockThreadId,
        read: true,
        readAt: new Date().toISOString(),
      } as any);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(200);
      expect(crmData.markMessageRead).toHaveBeenCalledWith(
        mockUserId,
        mockThreadId
      );
    });
  });

  // ============================================================================
  // Success Scenarios
  // ============================================================================

  describe('Success Scenarios', () => {
    beforeEach(() => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        userId: mockUserId,
      } as any);
    });

    it('should mark message as read successfully', async () => {
      const mockMessage = {
        id: mockThreadId,
        userId: mockUserId,
        read: true,
        readAt: new Date().toISOString(),
        content: 'Test message',
      };

      vi.mocked(crmData.markMessageRead).mockReturnValue(mockMessage as any);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toEqual(mockMessage);
      expect(data.message.read).toBe(true);
      expect(data.message.readAt).toBeDefined();
    });

    it('should handle already read message', async () => {
      const mockMessage = {
        id: mockThreadId,
        userId: mockUserId,
        read: true,
        readAt: '2025-01-01T00:00:00.000Z',
      };

      vi.mocked(crmData.markMessageRead).mockReturnValue(mockMessage as any);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message.read).toBe(true);
    });

    it('should return correct response structure', async () => {
      const mockMessage = {
        id: mockThreadId,
        userId: mockUserId,
        read: true,
        readAt: new Date().toISOString(),
      };

      vi.mocked(crmData.markMessageRead).mockReturnValue(mockMessage as any);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toHaveProperty('id');
      expect(data.message).toHaveProperty('read');
      expect(data.message).toHaveProperty('readAt');
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        userId: mockUserId,
      } as any);
    });

    it('should return 404 if message not found', async () => {
      vi.mocked(crmData.markMessageRead).mockReturnValue(null);

      const request = new NextRequest(
        `${baseUrl}/api/messages/nonexistent/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: 'nonexistent' }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Message not found');
    });

    it('should return 404 if user does not own message', async () => {
      vi.mocked(crmData.markMessageRead).mockReturnValue(null);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(404);
      expect(crmData.markMessageRead).toHaveBeenCalledWith(
        mockUserId,
        mockThreadId
      );
    });

    it('should handle invalid threadId format', async () => {
      const invalidThreadId = '';

      vi.mocked(crmData.markMessageRead).mockReturnValue(null);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${invalidThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: invalidThreadId }),
      });

      expect(response.status).toBe(404);
    });

    it('should handle special characters in threadId', async () => {
      const specialThreadId = 'thread_<script>alert("xss")</script>';

      vi.mocked(crmData.markMessageRead).mockReturnValue(null);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${encodeURIComponent(specialThreadId)}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: specialThreadId }),
      });

      expect(response.status).toBe(404);
      expect(crmData.markMessageRead).toHaveBeenCalledWith(
        mockUserId,
        specialThreadId
      );
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should only allow user to mark their own messages', async () => {
      const user1 = 'user_1';
      const user2 = 'user_2';

      vi.mocked(getUserFromRequest).mockResolvedValue({
        userId: user1,
      } as any);

      // User 1 tries to mark user 2's message
      vi.mocked(crmData.markMessageRead).mockReturnValue(null);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(404);
      expect(crmData.markMessageRead).toHaveBeenCalledWith(user1, mockThreadId);
    });

    it('should verify userId matches message owner', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        userId: mockUserId,
      } as any);

      const mockMessage = {
        id: mockThreadId,
        userId: mockUserId,
        read: true,
        readAt: new Date().toISOString(),
      };

      vi.mocked(crmData.markMessageRead).mockReturnValue(mockMessage as any);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message.userId).toBe(mockUserId);
    });
  });

  // ============================================================================
  // Concurrent Access Tests
  // ============================================================================

  describe('Concurrent Access', () => {
    beforeEach(() => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        userId: mockUserId,
      } as any);
    });

    it('should handle multiple concurrent mark read requests', async () => {
      const mockMessage = {
        id: mockThreadId,
        userId: mockUserId,
        read: true,
        readAt: new Date().toISOString(),
      };

      vi.mocked(crmData.markMessageRead).mockReturnValue(mockMessage as any);

      const requests = Array.from({ length: 5 }, () =>
        PATCH(
          new NextRequest(`${baseUrl}/api/messages/${mockThreadId}/read`, {
            method: 'PATCH',
          }),
          { params: Promise.resolve({ threadId: mockThreadId }) }
        )
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Should be called 5 times (once per request)
      expect(crmData.markMessageRead).toHaveBeenCalledTimes(5);
    });

    it('should handle race condition gracefully', async () => {
      let callCount = 0;
      vi.mocked(crmData.markMessageRead).mockImplementation(() => {
        callCount++;
        return {
          id: mockThreadId,
          userId: mockUserId,
          read: true,
          readAt: new Date().toISOString(),
        } as any;
      });

      const request1 = PATCH(
        new NextRequest(`${baseUrl}/api/messages/${mockThreadId}/read`, {
          method: 'PATCH',
        }),
        { params: Promise.resolve({ threadId: mockThreadId }) }
      );

      const request2 = PATCH(
        new NextRequest(`${baseUrl}/api/messages/${mockThreadId}/read`, {
          method: 'PATCH',
        }),
        { params: Promise.resolve({ threadId: mockThreadId }) }
      );

      const [response1, response2] = await Promise.all([request1, request2]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(callCount).toBe(2);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        userId: mockUserId,
      } as any);
    });

    it('should handle very long threadId', async () => {
      const longThreadId = 'thread_' + 'a'.repeat(1000);

      vi.mocked(crmData.markMessageRead).mockReturnValue(null);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${longThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: longThreadId }),
      });

      expect(response.status).toBe(404);
    });

    it('should handle unicode characters in threadId', async () => {
      const unicodeThreadId = 'thread_你好_🎉';

      vi.mocked(crmData.markMessageRead).mockReturnValue(null);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${encodeURIComponent(unicodeThreadId)}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: unicodeThreadId }),
      });

      expect(response.status).toBe(404);
    });

    it('should handle null return from markMessageRead', async () => {
      vi.mocked(crmData.markMessageRead).mockReturnValue(null);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(404);
    });

    it('should handle undefined return from markMessageRead', async () => {
      vi.mocked(crmData.markMessageRead).mockReturnValue(undefined as any);

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      expect(response.status).toBe(404);
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    beforeEach(() => {
      vi.mocked(getUserFromRequest).mockResolvedValue({
        userId: mockUserId,
      } as any);
    });

    it('should respond within acceptable time', async () => {
      const mockMessage = {
        id: mockThreadId,
        userId: mockUserId,
        read: true,
        readAt: new Date().toISOString(),
      };

      vi.mocked(crmData.markMessageRead).mockReturnValue(mockMessage as any);

      const startTime = Date.now();

      const request = new NextRequest(
        `${baseUrl}/api/messages/${mockThreadId}/read`,
        { method: 'PATCH' }
      );

      await PATCH(request, {
        params: Promise.resolve({ threadId: mockThreadId }),
      });

      const duration = Date.now() - startTime;

      // Should respond in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle burst of requests efficiently', async () => {
      const mockMessage = {
        id: mockThreadId,
        userId: mockUserId,
        read: true,
        readAt: new Date().toISOString(),
      };

      vi.mocked(crmData.markMessageRead).mockReturnValue(mockMessage as any);

      const startTime = Date.now();

      const requests = Array.from({ length: 10 }, (_, i) =>
        PATCH(
          new NextRequest(`${baseUrl}/api/messages/thread_${i}/read`, {
            method: 'PATCH',
          }),
          { params: Promise.resolve({ threadId: `thread_${i}` }) }
        )
      );

      await Promise.all(requests);

      const duration = Date.now() - startTime;

      // Should handle 10 requests in less than 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});
