// Performance thresholds and baselines for load tests

export const PERFORMANCE_BASELINES = {
  // API endpoint baselines (in milliseconds)
  api: {
    health: { p95: 100, p99: 200 },
    dashboard: { p95: 300, p99: 500 },
    content: { p95: 400, p99: 800 },
    messages: { p95: 200, p99: 400 },
    revenue: { p95: 500, p99: 1000 },
    analytics: { p95: 1000, p99: 2000 },
  },
  
  // Page load baselines (in milliseconds)
  pages: {
    dashboard: { p95: 1500, p99: 3000 },
    content: { p95: 2000, p99: 4000 },
    messages: { p95: 1000, p99: 2000 },
  },
  
  // Database query baselines (in milliseconds)
  database: {
    queries: { p95: 50, p99: 100 },
    writes: { p95: 100, p99: 200 },
  },
};

// Rate limiting thresholds
export const RATE_LIMIT_THRESHOLDS = {
  // IP-based rate limits (requests per minute)
  ip: {
    default: 100,
    strict: 30,
  },
  
  // User-based rate limits (requests per minute)
  user: {
    default: 200,
    authenticated: 500,
  },
  
  // Endpoint-specific rate limits (requests per minute)
  endpoints: {
    '/api/health': 1000,
    '/api/dashboard': 100,
    '/api/content': 50,
    '/api/messages/unified': 30,
    '/api/revenue/*': 50,
  },
};

// Circuit breaker configuration
export const CIRCUIT_BREAKER_CONFIG = {
  // Failure threshold before opening circuit
  failureThreshold: 5,
  
  // Time window for counting failures (in seconds)
  failureWindow: 60,
  
  // Time to wait before attempting recovery (in seconds)
  recoveryTimeout: 30,
  
  // Number of successful requests needed to close circuit
  successThreshold: 3,
};

// Load test scenarios configuration
export const LOAD_SCENARIOS = {
  // Baseline: Normal traffic
  baseline: {
    vus: 1000,
    duration: '15m',
    rampUp: '2m',
    rampDown: '2m',
  },
  
  // Peak: Expected peak traffic
  peak: {
    vus: 2500,
    duration: '30m',
    rampUp: '5m',
    rampDown: '5m',
  },
  
  // Spike: Sudden traffic increase
  spike: {
    startVus: 100,
    peakVus: 5000,
    spikeDuration: '1m',
    totalDuration: '10m',
  },
  
  // Stress: Beyond capacity
  stress: {
    startVus: 100,
    maxVus: 10000,
    stepDuration: '5m',
    stepSize: 1000,
  },
  
  // Soak: Long-duration stability
  soak: {
    vus: 500,
    duration: '4h',
  },
};

// Error rate thresholds
export const ERROR_THRESHOLDS = {
  // Maximum acceptable error rates
  http_errors: 0.01,        // 1% for unexpected errors
  rate_limit_errors: 0.05,  // 5% for rate limit errors (expected)
  server_errors: 0.001,     // 0.1% for 5xx errors
};

// k6 threshold configurations
export const K6_THRESHOLDS = {
  // Standard API thresholds
  api: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed{expected:false}': ['rate<0.01'],
    'http_reqs': ['rate>10'],
  },
  
  // Rate limiting test thresholds
  rateLimiting: {
    'http_req_duration': ['p(95)<1000'],
    'http_req_failed{expected:false}': ['rate<0.01'],
    'rate_limit_hits': ['count>0'],
    'rate_limit_bypass': ['count==0'],
  },
  
  // Circuit breaker test thresholds
  circuitBreaker: {
    'http_req_duration': ['p(95)<2000'],
    'circuit_breaker_trips': ['count>0'],
    'fallback_responses': ['count>0'],
    'errors': ['rate<0.3'],
  },
  
  // Stress test thresholds (more lenient)
  stress: {
    'http_req_duration': ['p(95)<5000'],
    'http_req_failed': ['rate<0.1'],
  },
};

// Export helper function to get thresholds by test type
export function getThresholds(testType) {
  return K6_THRESHOLDS[testType] || K6_THRESHOLDS.api;
}

// Export helper function to get baseline by endpoint
export function getBaseline(endpoint) {
  const path = endpoint.replace(/^\/api\//, '');
  return PERFORMANCE_BASELINES.api[path] || PERFORMANCE_BASELINES.api.dashboard;
}
