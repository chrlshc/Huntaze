/**
 * Messages Read API - Unit Tests
 * 
 * Tests for PATCH /api/messages/[threadId]/read
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/services/crmData', () => ({
  crmData: {
    markMessageRead: vi.fn(),
  },
  Message: {},
}));

vi.mock('@/lib/auth/request', () => ({
  getUserFromRequest: vi.fn(),
}));

describe('PATCH /api/messages/[threadId]/read', () => {
  let mockMarkMessageRead: any;
  let mockGetUserFromRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkMessageRead = vi.fn();
    mockGetUserFromRequest = vi.fn();
    
    // Setup mocks
    const { crmData } = require('@/lib/services/crmData');
    crmData.markMessageRead = mockMarkMessageRead;
    
    const { getUserFromRequest } = require('@/lib/auth/request');
    getUserFromRequest.mockImplementation(mockGetUserFromRequest);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/messages/test-id/read', {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId: 'test-id' });
      
      // Dynamic import to get fresh module
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('UNAUTHORIZED');
      expect(data.correlationId).toBeDefined();
    });

    it('should handle auth errors gracefully', async () => {
      mockGetUserFromRequest.mockRejectedValue(new Error('Auth service down'));

      const request = new NextRequest('http://localhost:3000/api/messages/test-id/read', {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId: 'test-id' });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetUserFromRequest.mockResolvedValue({ userId: 'user-123' });
    });

    it('should validate thread ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/messages/invalid-id/read', {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId: 'invalid-id' });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_THREAD_ID');
    });

    it('should accept valid UUID v4', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      mockMarkMessageRead.mockReturnValue({
        id: validUuid,
        userId: 'user-123',
        conversationId: 'conv-123',
        fanId: 'fan-123',
        direction: 'in',
        text: 'Test message',
        read: true,
        createdAt: new Date().toISOString(),
      });

      const request = new NextRequest(`http://localhost:3000/api/messages/${validUuid}/read`, {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId: validUuid });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });

      expect(response.status).toBe(200);
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      mockGetUserFromRequest.mockResolvedValue({ userId: 'user-123' });
    });

    it('should mark message as read successfully', async () => {
      const threadId = '550e8400-e29b-41d4-a716-446655440000';
      const mockMessage = {
        id: threadId,
        userId: 'user-123',
        conversationId: 'conv-123',
        fanId: 'fan-123',
        direction: 'in' as const,
        text: 'Test message',
        read: true,
        createdAt: new Date().toISOString(),
      };

      mockMarkMessageRead.mockReturnValue(mockMessage);

      const request = new NextRequest(`http://localhost:3000/api/messages/${threadId}/read`, {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toEqual(mockMessage);
      expect(data.correlationId).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(mockMarkMessageRead).toHaveBeenCalledWith('user-123', threadId);
    });

    it('should include correlation ID in response headers', async () => {
      const threadId = '550e8400-e29b-41d4-a716-446655440000';
      mockMarkMessageRead.mockReturnValue({
        id: threadId,
        userId: 'user-123',
        conversationId: 'conv-123',
        fanId: 'fan-123',
        direction: 'in',
        text: 'Test',
        read: true,
        createdAt: new Date().toISOString(),
      });

      const request = new NextRequest(`http://localhost:3000/api/messages/${threadId}/read`, {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });

      expect(response.headers.get('X-Correlation-Id')).toBeDefined();
      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
    });
  });

  describe('Error Cases', () => {
    beforeEach(() => {
      mockGetUserFromRequest.mockResolvedValue({ userId: 'user-123' });
    });

    it('should return 404 if message not found', async () => {
      const threadId = '550e8400-e29b-41d4-a716-446655440000';
      mockMarkMessageRead.mockReturnValue(undefined);

      const request = new NextRequest(`http://localhost:3000/api/messages/${threadId}/read`, {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('MESSAGE_NOT_FOUND');
    });

    it('should handle database errors', async () => {
      const threadId = '550e8400-e29b-41d4-a716-446655440000';
      mockMarkMessageRead.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest(`http://localhost:3000/api/messages/${threadId}/read`, {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('DATABASE_ERROR');
    });

    it('should handle unexpected errors', async () => {
      mockGetUserFromRequest.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/messages/test-id/read', {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId: 'test-id' });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Response Structure', () => {
    beforeEach(() => {
      mockGetUserFromRequest.mockResolvedValue({ userId: 'user-123' });
    });

    it('should have consistent error response structure', async () => {
      mockGetUserFromRequest.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/messages/test-id/read', {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId: 'test-id' });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('correlationId');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('statusCode');
    });

    it('should have consistent success response structure', async () => {
      const threadId = '550e8400-e29b-41d4-a716-446655440000';
      mockMarkMessageRead.mockReturnValue({
        id: threadId,
        userId: 'user-123',
        conversationId: 'conv-123',
        fanId: 'fan-123',
        direction: 'in',
        text: 'Test',
        read: true,
        createdAt: new Date().toISOString(),
      });

      const request = new NextRequest(`http://localhost:3000/api/messages/${threadId}/read`, {
        method: 'PATCH',
      });

      const params = Promise.resolve({ threadId });
      
      const { PATCH } = await import('@/app/api/messages/[threadId]/read/route');
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('correlationId');
      expect(data).toHaveProperty('timestamp');
    });
  });
});
