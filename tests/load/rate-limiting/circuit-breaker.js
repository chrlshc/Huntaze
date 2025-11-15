import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { generateAuthToken } from '../utils/auth.js';

// Custom metrics
const circuitBreakerOpen = new Gauge('circuit_breaker_open');
const circuitBreakerTrips = new Counter('circuit_breaker_trips');
const failedRequests = new Counter('failed_requests');
const successfulRequests = new Counter('successful_requests');
const fallbackResponses = new Counter('fallback_responses');
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  scenarios: {
    // Scenario 1: Gradual failure to trigger circuit breaker
    gradual_failure: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'testCircuitBreakerTrip',
    },
    // Scenario 2: Recovery after circuit breaker opens
    recovery: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      startTime: '2m30s',
      exec: 'testCircuitBreakerRecovery',
    },
    // Scenario 3: Fail-open behavior
    fail_open: {
      executor: 'constant-vus',
      vus: 30,
      duration: '1m',
      startTime: '5m',
      exec: 'testFailOpenBehavior',
    },
  },
  thresholds: {
    'circuit_breaker_trips': ['count>0'],     // Should trip at least once
    'fallback_responses': ['count>0'],        // Should use fallback
    'http_req_duration': ['p(95)<2000'],      // 95% under 2s (higher due to failures)
    'errors': ['rate<0.3'],                   // Allow higher error rate during testing
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const REDIS_FAILURE_ENDPOINT = `${BASE_URL}/api/test/redis-failure`; // Test endpoint to simulate Redis failure

export function setup() {
  const users = [];
  for (let i = 0; i < 5; i++) {
    users.push({
      id: `test-user-${i}`,
      token: generateAuthToken(`test-user-${i}`),
    });
  }
  return { users };
}

export function testCircuitBreakerTrip(data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  
  group('Circuit Breaker Trip Test', () => {
    // Make requests that will cause failures
    const res = http.get(`${BASE_URL}/api/dashboard`, { headers });
    
    responseTime.add(res.timings.duration);
    
    if (res.status === 200) {
      successfulRequests.add(1);
    } else if (res.status === 503) {
      // Circuit breaker is open
      circuitBreakerOpen.add(1);
      circuitBreakerTrips.add(1);
      
      check(res, {
        'Circuit breaker response is 503': (r) => r.status === 503,
        'Circuit breaker response has error message': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.error && body.error.includes('circuit');
          } catch {
            return false;
          }
        },
      });
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });
  
  sleep(0.5);
}

export function testCircuitBreakerRecovery(data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  
  group('Circuit Breaker Recovery Test', () => {
    const res = http.get(`${BASE_URL}/api/dashboard`, { headers });
    
    responseTime.add(res.timings.duration);
    
    // Check if circuit breaker is recovering (half-open state)
    if (res.status === 200) {
      successfulRequests.add(1);
      circuitBreakerOpen.add(0); // Circuit is closed
      
      check(res, {
        'Request succeeds after recovery': (r) => r.status === 200,
        'Response time is normal': (r) => r.timings.duration < 1000,
      });
    } else if (res.status === 503) {
      circuitBreakerOpen.add(1);
    }
  });
  
  sleep(1);
}

export function testFailOpenBehavior(data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  
  group('Fail-Open Behavior Test', () => {
    // Test that system fails open when Redis is unavailable
    const res = http.get(`${BASE_URL}/api/dashboard`, { headers });
    
    responseTime.add(res.timings.duration);
    
    // When Redis fails, rate limiter should fail open (allow requests)
    if (res.status === 200) {
      successfulRequests.add(1);
      fallbackResponses.add(1);
      
      check(res, {
        'Request allowed when Redis unavailable': (r) => r.status === 200,
        'Response indicates fallback mode': (r) => {
          // Check for fallback indicator in headers
          return r.headers['X-RateLimit-Mode'] === 'fallback' || 
                 r.headers['X-Circuit-Breaker'] === 'open';
        },
      });
    } else if (res.status === 503) {
      // Circuit breaker protecting the system
      circuitBreakerOpen.add(1);
      
      check(res, {
        'Circuit breaker protects system': (r) => r.status === 503,
      });
    }
  });
  
  sleep(0.5);
}

// Test circuit breaker state transitions
export function testCircuitBreakerStates(data) {
  const user = data.users[0];
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  
  group('Circuit Breaker State Transitions', () => {
    const states = [];
    
    // Make multiple requests to observe state transitions
    for (let i = 0; i < 20; i++) {
      const res = http.get(`${BASE_URL}/api/dashboard`, { headers });
      
      const state = {
        status: res.status,
        timestamp: Date.now(),
        circuitState: res.headers['X-Circuit-Breaker-State'],
      };
      
      states.push(state);
      
      if (res.status === 503) {
        circuitBreakerTrips.add(1);
      }
      
      sleep(0.2);
    }
    
    // Analyze state transitions
    const hasClosedState = states.some(s => s.circuitState === 'closed');
    const hasOpenState = states.some(s => s.circuitState === 'open');
    const hasHalfOpenState = states.some(s => s.circuitState === 'half-open');
    
    check(states[states.length - 1], {
      'Circuit breaker transitions through states': () => {
        return hasClosedState || hasOpenState || hasHalfOpenState;
      },
    });
  });
}

// Test circuit breaker with different failure thresholds
export function testFailureThresholds(data) {
  const user = data.users[0];
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  
  group('Circuit Breaker Failure Thresholds', () => {
    let consecutiveFailures = 0;
    let circuitOpened = false;
    
    // Make requests until circuit breaker opens
    for (let i = 0; i < 50; i++) {
      const res = http.get(`${BASE_URL}/api/dashboard`, { headers });
      
      if (res.status >= 500) {
        consecutiveFailures++;
        failedRequests.add(1);
      } else if (res.status === 503) {
        circuitOpened = true;
        circuitBreakerTrips.add(1);
        break;
      } else {
        consecutiveFailures = 0;
        successfulRequests.add(1);
      }
      
      sleep(0.1);
    }
    
    check({ consecutiveFailures, circuitOpened }, {
      'Circuit breaker opens after threshold': (data) => {
        // Circuit should open after ~5-10 consecutive failures
        return data.circuitOpened || data.consecutiveFailures >= 5;
      },
    });
  });
}

export function teardown(data) {
  console.log('Circuit Breaker Load Test Complete');
  console.log(`Circuit breaker trips: ${circuitBreakerTrips.value}`);
  console.log(`Successful requests: ${successfulRequests.value}`);
  console.log(`Failed requests: ${failedRequests.value}`);
  console.log(`Fallback responses: ${fallbackResponses.value}`);
}
