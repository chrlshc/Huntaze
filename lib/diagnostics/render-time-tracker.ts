/**
 * Render Time Measurement
 * Tracks server-side render times and component re-renders
 */

import React from 'react';

export interface RenderMetrics {
  page: string;
  component: string;
  renderTime: number;
  reRenderCount: number;
  timestamp: Date;
}

export interface RenderStats {
  totalRenders: number;
  avgRenderTime: number;
  slowRenders: RenderMetrics[];
  rendersByPage: Map<string, RenderMetrics[]>;
}

class RenderTimeTracker {
  private renders: RenderMetrics[] = [];
  private enabled: boolean = false;
  private slowRenderThreshold: number = 500; // ms
  private activeRenders: Map<string, number> = new Map();

  enable() {
    this.enabled = true;
    this.renders = [];
    this.activeRenders.clear();
  }

  disable() {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  startRender(page: string, component: string): string {
    if (!this.enabled) return '';

    const renderId = `${page}:${component}:${Date.now()}`;
    this.activeRenders.set(renderId, performance.now());
    return renderId;
  }

  endRender(renderId: string, page: string, component: string) {
    if (!this.enabled || !renderId) return;

    const startTime = this.activeRenders.get(renderId);
    if (!startTime) return;

    const renderTime = performance.now() - startTime;
    this.activeRenders.delete(renderId);

    const existingRender = this.renders.find(
      (r) => r.page === page && r.component === component
    );

    if (existingRender) {
      existingRender.reRenderCount++;
      existingRender.renderTime += renderTime;
    } else {
      this.renders.push({
        page,
        component,
        renderTime,
        reRenderCount: 1,
        timestamp: new Date(),
      });
    }
  }

  trackRender(page: string, component: string, renderTime: number) {
    if (!this.enabled) return;

    const existingRender = this.renders.find(
      (r) => r.page === page && r.component === component
    );

    if (existingRender) {
      existingRender.reRenderCount++;
      existingRender.renderTime += renderTime;
    } else {
      this.renders.push({
        page,
        component,
        renderTime,
        reRenderCount: 1,
        timestamp: new Date(),
      });
    }
  }

  getStats(): RenderStats {
    const totalRenders = this.renders.reduce(
      (sum, r) => sum + r.reRenderCount,
      0
    );
    const totalTime = this.renders.reduce((sum, r) => sum + r.renderTime, 0);
    const avgRenderTime = totalRenders > 0 ? totalTime / totalRenders : 0;

    const slowRenders = this.renders
      .filter((r) => r.renderTime / r.reRenderCount > this.slowRenderThreshold)
      .sort(
        (a, b) =>
          b.renderTime / b.reRenderCount - a.renderTime / a.reRenderCount
      );

    const rendersByPage = new Map<string, RenderMetrics[]>();
    this.renders.forEach((r) => {
      const existing = rendersByPage.get(r.page) || [];
      existing.push(r);
      rendersByPage.set(r.page, existing);
    });

    return {
      totalRenders,
      avgRenderTime,
      slowRenders,
      rendersByPage,
    };
  }

  getRenders(): RenderMetrics[] {
    return [...this.renders];
  }

  reset() {
    this.renders = [];
    this.activeRenders.clear();
  }

  setSlowRenderThreshold(ms: number) {
    this.slowRenderThreshold = ms;
  }
}

// Singleton instance
export const renderTimeTracker = new RenderTimeTracker();

/**
 * HOC to track component render time
 */
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  pageName: string
): React.ComponentType<P> {
  return function TrackedComponent(props: P) {
    const renderId = React.useRef<string>('');

    React.useEffect(() => {
      renderId.current = renderTimeTracker.startRender(pageName, componentName);
      return () => {
        renderTimeTracker.endRender(renderId.current, pageName, componentName);
      };
    });

    return React.createElement(Component, props);
  };
}
