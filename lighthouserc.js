module.exports = {
  ci: {
    collect: {
      // URLs to audit
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/auth/login',
        'http://localhost:3000/auth/register',
        'http://localhost:3000/home',
        'http://localhost:3000/integrations',
      ],
      // Number of runs per URL
      numberOfRuns: 3,
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
      // Performance budgets based on Requirements 21.1-21.4
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals - Requirements 21.1-21.4
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }], // FCP < 1.5s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP < 2.5s
        'max-potential-fid': ['error', { maxNumericValue: 100 }], // FID < 100ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS < 0.1
        
        // Additional performance metrics
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Resource optimization
        'uses-optimized-images': 'warn',
        'modern-image-formats': 'warn',
        'uses-text-compression': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        
        // JavaScript optimization
        'unused-javascript': 'warn',
        'unused-css-rules': 'warn',
        'unminified-javascript': 'error',
        'unminified-css': 'error',
        
        // Network optimization
        'uses-http2': 'warn',
        'uses-long-cache-ttl': 'warn',
        'uses-rel-preconnect': 'warn',
        
        // Accessibility
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
