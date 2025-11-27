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
        return '#10b981'; // green
      case '3g':
        return '#f59e0b'; // yellow
      case '2g':
      case 'slow-2g':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getClsColor = (value: number) => {
    if (value < 0.1) return '#10b981'; // green
    if (value < 0.25) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getTouchColor = (time: number) => {
    if (time < 100) return '#10b981'; // green
    if (time < 200) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  if (compact) {
    return (
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        fontSize: '12px',
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
      border: '1px solid #e5e7eb',
      fontSize: '14px',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
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
          <span style={{ color: '#6b7280' }}>
            ({connectionQuality.downlink.toFixed(1)} Mbps, {connectionQuality.rtt}ms RTT)
          </span>
          {connectionQuality.saveData && (
            <span style={{
              padding: '2px 6px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '4px',
              fontSize: '12px',
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
          <div style={{ color: '#6b7280' }}>
            Quality: {imageSettings.quality}% | Format: {imageSettings.format.toUpperCase()} | Max Width: {imageSettings.maxWidth}px
          </div>
        </div>
      )}

      {/* CLS Score */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Cumulative Layout Shift</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: getClsColor(cls), fontWeight: 'bold', fontSize: '18px' }}>
            {cls.toFixed(3)}
          </span>
          <span style={{ color: clsAcceptable ? '#10b981' : '#ef4444' }}>
            {clsAcceptable ? '✓ Good' : '✗ Needs Improvement'}
          </span>
        </div>
      </div>

      {/* Touch Responsiveness */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Touch Responsiveness</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: getTouchColor(avgTouchResponseTime), fontWeight: 'bold', fontSize: '18px' }}>
            {avgTouchResponseTime.toFixed(0)}ms
          </span>
          <span style={{ color: touchResponsive ? '#10b981' : '#ef4444' }}>
            {touchResponsive ? '✓ Responsive' : '✗ Slow'}
          </span>
        </div>
      </div>

      {/* Content Deferral */}
      {shouldDeferContent && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#fef3c7',
          borderRadius: '6px',
          marginBottom: '12px',
        }}>
          <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
            Adaptive Loading Active
          </div>
          <div style={{ color: '#92400e', fontSize: '12px' }}>
            Non-essential content is being deferred due to slow connection
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Recommendations</div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
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
