/**
 * Web Vitals Monitor Component
 * 
 * Displays real-time Web Vitals metrics in development
 * Hidden in production
 * 
 * Requirements: 11.5, 12.1
 */

'use client';

import { useState } from 'react';
import { useWebVitals, getPerformanceGrade, type WebVitals } from '@/hooks/useWebVitals';
import { X, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function WebVitalsMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { vitals, isLoading } = useWebVitals({
    reportToAnalytics: process.env.NODE_ENV === 'production',
    onReport: (report) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Web Vitals Report:', report);
      }
    },
  });
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // Don't show until user clicks the floating button
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Show Web Vitals"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }
  
  const grade = getPerformanceGrade(vitals);
  
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold
            ${grade.grade === 'A' ? 'bg-green-100 text-green-700' :
              grade.grade === 'B' ? 'bg-blue-100 text-blue-700' :
              grade.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
              grade.grade === 'D' ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'}
          `}>
            {grade.grade}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Performance</div>
            <div className="text-xs text-gray-500">Score: {grade.score}/100</div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="ml-2 text-gray-400 hover:text-gray-600"
            title="Expand"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Web Vitals</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-gray-600"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Grade */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Overall Grade</div>
            <div className="text-2xl font-bold text-gray-900">{grade.grade}</div>
          </div>
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold
            ${grade.grade === 'A' ? 'bg-green-100 text-green-700' :
              grade.grade === 'B' ? 'bg-blue-100 text-blue-700' :
              grade.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
              grade.grade === 'D' ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'}
          `}>
            {grade.score}
          </div>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-gray-500 py-4">
            <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
            <div className="text-sm">Measuring...</div>
          </div>
        ) : (
          <>
            <MetricRow
              name="LCP"
              label="Largest Contentful Paint"
              value={vitals.lcp}
              unit="ms"
              detail={grade.details.lcp}
            />
            <MetricRow
              name="FID"
              label="First Input Delay"
              value={vitals.fid}
              unit="ms"
              detail={grade.details.fid}
            />
            <MetricRow
              name="CLS"
              label="Cumulative Layout Shift"
              value={vitals.cls}
              unit=""
              detail={grade.details.cls}
              decimals={3}
            />
            <MetricRow
              name="FCP"
              label="First Contentful Paint"
              value={vitals.fcp}
              unit="ms"
              detail={grade.details.fcp}
            />
            <MetricRow
              name="TTFB"
              label="Time to First Byte"
              value={vitals.ttfb}
              unit="ms"
            />
            {vitals.inp !== undefined && (
              <MetricRow
                name="INP"
                label="Interaction to Next Paint"
                value={vitals.inp}
                unit="ms"
              />
            )}
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Development mode only • Updates in real-time
        </div>
      </div>
    </div>
  );
}

interface MetricRowProps {
  name: string;
  label: string;
  value?: number;
  unit: string;
  detail?: { value: number; grade: string; threshold: string };
  decimals?: number;
}

function MetricRow({ name, label, value, unit, detail, decimals = 0 }: MetricRowProps) {
  if (value === undefined) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <div>
          <div className="text-sm font-medium text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
        <div className="text-sm text-gray-400">—</div>
      </div>
    );
  }
  
  const gradeColor = detail?.grade === 'Good' ? 'text-green-600' :
                     detail?.grade === 'Needs Improvement' ? 'text-yellow-600' :
                     detail?.grade === 'Poor' ? 'text-red-600' :
                     'text-gray-600';
  
  const gradeIcon = detail?.grade === 'Good' ? <TrendingUp className="w-3 h-3" /> :
                    detail?.grade === 'Poor' ? <TrendingDown className="w-3 h-3" /> :
                    <Minus className="w-3 h-3" />;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{name}</div>
        <div className="text-xs text-gray-500">{label}</div>
        {detail && (
          <div className={`text-xs ${gradeColor} flex items-center gap-1 mt-1`}>
            {gradeIcon}
            <span>{detail.grade} ({detail.threshold})</span>
          </div>
        )}
      </div>
      <div className="text-right">
        <div className={`text-sm font-semibold ${gradeColor}`}>
          {value.toFixed(decimals)}{unit}
        </div>
      </div>
    </div>
  );
}
