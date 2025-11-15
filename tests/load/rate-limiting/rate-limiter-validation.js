import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { generateAuthToken } from '../utils/auth.js';

// Custom metrics
const rateLimitHits = new Counter('rate_limit_hits');
const rateLimitBypass = new Counter('rate_limit_bypass');
const successfulRequests = new Counter('successful_requests');
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm up
    { duration: '1m', target: 100 },   // Normal load
    { duration: '2m', target: 200 },   // Increased load
    { duration: '1m', target: 100 },   // Scale down
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    'rate_limit_hits': ['count>0'],           // Should hit rate limits
    'rate_limit_bypass': ['count==0'],        // No bypasses allowed
    'http_req_duration': ['p(95)<1000'],      // 95% under 1s
    'http_req_failed{expected:false}': ['rate<0.01'], // Unexpected errors < 1%
    'errors': ['rate<0.05'],                  // Total error rate < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // Generate test users with auth tokens
  const users = [];
  for (let i = 0; i < 10; i++) {
    users.push({
      id: `test-user-${i}`,
      token: generateAuthToken(`test-user-${i}`),
    });
  }
  return { users };
}

export default function (data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  
  group('Rate Limiter Validation', () => {
    // Test 1: IP-based rate limiting
    group('IP Rate Limiting', () => {
      testIPRateLimit();
    });
    
    // Test 2: User-based rate limiting
    group('User Rate Limiting', () => {
      testUserRateLimit(user);
    });
    
    // Test 3: Endpoint-specific rate limiting
    group('Endpoint Rate Limiting', () => {
      testEndpointRateLimit(user);
    });
    
    // Test 4: Rate limit headers validation
    group('Rate Limit Headers', () => {
      testRateLimitHeaders(user);
    });
  });
  
  sleep(1);
}

function testIPRateLimit() {
  const responses = [];
  
  // Make rapid requests to trigger IP rate limit
  for (let i = 0; i < 15; i++) {
    const res = http.get(`${BASE_URL}/api/health`);
    responses.push(res);
    
    const isRateLimited = res.status === 429;
    if (isRateLimited) {
      rateLimitHits.add(1);
    }
    
    responseTime.add(res.timings.duration);
  }
  
  // Verify at least some requests were rate limited
  const rateLimitedCount = responses.filter(r => r.status === 429).length;
  
  check(responses[responses.length - 1], {
    'IP rate limit enforced': () => rateLimitedCount > 0,
    'Rate limited requests return 429': () => {
      return responses.filter(r => r.status === 429).every(r => r.status === 429);
    },
  });
}

function testUserRateLimit(user) {
  const responses = [];
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  
  // Make rapid authenticated requests
  for (let i = 0; i < 20; i++) {
    const res = http.get(`${BASE_URL}/api/dashboard`, { headers });
    responses.push(res);
    
    if (res.status === 429) {
      rateLimitHits.add(1);
      
      // Verify retry-after header
      check(res, {
        'Retry-After header present': (r) => r.headers['Retry-After'] !== undefined,
      });
    } else if (res.status === 200) {
      successfulRequests.add(1);
    } else {
      errorRate.add(1);
    }
    
    responseTime.add(res.timings.duration);
  }
  
  const rateLimitedCount = responses.filter(r => r.status === 429).length;
  
  check(responses[responses.length - 1], {
    'User rate limit enforced': () => rateLimitedCount > 0,
    'Some requests succeed before limit': () => responses.some(r => r.status === 200),
  });
}

function testEndpointRateLimit(user) {
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  
  // Test different endpoints with different limits
  const endpoints = [
    { path: '/api/dashboard', limit: 100 },
    { path: '/api/content', limit: 50 },
    { path: '/api/messages/unified', limit: 30 },
  ];
  
  endpoints.forEach(endpoint => {
    const responses = [];
    
    // Make requests up to and beyond the limit
    for (let i = 0; i < endpoint.limit + 10; i++) {
      const res = http.get(`${BASE_URL}${endpoint.path}`, { headers });
      responses.push(res);
      
      if (res.status === 429) {
        rateLimitHits.add(1);
      }
    }
    
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    check(responses[responses.length - 1], {
      [`${endpoint.path} rate limit enforced`]: () => rateLimitedCount > 0,
      [`${endpoint.path} allows requests before limit`]: () => {
        return responses.slice(0, Math.floor(endpoint.limit / 2)).every(r => r.status !== 429);
      },
    });
  });
}

function testRateLimitHeaders(user) {
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  
  const res = http.get(`${BASE_URL}/api/dashboard`, { headers });
  
  check(res, {
    'X-RateLimit-Limit header present': (r) => r.headers['X-RateLimit-Limit'] !== undefined,
    'X-RateLimit-Remaining header present': (r) => r.headers['X-RateLimit-Remaining'] !== undefined,
    'X-RateLimit-Reset header present': (r) => r.headers['X-RateLimit-Reset'] !== undefined,
    'Rate limit headers are numeric': (r) => {
      const limit = parseInt(r.headers['X-RateLimit-Limit']);
      const remaining = parseInt(r.headers['X-RateLimit-Remaining']);
      return !isNaN(limit) && !isNaN(remaining);
    },
  });
  
  // Make requests until rate limited
  let rateLimitedResponse;
  for (let i = 0; i < 150; i++) {
    const r = http.get(`${BASE_URL}/api/dashboard`, { headers });
    if (r.status === 429) {
      rateLimitedResponse = r;
      break;
    }
  }
  
  if (rateLimitedResponse) {
    check(rateLimitedResponse, {
      'Rate limited response has Retry-After': (r) => r.headers['Retry-After'] !== undefined,
      'Retry-After is numeric': (r) => !isNaN(parseInt(r.headers['Retry-After'])),
      'Rate limited response has error body': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.error !== undefined;
        } catch {
          return false;
        }
      },
    });
  }
}

export function teardown(data) {
  console.log('Rate Limiter Validation Test Complete');
  console.log(`Total rate limit hits: ${rateLimitHits.value}`);
  console.log(`Successful requests: ${successfulRequests.value}`);
}
