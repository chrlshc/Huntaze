import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

/**
 * Generate a test authentication token
 * In production, this would call the actual auth endpoint
 */
export function generateAuthToken(userId) {
  // For testing purposes, generate a mock JWT-like token
  // In real tests, you'd call your auth API
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  const signature = randomString(43);
  
  return `${header}.${payload}.${signature}`;
}

/**
 * Create authenticated request headers
 */
export function createAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Login and get real auth token
 * Use this for actual integration with your auth system
 */
export function login(baseUrl, email, password) {
  const url = `${baseUrl}/api/auth/login`;
  const payload = JSON.stringify({
    email,
    password,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.post(url, payload, params);
  
  if (response.status === 200) {
    const body = JSON.parse(response.body);
    return body.token || body.accessToken;
  }
  
  return null;
}

/**
 * Generate multiple test users with tokens
 */
export function generateTestUsers(count = 10) {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    users.push({
      id: `test-user-${i}`,
      email: `test-user-${i}@example.com`,
      token: generateAuthToken(`test-user-${i}`),
    });
  }
  
  return users;
}
