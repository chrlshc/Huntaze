'use client';

/**
 * Automation Analytics Page
 * Dashboard for viewing automation performance metrics
 * Requirements: 9.1, 9.3, 9.4
 */

import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AutomationAnalytics } from '@/components/automations/AutomationAnalytics';
import Link from 'next/link';

export default function AutomationAnalyticsPage() {
  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Automation Analytics">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/automations"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Automation Analytics
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Monitor performance and optimize your automations
              </p>
            </div>
          </div>

          {/* Analytics Dashboard */}
          <AutomationAnalytics />
        </div>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
