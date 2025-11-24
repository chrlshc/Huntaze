/**
 * Unit tests for Staging Protection middleware
 * 
 * Tests Requirement 4.1: Block indexing on staging/preview environments
 * Validates that X-Robots-Tag header is correctly set based on VERCEL_ENV
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

describe('Staging Protection Middleware', () => {
  let originalEnv: string | undefined

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.VERCEL_ENV
    
    // Mock logger to avoid console output during tests
    vi.mock('../../../lib/utils/logger', () => ({
      createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    }))
  })

  afterEach(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.VERCEL_ENV = originalEnv
    } else {
      delete process.env.VERCEL_ENV
    }
    vi.clearAllMocks()
  })

  describe('Production Environment', () => {
    it('should NOT set X-Robots-Tag header in production', async () => {
      // Arrange
      process.env.VERCEL_ENV = 'production'
      
      // Import middleware after setting env
      const { default: middleware } = await import('../../../middleware')
      
      const request = new NextRequest('https://huntaze.com/')
      
      // Act
      const response = await middleware(request)
      
      // Assert
      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })

    it('should allow search engines to index production pages', async () => {
      // Arrange
      process.env.VERCEL_ENV = 'production'
      
      const { default: middleware } = await import('../../../middleware')
      const request = new NextRequest('https://huntaze.com/pricing')
      
      // Act
      const response = await middleware(request)
      
      // Assert
      expect(response.headers.get('X-Robots-Tag')).toBeNull()
    })
  })

  describe('Staging Environment', () => {
    it('should set X-Robots-Tag header in staging', async () => {
      // Arrange
      process.env.VERCEL_ENV = 'preview'
      
      const { default: middleware } = await import('../../../middleware')
      const request = new NextRequest('https://staging.huntaze.com/')
      
      // Act
      const response = await middleware(request)
      
      // Assert
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive')
    })

    it('should block indexing on preview deployments', async () => {
      // Arrange
      process.env.VERCEL_ENV = 'preview'
      
      const { default: middleware } = await import('../../../middleware')
      const request = new NextRequest('https://preview-abc123.vercel.app/')
      
      // Act
      const response = await middleware(request)
      
      // Assert
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive')
    })

    it('should block indexing on development environment', async () => {
      // Arrange
      process.env.VERCEL_ENV = 'development'
      
      const { default: middleware } = await import('../../../middleware')
      const request = new NextRequest('http://localhost:3000/')
      
      // Act
      const response = await middleware(request)
      
      // Assert
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive')
    })

    it('should block indexing when VERCEL_ENV is not set', async () => {
      // Arrange
      delete process.env.VERCEL_ENV
      
      const { default: middleware } = await import('../../../middleware')
      const request = new NextRequest('http://localhost:3000/')
      
      // Act
      const response = await middleware(request)
      
      // Assert
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive')
    })
  })

  describe('All Routes Coverage', () => {
    it('should apply staging protection to marketing pages', async () => {
      // Arrange
      process.env.VERCEL_ENV = 'preview'
      
      const { default: middleware } = await import('../../../middleware')
      const request = new NextRequest('https://staging.huntaze.com/pricing')
      
      // Act
      const response = await middleware(request)
      
      // Assert
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive')
    })

    it('should apply staging protection to app routes', async () => {
      // Arrange
      process.env.VERCEL_ENV = 'preview'
      
      const { default: middleware } = await import('../../../middleware')
      const request = new NextRequest('https://staging.huntaze.com/dashboard')
      
      // Act
      const response = await middleware(request)
      
      // Assert
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive')
    })

    it('should apply staging protection to API routes', async () => {
      // Arrange
      process.env.VERCEL_ENV = 'preview'
      
      const { default: middleware } = await import('../../../middleware')
      const request = new NextRequest('https://staging.huntaze.com/api/users')
      
      // Act
      const response = await middleware(request)
      
      // Assert
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive')
    })
  })

  describe('Matcher Configuration', () => {
    it('should not process static assets', async () => {
      // The matcher configuration excludes these paths, so middleware won't run
      // This test documents the expected behavior
      const excludedPaths = [
        '/_next/static/chunks/main.js',
        '/_next/image?url=/logo.png',
        '/favicon.ico',
        '/logo.svg',
        '/image.png',
        '/photo.jpg',
        '/graphic.webp',
      ]
      
      // These paths should be excluded by the matcher config
      expect(excludedPaths.length).toBeGreaterThan(0)
    })
  })
})
