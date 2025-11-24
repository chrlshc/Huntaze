/**
 * Lazy-loaded Heavy Components
 * 
 * This file provides lazy-loaded versions of components that exceed 50KB.
 * These components include charts, editors, and 3D animations that should
 * only be loaded when needed to improve initial page load performance.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

'use client';

import React from 'react';
import { LazyComponent } from './LazyComponent';
import { SkeletonScreen } from '../layout/SkeletonScreen';

/**
 * Lazy-loaded PhoneMockup3D component
 * Heavy due to Three.js dependencies (~950KB)
 */
export const LazyPhoneMockup3D = (props: any) => (
  <LazyComponent
    loader={() => import('../animations/PhoneMockup3D')}
    fallback={
      <div className="relative h-[600px] lg:h-[700px] flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading 3D Experience...</p>
        </div>
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Lazy-loaded LiveDashboard component
 * Heavy due to Chart.js dependencies (~300KB)
 */
export const LazyLiveDashboard = (props: any) => (
  <LazyComponent
    loader={() => import('../animations/LiveDashboard')}
    fallback={
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <SkeletonScreen variant="dashboard" count={1} />
        </div>
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Lazy-loaded ContentEditor component
 * Heavy due to TipTap dependencies (~130KB)
 */
export const LazyContentEditor = (props: any) => (
  <LazyComponent
    loader={() => import('../content/ContentEditor')}
    fallback={
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="border-b bg-gray-50 p-2 h-12 animate-pulse" />
        <div className="p-4 min-h-[200px] space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
        </div>
        <div className="border-t bg-gray-50 p-2 h-10 animate-pulse" />
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Lazy-loaded Chart components
 * Heavy due to Chart.js dependencies (~300KB)
 */
export const LazyLineChart = (props: any) => (
  <LazyComponent
    loader={() => import('react-chartjs-2').then(mod => ({ default: mod.Line }))}
    fallback={
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-400">Loading chart...</p>
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

export const LazyDoughnutChart = (props: any) => (
  <LazyComponent
    loader={() => import('react-chartjs-2').then(mod => ({ default: mod.Doughnut }))}
    fallback={
      <div className="h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-400">Loading chart...</p>
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

export const LazyBarChart = (props: any) => (
  <LazyComponent
    loader={() => import('react-chartjs-2').then(mod => ({ default: mod.Bar }))}
    fallback={
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-400">Loading chart...</p>
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Lazy-loaded PerformanceCharts component
 */
export const LazyPerformanceCharts = (props: any) => (
  <LazyComponent
    loader={() => import('../dashboard/PerformanceCharts')}
    fallback={
      <div className="space-y-4">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Lazy-loaded ContentEditorWithAutoSave component
 */
export const LazyContentEditorWithAutoSave = (props: any) => (
  <LazyComponent
    loader={() => import('../content/ContentEditorWithAutoSave')}
    fallback={
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="border-b bg-gray-50 p-2 h-12 animate-pulse" />
        <div className="p-4 min-h-[200px] space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
        </div>
        <div className="border-t bg-gray-50 p-2 h-10 animate-pulse" />
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Lazy-loaded MediaPicker component
 */
export const LazyMediaPicker = (props: any) => (
  <LazyComponent
    loader={() => import('../content/MediaPicker')}
    fallback={
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="animate-pulse">
          <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
        </div>
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Lazy-loaded InteractiveDemo component
 */
export const LazyInteractiveDemo = (props: any) => (
  <LazyComponent
    loader={() => import('../../components/InteractiveDemo')}
    fallback={
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading interactive demo...</p>
        </div>
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Lazy-loaded CookieConsent component
 */
export const LazyCookieConsent = (props: any) => (
  <LazyComponent
    loader={() => import('../../components/CookieConsent')}
    fallback={null} // No fallback needed for cookie consent
    componentProps={props}
    maxRetries={2}
    threshold={50}
  />
);

/**
 * Lazy-loaded ContactSalesModal component
 */
export const LazyContactSalesModal = (props: any) => (
  <LazyComponent
    loader={() => import('../../components/ContactSalesModal')}
    fallback={
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
        </div>
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Lazy-loaded NotificationSettings component
 */
export const LazyNotificationSettings = (props: any) => (
  <LazyComponent
    loader={() => import('../../components/NotificationSettings')}
    fallback={
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>
    }
    componentProps={props}
    maxRetries={3}
    threshold={50}
  />
);

/**
 * Export all lazy components
 */
export const LazyComponents = {
  PhoneMockup3D: LazyPhoneMockup3D,
  LiveDashboard: LazyLiveDashboard,
  ContentEditor: LazyContentEditor,
  ContentEditorWithAutoSave: LazyContentEditorWithAutoSave,
  LineChart: LazyLineChart,
  DoughnutChart: LazyDoughnutChart,
  BarChart: LazyBarChart,
  PerformanceCharts: LazyPerformanceCharts,
  MediaPicker: LazyMediaPicker,
  InteractiveDemo: LazyInteractiveDemo,
  CookieConsent: LazyCookieConsent,
  ContactSalesModal: LazyContactSalesModal,
  NotificationSettings: LazyNotificationSettings,
};

export default LazyComponents;
