/**
 * Web Vitals Monitor Component
 * 
 * Displays real-time Web Vitals metrics with CloudWatch integration
 * Shows performance grade and alerts when thresholds are exceeded
 * 
 * Requirements: 9.1, 9.3, 9.4
 * Property 40: Dashboard creation
 */

'use client';

import { useWebVitals, getPerformanceGrade, type WebVitals } from '@/hooks/useWebVitals';
import { useState, useEffect } from 'react';

interface WebVitalsMonitorProps {
  showDetails?: boolean;
  autoReport?: boolean;
}

export function WebVitalsMonitor({ 
  showDetails = true,
  autoReport = true,
}: WebVitalsMonitorProps) {
  const [reportSent, setReportSent] = useState(false);
  
  const { vitals, isLoading } = useWebVitals({
    sendToCloudWatch: autoReport,
    reportToAnalytics: autoReport,
    onReport: (report) => {
      if (!reportSent) {
        console.log('📊 Web Vitals Report:', report);
        setReportSent(true);
      }
    },
  });
  
  if (isLoading) {
    return null; // Don't show anything while loading
  }
  
  // Only show if we have at least one metric
  const hasMetrics = Object.keys(vitals).length > 0;
  if (!hasMetrics) {
    return null;
  }
  
  const grade = getPerformanceGrade(vitals);
  
  return (
    <div className="web-vitals-monitor">
      {showDetails ? (
        <DetailedView vitals={vitals} grade={grade} />
      ) : (
        <CompactView grade={grade} />
      )}
    </div>
  );
}

function DetailedView({ 
  vitals, 
  grade 
}: { 
  vitals: WebVitals; 
  grade: ReturnType<typeof getPerformanceGrade>;
}) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Web Vitals
        </h3>
        <PerformanceBadge grade={grade.grade} score={grade.score} />
      </div>
      
      <div className="space-y-3">
        {Object.entries(grade.details).map(([key, detail]) => (
          <MetricRow
            key={key}
            name={key}
            value={detail.value}
            grade={detail.grade}
            threshold={detail.threshold}
          />
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Metrics automatically sent to CloudWatch for monitoring
        </p>
      </div>
    </div>
  );
}

function CompactView({ grade }: { grade: ReturnType<typeof getPerformanceGrade> }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
      <span className="text-sm text-gray-600 dark:text-gray-400">Performance:</span>
      <PerformanceBadge grade={grade.grade} score={grade.score} compact />
    </div>
  );
}

function PerformanceBadge({ 
  grade, 
  score,
  compact = false,
}: { 
  grade: string; 
  score: number;
  compact?: boolean;
}) {
  const colors = {
    A: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    B: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    D: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    F: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  
  const color = colors[grade as keyof typeof colors] || colors.F;
  
  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {grade}
      </span>
    );
  }
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${color}`}>
      <span className="text-2xl font-bold">{grade}</span>
      <span className="text-sm font-medium">{score}/100</span>
    </div>
  );
}

function MetricRow({ 
  name, 
  value, 
  grade, 
  threshold 
}: { 
  name: string; 
  value: number; 
  grade: string; 
  threshold: string;
}) {
  const gradeColors = {
    Good: 'text-green-600 dark:text-green-400',
    'Needs Improvement': 'text-yellow-600 dark:text-yellow-400',
    Poor: 'text-red-600 dark:text-red-400',
  };
  
  const color = gradeColors[grade as keyof typeof gradeColors] || gradeColors.Poor;
  
  // Format value based on metric type
  const formattedValue = name === 'CLS' 
    ? value.toFixed(3)
    : `${Math.round(value)}ms`;
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {name.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({threshold})
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${color}`}>
          {formattedValue}
        </span>
        <span className={`text-xs ${color}`}>
          {grade}
        </span>
      </div>
    </div>
  );
}

/**
 * Hook to get Web Vitals data for display in other components
 */
export function useWebVitalsData() {
  const { vitals, isLoading } = useWebVitals({
    sendToCloudWatch: true,
    reportToAnalytics: true,
  });
  
  const grade = getPerformanceGrade(vitals);
  
  return {
    vitals,
    grade,
    isLoading,
    hasMetrics: Object.keys(vitals).length > 0,
  };
}
