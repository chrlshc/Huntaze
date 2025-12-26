import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TARGET_URL = `${BASE_URL}/api/health-check`;

export default function () {
  const responses = http.batch([
    ['GET', TARGET_URL],
    ['GET', TARGET_URL],
    ['GET', TARGET_URL],
    ['GET', TARGET_URL],
    ['GET', TARGET_URL],
  ]);

  responses.forEach((response) => {
    check(response, {
      'status is ok or rate limited': (r) => r.status === 200 || r.status === 429,
    });
  });

  sleep(1);
}
