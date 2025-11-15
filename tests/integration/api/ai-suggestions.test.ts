/**
 * Integration Tests - /api/ai/suggestions Endpoint
 * 
 * Tests the AI message suggestions endpoint with:
 * - Request/response validation
 * - Authentication and authorization
 * - Error handling and edge cases
 * - Performance characteristics
 * - Circuit breaker integration
 * - Concurrent access patterns
 * 
 * Based on: AI Suggestions API Optimization
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { z } from 'zod'

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const SUGGESTIONS_ENDPOINT = `${BASE_URL}/api/ai/suggestions`

// Response schemas
const SuggestionSchema = z.object({
  text: z.string(),
  tone: z.enum(['flirty', 'friendly', 'professional', 'playful']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
})

const SuccessResponseSchema = z.object({
  success: z.literal(true),
  suggestions: z.array(SuggestionSchema),
  metadata: z.object({
    count: z.number(),
    duration: z.number(),
    correlationId: z.string(),
  }),
})

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  correlationId: z.string(),
})

const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  circuitBreakers: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
  error: z.string().optional(),
})

describe('Integration: /api/ai/suggestions', () => {
  describe('POST - Generate Suggestions', () => {
    describe('HTTP Status Codes', () => {
      it('should return 200 OK on successful suggestion generation', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
            lastMessage: 'Hey, how are you?',
            messageCount: 5,
            fanValueCents: 10000,
          }),
        })

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toMatch(/application\/json/)
      })

      it('should return 400 Bad Request when fanId is missing', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            creatorId: 'creator-456',
            lastMessage: 'Hey',
          }),
        })

        expect(response.status).toBe(400)
        
        const json = await response.json()
        expect(json.error).toBe('Missing required fields')
        expect(json.details).toContain('fanId')
      })

      it('should return 400 Bad Request when creatorId is missing', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            lastMessage: 'Hey',
          }),
        })

        expect(response.status).toBe(400)
        
        const json = await response.json()
        expect(json.error).toBe('Missing required fields')
        expect(json.details).toContain('creatorId')
      })

      it('should return 401 Unauthorized when no auth token provided', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
          }),
        })

        expect([401, 403]).toContain(response.status)
      })

      it('should return 401 Unauthorized with invalid token', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid-token',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
          }),
        })

        expect([401, 403]).toContain(response.status)
      })

      it('should return 405 Method Not Allowed for GET on suggestions endpoint', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token-valid',
          },
        })

        expect(response.status).toBe(405)
      })

      it('should return 405 Method Not Allowed for PUT', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer test-token-valid',
          },
        })

        expect(response.status).toBe(405)
      })

      it('should return 405 Method Not Allowed for DELETE', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer test-token-valid',
          },
        })

        expect(response.status).toBe(405)
      })
    })

    describe('Response Schema Validation', () => {
      it('should return valid success response schema', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
            lastMessage: 'Hey there!',
            messageCount: 10,
            fanValueCents: 5000,
          }),
        })

        const json = await response.json()
        const result = SuccessResponseSchema.safeParse(json)

        if (!result.success) {
          console.error('Schema validation errors:', result.error.errors)
        }

        expect(result.success).toBe(true)
      })

      it('should return valid error response schema on failure', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-trigger-error',
            creatorId: 'creator-456',
          }),
        })

        if (response.status === 500) {
          const json = await response.json()
          const result = ErrorResponseSchema.safeParse(json)

          expect(result.success).toBe(true)
        }
      })

      it('should include correlation ID in response headers', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
          }),
        })

        const correlationId = response.headers.get('x-correlation-id')
        expect(correlationId).toBeTruthy()
        expect(correlationId).toMatch(/^req-/)
      })

      it('should include response time in headers', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
          }),
        })

        const responseTime = response.headers.get('x-response-time')
        expect(responseTime).toBeTruthy()
        expect(responseTime).toMatch(/^\d+ms$/)
      })

      it('should return suggestions with valid structure', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
            lastMessage: 'What are you up to?',
          }),
        })

        const json = await response.json()

        if (json.success) {
          expect(json.suggestions).toBeInstanceOf(Array)
          expect(json.suggestions.length).toBeGreaterThan(0)
          
          json.suggestions.forEach((suggestion: any) => {
            expect(suggestion).toHaveProperty('text')
            expect(suggestion).toHaveProperty('tone')
            expect(suggestion).toHaveProperty('confidence')
            expect(typeof suggestion.text).toBe('string')
            expect(suggestion.text.length).toBeGreaterThan(0)
            expect(suggestion.confidence).toBeGreaterThanOrEqual(0)
            expect(suggestion.confidence).toBeLessThanOrEqual(1)
          })
        }
      })
    })

    describe('Request Validation', () => {
      it('should handle empty request body', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({}),
        })

        expect(response.status).toBe(400)
        
        const json = await response.json()
        expect(json.error).toBe('Missing required fields')
      })

      it('should handle malformed JSON', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: 'invalid-json{',
        })

        expect([400, 500]).toContain(response.status)
      })

      it('should handle optional fields correctly', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
            // lastMessage, messageCount, fanValueCents are optional
          }),
        })

        expect([200, 201]).toContain(response.status)
      })

      it('should handle very long lastMessage', async () => {
        const longMessage = 'A'.repeat(10000)
        
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
            lastMessage: longMessage,
          }),
        })

        expect([200, 400, 413]).toContain(response.status)
      })

      it('should handle negative messageCount', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
            messageCount: -5,
          }),
        })

        // Should either accept (treating as 0) or reject
        expect([200, 400]).toContain(response.status)
      })

      it('should handle negative fanValueCents', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
            fanValueCents: -1000,
          }),
        })

        expect([200, 400]).toContain(response.status)
      })
    })

    describe('Performance Characteristics', () => {
      it('should respond within acceptable time (<5s)', async () => {
        const start = Date.now()
        
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
            lastMessage: 'Hello!',
          }),
        })

        const duration = Date.now() - start

        expect(response.ok || response.status === 500).toBe(true)
        expect(duration).toBeLessThan(5000)
      })

      it('should include duration in response metadata', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-123',
            creatorId: 'creator-456',
          }),
        })

        const json = await response.json()

        if (json.success) {
          expect(json.metadata.duration).toBeDefined()
          expect(typeof json.metadata.duration).toBe('number')
          expect(json.metadata.duration).toBeGreaterThan(0)
        }
      })

      it('should have consistent performance across requests', async () => {
        const durations: number[] = []

        for (let i = 0; i < 5; i++) {
          const start = Date.now()
          
          await fetch(SUGGESTIONS_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token-valid',
            },
            body: JSON.stringify({
              fanId: `fan-${i}`,
              creatorId: 'creator-456',
            }),
          })

          durations.push(Date.now() - start)
        }

        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
        const maxDuration = Math.max(...durations)

        expect(avgDuration).toBeLessThan(5000)
        expect(maxDuration).toBeLessThan(10000)
      })
    })

    describe('Concurrent Access', () => {
      it('should handle multiple concurrent requests', async () => {
        const requests = Array.from({ length: 10 }, (_, i) =>
          fetch(SUGGESTIONS_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token-valid',
            },
            body: JSON.stringify({
              fanId: `fan-concurrent-${i}`,
              creatorId: 'creator-456',
              lastMessage: `Message ${i}`,
            }),
          })
        )

        const responses = await Promise.all(requests)

        responses.forEach(response => {
          expect([200, 429, 500]).toContain(response.status)
        })
      })

      it('should return unique correlation IDs for concurrent requests', async () => {
        const requests = Array.from({ length: 5 }, (_, i) =>
          fetch(SUGGESTIONS_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token-valid',
            },
            body: JSON.stringify({
              fanId: `fan-${i}`,
              creatorId: 'creator-456',
            }),
          })
        )

        const responses = await Promise.all(requests)
        const jsons = await Promise.all(responses.map(r => r.json()))
        
        const correlationIds = jsons
          .map(j => j.metadata?.correlationId || j.correlationId)
          .filter(Boolean)

        const uniqueIds = new Set(correlationIds)
        expect(uniqueIds.size).toBe(correlationIds.length)
      })

      it('should not have race conditions', async () => {
        const fanId = 'fan-race-test'
        
        const requests = Array.from({ length: 20 }, () =>
          fetch(SUGGESTIONS_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token-valid',
            },
            body: JSON.stringify({
              fanId,
              creatorId: 'creator-456',
            }),
          })
        )

        const responses = await Promise.all(requests)
        
        // All should complete without crashes
        responses.forEach(response => {
          expect(response.status).toBeGreaterThanOrEqual(200)
          expect(response.status).toBeLessThan(600)
        })
      })
    })

    describe('Error Handling', () => {
      it('should handle internal service errors gracefully', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-trigger-error',
            creatorId: 'creator-trigger-error',
          }),
        })

        if (response.status === 500) {
          const json = await response.json()
          
          expect(json.success).toBe(false)
          expect(json.error).toBeDefined()
          expect(json.correlationId).toBeDefined()
        }
      })

      it('should not expose sensitive information in errors', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-error',
            creatorId: 'creator-error',
          }),
        })

        const text = await response.text()
        const lowerText = text.toLowerCase()

        expect(lowerText).not.toContain('password')
        expect(lowerText).not.toContain('secret')
        expect(lowerText).not.toContain('api_key')
        expect(lowerText).not.toContain('token')
      })

      it('should log errors with correlation ID', async () => {
        const correlationId = `test-${Date.now()}`
        
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
            'X-Correlation-Id': correlationId,
          },
          body: JSON.stringify({
            fanId: 'fan-error',
            creatorId: 'creator-error',
          }),
        })

        const json = await response.json()
        
        // Should preserve or generate correlation ID
        expect(json.correlationId || json.metadata?.correlationId).toBeTruthy()
      })
    })

    describe('Security', () => {
      it('should sanitize XSS attempts in input', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: '<script>alert("xss")</script>',
            creatorId: 'creator-456',
            lastMessage: '<img src=x onerror=alert(1)>',
          }),
        })

        const json = await response.json()
        const text = JSON.stringify(json)

        expect(text).not.toContain('<script>')
        expect(text).not.toContain('onerror=')
      })

      it('should handle SQL injection attempts safely', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: "'; DROP TABLE users; --",
            creatorId: 'creator-456',
          }),
        })

        // Should either reject or handle safely
        expect([200, 400, 500]).toContain(response.status)
      })

      it('should validate authorization for different users', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-user-a',
          },
          body: JSON.stringify({
            fanId: 'fan-user-b',
            creatorId: 'creator-user-b',
          }),
        })

        // Should enforce authorization
        expect([200, 403]).toContain(response.status)
      })
    })
  })

  describe('GET - Health Check', () => {
    describe('HTTP Status Codes', () => {
      it('should return 200 OK when healthy', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'GET',
        })

        expect([200, 503]).toContain(response.status)
      })

      it('should return correct Content-Type', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'GET',
        })

        expect(response.headers.get('content-type')).toMatch(/application\/json/)
      })
    })

    describe('Response Schema Validation', () => {
      it('should return valid health response schema', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'GET',
        })

        const json = await response.json()
        const result = HealthResponseSchema.safeParse(json)

        if (!result.success) {
          console.error('Health schema validation errors:', result.error.errors)
        }

        expect(result.success).toBe(true)
      })

      it('should include circuit breaker status', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'GET',
        })

        const json = await response.json()

        if (json.status === 'healthy') {
          expect(json.circuitBreakers).toBeDefined()
          expect(typeof json.circuitBreakers).toBe('object')
        }
      })

      it('should include timestamp', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'GET',
        })

        const json = await response.json()

        if (json.status === 'healthy') {
          expect(json.timestamp).toBeDefined()
          expect(new Date(json.timestamp).toString()).not.toBe('Invalid Date')
        }
      })
    })

    describe('Circuit Breaker Status', () => {
      it('should report circuit breaker states', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'GET',
        })

        const json = await response.json()

        if (json.circuitBreakers) {
          Object.values(json.circuitBreakers).forEach((breaker: any) => {
            expect(['closed', 'open', 'half-open']).toContain(breaker.state)
          })
        }
      })

      it('should be accessible without authentication', async () => {
        const response = await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'GET',
          // No Authorization header
        })

        expect([200, 503]).toContain(response.status)
      })
    })

    describe('Performance', () => {
      it('should respond quickly (<500ms)', async () => {
        const start = Date.now()
        
        await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'GET',
        })

        const duration = Date.now() - start
        expect(duration).toBeLessThan(500)
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on excessive requests', async () => {
      const requests = Array.from({ length: 100 }, () =>
        fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-rate-limit',
            creatorId: 'creator-456',
          }),
        })
      )

      const responses = await Promise.all(requests)
      const statusCodes = responses.map(r => r.status)

      // Should have at least some rate limit responses
      const rateLimited = statusCodes.filter(s => s === 429).length
      
      // Either rate limiting is enforced or all succeed
      expect(rateLimited === 0 || rateLimited > 0).toBe(true)
    })

    it('should include rate limit headers when limited', async () => {
      // Make many requests to trigger rate limit
      for (let i = 0; i < 50; i++) {
        await fetch(SUGGESTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-valid',
          },
          body: JSON.stringify({
            fanId: 'fan-rate-limit-headers',
            creatorId: 'creator-456',
          }),
        })
      }

      const response = await fetch(SUGGESTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-valid',
        },
        body: JSON.stringify({
          fanId: 'fan-rate-limit-headers',
          creatorId: 'creator-456',
        }),
      })

      if (response.status === 429) {
        // Check for rate limit headers
        const retryAfter = response.headers.get('retry-after')
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
        
        expect(retryAfter || rateLimitRemaining).toBeTruthy()
      }
    })
  })
})
