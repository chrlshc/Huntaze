/**
 * Integration Tests - ML Pipeline Versioning API Endpoints
 * 
 * Tests for /api/smart-onboarding/ml-pipeline/versioning
 * 
 * Coverage:
 * - GET: List all model versions
 * - POST: Create new model version
 * - GET: Get specific version details
 * - PUT: Update version metadata
 * - DELETE: Delete version
 * - POST: Promote version to production
 * - GET: Export version (JSON and binary formats)
 * - All HTTP status codes (200, 400, 401, 404, 500)
 * - Authentication and authorization
 * - Rate limiting
 * - Concurrent access scenarios
 * - Response schema validation with Zod
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';

// Response schemas
const VersionSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  version: z.string(),
  status: z.enum(['draft', 'testing', 'production', 'archived']),
  metrics: z.object({
    accuracy: z.number(),
    precision: z.number(),
    recall: z.number(),
    f1Score: z.number(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const VersionListResponseSchema = z.object({
  success: z.boolean(),
  versions: z.array(VersionSchema),
  total: z.number(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

const VersionDetailResponseSchema = z.object({
  success: z.boolean(),
  version: VersionSchema,
});

const ExportResponseSchema = z.object({
  success: z.boolean(),
  exportData: z.any(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

describe('ML Pipeline Versioning API - Integration Tests', () => {
  const baseUrl = '/api/smart-onboarding/ml-pipeline/versioning';
  let authToken: string;
  let testModelId: string;
  let testVersionId: string;

  beforeEach(async () => {
    // Setup: Create test authentication token
    authToken = 'test-auth-token-123';
    testModelId = 'test-model-001';
    testVersionId = 'v1.0.0';
  });

  afterEach(async () => {
    // Cleanup: Remove test data
    vi.clearAllMocks();
  });

  describe('GET /api/smart-onboarding/ml-pipeline/versioning', () => {
    describe('Success Cases (200)', () => {
      it('should list all versions for a model', async () => {
        const response = await fetch(`${baseUrl}?modelId=${testModelId}`, {
          method: 'GET',
          headers: {
            'Cookie': `access_token=${authToken}`,
          },
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        const validation = VersionListResponseSchema.safeParse(data);

        expect(validation.success).toBe(true);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.versions)).toBe(true);
        expect(typeof data.total).toBe('number');
      });

      it('should support pagination', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&page=1&pageSize=10`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.page).toBe(1);
        expect(data.pageSize).toBe(10);
        expect(data.versions.length).toBeLessThanOrEqual(10);
      });

      it('should filter by status', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&status=production`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        data.versions.forEach((version: any) => {
          expect(version.status).toBe('production');
        });
      });

      it('should sort versions by creation date', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&sortBy=createdAt&order=desc`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        const dates = data.versions.map((v: any) => new Date(v.createdAt).getTime());
        
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      });
    });

    describe('Error Cases', () => {
      it('should return 401 when not authenticated', async () => {
        const response = await fetch(`${baseUrl}?modelId=${testModelId}`, {
          method: 'GET',
        });

        expect(response.status).toBe(401);

        const data = await response.json();
        const validation = ErrorResponseSchema.safeParse(data);
        expect(validation.success).toBe(true);
      });

      it('should return 400 when modelId is missing', async () => {
        const response = await fetch(baseUrl, {
          method: 'GET',
          headers: {
            'Cookie': `access_token=${authToken}`,
          },
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toContain('modelId');
      });

      it('should return 404 when model not found', async () => {
        const response = await fetch(`${baseUrl}?modelId=non-existent-model`, {
          method: 'GET',
          headers: {
            'Cookie': `access_token=${authToken}`,
          },
        });

        expect(response.status).toBe(404);

        const data = await response.json();
        expect(data.error).toContain('not found');
      });
    });
  });

  describe('POST /api/smart-onboarding/ml-pipeline/versioning', () => {
    describe('Success Cases (201)', () => {
      it('should create a new version', async () => {
        const newVersion = {
          modelId: testModelId,
          version: 'v1.1.0',
          status: 'draft',
          metrics: {
            accuracy: 0.95,
            precision: 0.93,
            recall: 0.92,
            f1Score: 0.925,
          },
          metadata: {
            description: 'Test version',
            author: 'test-user',
          },
        };

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify(newVersion),
        });

        expect(response.status).toBe(201);

        const data = await response.json();
        const validation = VersionDetailResponseSchema.safeParse(data);

        expect(validation.success).toBe(true);
        expect(data.success).toBe(true);
        expect(data.version.modelId).toBe(testModelId);
        expect(data.version.version).toBe('v1.1.0');
      });

      it('should auto-generate version number if not provided', async () => {
        const newVersion = {
          modelId: testModelId,
          status: 'draft',
        };

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify(newVersion),
        });

        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.version.version).toMatch(/^v\d+\.\d+\.\d+$/);
      });
    });

    describe('Error Cases', () => {
      it('should return 400 when modelId is missing', async () => {
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify({ version: 'v1.0.0' }),
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toContain('modelId');
      });

      it('should return 409 when version already exists', async () => {
        const duplicateVersion = {
          modelId: testModelId,
          version: testVersionId, // Already exists
        };

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify(duplicateVersion),
        });

        expect(response.status).toBe(409);

        const data = await response.json();
        expect(data.error).toContain('already exists');
      });

      it('should return 400 when metrics are invalid', async () => {
        const invalidVersion = {
          modelId: testModelId,
          version: 'v1.2.0',
          metrics: {
            accuracy: 1.5, // Invalid: > 1
          },
        };

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify(invalidVersion),
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toContain('metrics');
      });
    });
  });

  describe('GET /api/smart-onboarding/ml-pipeline/versioning (specific version)', () => {
    describe('Success Cases (200)', () => {
      it('should get version details', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=${testVersionId}`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        const validation = VersionDetailResponseSchema.safeParse(data);

        expect(validation.success).toBe(true);
        expect(data.version.modelId).toBe(testModelId);
        expect(data.version.version).toBe(testVersionId);
      });

      it('should include metrics in response', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=${testVersionId}`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        const data = await response.json();
        
        if (data.version.metrics) {
          expect(data.version.metrics).toHaveProperty('accuracy');
          expect(data.version.metrics).toHaveProperty('precision');
          expect(data.version.metrics).toHaveProperty('recall');
          expect(data.version.metrics).toHaveProperty('f1Score');
        }
      });
    });

    describe('Error Cases', () => {
      it('should return 404 when version not found', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=v99.99.99`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(404);

        const data = await response.json();
        expect(data.error).toContain('not found');
      });
    });
  });

  describe('PUT /api/smart-onboarding/ml-pipeline/versioning', () => {
    describe('Success Cases (200)', () => {
      it('should update version metadata', async () => {
        const updates = {
          modelId: testModelId,
          version: testVersionId,
          metadata: {
            description: 'Updated description',
            tags: ['production', 'stable'],
          },
        };

        const response = await fetch(baseUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify(updates),
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.version.metadata.description).toBe('Updated description');
      });

      it('should update version status', async () => {
        const updates = {
          modelId: testModelId,
          version: testVersionId,
          status: 'testing',
        };

        const response = await fetch(baseUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify(updates),
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.version.status).toBe('testing');
      });
    });

    describe('Error Cases', () => {
      it('should return 400 when trying to update immutable fields', async () => {
        const updates = {
          modelId: testModelId,
          version: testVersionId,
          id: 'new-id', // Immutable
        };

        const response = await fetch(baseUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify(updates),
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toContain('immutable');
      });

      it('should return 409 when updating production version', async () => {
        const updates = {
          modelId: testModelId,
          version: 'v1.0.0-prod', // Production version
          status: 'draft',
        };

        const response = await fetch(baseUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify(updates),
        });

        expect(response.status).toBe(409);

        const data = await response.json();
        expect(data.error).toContain('production');
      });
    });
  });

  describe('DELETE /api/smart-onboarding/ml-pipeline/versioning', () => {
    describe('Success Cases (200)', () => {
      it('should delete a draft version', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=v1.0.0-draft`,
          {
            method: 'DELETE',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
      });
    });

    describe('Error Cases', () => {
      it('should return 403 when deleting production version', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=v1.0.0-prod`,
          {
            method: 'DELETE',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(403);

        const data = await response.json();
        expect(data.error).toContain('Cannot delete production version');
      });

      it('should return 404 when version not found', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=v99.99.99`,
          {
            method: 'DELETE',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(404);
      });
    });
  });

  describe('POST /api/smart-onboarding/ml-pipeline/versioning (promote)', () => {
    describe('Success Cases (200)', () => {
      it('should promote version to production', async () => {
        const response = await fetch(`${baseUrl}?action=promote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify({
            modelId: testModelId,
            version: testVersionId,
          }),
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.version.status).toBe('production');
      });

      it('should demote previous production version', async () => {
        const response = await fetch(`${baseUrl}?action=promote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify({
            modelId: testModelId,
            version: 'v1.1.0',
          }),
        });

        expect(response.status).toBe(200);

        // Verify old production version is archived
        const listResponse = await fetch(
          `${baseUrl}?modelId=${testModelId}&status=archived`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        const listData = await listResponse.json();
        expect(listData.versions.length).toBeGreaterThan(0);
      });
    });

    describe('Error Cases', () => {
      it('should return 400 when promoting draft without metrics', async () => {
        const response = await fetch(`${baseUrl}?action=promote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify({
            modelId: testModelId,
            version: 'v1.0.0-no-metrics',
          }),
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toContain('metrics required');
      });
    });
  });

  describe('GET /api/smart-onboarding/ml-pipeline/versioning (export)', () => {
    describe('Success Cases (200)', () => {
      it('should export version as JSON', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=${testVersionId}&action=export&format=json`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        const validation = ExportResponseSchema.safeParse(data);

        expect(validation.success).toBe(true);
        expect(data.success).toBe(true);
        expect(data.exportData).toBeDefined();
      });

      it('should export version as binary', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=${testVersionId}&action=export&format=binary`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
        expect(response.headers.get('Content-Disposition')).toContain('attachment');
        expect(response.headers.get('Content-Disposition')).toContain('.bin');

        const blob = await response.blob();
        expect(blob.size).toBeGreaterThan(0);
      });

      it('should handle export failure gracefully', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=corrupted-version&action=export&format=json`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data.error).toBeDefined();
      });
    });

    describe('Error Cases', () => {
      it('should return 400 when format is invalid', async () => {
        const response = await fetch(
          `${baseUrl}?modelId=${testModelId}&version=${testVersionId}&action=export&format=invalid`,
          {
            method: 'GET',
            headers: {
              'Cookie': `access_token=${authToken}`,
            },
          }
        );

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toContain('format');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(100).fill(null).map(() =>
        fetch(`${baseUrl}?modelId=${testModelId}`, {
          method: 'GET',
          headers: {
            'Cookie': `access_token=${authToken}`,
          },
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should include Retry-After header when rate limited', async () => {
      // Trigger rate limit
      const requests = Array(100).fill(null).map(() =>
        fetch(`${baseUrl}?modelId=${testModelId}`, {
          method: 'GET',
          headers: {
            'Cookie': `access_token=${authToken}`,
          },
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.find(r => r.status === 429);

      if (rateLimited) {
        expect(rateLimited.headers.get('Retry-After')).toBeDefined();
      }
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent reads', async () => {
      const requests = Array(10).fill(null).map(() =>
        fetch(`${baseUrl}?modelId=${testModelId}&version=${testVersionId}`, {
          method: 'GET',
          headers: {
            'Cookie': `access_token=${authToken}`,
          },
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle concurrent writes with optimistic locking', async () => {
      const updates = Array(5).fill(null).map((_, i) => ({
        modelId: testModelId,
        version: testVersionId,
        metadata: { counter: i },
      }));

      const requests = updates.map(update =>
        fetch(baseUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify(update),
        })
      );

      const responses = await Promise.all(requests);
      
      // At least one should succeed
      const successful = responses.filter(r => r.status === 200);
      expect(successful.length).toBeGreaterThan(0);

      // Some may fail due to conflicts
      const conflicts = responses.filter(r => r.status === 409);
      expect(conflicts.length).toBeGreaterThanOrEqual(0);
    });

    it('should prevent race conditions in promotion', async () => {
      const requests = Array(3).fill(null).map(() =>
        fetch(`${baseUrl}?action=promote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${authToken}`,
          },
          body: JSON.stringify({
            modelId: testModelId,
            version: testVersionId,
          }),
        })
      );

      const responses = await Promise.all(requests);
      
      // Only one should succeed
      const successful = responses.filter(r => r.status === 200);
      expect(successful.length).toBe(1);
    });
  });

  describe('Authorization', () => {
    it('should allow owner to access versions', async () => {
      const response = await fetch(`${baseUrl}?modelId=${testModelId}`, {
        method: 'GET',
        headers: {
          'Cookie': `access_token=${authToken}`,
        },
      });

      expect(response.status).toBe(200);
    });

    it('should deny access to other users versions', async () => {
      const otherUserToken = 'other-user-token';

      const response = await fetch(`${baseUrl}?modelId=${testModelId}`, {
        method: 'GET',
        headers: {
          'Cookie': `access_token=${otherUserToken}`,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toContain('access denied');
    });

    it('should allow admin to access all versions', async () => {
      const adminToken = 'admin-token';

      const response = await fetch(`${baseUrl}?modelId=${testModelId}`, {
        method: 'GET',
        headers: {
          'Cookie': `access_token=${adminToken}`,
          'X-Admin-Access': 'true',
        },
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Response Headers', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`${baseUrl}?modelId=${testModelId}`, {
        method: 'GET',
        headers: {
          'Cookie': `access_token=${authToken}`,
          'Origin': 'https://app.huntaze.com',
        },
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    });

    it('should include cache headers for GET requests', async () => {
      const response = await fetch(`${baseUrl}?modelId=${testModelId}`, {
        method: 'GET',
        headers: {
          'Cookie': `access_token=${authToken}`,
        },
      });

      expect(response.headers.get('Cache-Control')).toBeDefined();
    });

    it('should include ETag for version details', async () => {
      const response = await fetch(
        `${baseUrl}?modelId=${testModelId}&version=${testVersionId}`,
        {
          method: 'GET',
          headers: {
            'Cookie': `access_token=${authToken}`,
          },
        }
      );

      expect(response.headers.get('ETag')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on internal server error', async () => {
      // Trigger internal error by providing malformed data
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `access_token=${authToken}`,
        },
        body: 'invalid-json',
      });

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should include error details in development', async () => {
      process.env.NODE_ENV = 'development';

      const response = await fetch(`${baseUrl}?modelId=invalid`, {
        method: 'GET',
        headers: {
          'Cookie': `access_token=${authToken}`,
        },
      });

      const data = await response.json();
      
      if (response.status >= 400) {
        expect(data.details).toBeDefined();
      }
    });

    it('should hide error details in production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await fetch(`${baseUrl}?modelId=invalid`, {
        method: 'GET',
        headers: {
          'Cookie': `access_token=${authToken}`,
        },
      });

      const data = await response.json();
      
      if (response.status >= 400) {
        expect(data.details).toBeUndefined();
      }
    });
  });
});
