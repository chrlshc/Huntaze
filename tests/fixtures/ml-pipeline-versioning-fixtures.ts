/**
 * Test Fixtures - ML Pipeline Versioning
 * 
 * Reusable test data for ML pipeline versioning tests
 */

export const mockVersions = {
  draft: {
    id: 'ver_draft_001',
    modelId: 'model_001',
    version: 'v1.0.0-draft',
    status: 'draft' as const,
    metrics: {
      accuracy: 0.85,
      precision: 0.83,
      recall: 0.82,
      f1Score: 0.825,
    },
    metadata: {
      description: 'Draft version for testing',
      author: 'test-user',
      tags: ['draft', 'experimental'],
    },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },

  testing: {
    id: 'ver_test_001',
    modelId: 'model_001',
    version: 'v1.0.0-test',
    status: 'testing' as const,
    metrics: {
      accuracy: 0.92,
      precision: 0.91,
      recall: 0.90,
      f1Score: 0.905,
    },
    metadata: {
      description: 'Testing version',
      author: 'test-user',
      tags: ['testing', 'validation'],
    },
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },

  production: {
    id: 'ver_prod_001',
    modelId: 'model_001',
    version: 'v1.0.0',
    status: 'production' as const,
    metrics: {
      accuracy: 0.95,
      precision: 0.94,
      recall: 0.93,
      f1Score: 0.935,
    },
    metadata: {
      description: 'Production version',
      author: 'test-user',
      tags: ['production', 'stable'],
      promotedAt: '2025-01-03T00:00:00Z',
    },
    createdAt: '2025-01-03T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
  },

  archived: {
    id: 'ver_arch_001',
    modelId: 'model_001',
    version: 'v0.9.0',
    status: 'archived' as const,
    metrics: {
      accuracy: 0.88,
      precision: 0.86,
      recall: 0.85,
      f1Score: 0.855,
    },
    metadata: {
      description: 'Archived old version',
      author: 'test-user',
      tags: ['archived', 'deprecated'],
      archivedAt: '2025-01-03T00:00:00Z',
    },
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
  },
};

export const mockExportData = {
  json: {
    modelId: 'model_001',
    version: 'v1.0.0',
    architecture: {
      layers: [
        { type: 'input', size: 128 },
        { type: 'dense', size: 64, activation: 'relu' },
        { type: 'dropout', rate: 0.2 },
        { type: 'dense', size: 32, activation: 'relu' },
        { type: 'output', size: 10, activation: 'softmax' },
      ],
    },
    weights: {
      format: 'float32',
      shape: [128, 64, 32, 10],
      checksum: 'sha256:abc123...',
    },
    hyperparameters: {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 100,
      optimizer: 'adam',
    },
    trainingData: {
      samples: 10000,
      validationSplit: 0.2,
      augmentation: true,
    },
  },

  binary: new Uint8Array([
    0x4d, 0x4c, 0x50, 0x4b, // Magic number: MLPK
    0x01, 0x00, 0x00, 0x00, // Version: 1
    // ... model weights data
  ]),
};

export const mockAuthTokens = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSIsInJvbGUiOiJ1c2VyIn0.signature',
  admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8wMDEiLCJyb2xlIjoiYWRtaW4ifQ.signature',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSIsImV4cCI6MTYwMDAwMDAwMH0.signature',
  invalid: 'invalid.token.format',
};

export const mockErrorResponses = {
  unauthorized: {
    error: 'Unauthorized',
    details: 'Authentication required',
  },

  forbidden: {
    error: 'Forbidden',
    details: 'Access denied to this resource',
  },

  notFound: {
    error: 'Not Found',
    details: 'Version not found',
  },

  badRequest: {
    error: 'Bad Request',
    details: 'Invalid request parameters',
  },

  conflict: {
    error: 'Conflict',
    details: 'Version already exists',
  },

  rateLimited: {
    error: 'Too Many Requests',
    details: 'Rate limit exceeded',
  },

  internalError: {
    error: 'Internal Server Error',
    details: 'An unexpected error occurred',
  },
};

export const mockRequestBodies = {
  createVersion: {
    valid: {
      modelId: 'model_001',
      version: 'v1.1.0',
      status: 'draft',
      metrics: {
        accuracy: 0.95,
        precision: 0.93,
        recall: 0.92,
        f1Score: 0.925,
      },
      metadata: {
        description: 'New version',
        author: 'test-user',
      },
    },

    missingModelId: {
      version: 'v1.1.0',
      status: 'draft',
    },

    invalidMetrics: {
      modelId: 'model_001',
      version: 'v1.1.0',
      metrics: {
        accuracy: 1.5, // Invalid: > 1
      },
    },

    invalidStatus: {
      modelId: 'model_001',
      version: 'v1.1.0',
      status: 'invalid-status',
    },
  },

  updateVersion: {
    valid: {
      modelId: 'model_001',
      version: 'v1.0.0',
      metadata: {
        description: 'Updated description',
        tags: ['updated'],
      },
    },

    statusChange: {
      modelId: 'model_001',
      version: 'v1.0.0',
      status: 'testing',
    },

    immutableField: {
      modelId: 'model_001',
      version: 'v1.0.0',
      id: 'new-id', // Immutable
    },
  },

  promoteVersion: {
    valid: {
      modelId: 'model_001',
      version: 'v1.0.0',
    },

    noMetrics: {
      modelId: 'model_001',
      version: 'v1.0.0-no-metrics',
    },
  },
};

export const mockQueryParams = {
  list: {
    basic: { modelId: 'model_001' },
    paginated: { modelId: 'model_001', page: 1, pageSize: 10 },
    filtered: { modelId: 'model_001', status: 'production' },
    sorted: { modelId: 'model_001', sortBy: 'createdAt', order: 'desc' },
  },

  get: {
    valid: { modelId: 'model_001', version: 'v1.0.0' },
    notFound: { modelId: 'model_001', version: 'v99.99.99' },
  },

  export: {
    json: { modelId: 'model_001', version: 'v1.0.0', action: 'export', format: 'json' },
    binary: { modelId: 'model_001', version: 'v1.0.0', action: 'export', format: 'binary' },
    invalid: { modelId: 'model_001', version: 'v1.0.0', action: 'export', format: 'invalid' },
  },

  delete: {
    draft: { modelId: 'model_001', version: 'v1.0.0-draft' },
    production: { modelId: 'model_001', version: 'v1.0.0' },
  },
};

export const mockRateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  retryAfter: 60, // seconds
};

export const mockConcurrencyScenarios = {
  reads: {
    count: 10,
    expectedSuccess: 10,
    expectedFailures: 0,
  },

  writes: {
    count: 5,
    expectedSuccess: 1, // Only one should succeed due to optimistic locking
    expectedConflicts: 4,
  },

  promotion: {
    count: 3,
    expectedSuccess: 1, // Only one promotion should succeed
    expectedFailures: 2,
  },
};

export function createMockVersion(overrides: Partial<typeof mockVersions.draft> = {}) {
  return {
    ...mockVersions.draft,
    ...overrides,
    id: overrides.id || `ver_${Date.now()}`,
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
  };
}

export function createMockVersionList(count: number, status?: string) {
  return Array.from({ length: count }, (_, i) =>
    createMockVersion({
      version: `v1.${i}.0`,
      status: status as any || 'draft',
    })
  );
}

export function createMockExportData(format: 'json' | 'binary') {
  return format === 'json' ? mockExportData.json : mockExportData.binary;
}
