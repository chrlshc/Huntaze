/**
 * Signup Page Performance Optimization Utilities
 * 
 * Provides utilities for optimizing the signup page performance:
 * - Critical CSS extraction
 * - Code splitting helpers
 * - Resource preloading
 * - Performance monitoring
 * 
 * Requirements: 11.1, 11.2, 11.4, 11.5
 */

/**
 * Critical CSS for signup page
 * This should be inlined in the document head for fastest FCP
 */
export const CRITICAL_CSS = `
  /* Reset and base styles */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Critical layout styles for signup page */
  .signup-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-center;
    padding: 1rem;
  }

  .signup-card {
    width: 100%;
    max-width: 28rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    padding: 2rem;
  }

  /* Critical form styles */
  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-subtle);
    border-radius: 0.5rem;
    font-size: var(--text-base);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  .btn-primary {
    width: 100%;
    padding: 0.75rem 1.5rem;
    background-color: var(--accent-primary);
    color: white;
    font-weight: 600;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-primary:hover {
    background-color: #7e22ce;
  }

  .btn-primary:disabled {
    background-color: var(--border-subtle);
    cursor: not-allowed;
  }
`;

/**
 * Resource hints for preloading critical resources
 */
export const RESOURCE_HINTS = [
  // Preconnect to authentication providers
  { rel: 'preconnect', href: 'https://accounts.google.com' },
  { rel: 'dns-prefetch', href: 'https://accounts.google.com' },
  
  // Preconnect to API endpoints
  { rel: 'preconnect', href: process.env.NEXT_PUBLIC_API_URL || '' },
  
  // Prefetch onboarding page (likely next navigation)
  { rel: 'prefetch', href: '/onboarding' },
] as const;

/**
 * Performance monitoring utilities
 */
export class SignupPerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  
  /**
   * Mark the start of a performance measurement
   */
  static mark(name: string): void {
    if (typeof window === 'undefined') return;
    
    this.marks.set(name, performance.now());
    
    // Use Performance API if available
    if (performance.mark) {
      performance.mark(name);
    }
  }
  
  /**
   * Measure time since a mark
   */
  static measure(name: string, startMark: string): number | null {
    if (typeof window === 'undefined') return null;
    
    const startTime = this.marks.get(startMark);
    if (!startTime) return null;
    
    const duration = performance.now() - startTime;
    
    // Use Performance API if available
    if (performance.measure) {
      try {
        performance.measure(name, startMark);
      } catch (e) {
        // Mark might not exist in Performance API
      }
    }
    
    return duration;
  }
  
  /**
   * Get Core Web Vitals
   */
  static async getCoreWebVitals(): Promise<{
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  }> {
    if (typeof window === 'undefined') return {};
    
    const vitals: Record<string, number> = {};
    
    // Get FCP (First Contentful Paint)
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      vitals.fcp = fcpEntry.startTime;
    }
    
    // Get TTFB (Time to First Byte)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    }
    
    // LCP, FID, CLS require web-vitals library
    // These should be tracked separately with the web-vitals package
    
    return vitals;
  }
  
  /**
   * Log performance metrics
   */
  static logMetrics(): void {
    if (typeof window === 'undefined') return;
    
    const metrics = {
      marks: Array.from(this.marks.entries()),
      navigation: performance.getEntriesByType('navigation')[0],
      resources: performance.getEntriesByType('resource').length,
    };
    
    console.log('📊 Signup Performance Metrics:', metrics);
  }
}

/**
 * Code splitting configuration for signup flow
 */
export const SIGNUP_DYNAMIC_IMPORTS = {
  // Heavy components that can be lazy loaded
  SocialAuthButtons: () => import('@/components/auth/SocialAuthButtons'),
  EmailSignupForm: () => import('@/components/auth/EmailSignupForm'),
  
  // Optional components
  CookieConsent: () => import('@/components/CookieConsent'),
} as const;

/**
 * Defer non-critical CSS
 * This function should be called to load non-critical styles after page load
 */
export function loadNonCriticalCSS(): void {
  if (typeof window === 'undefined') return;
  
  // Load non-critical styles after page load
  if (document.readyState === 'complete') {
    loadStyles();
  } else {
    window.addEventListener('load', loadStyles);
  }
}

function loadStyles(): void {
  // This would load additional stylesheets
  // For now, Tailwind handles most of our styling
  // But we could add custom stylesheets here if needed
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(): void {
  if (typeof window === 'undefined') return;
  
  // Preload fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  // Add font URL when we have custom fonts
  
  // Preload critical images
  // Add image preloading here if needed
}

/**
 * Optimize form submission performance
 */
export function optimizeFormSubmission(formElement: HTMLFormElement): void {
  // Prevent multiple submissions
  let isSubmitting = false;
  
  formElement.addEventListener('submit', (e) => {
    if (isSubmitting) {
      e.preventDefault();
      return;
    }
    
    isSubmitting = true;
    
    // Mark submission start
    SignupPerformanceMonitor.mark('form-submit-start');
    
    // Reset after 5 seconds (timeout)
    setTimeout(() => {
      isSubmitting = false;
    }, 5000);
  });
}

/**
 * Bundle size optimization helpers
 */
export const BUNDLE_OPTIMIZATION = {
  /**
   * Check if a feature should be loaded based on user agent
   */
  shouldLoadFeature(feature: string): boolean {
    if (typeof window === 'undefined') return true;
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Skip heavy features on slow connections
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) {
        return false;
      }
    }
    
    return true;
  },
  
  /**
   * Lazy load a component when it enters viewport
   */
  lazyLoadOnVisible(
    element: HTMLElement,
    callback: () => void,
    options?: IntersectionObserverInit
  ): () => void {
    if (typeof window === 'undefined') {
      callback();
      return () => {};
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.disconnect();
        }
      });
    }, options);
    
    observer.observe(element);
    
    return () => observer.disconnect();
  },
};

/**
 * Performance budget checker
 */
export const PERFORMANCE_BUDGET = {
  // Target metrics (in milliseconds)
  FCP: 1500,  // First Contentful Paint
  LCP: 2500,  // Largest Contentful Paint
  FID: 100,   // First Input Delay
  CLS: 0.1,   // Cumulative Layout Shift
  TTI: 3500,  // Time to Interactive
  
  /**
   * Check if metrics are within budget
   */
  checkBudget(metrics: Record<string, number>): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    
    if (metrics.fcp && metrics.fcp > this.FCP) {
      violations.push(`FCP: ${metrics.fcp.toFixed(0)}ms (budget: ${this.FCP}ms)`);
    }
    
    if (metrics.lcp && metrics.lcp > this.LCP) {
      violations.push(`LCP: ${metrics.lcp.toFixed(0)}ms (budget: ${this.LCP}ms)`);
    }
    
    if (metrics.fid && metrics.fid > this.FID) {
      violations.push(`FID: ${metrics.fid.toFixed(0)}ms (budget: ${this.FID}ms)`);
    }
    
    if (metrics.cls && metrics.cls > this.CLS) {
      violations.push(`CLS: ${metrics.cls.toFixed(3)} (budget: ${this.CLS})`);
    }
    
    if (metrics.tti && metrics.tti > this.TTI) {
      violations.push(`TTI: ${metrics.tti.toFixed(0)}ms (budget: ${this.TTI}ms)`);
    }
    
    return {
      passed: violations.length === 0,
      violations,
    };
  },
};
