import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics for rate limiting tests
export const rateLimitMetrics = {
  hits: new Counter('rate_limit_hits'),
  bypass: new Counter('rate_limit_bypass'),
  successful: new Counter('successful_requests'),
  errors: new Rate('errors'),
  responseTime: new Trend('response_time'),
};

// Custom metrics for circuit breaker tests
export const circuitBreakerMetrics = {
  open: new Gauge('circuit_breaker_open'),
  trips: new Counter('circuit_breaker_trips'),
  failed: new Counter('failed_requests'),
  successful: new Counter('successful_requests'),
  fallback: new Counter('fallback_responses'),
  errors: new Rate('errors'),
  responseTime: new Trend('response_time'),
};

// Custom metrics for API performance
export const apiMetrics = {
  requestDuration: new Trend('api_request_duration'),
  requestRate: new Rate('api_request_rate'),
  errorRate: new Rate('api_error_rate'),
  successRate: new Rate('api_success_rate'),
};

// Helper function to record rate limit metrics
export function recordRateLimitMetrics(response) {
  rateLimitMetrics.responseTime.add(response.timings.duration);
  
  if (response.status === 429) {
    rateLimitMetrics.hits.add(1);
  } else if (response.status === 200) {
    rateLimitMetrics.successful.add(1);
  } else {
    rateLimitMetrics.errors.add(1);
  }
}

// Helper function to record circuit breaker metrics
export function recordCircuitBreakerMetrics(response) {
  circuitBreakerMetrics.responseTime.add(response.timings.duration);
  
  if (response.status === 200) {
    circuitBreakerMetrics.successful.add(1);
    circuitBreakerMetrics.open.add(0);
  } else if (response.status === 503) {
    circuitBreakerMetrics.trips.add(1);
    circuitBreakerMetrics.open.add(1);
  } else if (response.status >= 500) {
    circuitBreakerMetrics.failed.add(1);
    circuitBreakerMetrics.errors.add(1);
  }
  
  // Check for fallback mode
  if (response.headers['X-RateLimit-Mode'] === 'fallback' ||
      response.headers['X-Circuit-Breaker'] === 'open') {
    circuitBreakerMetrics.fallback.add(1);
  }
}

// Helper function to record API metrics
export function recordApiMetrics(response) {
  apiMetrics.requestDuration.add(response.timings.duration);
  
  if (response.status >= 200 && response.status < 300) {
    apiMetrics.successRate.add(1);
    apiMetrics.errorRate.add(0);
  } else {
    apiMetrics.successRate.add(0);
    apiMetrics.errorRate.add(1);
  }
  
  apiMetrics.requestRate.add(1);
}

// Helper function to extract rate limit headers
export function extractRateLimitHeaders(response) {
  return {
    limit: parseInt(response.headers['X-RateLimit-Limit']) || null,
    remaining: parseInt(response.headers['X-RateLimit-Remaining']) || null,
    reset: parseInt(response.headers['X-RateLimit-Reset']) || null,
    retryAfter: parseInt(response.headers['Retry-After']) || null,
  };
}

// Helper function to extract circuit breaker state
export function extractCircuitBreakerState(response) {
  return {
    state: response.headers['X-Circuit-Breaker-State'] || 'unknown',
    isOpen: response.headers['X-Circuit-Breaker'] === 'open',
    mode: response.headers['X-RateLimit-Mode'] || 'normal',
  };
}

// Helper function to print metrics summary
export function printMetricsSummary(metrics, testName) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 ${testName} - Metrics Summary`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  Object.entries(metrics).forEach(([name, metric]) => {
    if (metric.value !== undefined) {
      console.log(`${name}: ${metric.value}`);
    }
  });
  
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}
