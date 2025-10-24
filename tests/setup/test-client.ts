/**
 * Test Client for API Integration Tests
 * Provides a unified interface for making HTTP requests in tests
 */

interface TestClientOptions {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

class TestClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(options: TestClientOptions = {}) {
    this.baseURL = options.baseURL || 'http://localhost:3000';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    this.timeout = options.timeout || 10000;
  }

  private async makeRequest(
    method: string,
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<Response> {
    const url = `${this.baseURL}${path}`;
    const headers = { ...this.defaultHeaders, ...options.headers };

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestInit.body = JSON.stringify(body);
    }

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...requestInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async get(path: string, options?: RequestOptions): Promise<Response> {
    return this.makeRequest('GET', path, undefined, options);
  }

  async post(path: string, body?: any, options?: RequestOptions): Promise<Response> {
    return this.makeRequest('POST', path, body, options);
  }

  async put(path: string, body?: any, options?: RequestOptions): Promise<Response> {
    return this.makeRequest('PUT', path, body, options);
  }

  async patch(path: string, body?: any, options?: RequestOptions): Promise<Response> {
    return this.makeRequest('PATCH', path, body, options);
  }

  async delete(path: string, options?: RequestOptions): Promise<Response> {
    return this.makeRequest('DELETE', path, undefined, options);
  }

  // Utility methods for common test scenarios
  async authenticatedRequest(
    method: string,
    path: string,
    token: string,
    body?: any
  ): Promise<Response> {
    return this.makeRequest(method, path, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async signIn(email: string, password: string, rememberMe = false): Promise<{
    response: Response;
    user?: any;
    accessToken?: string;
  }> {
    const response = await this.post('/api/auth/signin', {
      email,
      password,
      rememberMe,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        response,
        user: data.user,
        accessToken: data.accessToken,
      };
    }

    return { response };
  }

  async signUp(userData: {
    name: string;
    email: string;
    password: string;
    acceptTerms: boolean;
  }): Promise<{
    response: Response;
    user?: any;
  }> {
    const response = await this.post('/api/auth/signup', userData);

    if (response.ok) {
      const data = await response.json();
      return {
        response,
        user: data.user,
      };
    }

    return { response };
  }

  // Helper to set authentication token for subsequent requests
  setAuthToken(token: string): void {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  // Helper to clear authentication
  clearAuth(): void {
    delete this.defaultHeaders.Authorization;
  }

  // Helper to set custom headers
  setHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  // Helper to reset headers to defaults
  resetHeaders(): void {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }
}

// Create singleton instance for tests
export const testClient = new TestClient({
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
});

// Export class for custom instances
export { TestClient };

// Helper function to create authenticated client
export function createAuthenticatedClient(token: string): TestClient {
  return new TestClient({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Helper function for API response assertions
export class APIResponseHelper {
  static async expectSuccess(response: Response, expectedStatus = 200): Promise<any> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expected ${expectedStatus}, got ${response.status}: ${errorText}`);
    }

    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }

    return response.json();
  }

  static async expectError(
    response: Response,
    expectedStatus: number,
    expectedErrorMessage?: string
  ): Promise<any> {
    if (response.ok) {
      throw new Error(`Expected error ${expectedStatus}, but request succeeded`);
    }

    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }

    const errorData = await response.json();

    if (expectedErrorMessage && !errorData.error?.includes(expectedErrorMessage)) {
      throw new Error(`Expected error message to contain "${expectedErrorMessage}", got "${errorData.error}"`);
    }

    return errorData;
  }

  static expectValidationError(response: Response): Promise<any> {
    return this.expectError(response, 400, 'Invalid input');
  }

  static expectAuthenticationError(response: Response): Promise<any> {
    return this.expectError(response, 401, 'Invalid credentials');
  }

  static expectAuthorizationError(response: Response): Promise<any> {
    return this.expectError(response, 403);
  }

  static expectNotFoundError(response: Response): Promise<any> {
    return this.expectError(response, 404);
  }

  static expectConflictError(response: Response): Promise<any> {
    return this.expectError(response, 409);
  }

  static expectRateLimitError(response: Response): Promise<any> {
    return this.expectError(response, 429, 'Too many requests');
  }

  static expectServerError(response: Response): Promise<any> {
    return this.expectError(response, 500, 'Internal server error');
  }
}

export { APIResponseHelper };