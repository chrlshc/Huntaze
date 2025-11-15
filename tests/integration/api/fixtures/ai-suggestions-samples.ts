/**
 * Test Fixtures - AI Suggestions Samples
 * 
 * Sample data for testing AI suggestions endpoint
 */

export const validSuggestionRequest = {
  fanId: 'fan-test-123',
  creatorId: 'creator-test-456',
  lastMessage: 'Hey, how are you doing today?',
  messageCount: 15,
  fanValueCents: 25000,
}

export const minimalSuggestionRequest = {
  fanId: 'fan-minimal',
  creatorId: 'creator-minimal',
}

export const highValueFanRequest = {
  fanId: 'fan-whale',
  creatorId: 'creator-456',
  lastMessage: 'I want to see more exclusive content',
  messageCount: 150,
  fanValueCents: 500000, // $5000
}

export const newFanRequest = {
  fanId: 'fan-new',
  creatorId: 'creator-456',
  lastMessage: 'Hi! Just subscribed',
  messageCount: 1,
  fanValueCents: 0,
}

export const flirtyContextRequest = {
  fanId: 'fan-flirty',
  creatorId: 'creator-456',
  lastMessage: 'You look amazing in that photo 😍',
  messageCount: 25,
  fanValueCents: 15000,
}

export const professionalContextRequest = {
  fanId: 'fan-professional',
  creatorId: 'creator-456',
  lastMessage: 'Can I get a custom video for my birthday?',
  messageCount: 10,
  fanValueCents: 50000,
}

export const invalidRequests = {
  missingFanId: {
    creatorId: 'creator-456',
    lastMessage: 'Hello',
  },
  missingCreatorId: {
    fanId: 'fan-123',
    lastMessage: 'Hello',
  },
  emptyObject: {},
  nullValues: {
    fanId: null,
    creatorId: null,
  },
  wrongTypes: {
    fanId: 123,
    creatorId: 456,
    messageCount: 'not-a-number',
  },
}

export const edgeCaseRequests = {
  veryLongMessage: {
    fanId: 'fan-long',
    creatorId: 'creator-456',
    lastMessage: 'A'.repeat(10000),
  },
  emptyMessage: {
    fanId: 'fan-empty',
    creatorId: 'creator-456',
    lastMessage: '',
  },
  specialCharacters: {
    fanId: 'fan-special',
    creatorId: 'creator-456',
    lastMessage: '🔥💋😘 Special chars & symbols! @#$%',
  },
  negativeValues: {
    fanId: 'fan-negative',
    creatorId: 'creator-456',
    messageCount: -10,
    fanValueCents: -5000,
  },
  hugeValues: {
    fanId: 'fan-huge',
    creatorId: 'creator-456',
    messageCount: 999999,
    fanValueCents: 99999999,
  },
}

export const expectedSuccessResponse = {
  success: true,
  suggestions: [
    {
      text: expect.any(String),
      tone: expect.stringMatching(/^(flirty|friendly|professional|playful)$/),
      confidence: expect.any(Number),
    },
  ],
  metadata: {
    count: expect.any(Number),
    duration: expect.any(Number),
    correlationId: expect.any(String),
  },
}

export const expectedErrorResponse = {
  success: false,
  error: expect.any(String),
  message: expect.any(String),
  correlationId: expect.any(String),
}

export const expectedHealthResponse = {
  status: expect.stringMatching(/^(healthy|unhealthy)$/),
  timestamp: expect.any(String),
}

export const mockSuggestions = [
  {
    text: "Hey! I'm doing great, thanks for asking! How about you? 😊",
    tone: 'friendly' as const,
    confidence: 0.92,
    reasoning: 'Friendly response matching conversation tone',
  },
  {
    text: "I'm doing amazing, especially now that I'm talking to you 💕",
    tone: 'flirty' as const,
    confidence: 0.88,
    reasoning: 'Flirty response for engaged fan',
  },
  {
    text: "Pretty good! Just finished creating some new content you might like 🔥",
    tone: 'playful' as const,
    confidence: 0.85,
    reasoning: 'Playful response with content tease',
  },
]

export const circuitBreakerStates = {
  healthy: {
    emotionAnalyzer: {
      state: 'closed',
      failures: 0,
      lastFailure: null,
    },
    preferenceEngine: {
      state: 'closed',
      failures: 0,
      lastFailure: null,
    },
    personalityCalibrator: {
      state: 'closed',
      failures: 0,
      lastFailure: null,
    },
  },
  degraded: {
    emotionAnalyzer: {
      state: 'half-open',
      failures: 2,
      lastFailure: new Date().toISOString(),
    },
    preferenceEngine: {
      state: 'closed',
      failures: 0,
      lastFailure: null,
    },
    personalityCalibrator: {
      state: 'closed',
      failures: 0,
      lastFailure: null,
    },
  },
  unhealthy: {
    emotionAnalyzer: {
      state: 'open',
      failures: 5,
      lastFailure: new Date().toISOString(),
    },
    preferenceEngine: {
      state: 'open',
      failures: 5,
      lastFailure: new Date().toISOString(),
    },
    personalityCalibrator: {
      state: 'closed',
      failures: 0,
      lastFailure: null,
    },
  },
}

export const performanceBenchmarks = {
  firstRequest: {
    maxDuration: 5000, // ms - includes AI processing
    target: 2000,
  },
  subsequentRequest: {
    maxDuration: 3000, // ms - with caching
    target: 1500,
  },
  concurrent: {
    maxDuration: 10000, // ms - for 10 concurrent
    target: 5000,
  },
}

export const rateLimitScenarios = {
  normal: 10, // requests per minute
  burst: 50, // rapid requests
  sustained: 100, // over longer period
}

export const securityTestCases = {
  xssAttempts: [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '<svg onload=alert(1)>',
  ],
  sqlInjectionAttempts: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "admin'--",
    "1' UNION SELECT * FROM users--",
  ],
  pathTraversalAttempts: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32',
    '%2e%2e%2f%2e%2e%2f',
  ],
  commandInjectionAttempts: [
    '; ls -la',
    '| cat /etc/passwd',
    '`whoami`',
    '$(rm -rf /)',
  ],
}

export const authenticationScenarios = {
  validToken: 'Bearer test-token-valid-user',
  expiredToken: 'Bearer test-token-expired',
  invalidToken: 'Bearer invalid-token-format',
  malformedToken: 'InvalidFormat',
  noToken: undefined,
  emptyToken: 'Bearer ',
}

export const correlationIdPatterns = {
  valid: /^req-\d+-[a-z0-9]{9}$/,
  custom: /^test-\d+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
}
