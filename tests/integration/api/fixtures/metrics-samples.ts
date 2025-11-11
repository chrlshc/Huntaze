/**
 * Test Fixtures - Prometheus Metrics Samples
 * 
 * Sample data for testing metrics endpoint responses
 */

export const validPrometheusMetrics = `# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.123456

# HELP process_cpu_system_seconds_total Total system CPU time spent in seconds.
# TYPE process_cpu_system_seconds_total counter
process_cpu_system_seconds_total 0.045678

# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 52428800

# HELP nodejs_heap_size_total_bytes Process heap size from Node.js in bytes.
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes 18874368

# HELP nodejs_heap_size_used_bytes Process heap size used from Node.js in bytes.
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 12345678

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/metrics",status="200"} 42
http_requests_total{method="POST",route="/api/data",status="201"} 15
http_requests_total{method="GET",route="/api/users",status="404"} 3

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 150
http_request_duration_seconds_bucket{le="1"} 180
http_request_duration_seconds_bucket{le="+Inf"} 200
http_request_duration_seconds_sum 45.5
http_request_duration_seconds_count 200
`

export const metricsWithLabels = `# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total{route="/api/crm/fans",method="GET",status="200"} 1234
api_requests_total{route="/api/crm/fans",method="POST",status="201"} 567
api_requests_total{route="/api/analytics/summary",method="GET",status="200"} 890
api_requests_total{route="/api/onboarding/complete",method="POST",status="500"} 12
`

export const errorResponse = {
  error: 'Metrics unavailable'
}

export const expectedDefaultMetrics = [
  'process_cpu_user_seconds_total',
  'process_cpu_system_seconds_total',
  'process_cpu_seconds_total',
  'process_start_time_seconds',
  'process_resident_memory_bytes',
  'nodejs_eventloop_lag_seconds',
  'nodejs_eventloop_lag_min_seconds',
  'nodejs_eventloop_lag_max_seconds',
  'nodejs_eventloop_lag_mean_seconds',
  'nodejs_eventloop_lag_stddev_seconds',
  'nodejs_eventloop_lag_p50_seconds',
  'nodejs_eventloop_lag_p90_seconds',
  'nodejs_eventloop_lag_p99_seconds',
  'nodejs_active_handles',
  'nodejs_active_handles_total',
  'nodejs_active_requests',
  'nodejs_active_requests_total',
  'nodejs_heap_size_total_bytes',
  'nodejs_heap_size_used_bytes',
  'nodejs_external_memory_bytes',
  'nodejs_heap_space_size_total_bytes',
  'nodejs_heap_space_size_used_bytes',
  'nodejs_heap_space_size_available_bytes',
  'nodejs_version_info',
  'nodejs_gc_duration_seconds',
]

export const metricTypes = {
  counter: 'counter',
  gauge: 'gauge',
  histogram: 'histogram',
  summary: 'summary',
}

export const invalidMetricFormats = [
  '# HELP', // Missing metric name
  '# TYPE', // Missing metric name
  'invalid-metric-name 123', // Hyphen not allowed
  'metric{invalid label} 123', // Invalid label syntax
  'metric{label="value"} abc', // Non-numeric value
  'metric{label=value} 123', // Missing quotes
]

export const concurrentRequestScenarios = {
  light: 5,
  medium: 20,
  heavy: 50,
  stress: 100,
}

export const performanceBenchmarks = {
  firstRequest: {
    maxDuration: 1000, // ms - includes lazy init
    target: 500,
  },
  subsequentRequest: {
    maxDuration: 200, // ms - cached
    target: 100,
  },
  concurrent: {
    maxDuration: 2000, // ms - for 20 concurrent
    target: 1000,
  },
}
