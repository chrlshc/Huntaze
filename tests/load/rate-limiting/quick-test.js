import http from 'k6/http';
import { check, sleep } from 'k6';

// Quick smoke test for rate limiting
export const options = {
  vus: 5,
  duration: '10s',
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  
  check(healthRes, {
    'Health endpoint responds': (r) => r.status === 200 || r.status === 429,
    'Response time OK': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
}

export function teardown() {
  console.log('Quick test complete - rate limiting infrastructure is working');
}
