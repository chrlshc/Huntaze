/**
 * Prometheus Metrics Endpoint
 * Expose les métriques au format Prometheus pour scraping
 */

import { NextRequest, NextResponse } from 'next/server';
import { sloMonitoring } from '@/lib/services/slo-monitoring-service';
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';
import { AdvancedCircuitBreakerFactory } from '@/lib/services/advanced-circuit-breaker';
import { getSmartRequestCoalescer } from '@/lib/services/smart-request-coalescer';

export async function GET(request: NextRequest) {
  try {
    const metrics = generatePrometheusMetrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Metrics] Failed to generate metrics:', error);
    
    return new NextResponse('# Error generating metrics\n', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  }
}

/**
 * Génère les métriques au format Prometheus
 */
function generatePrometheusMetrics(): string {
  const timestamp = Date.now();
  let metrics = '';

  // Header avec métadonnées
  metrics += `# HELP huntaze_build_info Build information\n`;
  metrics += `# TYPE huntaze_build_info gauge\n`;
  metrics += `huntaze_build_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1\n\n`;

  // SLI Metrics
  metrics += generateSLIMetrics();

  // API Monitoring Metrics
  metrics += generateAPIMetrics();

  // Circuit Breaker Metrics
  metrics += generateCircuitBreakerMetrics();

  // Request Coalescer Metrics
  metrics += generateCoalescerMetrics();

  // System Metrics
  metrics += generateSystemMetrics();

  // Health Score Metrics
  metrics += generateHealthMetrics();

  return metrics;
}

/**
 * Métriques SLI/SLO
 */
function generateSLIMetrics(): string {
  let metrics = '';
  
  try {
    const slis = sloMonitoring.getSLIs();
    const burnRates = sloMonitoring.getBurnRates();

    // SLI current values
    metrics += `# HELP sli_current_value Current SLI value\n`;
    metrics += `# TYPE sli_current_value gauge\n`;
    slis.forEach(sli => {
      const labels = `name="${sli.name}",target="${sli.target}",status="${sli.status}"`;
      metrics += `sli_current_value{${labels}} ${sli.currentValue}\n`;
    });
    metrics += '\n';

    // SLI targets
    metrics += `# HELP sli_target SLI target value\n`;
    metrics += `# TYPE sli_target gauge\n`;
    slis.forEach(sli => {
      metrics += `sli_target{name="${sli.name}"} ${sli.target}\n`;
    });
    metrics += '\n';

    // Error budgets
    metrics += `# HELP sli_error_budget Remaining error budget percentage\n`;
    metrics += `# TYPE sli_error_budget gauge\n`;
    slis.forEach(sli => {
      metrics += `sli_error_budget{name="${sli.name}"} ${sli.errorBudget}\n`;
    });
    metrics += '\n';

    // Burn rates
    metrics += `# HELP sli_burn_rate Error budget burn rate\n`;
    metrics += `# TYPE sli_burn_rate gauge\n`;
    Object.entries(burnRates).forEach(([name, burnRate]) => {
      const severity = burnRate.severity.toLowerCase();
      metrics += `sli_burn_rate{name="${name}",severity="${severity}"} ${burnRate.budgetConsumed}\n`;
    });
    metrics += '\n';

  } catch (error) {
    metrics += `# Error generating SLI metrics: ${error}\n`;
  }

  return metrics;
}

/**
 * Métriques API Monitoring
 */
function generateAPIMetrics(): string {
  let metrics = '';
  
  try {
    const monitoring = getAPIMonitoringService();
    const healthMetrics = monitoring.getHealthMetrics();
    const endpointMetrics = monitoring.getEndpointMetrics();

    // Total requests
    metrics += `# HELP http_requests_total Total HTTP requests\n`;
    metrics += `# TYPE http_requests_total counter\n`;
    metrics += `http_requests_total ${healthMetrics.totalRequests}\n\n`;

    // Request rate
    metrics += `# HELP http_requests_per_second Current requests per second\n`;
    metrics += `# TYPE http_requests_per_second gauge\n`;
    const rps = healthMetrics.totalRequests / (process.uptime() || 1);
    metrics += `http_requests_per_second ${rps.toFixed(2)}\n\n`;

    // Error rate
    metrics += `# HELP http_error_rate HTTP error rate percentage\n`;
    metrics += `# TYPE http_error_rate gauge\n`;
    metrics += `http_error_rate ${healthMetrics.errorRate}\n\n`;

    // Response time
    metrics += `# HELP http_request_duration_seconds HTTP request duration\n`;
    metrics += `# TYPE http_request_duration_seconds histogram\n`;
    
    // Simuler des buckets d'histogramme basés sur le temps de réponse moyen
    const avgTime = healthMetrics.averageResponseTime / 1000; // Convert to seconds
    const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
    let cumulativeCount = 0;
    
    buckets.forEach(bucket => {
      // Estimation simple de la distribution
      const count = avgTime <= bucket ? healthMetrics.totalRequests : Math.floor(healthMetrics.totalRequests * 0.9);
      cumulativeCount = Math.max(cumulativeCount, count);
      metrics += `http_request_duration_seconds_bucket{le="${bucket}"} ${cumulativeCount}\n`;
    });
    metrics += `http_request_duration_seconds_bucket{le="+Inf"} ${healthMetrics.totalRequests}\n`;
    metrics += `http_request_duration_seconds_sum ${(avgTime * healthMetrics.totalRequests).toFixed(3)}\n`;
    metrics += `http_request_duration_seconds_count ${healthMetrics.totalRequests}\n\n`;

    // Cache hit rate
    metrics += `# HELP cache_hit_rate Cache hit rate percentage\n`;
    metrics += `# TYPE cache_hit_rate gauge\n`;
    metrics += `cache_hit_rate ${healthMetrics.cacheHitRate}\n\n`;

    // Endpoint-specific metrics
    metrics += `# HELP http_requests_by_endpoint Requests by endpoint\n`;
    metrics += `# TYPE http_requests_by_endpoint counter\n`;
    Object.entries(endpointMetrics).forEach(([endpoint, stats]) => {
      const [method, path] = endpoint.split(' ');
      metrics += `http_requests_by_endpoint{method="${method}",path="${path}"} ${stats.requests}\n`;
    });
    metrics += '\n';

    metrics += `# HELP http_request_duration_by_endpoint Average response time by endpoint\n`;
    metrics += `# TYPE http_request_duration_by_endpoint gauge\n`;
    Object.entries(endpointMetrics).forEach(([endpoint, stats]) => {
      const [method, path] = endpoint.split(' ');
      metrics += `http_request_duration_by_endpoint{method="${method}",path="${path}"} ${stats.averageResponseTime / 1000}\n`;
    });
    metrics += '\n';

  } catch (error) {
    metrics += `# Error generating API metrics: ${error}\n`;
  }

  return metrics;
}

/**
 * Métriques Circuit Breaker
 */
function generateCircuitBreakerMetrics(): string {
  let metrics = '';
  
  try {
    const circuitBreakers = AdvancedCircuitBreakerFactory.getAllMetrics();

    metrics += `# HELP circuit_breaker_state Circuit breaker state (0=closed, 1=open, 2=half_open)\n`;
    metrics += `# TYPE circuit_breaker_state gauge\n`;
    
    metrics += `# HELP circuit_breaker_failure_count Circuit breaker failure count\n`;
    metrics += `# TYPE circuit_breaker_failure_count counter\n`;
    
    metrics += `# HELP circuit_breaker_success_rate Circuit breaker success rate\n`;
    metrics += `# TYPE circuit_breaker_success_rate gauge\n`;

    Object.entries(circuitBreakers).forEach(([name, cbMetrics]) => {
      const stateValue = cbMetrics.state === 'CLOSED' ? 0 : cbMetrics.state === 'OPEN' ? 1 : 2;
      metrics += `circuit_breaker_state{service="${name}",state="${cbMetrics.state.toLowerCase()}"} ${stateValue}\n`;
      
      metrics += `circuit_breaker_failure_count{service="${name}"} ${cbMetrics.failureCount}\n`;
      
      const successRate = cbMetrics.totalRequests > 0 
        ? (cbMetrics.successfulRequests / cbMetrics.totalRequests) * 100 
        : 100;
      metrics += `circuit_breaker_success_rate{service="${name}"} ${successRate.toFixed(2)}\n`;
    });
    metrics += '\n';

  } catch (error) {
    metrics += `# Error generating circuit breaker metrics: ${error}\n`;
  }

  return metrics;
}

/**
 * Métriques Request Coalescer
 */
function generateCoalescerMetrics(): string {
  let metrics = '';
  
  try {
    const coalescer = getSmartRequestCoalescer();
    const coalescerMetrics = coalescer.getMetrics();

    metrics += `# HELP request_coalescer_total_requests Total coalescer requests\n`;
    metrics += `# TYPE request_coalescer_total_requests counter\n`;
    metrics += `request_coalescer_total_requests ${coalescerMetrics.totalRequests}\n\n`;

    metrics += `# HELP request_coalescer_coalesced_requests Coalesced requests count\n`;
    metrics += `# TYPE request_coalescer_coalesced_requests counter\n`;
    metrics += `request_coalescer_coalesced_requests ${coalescerMetrics.coalescedRequests}\n\n`;

    metrics += `# HELP request_coalescer_cache_hits Cache hits count\n`;
    metrics += `# TYPE request_coalescer_cache_hits counter\n`;
    metrics += `request_coalescer_cache_hits ${coalescerMetrics.cacheHits}\n\n`;

    metrics += `# HELP request_coalescer_efficiency Coalescing efficiency percentage\n`;
    metrics += `# TYPE request_coalescer_efficiency gauge\n`;
    metrics += `request_coalescer_efficiency ${coalescerMetrics.coalescingEfficiency}\n\n`;

    metrics += `# HELP request_coalescer_cache_size Current cache size\n`;
    metrics += `# TYPE request_coalescer_cache_size gauge\n`;
    metrics += `request_coalescer_cache_size ${coalescerMetrics.cacheSize}\n\n`;

    metrics += `# HELP request_coalescer_pending_requests Current pending requests\n`;
    metrics += `# TYPE request_coalescer_pending_requests gauge\n`;
    metrics += `request_coalescer_pending_requests ${coalescerMetrics.pendingRequests}\n\n`;

  } catch (error) {
    metrics += `# Error generating coalescer metrics: ${error}\n`;
  }

  return metrics;
}

/**
 * Métriques système
 */
function generateSystemMetrics(): string {
  let metrics = '';
  
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    metrics += `# HELP process_resident_memory_bytes Resident memory size in bytes\n`;
    metrics += `# TYPE process_resident_memory_bytes gauge\n`;
    metrics += `process_resident_memory_bytes ${memUsage.rss}\n\n`;

    metrics += `# HELP process_heap_bytes Heap memory size in bytes\n`;
    metrics += `# TYPE process_heap_bytes gauge\n`;
    metrics += `process_heap_bytes{type="used"} ${memUsage.heapUsed}\n`;
    metrics += `process_heap_bytes{type="total"} ${memUsage.heapTotal}\n\n`;

    // CPU metrics
    metrics += `# HELP process_cpu_seconds_total CPU time in seconds\n`;
    metrics += `# TYPE process_cpu_seconds_total counter\n`;
    metrics += `process_cpu_seconds_total{type="user"} ${cpuUsage.user / 1000000}\n`;
    metrics += `process_cpu_seconds_total{type="system"} ${cpuUsage.system / 1000000}\n\n`;

    // Uptime
    metrics += `# HELP process_uptime_seconds Process uptime in seconds\n`;
    metrics += `# TYPE process_uptime_seconds gauge\n`;
    metrics += `process_uptime_seconds ${process.uptime()}\n\n`;

    // Event loop lag (approximation)
    const eventLoopLag = 0; // À implémenter avec perf_hooks si nécessaire
    metrics += `# HELP nodejs_eventloop_lag_seconds Event loop lag in seconds\n`;
    metrics += `# TYPE nodejs_eventloop_lag_seconds gauge\n`;
    metrics += `nodejs_eventloop_lag_seconds ${eventLoopLag}\n\n`;

  } catch (error) {
    metrics += `# Error generating system metrics: ${error}\n`;
  }

  return metrics;
}

/**
 * Métriques de santé globale
 */
function generateHealthMetrics(): string {
  let metrics = '';
  
  try {
    const healthScore = sloMonitoring.getHealthScore();
    const dependencies = sloMonitoring.getDependencies();

    // Overall health score
    metrics += `# HELP health_score_overall Overall system health score (0-100)\n`;
    metrics += `# TYPE health_score_overall gauge\n`;
    metrics += `health_score_overall ${healthScore.overall}\n\n`;

    // Health breakdown
    metrics += `# HELP health_score_component Component health scores\n`;
    metrics += `# TYPE health_score_component gauge\n`;
    Object.entries(healthScore.breakdown).forEach(([component, score]) => {
      metrics += `health_score_component{component="${component}"} ${score}\n`;
    });
    metrics += '\n';

    // Health status
    metrics += `# HELP health_status System health status (0=unhealthy, 1=degraded, 2=healthy)\n`;
    metrics += `# TYPE health_status gauge\n`;
    const statusValue = healthScore.status === 'HEALTHY' ? 2 : healthScore.status === 'DEGRADED' ? 1 : 0;
    metrics += `health_status{status="${healthScore.status.toLowerCase()}"} ${statusValue}\n\n`;

    // Dependencies health
    metrics += `# HELP dependency_health Dependency health status\n`;
    metrics += `# TYPE dependency_health gauge\n`;
    dependencies.forEach(dep => {
      const statusValue = dep.status === 'UP' ? 1 : dep.status === 'DEGRADED' ? 0.5 : 0;
      const labels = `name="${dep.name}",status="${dep.status.toLowerCase()}",criticality="${dep.criticality.toLowerCase()}"`;
      metrics += `dependency_health{${labels}} ${statusValue}\n`;
    });
    metrics += '\n';

    // Dependency latency
    metrics += `# HELP dependency_latency_seconds Dependency response time in seconds\n`;
    metrics += `# TYPE dependency_latency_seconds gauge\n`;
    dependencies.forEach(dep => {
      metrics += `dependency_latency_seconds{name="${dep.name}"} ${dep.latency / 1000}\n`;
    });
    metrics += '\n';

  } catch (error) {
    metrics += `# Error generating health metrics: ${error}\n`;
  }

  return metrics;
}

/**
 * Endpoint pour les métriques custom (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metric, value, labels = {} } = body;

    if (!metric || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metric, value' },
        { status: 400 }
      );
    }

    // Ici on pourrait stocker les métriques custom
    // Pour l'instant, on retourne juste un succès
    
    return NextResponse.json({ 
      success: true, 
      message: 'Custom metric recorded',
      metric,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}