/**
 * Three.js Monitoring System
 * Monitors 3D component rendering errors, WebGL failures, and performance issues
 */

interface ThreeJsError {
  type: 'webgl' | 'rendering' | 'performance' | 'memory';
  message: string;
  component?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  stack?: string;
  context?: Record<string, any>;
}

interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  renderTime: number;
  triangleCount: number;
  drawCalls: number;
}

class ThreeJsMonitor {
  private errors: ThreeJsError[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.setupErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  /**
   * Start monitoring Three.js components
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('[ThreeJsMonitor] Monitoring started');
    
    // Monitor WebGL context loss
    this.setupWebGLContextMonitoring();
    
    // Monitor performance
    this.startPerformanceTracking();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.performanceObserver?.disconnect();
    console.log('[ThreeJsMonitor] Monitoring stopped');
  }

  /**
   * Setup global error handlers for Three.js related errors
   */
  private setupErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      if (this.isThreeJsError(event.error)) {
        this.logError({
          type: 'rendering',
          message: event.message,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          stack: event.error?.stack
        });
      }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isThreeJsError(event.reason)) {
        this.logError({
          type: 'rendering',
          message: event.reason?.message || 'Unhandled Three.js promise rejection',
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          stack: event.reason?.stack
        });
      }
    });
  }

  /**
   * Setup WebGL context monitoring
   */
  private setupWebGLContextMonitoring(): void {
    // Monitor for WebGL context loss
    document.addEventListener('webglcontextlost', (event) => {
      const webglEvent = event as WebGLContextEvent;
      this.logError({
        type: 'webgl',
        message: 'WebGL context lost',
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        context: {
          reason: webglEvent.statusMessage || 'Unknown'
        }
      });
    });

    // Monitor for WebGL context restoration
    document.addEventListener('webglcontextrestored', () => {
      console.log('[ThreeJsMonitor] WebGL context restored');
    });
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('three') || entry.name.includes('webgl')) {
            this.trackPerformanceEntry(entry);
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
    }
  }

  /**
   * Start performance tracking
   */
  private startPerformanceTracking(): void {
    if (typeof requestAnimationFrame !== 'undefined') {
      let lastTime = performance.now();
      let frameCount = 0;

      const trackFrame = (currentTime: number) => {
        frameCount++;
        
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          
          // Log performance issues
          if (fps < 30) {
            this.logError({
              type: 'performance',
              message: `Low frame rate detected: ${fps} FPS`,
              timestamp: Date.now(),
              userAgent: navigator.userAgent,
              url: window.location.href,
              context: { fps, frameCount }
            });
          }

          frameCount = 0;
          lastTime = currentTime;
        }

        if (this.isMonitoring) {
          requestAnimationFrame(trackFrame);
        }
      };

      requestAnimationFrame(trackFrame);
    }
  }

  /**
   * Track performance entry
   */
  private trackPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.duration > 16.67) { // More than 60fps threshold
      this.logError({
        type: 'performance',
        message: `Slow Three.js operation: ${entry.name}`,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        context: {
          duration: entry.duration,
          entryType: entry.entryType,
          name: entry.name
        }
      });
    }
  }

  /**
   * Check if error is Three.js related
   */
  private isThreeJsError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || error.toString();
    const stack = error.stack || '';
    
    const threeJsKeywords = [
      'three',
      'webgl',
      'shader',
      'texture',
      'geometry',
      'material',
      'renderer',
      'canvas',
      'gl.getError',
      'CONTEXT_LOST_WEBGL'
    ];

    return threeJsKeywords.some(keyword => 
      message.toLowerCase().includes(keyword) || 
      stack.toLowerCase().includes(keyword)
    );
  }

  /**
   * Log Three.js error
   */
  private logError(error: ThreeJsError): void {
    this.errors.push(error);
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    console.error('[ThreeJsMonitor] Error logged:', error);

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(error);
    }
  }

  /**
   * Send error to monitoring service
   */
  private async sendToMonitoringService(error: ThreeJsError): Promise<void> {
    try {
      await fetch('/api/monitoring/three-js-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (err) {
      console.error('[ThreeJsMonitor] Failed to send error to monitoring service:', err);
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10): ThreeJsError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.errors.forEach(error => {
      stats[error.type] = (stats[error.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    const recentErrors = this.getRecentErrors(5);
    const criticalErrors = recentErrors.filter(error => 
      error.type === 'webgl' || error.type === 'rendering'
    );

    return criticalErrors.length === 0;
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    healthy: boolean;
    errorCount: number;
    recentErrors: ThreeJsError[];
    stats: Record<string, number>;
  } {
    return {
      healthy: this.isHealthy(),
      errorCount: this.errors.length,
      recentErrors: this.getRecentErrors(),
      stats: this.getErrorStats()
    };
  }

  /**
   * Clear all errors (for testing)
   */
  clearErrors(): void {
    this.errors = [];
  }
}

// Singleton instance
export const threeJsMonitor = new ThreeJsMonitor();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  threeJsMonitor.startMonitoring();
}

export default ThreeJsMonitor;