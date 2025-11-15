/**
 * Billing API Test Fixtures
 * 
 * Reusable test data for billing integration tests
 */

// ============================================================================
// Pack Types
// ============================================================================

export const PACK_TYPES = {
  STARTER: '25k',
  PRO: '100k',
  ENTERPRISE: '500k',
} as const;

export const ALL_PACK_TYPES = Object.values(PACK_TYPES);

// ============================================================================
// Valid Request Bodies
// ============================================================================

export const VALID_REQUESTS = {
  STARTER_PACK: {
    pack: PACK_TYPES.STARTER,
  },
  PRO_PACK: {
    pack: PACK_TYPES.PRO,
  },
  ENTERPRISE_PACK: {
    pack: PACK_TYPES.ENTERPRISE,
  },
  WITH_CUSTOMER_ID: {
    pack: PACK_TYPES.STARTER,
    customerId: 'cus_test_123',
  },
  WITH_METADATA: {
    pack: PACK_TYPES.STARTER,
    metadata: {
      userId: 'user_123',
      source: 'dashboard',
      campaign: 'summer_sale',
    },
  },
  FULL_REQUEST: {
    pack: PACK_TYPES.PRO,
    customerId: 'cus_test_456',
    metadata: {
      userId: 'user_456',
      source: 'api',
    },
  },
};

// ============================================================================
// Invalid Request Bodies
// ============================================================================

export const INVALID_REQUESTS = {
  MISSING_PACK: {},
  INVALID_PACK_TYPE: {
    pack: 'invalid',
  },
  NUMERIC_PACK: {
    pack: 123,
  },
  NULL_PACK: {
    pack: null,
  },
  ARRAY_PACK: {
    pack: ['25k'],
  },
  INVALID_CUSTOMER_ID_TYPE: {
    pack: PACK_TYPES.STARTER,
    customerId: 123,
  },
  INVALID_METADATA_TYPE: {
    pack: PACK_TYPES.STARTER,
    metadata: 'invalid',
  },
  INVALID_METADATA_ARRAY: {
    pack: PACK_TYPES.STARTER,
    metadata: ['invalid'],
  },
};

// ============================================================================
// Mock Stripe Responses
// ============================================================================

export const MOCK_STRIPE_SESSION = {
  id: 'cs_test_mock_session_id',
  object: 'checkout.session',
  url: 'https://checkout.stripe.com/pay/cs_test_mock',
  customer: 'cus_mock_demo',
  mode: 'payment',
  status: 'open',
  payment_status: 'unpaid',
  amount_total: 2500,
  currency: 'usd',
  metadata: {
    pack: '25k',
    messages: '25000',
    packName: 'Starter Pack',
  },
};

export const MOCK_STRIPE_SESSIONS = {
  STARTER: {
    ...MOCK_STRIPE_SESSION,
    id: 'cs_test_starter',
    amount_total: 2500,
    metadata: {
      pack: '25k',
      messages: '25000',
      packName: 'Starter Pack',
    },
  },
  PRO: {
    ...MOCK_STRIPE_SESSION,
    id: 'cs_test_pro',
    amount_total: 9900,
    metadata: {
      pack: '100k',
      messages: '100000',
      packName: 'Pro Pack',
    },
  },
  ENTERPRISE: {
    ...MOCK_STRIPE_SESSION,
    id: 'cs_test_enterprise',
    amount_total: 49900,
    metadata: {
      pack: '500k',
      messages: '500000',
      packName: 'Enterprise Pack',
    },
  },
};

// ============================================================================
// Mock Stripe Errors
// ============================================================================

export const MOCK_STRIPE_ERRORS = {
  API_ERROR: {
    type: 'api_error',
    message: 'An error occurred with the Stripe API',
    statusCode: 500,
  },
  CONNECTION_ERROR: {
    type: 'StripeConnectionError',
    message: 'Failed to connect to Stripe',
    statusCode: 503,
  },
  RATE_LIMIT: {
    type: 'rate_limit',
    message: 'Too many requests',
    statusCode: 429,
  },
  AUTHENTICATION_ERROR: {
    type: 'authentication_error',
    message: 'Invalid API key provided',
    statusCode: 401,
  },
  INVALID_REQUEST: {
    type: 'invalid_request_error',
    message: 'Invalid request parameters',
    statusCode: 400,
  },
  CARD_ERROR: {
    type: 'card_error',
    message: 'Your card was declined',
    statusCode: 402,
  },
};

// ============================================================================
// Environment Variables
// ============================================================================

export const MOCK_ENV_COMPLETE = {
  STRIPE_SECRET_KEY: 'sk_test_mock_key_complete',
  STRIPE_PRICE_MSGPACK_25K: 'price_mock_25k',
  STRIPE_PRICE_MSGPACK_100K: 'price_mock_100k',
  STRIPE_PRICE_MSGPACK_500K: 'price_mock_500k',
  DEMO_STRIPE_CUSTOMER_ID: 'cus_mock_demo',
  NEXT_PUBLIC_APP_URL: 'https://test.huntaze.com',
};

export const MOCK_ENV_MISSING_SECRET = {
  ...MOCK_ENV_COMPLETE,
  STRIPE_SECRET_KEY: undefined,
};

export const MOCK_ENV_MISSING_PRICES = {
  ...MOCK_ENV_COMPLETE,
  STRIPE_PRICE_MSGPACK_25K: undefined,
  STRIPE_PRICE_MSGPACK_100K: undefined,
  STRIPE_PRICE_MSGPACK_500K: undefined,
};

export const MOCK_ENV_MISSING_CUSTOMER = {
  ...MOCK_ENV_COMPLETE,
  DEMO_STRIPE_CUSTOMER_ID: undefined,
};

// ============================================================================
// Expected Response Schemas
// ============================================================================

export const SUCCESS_RESPONSE_SCHEMA = {
  success: true,
  url: expect.any(String),
  sessionId: expect.any(String),
  correlationId: expect.stringMatching(/^billing-\d+-[a-z0-9]+$/),
};

export const ERROR_RESPONSE_SCHEMA = {
  success: false,
  error: expect.any(String),
  correlationId: expect.stringMatching(/^billing-\d+-[a-z0-9]+$/),
};

// ============================================================================
// Test Scenarios
// ============================================================================

export const TEST_SCENARIOS = {
  HAPPY_PATH: {
    name: 'Happy path - successful checkout',
    request: VALID_REQUESTS.STARTER_PACK,
    expectedStatus: 200,
    expectedResponse: SUCCESS_RESPONSE_SCHEMA,
  },
  VALIDATION_ERROR: {
    name: 'Validation error - invalid pack',
    request: INVALID_REQUESTS.INVALID_PACK_TYPE,
    expectedStatus: 400,
    expectedResponse: ERROR_RESPONSE_SCHEMA,
  },
  CONFIGURATION_ERROR: {
    name: 'Configuration error - missing price ID',
    request: VALID_REQUESTS.STARTER_PACK,
    envOverride: MOCK_ENV_MISSING_PRICES,
    expectedStatus: 500,
    expectedResponse: ERROR_RESPONSE_SCHEMA,
  },
  STRIPE_ERROR: {
    name: 'Stripe error - API failure',
    request: VALID_REQUESTS.STARTER_PACK,
    stripeError: MOCK_STRIPE_ERRORS.API_ERROR,
    expectedStatus: 500,
    expectedResponse: ERROR_RESPONSE_SCHEMA,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function createMockStripeError(errorType: keyof typeof MOCK_STRIPE_ERRORS) {
  const errorData = MOCK_STRIPE_ERRORS[errorType];
  const error = new Error(errorData.message) as any;
  error.type = errorData.type;
  error.statusCode = errorData.statusCode;
  return error;
}

export function generateLargeMetadata(size: number = 100): Record<string, string> {
  const metadata: Record<string, string> = {};
  for (let i = 0; i < size; i++) {
    metadata[`key_${i}`] = `value_${i}`;
  }
  return metadata;
}

export function generateUnicodeMetadata(): Record<string, string> {
  return {
    chinese: '你好世界',
    arabic: 'مرحبا بالعالم',
    emoji: '🎉🚀💰',
    japanese: 'こんにちは世界',
    korean: '안녕하세요 세계',
    russian: 'Привет мир',
  };
}

export function generateSpecialCharMetadata(): Record<string, string> {
  return {
    special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    quotes: `'"`,
    backslash: '\\',
    newline: 'line1\nline2',
    tab: 'col1\tcol2',
  };
}
