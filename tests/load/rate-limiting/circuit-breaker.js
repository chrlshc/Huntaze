import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const HEALTH_CHECK = `${BASE_URL}/api/health-check`;
const HEALTH = `${BASE_URL}/api/health`;

export default function () {
  const responses = http.batch([
    ['GET', HEALTH_CHECK],
    ['GET', HEALTH],
  ]);

  responses.forEach((response) => {
    check(response, {
      'status is ok or degraded': (r) => r.status === 200 || r.status === 503,
    });
  });

  sleep(1);
}
