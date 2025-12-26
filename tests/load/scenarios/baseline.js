import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const response = http.get(`${BASE_URL}/api/health-check`);

  check(response, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
