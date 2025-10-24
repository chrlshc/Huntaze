import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getAssets, POST as createAsset } from '@/app/api/content-creation/assets/route';
import { GET as getAsset, PATCH as updateAsset, DELETE as deleteAsset } from '@/app/api/content-creation/assets/[id]/route';
import { POST as uploadAsset } from '@/app/api/content-creation/upload/route';
import { GET as getSchedule, POST as createSchedule } from '@/app/api/content-creation/schedule/route';
import { GET as getCampaigns, POST as createCampaign } from '@/app/api/content-creation/campaigns/route';

// Mock auth
vi.mock('@/lib/server-auth', () => ({
  getServerAuth: vi.fn(() => Promise.resolve({
    user: {
      id: 'test-user-123',
      email: 'test@huntaze.com',
      name: 'Test User'
    }
  }))
}));

// Mock SSE events
vi.mock('@/lib/services/sse-events', () => ({
  triggerAssetEvents: vi.fn(),
  BackgroundProcessor: {
    processAssetCompliance: vi.fn(),
  }
}));

describe('Content Creation API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Assets API', () => {
    it('should fetch assets with pagination and filters', async () => {
      const url = new URL('http://localhost:3000/api/content-creation/assets?page=1&limit=10&type=photo&status=published');
      const request = new NextRequest(url);

      const response = await getAssets(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('items');
      expect(data.data).toHaveProperty('pagination');
      expect(data.data.pagination).toMatchObject({
        page: 1,
        limit: expect.any(Number),
        total: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
      });
      expect(Array.isArray(data.data.items)).toBe(true);
    });

    it('should create a new asset', async () => {
      const assetData = {
        title: 'Test Asset',
        description: 'Test description',
        type: 'photo',
        tags: ['test', 'integration'],
      };

      const request = new NextRequest('http://localhost:3000/api/content-creation/assets', {
        method: 'POST',
        body: JSON.stringify(assetData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createAsset(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        title: assetData.title,
        description: assetData.description,
        type: assetData.type,
        status: 'draft',
        tags: assetData.tags,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should validate asset creation data', async () => {
      const invalidData = {
        title: '', // Invalid: empty title
        type: 'invalid-type', // Invalid: not in enum
      };

      const request = new NextRequest('http://localhost:3000/api/content-creation/assets', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createAsset(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toHaveProperty('errors');
    });

    it('should get individual asset', async () => {
      const assetId = 'test-asset-123';
      const request = new NextRequest(`http://localhost:3000/api/content-creation/assets/${assetId}`);

      const response = await getAsset(request, { params: { id: assetId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: assetId,
        title: expect.any(String),
        type: expect.any(String),
        status: expect.any(String),
      });
    });

    it('should update asset', async () => {
      const assetId = 'test-asset-123';
      const updateData = {
        title: 'Updated Title',
        status: 'published',
        tags: ['updated', 'test'],
      };

      const request = new NextRequest(`http://localhost:3000/api/content-creation/assets/${assetId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await updateAsset(request, { params: { id: assetId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(updateData.title);
      expect(data.data.status).toBe(updateData.status);
      expect(data.data.tags).toEqual(updateData.tags);
    });

    it('should delete asset', async () => {
      const assetId = 'test-asset-123';
      const request = new NextRequest(`http://localhost:3000/api/content-creation/assets/${assetId}`, {
        method: 'DELETE',
      });

      const response = await deleteAsset(request, { params: { id: assetId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deleted).toBe(true);
      expect(data.data.id).toBe(assetId);
    });
  });

  describe('Upload API', () => {
    it('should handle file upload', async () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const metadata = JSON.stringify({
        title: 'Uploaded Test Image',
        tags: ['upload', 'test'],
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', metadata);

      const request = new NextRequest('http://localhost:3000/api/content-creation/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadAsset(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        title: 'Uploaded Test Image',
        type: 'photo',
        fileSize: expect.any(Number),
        originalUrl: expect.stringContaining('uploads/'),
        thumbnailUrl: expect.stringContaining('thumbnails/'),
      });
    });

    it('should validate file size', async () => {
      // Create a large file (mock)
      const largeFile = new File(['x'.repeat(60 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', largeFile);

      const request = new NextRequest('http://localhost:3000/api/content-creation/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadAsset(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('File too large');
    });

    it('should validate file type', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', invalidFile);

      const request = new NextRequest('http://localhost:3000/api/content-creation/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await uploadAsset(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Unsupported file type');
    });
  });

  describe('Schedule API', () => {
    it('should fetch schedule with date range', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';
      const url = new URL(`http://localhost:3000/api/content-creation/schedule?startDate=${startDate}&endDate=${endDate}`);
      const request = new NextRequest(url);

      const response = await getSchedule(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('entries');
      expect(data.data).toHaveProperty('aiSuggestions');
      expect(Array.isArray(data.data.entries)).toBe(true);
      expect(Array.isArray(data.data.aiSuggestions)).toBe(true);
    });

    it('should create schedule entry', async () => {
      const scheduleData = {
        mediaAssetId: 'asset-123',
        scheduledDate: '2024-02-01T10:00:00Z',
        platform: ['onlyfans', 'instagram'],
        contentType: 'post',
        priority: 'high',
      };

      const request = new NextRequest('http://localhost:3000/api/content-creation/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createSchedule(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        mediaAssetId: scheduleData.mediaAssetId,
        platform: scheduleData.platform,
        contentType: scheduleData.contentType,
        priority: scheduleData.priority,
      });
    });

    it('should validate schedule data', async () => {
      const invalidData = {
        mediaAssetId: '', // Invalid: empty
        scheduledDate: 'invalid-date', // Invalid: not ISO date
        platform: ['invalid-platform'], // Invalid: not in enum
      };

      const request = new NextRequest('http://localhost:3000/api/content-creation/schedule', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createSchedule(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Campaigns API', () => {
    it('should fetch campaigns with filters', async () => {
      const url = new URL('http://localhost:3000/api/content-creation/campaigns?status=active&page=1&limit=10');
      const request = new NextRequest(url);

      const response = await getCampaigns(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('items');
      expect(data.data).toHaveProperty('pagination');
      expect(Array.isArray(data.data.items)).toBe(true);
    });

    it('should create campaign', async () => {
      const campaignData = {
        name: 'Test Campaign',
        description: 'Test campaign description',
        targetAudience: {
          segments: ['vip', 'high_spenders'],
          minSpent: 100,
        },
        content: ['asset-1', 'asset-2'],
        pricing: {
          basePrice: 25.00,
          discountTiers: [],
        },
        schedule: {
          launchDate: '2024-02-01T18:00:00Z',
          timezone: 'UTC',
        },
        settings: {
          autoResend: false,
          maxResends: 1,
        },
      };

      const request = new NextRequest('http://localhost:3000/api/content-creation/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createCampaign(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        name: campaignData.name,
        description: campaignData.description,
        status: 'draft',
        targetAudience: expect.objectContaining({
          segments: campaignData.targetAudience.segments,
          estimatedReach: expect.any(Number),
        }),
      });
    });

    it('should validate campaign data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        targetAudience: {
          segments: ['invalid-segment'], // Invalid: not in enum
        },
        content: [], // Invalid: empty content array
        pricing: {
          basePrice: -10, // Invalid: negative price
        },
        schedule: {
          launchDate: 'invalid-date', // Invalid: not ISO date
        },
      };

      const request = new NextRequest('http://localhost:3000/api/content-creation/campaigns', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createCampaign(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toHaveProperty('errors');
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      // Mock auth to return null user
      vi.mocked(require('@/lib/server-auth').getServerAuth).mockResolvedValueOnce({ user: null });

      const request = new NextRequest('http://localhost:3000/api/content-creation/assets');
      const response = await getAssets(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should include request ID in all responses', async () => {
      const request = new NextRequest('http://localhost:3000/api/content-creation/assets');
      const response = await getAssets(request);
      const data = await response.json();

      expect(data).toHaveProperty('requestId');
      expect(typeof data.requestId).toBe('string');
      expect(data.requestId.length).toBeGreaterThan(0);
    });

    it('should include timestamp in all responses', async () => {
      const request = new NextRequest('http://localhost:3000/api/content-creation/assets');
      const response = await getAssets(request);
      const data = await response.json();

      expect(data).toHaveProperty('timestamp');
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });
  });
});