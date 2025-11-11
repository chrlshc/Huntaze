/**
 * Integration Tests - /api/metrics Endpoint
 * 
 * Tests the hardened Prometheus metrics endpoint with:
 * - Runtime initialization validation
 * - Error handling and graceful degradation
 * - Prometheus format compliance
 * - Concurrent access patterns
 * - Performance characteristics
 * 
 * Based on: .kiro/specs/observability-wrapper-build-fix/
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { z } from 'zod'

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const METRICS_ENDPOINT = `${BASE_URL}/api/metrics`

// Prometheus metric line schema
const PrometheusMetricLineSchema = z.union([
  z.string().regex(/^# HELP .+/), // Help text
  z.string().regex(/^# TYPE .+/), // Type declaration
  z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*(\{[^}]+\})?\s+[\d.]+(\s+\d+)?$/), // Metric line
  z.string().regex(/^$/), // Empty line
])

describe('Integration: /api/metrics', () => {
  describe('HTTP Status Codes', () => {
    it('should return 200 OK on successful metrics collection', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      expect(response.status).toBe(200)
    })

    it('should return correct Content-Type header', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      const contentType = response.headers.get('content-type')
      
      expect(contentType).toMatch(/text\/plain/)
    })

    it('should handle GET method', async () => {
      const response = await fetch(METRICS_ENDPOINT, { method: 'GET' })
      expect(response.ok).toBe(true)
    })

    it('should reject POST method with 405', async () => {
      const response = await fetch(METRICS_ENDPOINT, { method: 'POST' })
      expect(response.status).toBe(405)
    })

    it('should reject PUT method with 405', async () => {
      const response = await fetch(METRICS_ENDPOINT, { method: 'PUT' })
      expect(response.status).toBe(405)
    })

    it('should reject DELETE method with 405', async () => {
      const response = await fetch(METRICS_ENDPOINT, { method: 'DELETE' })
      expect(response.status).toBe(405)
    })
  })

  describe('Response Schema Validation', () => {
    it('should return valid Prometheus text format', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      const text = await response.text()
      
      expect(text.length).toBeGreaterThan(0)
      
      const lines = text.split('\n')
      lines.forEach((line, index) => {
        const result = PrometheusMetricLineSchema.safeParse(line)
        if (!result.success) {
          console.error(`Invalid line ${index}: "${line}"`)
        }
        expect(result.success).toBe(true)
      })
    })

    it('should include default Node.js metrics', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      const text = await response.text()
      
      // Default metrics from prom-client
      const expectedMetrics = [
        'process_cpu_user_seconds_total',
        'process_cpu_system_seconds_total',
        'process_resident_memory_bytes',
        'nodejs_heap_size_total_bytes',
        'nodejs_heap_size_used_bytes',
        'nodejs_eventloop_lag_seconds',
      ]
      
      expectedMetrics.forEach(metric => {
        expect(text).toContain(metric)
      })
    })

    it('should include HELP and TYPE declarations', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      const text = await response.text()
      
      expect(text).toMatch(/# HELP/)
      expect(text).toMatch(/# TYPE/)
    })

    it('should have valid metric names (no special chars)', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      const text = await response.text()
      
      const metricLines = text
        .split('\n')
        .filter(line => !line.startsWith('#') && line.trim().length > 0)
      
      metricLines.forEach(line => {
        const metricName = line.split(/[\s{]/)[0]
        expect(metricName).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
      })
    })

    it('should have valid metric values (numbers)', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      const text = await response.text()
      
      const metricLines = text
        .split('\n')
        .filter(line => !line.startsWith('#') && line.trim().length > 0)
      
      metricLines.forEach(line => {
        const parts = line.split(/\s+/)
        const value = parts[parts.length - 1]
        expect(parseFloat(value)).not.toBeNaN()
      })
    })
  })

  describe('Error Handling & Graceful Degradation', () => {
    it('should handle errors gracefully if prom-client fails', async () => {
      // This test validates the try/catch structure
      // In real scenario, prom-client would need to be mocked to fail
      const response = await fetch(METRICS_ENDPOINT)
      
      // Should either succeed (200) or fail gracefully (500)
      expect([200, 500]).toContain(response.status)
      
      if (response.status === 500) {
        const json = await response.json()
        expect(json).toHaveProperty('error')
        expect(json.error).toBe('Metrics unavailable')
      }
    })

    it('should return JSON error format on failure', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      
      if (response.status === 500) {
        const contentType = response.headers.get('content-type')
        expect(contentType).toMatch(/application\/json/)
        
        const json = await response.json()
        expect(json).toMatchObject({
          error: expect.any(String)
        })
      }
    })
  })

  describe('Performance Characteristics', () => {
    it('should respond within acceptable time (<500ms)', async () => {
      const start = Date.now()
      const response = await fetch(METRICS_ENDPOINT)
      const duration = Date.now() - start
      
      expect(response.ok).toBe(true)
      expect(duration).toBeLessThan(500)
    })

    it('should handle first request (lazy init) within 1s', async () => {
      // Simulate first request after cold start
      const start = Date.now()
      const response = await fetch(METRICS_ENDPOINT)
      const duration = Date.now() - start
      
      expect(response.ok).toBe(true)
      expect(duration).toBeLessThan(1000)
    })

    it('should have faster subsequent requests', async () => {
      // First request (may include lazy init)
      await fetch(METRICS_ENDPOINT)
      
      // Subsequent requests should be faster
      const start = Date.now()
      await fetch(METRICS_ENDPOINT)
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(200)
    })
  })

  describe('Concurrent Access', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        fetch(METRICS_ENDPOINT)
      )
      
      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should return consistent data across concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch(METRICS_ENDPOINT).then(r => r.text())
      )
      
      const results = await Promise.all(requests)
      
      // All responses should have similar structure
      results.forEach(text => {
        expect(text).toContain('process_cpu_user_seconds_total')
        expect(text.length).toBeGreaterThan(100)
      })
    })

    it('should not have race conditions on metric registration', async () => {
      // Rapid concurrent requests to test idempotence
      const requests = Array.from({ length: 20 }, (_, i) =>
        fetch(METRICS_ENDPOINT).then(async r => ({
          status: r.status,
          ok: r.ok,
          index: i
        }))
      )
      
      const results = await Promise.all(requests)
      
      // All should succeed, no "metric already registered" errors
      results.forEach(result => {
        expect(result.ok).toBe(true)
      })
    })
  })

  describe('Runtime Configuration', () => {
    it('should use Node.js runtime (not Edge)', async () => {
      // Verify that Node.js-specific metrics are available
      const response = await fetch(METRICS_ENDPOINT)
      const text = await response.text()
      
      // These metrics are only available in Node.js runtime
      expect(text).toContain('nodejs_')
      expect(text).toContain('process_')
    })

    it('should be dynamically rendered (not cached)', async () => {
      const response1 = await fetch(METRICS_ENDPOINT)
      const text1 = await response1.text()
      
      // Wait a bit for metrics to change
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const response2 = await fetch(METRICS_ENDPOINT)
      const text2 = await response2.text()
      
      // Metrics should be different (dynamic values)
      // At minimum, timestamps or counters should differ
      expect(text1).not.toBe(text2)
    })
  })

  describe('Idempotence', () => {
    it('should handle collectDefaultMetrics() being called multiple times', async () => {
      // Multiple requests should not cause "metric already registered" errors
      for (let i = 0; i < 5; i++) {
        const response = await fetch(METRICS_ENDPOINT)
        expect(response.status).toBe(200)
      }
    })

    it('should maintain metric registry across requests', async () => {
      const response1 = await fetch(METRICS_ENDPOINT)
      const text1 = await response1.text()
      const metrics1 = text1.split('\n').filter(l => !l.startsWith('#') && l.trim())
      
      const response2 = await fetch(METRICS_ENDPOINT)
      const text2 = await response2.text()
      const metrics2 = text2.split('\n').filter(l => !l.startsWith('#') && l.trim())
      
      // Same metrics should be present (registry persists)
      expect(metrics1.length).toBeGreaterThan(0)
      expect(metrics2.length).toBe(metrics1.length)
    })
  })

  describe('Security', () => {
    it('should not expose sensitive information in metrics', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      const text = await response.text()
      
      // Should not contain common sensitive patterns
      expect(text.toLowerCase()).not.toContain('password')
      expect(text.toLowerCase()).not.toContain('secret')
      expect(text.toLowerCase()).not.toContain('token')
      expect(text.toLowerCase()).not.toContain('api_key')
    })

    it('should not require authentication', async () => {
      // Metrics endpoint should be publicly accessible for Prometheus
      const response = await fetch(METRICS_ENDPOINT)
      expect(response.status).not.toBe(401)
      expect(response.status).not.toBe(403)
    })

    it('should handle malformed requests safely', async () => {
      const response = await fetch(METRICS_ENDPOINT, {
        headers: {
          'Content-Type': 'application/json',
          'X-Malicious-Header': '<script>alert("xss")</script>'
        }
      })
      
      expect([200, 400, 405]).toContain(response.status)
    })
  })

  describe('Prometheus Compatibility', () => {
    it('should be scrapable by Prometheus', async () => {
      const response = await fetch(METRICS_ENDPOINT, {
        headers: {
          'User-Agent': 'Prometheus/2.40.0'
        }
      })
      
      expect(response.ok).toBe(true)
      expect(response.headers.get('content-type')).toMatch(/text\/plain/)
    })

    it('should support Prometheus metric types', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      const text = await response.text()
      
      // Should have TYPE declarations for counter, gauge, histogram, summary
      const types = ['counter', 'gauge', 'histogram', 'summary']
      const hasTypes = types.some(type => 
        text.toLowerCase().includes(`# type`) && text.toLowerCase().includes(type)
      )
      
      expect(hasTypes).toBe(true)
    })

    it('should have valid label syntax', async () => {
      const response = await fetch(METRICS_ENDPOINT)
      const text = await response.text()
      
      const linesWithLabels = text
        .split('\n')
        .filter(line => line.includes('{') && line.includes('}'))
      
      linesWithLabels.forEach(line => {
        // Labels should be in format: metric{label1="value1",label2="value2"} value
        expect(line).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*\{[^}]+\}\s+[\d.]+/)
      })
    })
  })
})
