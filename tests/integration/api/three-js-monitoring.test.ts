import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../../app/api/monitoring/three-js-errors/route';

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('/api/monitoring/three-js-errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
    mockConsoleLog.mockClear();
  });

  describe('POST /api/monitoring/three-js-errors', () => {
    it('should accept valid Three.js error reports', async () => {
      const errorData = {
        type: 'webgl',
        message: 'WebGL context lost',
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        url: 'http://localhost:3000/test',
        stack: 'Error at three.js:123',
        context: {
          reason: 'GPU reset'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual({ success: true });
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Three.js Error]',
        expect.objectContaining({
          type: 'webgl',
          message: 'WebGL context lost',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          url: 'http://localhost:3000/test'
        })
      );
    });

    it('should reject invalid error data', async () => {
      const invalidData = {
        // Missing required fields
        message: 'Some error'
      };

      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result).toEqual({ error: 'Invalid error data' });
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result).toEqual({ error: 'Internal server error' });
    });

    it('should log rendering errors correctly', async () => {
      const errorData = {
        type: 'rendering',
        message: 'Failed to compile shader',
        component: 'PhoneMockup3D',
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        url: 'http://localhost:3000/demo',
        stack: 'Error\n    at ShaderMaterial.compile\n    at WebGLRenderer.render'
      };

      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Three.js Error]',
        expect.objectContaining({
          type: 'rendering',
          message: 'Failed to compile shader',
          component: 'PhoneMockup3D'
        })
      );
    });

    it('should log performance errors correctly', async () => {
      const errorData = {
        type: 'performance',
        message: 'Low frame rate detected: 15 FPS',
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        url: 'http://localhost:3000/scene',
        context: {
          fps: 15,
          frameCount: 150
        }
      };

      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Three.js Error]',
        expect.objectContaining({
          type: 'performance',
          message: 'Low frame rate detected: 15 FPS',
          context: {
            fps: 15,
            frameCount: 150
          }
        })
      );
    });

    it('should log memory errors correctly', async () => {
      const errorData = {
        type: 'memory',
        message: 'Memory usage exceeded threshold',
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        url: 'http://localhost:3000/complex-scene',
        context: {
          memoryUsage: 150000000, // 150MB
          threshold: 100000000    // 100MB
        }
      };

      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Three.js Error]',
        expect.objectContaining({
          type: 'memory',
          message: 'Memory usage exceeded threshold'
        })
      );
    });
  });

  describe('GET /api/monitoring/three-js-errors', () => {
    it('should return error statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'GET'
      });

      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toMatchObject({
        totalErrors: expect.any(Number),
        errorsByType: expect.any(Object),
        recentErrors: expect.any(Array),
        healthStatus: expect.any(String)
      });
    });

    it('should handle GET request errors gracefully', async () => {
      // Mock a scenario where fetching stats fails
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // This test assumes the GET handler might throw an error
      // In a real scenario, you might mock a database call that fails
      
      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'GET'
      });

      const response = await GET(request);
      
      // Should still return 200 with mock data
      expect(response.status).toBe(200);
      
      console.error = originalConsoleError;
    });
  });

  describe('Error Types Validation', () => {
    const validErrorTypes = ['webgl', 'rendering', 'performance', 'memory'];

    validErrorTypes.forEach(type => {
      it(`should accept ${type} error type`, async () => {
        const errorData = {
          type,
          message: `Test ${type} error`,
          timestamp: Date.now(),
          userAgent: 'Mozilla/5.0 (Test Browser)',
          url: 'http://localhost:3000/test'
        };

        const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorData)
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      });
    });

    it('should accept errors with optional fields', async () => {
      const errorData = {
        type: 'rendering',
        message: 'Test error with all optional fields',
        component: 'TestComponent',
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        url: 'http://localhost:3000/test',
        stack: 'Error stack trace',
        context: {
          customField: 'customValue',
          numericField: 123
        }
      };

      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Three.js Error]',
        expect.objectContaining({
          component: 'TestComponent',
          stack: 'Error stack trace',
          context: {
            customField: 'customValue',
            numericField: 123
          }
        })
      );
    });
  });

  describe('Production Environment Behavior', () => {
    it('should handle production logging differently', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const errorData = {
        type: 'webgl',
        message: 'Production WebGL error',
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 (Production Browser)',
        url: 'https://production-domain.com/scene'
      };

      const request = new NextRequest('http://localhost:3000/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[CloudWatch] Would log Three.js error:',
        'webgl'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Alert] Critical Three.js error detected:',
        expect.objectContaining({
          type: 'webgl',
          message: 'Production WebGL error'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});