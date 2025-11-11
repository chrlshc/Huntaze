/**
 * Test Utilities - API Integration Tests
 * 
 * Shared utilities for API integration testing
 */

import { z } from 'zod'

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options

  let lastError: Error | undefined
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        throw lastError
      }

      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.min(delay * backoffFactor, maxDelay)
    }
  }

  throw lastError
}

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now()
  const result = await fn()
  const duration = Date.now() - start
  return { result, duration }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number
    interval?: number
  } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options
  const start = Date.now()

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`)
}

/**
 * Make a request with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Parse Prometheus metrics text format
 */
export interface ParsedMetric {
  name: string
  type?: string
  help?: string
  labels?: Record<string, string>
  value: number
  timestamp?: number
}

export function parsePrometheusMetrics(text: string): ParsedMetric[] {
  const lines = text.split('\n')
  const metrics: ParsedMetric[] = []
  let currentMetric: Partial<ParsedMetric> = {}

  for (const line of lines) {
    if (line.startsWith('# HELP ')) {
      const match = line.match(/^# HELP (\S+) (.+)$/)
      if (match) {
        currentMetric.name = match[1]
        currentMetric.help = match[2]
      }
    } else if (line.startsWith('# TYPE ')) {
      const match = line.match(/^# TYPE (\S+) (\S+)$/)
      if (match) {
        currentMetric.name = match[1]
        currentMetric.type = match[2]
      }
    } else if (line.trim() && !line.startsWith('#')) {
      // Parse metric line: metric_name{label1="value1"} value [timestamp]
      const match = line.match(/^(\S+?)(?:\{([^}]+)\})?\s+([\d.eE+-]+)(?:\s+(\d+))?$/)
      if (match) {
        const [, name, labelsStr, valueStr, timestampStr] = match
        
        const labels: Record<string, string> = {}
        if (labelsStr) {
          const labelPairs = labelsStr.match(/(\w+)="([^"]*)"/g)
          if (labelPairs) {
            for (const pair of labelPairs) {
              const [key, value] = pair.split('=')
              labels[key] = value.replace(/"/g, '')
            }
          }
        }

        metrics.push({
          name,
          type: currentMetric.type,
          help: currentMetric.help,
          labels: Object.keys(labels).length > 0 ? labels : undefined,
          value: parseFloat(valueStr),
          timestamp: timestampStr ? parseInt(timestampStr) : undefined,
        })
      }
    }
  }

  return metrics
}

/**
 * Validate Prometheus metric name
 */
export function isValidMetricName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
}

/**
 * Validate Prometheus label name
 */
export function isValidLabelName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
}

/**
 * Generate concurrent requests
 */
export async function concurrentRequests<T>(
  fn: () => Promise<T>,
  count: number
): Promise<T[]> {
  const requests = Array.from({ length: count }, () => fn())
  return Promise.all(requests)
}

/**
 * Calculate percentiles from an array of numbers
 */
export function calculatePercentiles(
  values: number[],
  percentiles: number[] = [50, 90, 95, 99]
): Record<string, number> {
  const sorted = [...values].sort((a, b) => a - b)
  const result: Record<string, number> = {}

  for (const p of percentiles) {
    const index = Math.ceil((p / 100) * sorted.length) - 1
    result[`p${p}`] = sorted[index]
  }

  return result
}

/**
 * Assert response is successful
 */
export function assertSuccess(response: Response): void {
  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status}: ${response.statusText}`
    )
  }
}

/**
 * Assert response has expected status
 */
export function assertStatus(response: Response, expected: number): void {
  if (response.status !== expected) {
    throw new Error(
      `Expected status ${expected}, got ${response.status}: ${response.statusText}`
    )
  }
}

/**
 * Assert response has expected content type
 */
export function assertContentType(
  response: Response,
  expected: string | RegExp
): void {
  const contentType = response.headers.get('content-type')
  
  if (!contentType) {
    throw new Error('Response has no Content-Type header')
  }

  if (typeof expected === 'string') {
    if (!contentType.includes(expected)) {
      throw new Error(
        `Expected Content-Type to include "${expected}", got "${contentType}"`
      )
    }
  } else {
    if (!expected.test(contentType)) {
      throw new Error(
        `Expected Content-Type to match ${expected}, got "${contentType}"`
      )
    }
  }
}

/**
 * Create a mock Prometheus metrics response
 */
export function createMockMetrics(
  metrics: Array<{
    name: string
    type: string
    help: string
    value: number
    labels?: Record<string, string>
  }>
): string {
  const lines: string[] = []

  for (const metric of metrics) {
    lines.push(`# HELP ${metric.name} ${metric.help}`)
    lines.push(`# TYPE ${metric.name} ${metric.type}`)
    
    if (metric.labels) {
      const labelStr = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',')
      lines.push(`${metric.name}{${labelStr}} ${metric.value}`)
    } else {
      lines.push(`${metric.name} ${metric.value}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Validate Zod schema with detailed error messages
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.errors.map(
    err => `${err.path.join('.')}: ${err.message}`
  )
  
  return { success: false, errors }
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate random string for testing
 */
export function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Check if server is ready
 */
export async function waitForServer(
  url: string = BASE_URL,
  timeout: number = 30000
): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok || response.status === 404) {
        return
      }
    } catch (error) {
      // Server not ready yet
    }
    await sleep(1000)
  }

  throw new Error(`Server not ready after ${timeout}ms`)
}
