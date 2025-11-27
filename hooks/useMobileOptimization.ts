/**
 * React Hook for Mobile Performance Optimization
 * 
 * Provides mobile-specific optimizations including:
 * - Connection quality detection
 * - Adaptive image loading
 * - Layout shift monitoring
 * - Touch responsiveness tracking
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getMobileOptimizer, ConnectionQuality, ImageQualitySettings } from '@/lib/mobile/mobile-optimizer';

export interface UseMobileOptimizationOptions {
  enableAdaptiveLoading?: boolean;
  enableAboveFoldPriority?: boolean;
  touchResponseThreshold?: number;
  clsThreshold?: number;
}

export interface MobileOptimizationState {
  connectionQuality: ConnectionQuality | null;
  imageSettings: ImageQualitySettings | null;
  cls: number;
  clsAcceptable: boolean;
  avgTouchResponseTime: number;
  touchResponsive: boolean;
  shouldDeferContent: boolean;
  recommendations: string[];
}

export function useMobileOptimization(options: UseMobileOptimizationOptions = {}) {
  const [state, setState] = useState<MobileOptimizationState>({
    connectionQuality: null,
    imageSettings: null,
    cls: 0,
    clsAcceptable: true,
    avgTouchResponseTime: 0,
    touchResponsive: true,
    shouldDeferContent: false,
    recommendations: [],
  });

  const optimizer = useRef(getMobileOptimizer(options));
  const touchStartTime = useRef<number>(0);

  // Update state from optimizer
  const updateState = useCallback(() => {
    const report = optimizer.current.getReport();

    setState({
      connectionQuality: report.connectionQuality,
      imageSettings: report.imageSettings,
      cls: report.cls,
      clsAcceptable: report.clsAcceptable,
      avgTouchResponseTime: report.avgTouchResponseTime,
      touchResponsive: report.touchResponsive,
      shouldDeferContent: optimizer.current.shouldDeferNonEssentialContent(),
      recommendations: report.recommendations,
    });
  }, []);

  // Initialize and detect connection
  useEffect(() => {
    optimizer.current.detectConnectionQuality();
    updateState();

    // Update on connection change
    const handleConnectionChange = () => {
      optimizer.current.detectConnectionQuality();
      updateState();
    };

    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      connection?.addEventListener('change', handleConnectionChange);

      return () => {
        connection?.removeEventListener('change', handleConnectionChange);
      };
    }
  }, [updateState]);

  // Update state periodically
  useEffect(() => {
    const interval = setInterval(updateState, 5000);
    return () => clearInterval(interval);
  }, [updateState]);

  // Track touch interactions
  const handleTouchStart = useCallback((target: string) => {
    touchStartTime.current = performance.now();
  }, []);

  const handleTouchEnd = useCallback((target: string, type: 'tap' | 'swipe' | 'scroll' = 'tap') => {
    if (touchStartTime.current > 0) {
      optimizer.current.trackTouchInteraction(type, target, touchStartTime.current);
      touchStartTime.current = 0;
      updateState();
    }
  }, [updateState]);

  // Check if element is above fold
  const isAboveFold = useCallback((element: HTMLElement): boolean => {
    return optimizer.current.isAboveFold(element);
  }, []);

  // Prioritize content
  const prioritizeContent = useCallback((elements: HTMLElement[]) => {
    return optimizer.current.prioritizeAboveFoldContent(elements);
  }, []);

  // Get optimal image props
  const getImageProps = useCallback((src: string, alt: string) => {
    const settings = state.imageSettings || optimizer.current.getImageQualitySettings();

    return {
      src,
      alt,
      loading: settings.lazy ? ('lazy' as const) : ('eager' as const),
      style: {
        maxWidth: `${settings.maxWidth}px`,
        height: 'auto',
      },
      // Add quality hint for Next.js Image component
      quality: settings.quality,
    };
  }, [state.imageSettings]);

  return {
    // State
    connectionQuality: state.connectionQuality,
    imageSettings: state.imageSettings,
    cls: state.cls,
    clsAcceptable: state.clsAcceptable,
    avgTouchResponseTime: state.avgTouchResponseTime,
    touchResponsive: state.touchResponsive,
    shouldDeferContent: state.shouldDeferContent,
    recommendations: state.recommendations,

    // Methods
    handleTouchStart,
    handleTouchEnd,
    isAboveFold,
    prioritizeContent,
    getImageProps,
    updateState,
  };
}
