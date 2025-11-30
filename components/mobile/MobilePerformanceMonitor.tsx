/**
 * Mobile Performance Monitor Component
 * 
 * Displays real-time mobile performance metrics including:
 * - Connection quality
 * - CLS score
 * - Touch responsiveness
 * - Image optimization settings
 */

'use client';

import React from 'react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

export interface MobilePerformanceMonitorProps {
  compact?: boolean;
  showRecommendations?: boolean;
}

export function MobilePerformanceMonitor({
  compact = false,
  showRecommendations = true,
}: MobilePerformanceMonitorProps) {
  const {
    connectionQuality,
    imageSettings,
    cls,
    clsAcceptable,
    avgTouchResponseTime,
    touchResponsive,
    shouldDeferContent,
    recommendations,
  } = useMobileOptimization();

  if (!connectionQuality) {
    return null;
  }

  const getConnectionColor = (type: string) => {
    switch (type) {
      case '4g':
        return 'var(--accent-success)'; // green
      case '3g':
        return 'var(--accent-warning)'; // yellow
      case '2g':
      case 'slow-2g':
        return 'var(--accent-error)'; // red
      default:
        return 'var(--text-tertiary)'; // gray
    }
  };

  const getClsColor = (value: number) => {
    if (value < 0.1) return 'var(--accent-success)'; // green
    if (value < 0.25) return 'var(--accent-warning)'; // yellow
    return 'var(--accent-error)'; // red
  };

  const getTouchColor = (time: number) => {
    if (time < 100) return 'var(--accent-success)'; // green
    if (time < 200) return 'var(--accent-warning)'; // yellow
    return 'var(--accent-error)'; // red
  };

  if (compact) {
    return (
      <div style={{
        padding: '8px 12px',
        backgroundColor: 'var(--bg-glass)',
        borderRadius: '6px',
        fontSize: 'var(--text-xs)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getConnectionColor(connectionQuality.effectiveType),
            }}
          />
          <span>{connectionQuality.effectiveType.toUpperCase()}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>CLS:</span>
          <span style={{ color: getClsColor(cls), fontWeight: 'bold' }}>
            {cls.toFixed(3)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Touch:</span>
          <span style={{ color: getTouchColor(avgTouchResponseTime), fontWeight: 'bold' }}>
            {avgTouchResponseTime.toFixed(0)}ms
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid var(--border-subtle)',
      fontSize: 'var(--text-sm)',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-base)', fontWeight: 'bold' }}>
        Mobile Performance
      </h3>

      {/* Connection Quality */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Connection Quality</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getConnectionColor(connectionQuality.effectiveType),
            }}
          />
          <span>{connectionQuality.effectiveType.toUpperCase()}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>
            ({connectionQuality.downlink.toFixed(1)} Mbps, {connectionQuality.rtt}ms RTT)
          </span>
          {connectionQuality.saveData && (
            <span style={{
              padding: '2px 6px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: 'var(--accent-warning)',
              borderRadius: '4px',
              fontSize: 'var(--text-xs)',
            }}>
              Data Saver
            </span>
          )}
        </div>
      </div>

      {/* Image Settings */}
      {imageSettings && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Image Optimization</div>
          <div style={{ color: 'var(--text-tertiary)' }}>
            Quality: {imageSettings.quality}% | Format: {imageSettings.format.toUpperCase()} | Max Width: {imageSettings.maxWidth}px
          </div>
        </div>
      )}

      {/* CLS Score */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Cumulative Layout Shift</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: getClsColor(cls), fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>
            {cls.toFixed(3)}
          </span>
          <span style={{ color: clsAcceptable ? 'var(--accent-success)' : 'var(--accent-error)' }}>
            {clsAcceptable ? '✓ Good' : '✗ Needs Improvement'}
          </span>
        </div>
      </div>

      {/* Touch Responsiveness */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Touch Responsiveness</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: getTouchColor(avgTouchResponseTime), fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>
            {avgTouchResponseTime.toFixed(0)}ms
          </span>
          <span style={{ color: touchResponsive ? 'var(--accent-success)' : 'var(--accent-error)' }}>
            {touchResponsive ? '✓ Responsive' : '✗ Slow'}
          </span>
        </div>
      </div>

      {/* Content Deferral */}
      {shouldDeferContent && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '6px',
          marginBottom: '12px',
        }}>
          <div style={{ fontWeight: '600', color: 'var(--accent-warning)', marginBottom: '4px' }}>
            Adaptive Loading Active
          </div>
          <div style={{ color: 'var(--accent-warning)', fontSize: 'var(--text-xs)' }}>
            Non-essential content is being deferred due to slow connection
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Recommendations</div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-tertiary)' }}>
            {recommendations.map((rec, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
