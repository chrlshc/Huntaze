import { vi } from 'vitest';

// Global setup for Content Creation & AI Assistant tests

// Mock AI Services
export const mockAIServices = {
  contentAnalysis: vi.fn(),
  priceOptimization: vi.fn(),
  audienceTargeting: vi.fn(),
  captionGeneration: vi.fn(),
  complianceCheck: vi.fn(),
  performanceInsights: vi.fn()
};

// Mock File Upload Services
export const mockUploadServices = {
  uploadFile: vi.fn(),
  optimizeImage: vi.fn(),
  generateThumbnail: vi.fn(),
  validateFile: vi.fn()
};

// Mock Analytics Services
export const mockAnalyticsServices = {
  trackEvent: vi.fn(),
  getMetrics: vi.fn(),
  generateReport: vi.fn()
};

// Mock Notification Services
export const mockNotificationServices = {
  sendNotification: vi.fn(),
  scheduleNotification: vi.fn(),
  getNotificationHistory: vi.fn()
};

// Test Data Factories
export const createMockMediaAsset = (overrides = {}) => ({
  id: 'asset-123',
  title: 'Test Content',
  type: 'photo',
  status: 'published',
  tags: ['test', 'content'],
  createdAt: '2024-01-15T10:30:00Z',
  thumbnail: '/thumbnails/test.jpg',
  metrics: {
    views: 1000,
    likes: 50,
    revenue: 25.00
  },
  ...overrides
});

export const createMockPPVCampaign = (overrides = {}) => ({
  id: 'campaign-456',
  title: 'Test PPV Campaign',
  status: 'active',
  price: 19.99,
  createdAt: '2024-01-10T09:00:00Z',
  metrics: {
    openRate: 0.65,
    purchaseRate: 0.23,
    roi: 2.4,
    revenue: 480.75
  },
  ...overrides
});

export const createMockAIInsight = (overrides = {}) => ({
  id: 'insight-789',
  type: 'revenue_opportunity',
  severity: 'medium',
  title: 'Test AI Insight',
  description: 'This is a test insight for optimization',
  actions: ['Take action 1', 'Take action 2'],
  timestamp: '2024-01-15T08:00:00Z',
  ...overrides
});

export const createMockComplianceResult = (overrides = {}) => ({
  approved: true,
  violations: [],
  scanId: 'scan-101',
  timestamp: '2024-01-15T12:00:00Z',
  ...overrides
});

// Mock Browser APIs
export const setupBrowserMocks = () => {
  // Mock IntersectionObserver for lazy loading tests
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock ResizeObserver for responsive tests
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock File API
  global.File = vi.fn().mockImplementation((bits, name, options) => ({
    name,
    size: bits.join('').length,
    type: options?.type || 'text/plain',
    lastModified: Date.now()
  }));

  // Mock FileReader
  global.FileReader = vi.fn().mockImplementation(() => ({
    readAsText: vi.fn(),
    readAsDataURL: vi.fn(),
    onload: null,
    onerror: null,
    result: null
  }));

  // Mock Clipboard API
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('mocked clipboard text')
    }
  });

  // Mock Performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
      }
    }
  });

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((callback) => {
    setTimeout(callback, 16); // ~60fps
    return 1;
  });

  // Mock cancelAnimationFrame
  global.cancelAnimationFrame = vi.fn();
};

// Mock Network Requests
export const setupNetworkMocks = () => {
  // Mock fetch for API calls
  global.fetch = vi.fn().mockImplementation((url: string) => {
    // Default successful responses based on URL patterns
    if (url.includes('/api/content')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [createMockMediaAsset()],
          total: 1,
          page: 1
        })
      });
    }
    
    if (url.includes('/api/ppv')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [createMockPPVCampaign()],
          total: 1,
          page: 1
        })
      });
    }
    
    if (url.includes('/api/ai/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          response: 'AI generated response',
          confidence: 0.85,
          suggestions: ['Suggestion 1', 'Suggestion 2']
        })
      });
    }
    
    if (url.includes('/api/compliance')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createMockComplianceResult())
      });
    }
    
    // Default response
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });
};

// Performance Testing Utilities
export const performanceTestUtils = {
  measureRenderTime: (renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    return end - start;
  },

  measureAsyncOperation: async (asyncFn: () => Promise<any>) => {
    const start = performance.now();
    await asyncFn();
    const end = performance.now();
    return end - start;
  },

  createLargeDataset: (size: number, factory: (index: number) => any) => {
    return Array.from({ length: size }, (_, i) => factory(i));
  },

  simulateSlowNetwork: (delay: number = 1000) => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (...args) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return originalFetch(...args);
    });
  }
};

// Accessibility Testing Utilities
export const a11yTestUtils = {
  checkFocusManagement: async (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    return {
      count: focusableElements.length,
      elements: Array.from(focusableElements),
      hasTabIndex: Array.from(focusableElements).every(el => 
        el.hasAttribute('tabindex') || ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
      )
    };
  },

  checkAriaLabels: (container: HTMLElement) => {
    const interactiveElements = container.querySelectorAll(
      'button, [role="button"], input, select, textarea'
    );
    
    const missingLabels: Element[] = [];
    
    interactiveElements.forEach(element => {
      const hasLabel = element.hasAttribute('aria-label') ||
                      element.hasAttribute('aria-labelledby') ||
                      element.hasAttribute('title') ||
                      (element.tagName === 'INPUT' && element.hasAttribute('placeholder'));
      
      if (!hasLabel) {
        missingLabels.push(element);
      }
    });
    
    return {
      total: interactiveElements.length,
      missingLabels: missingLabels.length,
      elements: missingLabels
    };
  },

  checkColorContrast: (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // Simplified contrast check (in real implementation, would use proper contrast calculation)
    return {
      color,
      backgroundColor,
      hasGoodContrast: color !== backgroundColor // Simplified check
    };
  }
};

// Test Environment Setup
export const setupTestEnvironment = () => {
  setupBrowserMocks();
  setupNetworkMocks();
  
  // Setup console mocks to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  
  // Setup localStorage mock
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  // Setup sessionStorage mock
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
  });
};

// Cleanup function for after tests
export const cleanupTestEnvironment = () => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
};