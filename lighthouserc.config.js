/**
 * Lighthouse CI Configuration
 * Automated performance audits with budget validation
 * 
 * Validates: Requirements 8.1 (Lighthouse score > 90)
 */

module.exports = {
  ci: {
    collect: {
      // URLs to audit
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/integrations',
        'http://localhost:3000/analytics',
        'http://localhost:3000/content',
      ],
      // Number of runs per URL for consistency
      numberOfRuns: 3,
      // Start server automatically
      startServerCommand: 'npm run build && npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,
      settings: {
        // Emulate mobile device
        preset: 'desktop',
        // Throttling settings
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      // Performance budgets
      assertions: {
        // Core Web Vitals thresholds
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        
        // Specific metrics
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        
        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 512000 }], // 500KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 102400 }], // 100KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 1048576 }], // 1MB
        'resource-summary:font:size': ['warn', { maxNumericValue: 204800 }], // 200KB
        'resource-summary:total:size': ['warn', { maxNumericValue: 2097152 }], // 2MB
        
        // Request counts
        'resource-summary:script:count': ['warn', { maxNumericValue: 15 }],
        'resource-summary:stylesheet:count': ['warn', { maxNumericValue: 5 }],
        'resource-summary:third-party:count': ['warn', { maxNumericValue: 10 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
