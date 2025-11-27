/**
 * Mobile Performance Optimizer
 * 
 * Optimizes performance for mobile devices by:
 * - Detecting connection quality
 * - Adapting image quality based on network
 * - Prioritizing above-the-fold content
 * - Minimizing layout shifts
 * - Ensuring touch responsiveness
 */

export interface ConnectionQuality {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // Round-trip time in ms
  saveData: boolean;
}

export interface MobileOptimizationConfig {
  enableAdaptiveLoading: boolean;
  enableAboveFoldPriority: boolean;
  touchResponseThreshold: number; // ms
  clsThreshold: number;
  lighthouseScoreTarget: number;
}

export interface ImageQualitySettings {
  quality: number; // 0-100
  format: 'avif' | 'webp' | 'jpeg';
  maxWidth: number;
  lazy: boolean;
}

export interface LayoutShiftMetric {
  value: number;
  entries: LayoutShiftEntry[];
  timestamp: Date;
}

export interface LayoutShiftEntry {
  value: number;
  hadRecentInput: boolean;
  sources: Array<{
    node: string;
    previousRect: DOMRect;
    currentRect: DOMRect;
  }>;
}

export interface TouchInteractionMetric {
  startTime: number;
  responseTime: number;
  type: 'tap' | 'swipe' | 'scroll';
  target: string;
}

export class MobileOptimizer {
  private config: MobileOptimizationConfig;
  private connectionQuality: ConnectionQuality | null = null;
  private layoutShifts: LayoutShiftEntry[] = [];
  private touchMetrics: TouchInteractionMetric[] = [];
  private observer: PerformanceObserver | null = null;

  constructor(config: Partial<MobileOptimizationConfig> = {}) {
    this.config = {
      enableAdaptiveLoading: true,
      enableAboveFoldPriority: true,
      touchResponseThreshold: 100,
      clsThreshold: 0.1,
      lighthouseScoreTarget: 90,
      ...config,
    };

    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  /**
   * Detect current connection quality
   */
  detectConnectionQuality(): ConnectionQuality {
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return {
        effectiveType: 'unknown',
        downlink: 10,
        rtt: 50,
        saveData: false,
      };
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    this.connectionQuality = {
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 50,
      saveData: connection?.saveData || false,
    };

    return this.connectionQuality;
  }

  /**
   * Get optimal image quality settings based on connection
   */
  getImageQualitySettings(): ImageQualitySettings {
    const connection = this.connectionQuality || this.detectConnectionQuality();

    // Slow connection: reduce quality significantly
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' || connection.saveData) {
      return {
        quality: 50,
        format: 'jpeg',
        maxWidth: 640,
        lazy: true,
      };
    }

    // Medium connection: moderate quality
    if (connection.effectiveType === '3g') {
      return {
        quality: 70,
        format: 'webp',
        maxWidth: 1024,
        lazy: true,
      };
    }

    // Fast connection: high quality
    return {
      quality: 85,
      format: 'avif',
      maxWidth: 1920,
      lazy: true,
    };
  }

  /**
   * Check if content is above the fold
   */
  isAboveFold(element: HTMLElement): boolean {
    if (typeof window === 'undefined') return false;

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    return rect.top < viewportHeight;
  }

  /**
   * Prioritize above-the-fold content loading
   */
  prioritizeAboveFoldContent(elements: HTMLElement[]): {
    aboveFold: HTMLElement[];
    belowFold: HTMLElement[];
  } {
    const aboveFold: HTMLElement[] = [];
    const belowFold: HTMLElement[] = [];

    elements.forEach(element => {
      if (this.isAboveFold(element)) {
        aboveFold.push(element);
      } else {
        belowFold.push(element);
      }
    });

    return { aboveFold, belowFold };
  }

  /**
   * Initialize layout shift monitoring
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Monitor layout shifts
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            this.layoutShifts.push({
              value: (entry as any).value,
              hadRecentInput: (entry as any).hadRecentInput,
              sources: (entry as any).sources?.map((source: any) => ({
                node: source.node?.tagName || 'unknown',
                previousRect: source.previousRect,
                currentRect: source.currentRect,
              })) || [],
            });
          }
        }
      });

      this.observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('Layout shift monitoring not supported', e);
    }
  }

  /**
   * Get current Cumulative Layout Shift score
   */
  getCLS(): number {
    return this.layoutShifts.reduce((sum, shift) => sum + shift.value, 0);
  }

  /**
   * Check if CLS is within acceptable threshold
   */
  isCLSAcceptable(): boolean {
    return this.getCLS() < this.config.clsThreshold;
  }

  /**
   * Track touch interaction responsiveness
   */
  trackTouchInteraction(
    type: 'tap' | 'swipe' | 'scroll',
    target: string,
    startTime: number
  ): TouchInteractionMetric {
    const responseTime = performance.now() - startTime;

    const metric: TouchInteractionMetric = {
      startTime,
      responseTime,
      type,
      target,
    };

    this.touchMetrics.push(metric);

    return metric;
  }

  /**
   * Check if touch interactions are responsive enough
   */
  areTouchInteractionsResponsive(): boolean {
    if (this.touchMetrics.length === 0) return true;

    const avgResponseTime = this.touchMetrics.reduce((sum, m) => sum + m.responseTime, 0) / this.touchMetrics.length;

    return avgResponseTime < this.config.touchResponseThreshold;
  }

  /**
   * Get average touch response time
   */
  getAverageTouchResponseTime(): number {
    if (this.touchMetrics.length === 0) return 0;

    return this.touchMetrics.reduce((sum, m) => sum + m.responseTime, 0) / this.touchMetrics.length;
  }

  /**
   * Should defer non-essential content based on connection
   */
  shouldDeferNonEssentialContent(): boolean {
    const connection = this.connectionQuality || this.detectConnectionQuality();

    return (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.effectiveType === '3g' ||
      connection.saveData
    );
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    const cls = this.getCLS();
    if (cls >= this.config.clsThreshold) {
      recommendations.push(`CLS is ${cls.toFixed(3)}, should be < ${this.config.clsThreshold}`);
    }

    const avgTouchTime = this.getAverageTouchResponseTime();
    if (avgTouchTime >= this.config.touchResponseThreshold) {
      recommendations.push(`Touch response time is ${avgTouchTime.toFixed(0)}ms, should be < ${this.config.touchResponseThreshold}ms`);
    }

    const connection = this.connectionQuality || this.detectConnectionQuality();
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      recommendations.push('Slow connection detected: reduce image quality and defer non-essential content');
    }

    return recommendations;
  }

  /**
   * Get mobile optimization report
   */
  getReport(): {
    cls: number;
    clsAcceptable: boolean;
    avgTouchResponseTime: number;
    touchResponsive: boolean;
    connectionQuality: ConnectionQuality;
    imageSettings: ImageQualitySettings;
    recommendations: string[];
  } {
    return {
      cls: this.getCLS(),
      clsAcceptable: this.isCLSAcceptable(),
      avgTouchResponseTime: this.getAverageTouchResponseTime(),
      touchResponsive: this.areTouchInteractionsResponsive(),
      connectionQuality: this.connectionQuality || this.detectConnectionQuality(),
      imageSettings: this.getImageQualitySettings(),
      recommendations: this.getRecommendations(),
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.layoutShifts = [];
    this.touchMetrics = [];
  }
}

// Singleton instance
let mobileOptimizerInstance: MobileOptimizer | null = null;

export function getMobileOptimizer(config?: Partial<MobileOptimizationConfig>): MobileOptimizer {
  if (!mobileOptimizerInstance) {
    mobileOptimizerInstance = new MobileOptimizer(config);
  }
  return mobileOptimizerInstance;
}
