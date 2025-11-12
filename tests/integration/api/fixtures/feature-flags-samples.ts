/**
 * Test Fixtures - Feature Flags Samples
 * 
 * Sample data for testing feature flags endpoint responses
 */

export const validFeatureFlags = {
  enabled: true,
  rolloutPercentage: 50,
  markets: ['FR', 'DE', 'US'],
  userWhitelist: ['user-123', 'user-456']
};

export const disabledFeatureFlags = {
  enabled: false,
  rolloutPercentage: 0,
  markets: [],
  userWhitelist: []
};

export const partialRolloutFlags = {
  enabled: true,
  rolloutPercentage: 25,
  markets: ['FR'],
  userWhitelist: []
};

export const fullRolloutFlags = {
  enabled: true,
  rolloutPercentage: 100,
  markets: ['FR', 'DE', 'US', 'GB', 'CA'],
  userWhitelist: []
};

export const whitelistOnlyFlags = {
  enabled: true,
  rolloutPercentage: 0,
  markets: [],
  userWhitelist: ['vip-user-1', 'vip-user-2', 'vip-user-3']
};

export const validUpdateRequests = [
  { enabled: true },
  { enabled: false },
  { rolloutPercentage: 0 },
  { rolloutPercentage: 50 },
  { rolloutPercentage: 100 },
  { markets: ['FR'] },
  { markets: ['FR', 'DE', 'US'] },
  { userWhitelist: ['user-1'] },
  { userWhitelist: ['user-1', 'user-2'] },
  {
    enabled: true,
    rolloutPercentage: 75,
    markets: ['FR', 'DE']
  },
  {
    enabled: false,
    rolloutPercentage: 0,
    markets: [],
    userWhitelist: []
  }
];

export const invalidUpdateRequests = [
  {
    request: { rolloutPercentage: -1 },
    expectedError: 'Invalid rolloutPercentage',
    description: 'Negative rollout percentage'
  },
  {
    request: { rolloutPercentage: 101 },
    expectedError: 'Invalid rolloutPercentage',
    description: 'Rollout percentage above 100'
  },
  {
    request: { rolloutPercentage: 150 },
    expectedError: 'Invalid rolloutPercentage',
    description: 'Rollout percentage far above 100'
  },
  {
    request: {},
    expectedError: 'No valid updates provided',
    description: 'Empty update object'
  },
  {
    request: { invalidField: 'value' },
    expectedError: 'No valid updates provided',
    description: 'Only invalid fields'
  }
];

export const edgeCaseUpdateRequests = [
  {
    request: { rolloutPercentage: 0 },
    description: 'Zero rollout (valid)'
  },
  {
    request: { rolloutPercentage: 100 },
    description: 'Full rollout (valid)'
  },
  {
    request: { markets: [] },
    description: 'Empty markets array (valid)'
  },
  {
    request: { userWhitelist: [] },
    description: 'Empty whitelist (valid)'
  },
  {
    request: { 
      enabled: true,
      rolloutPercentage: 0,
      markets: [],
      userWhitelist: []
    },
    description: 'Enabled but no rollout or whitelist'
  }
];

export const concurrentUpdateScenarios = [
  {
    name: 'Sequential percentage increases',
    updates: [
      { rolloutPercentage: 10 },
      { rolloutPercentage: 20 },
      { rolloutPercentage: 30 },
      { rolloutPercentage: 40 },
      { rolloutPercentage: 50 }
    ]
  },
  {
    name: 'Toggle enabled flag',
    updates: [
      { enabled: true },
      { enabled: false },
      { enabled: true },
      { enabled: false },
      { enabled: true }
    ]
  },
  {
    name: 'Market additions',
    updates: [
      { markets: ['FR'] },
      { markets: ['FR', 'DE'] },
      { markets: ['FR', 'DE', 'US'] },
      { markets: ['FR', 'DE', 'US', 'GB'] },
      { markets: ['FR', 'DE', 'US', 'GB', 'CA'] }
    ]
  },
  {
    name: 'Mixed updates',
    updates: [
      { enabled: true },
      { rolloutPercentage: 25 },
      { markets: ['FR'] },
      { userWhitelist: ['user-1'] },
      { enabled: false }
    ]
  }
];

export const performanceBenchmarks = {
  get: {
    maxDuration: 500, // ms
    target: 200
  },
  post: {
    maxDuration: 1000, // ms
    target: 500
  },
  concurrent: {
    maxDuration: 2000, // ms for 5 concurrent requests
    target: 1000
  }
};

export const expectedResponseStructure = {
  get: {
    flags: {
      enabled: 'boolean',
      rolloutPercentage: 'number',
      markets: 'array (optional)',
      userWhitelist: 'array (optional)'
    },
    correlationId: 'string (uuid)'
  },
  post: {
    success: 'boolean',
    flags: {
      enabled: 'boolean',
      rolloutPercentage: 'number',
      markets: 'array (optional)',
      userWhitelist: 'array (optional)'
    },
    correlationId: 'string (uuid)'
  },
  error: {
    error: 'string',
    details: 'string (optional)',
    message: 'string (optional)',
    correlationId: 'string (uuid, optional)'
  }
};

export const marketCodes = {
  valid: ['FR', 'DE', 'US', 'GB', 'CA', 'AU', 'ES', 'IT', 'NL', 'BE'],
  invalid: ['FRA', 'DEU', 'USA', 'fr', 'de', 'us', '123', 'XX']
};

export const testUserIds = {
  admin: 'admin-user-123',
  regular: 'regular-user-456',
  whitelisted: 'whitelisted-user-789',
  nonWhitelisted: 'non-whitelisted-user-012'
};
