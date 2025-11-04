'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingAnalyticsDashboard from '@/components/smart-onboarding/analytics/OnboardingAnalyticsDashboard';
import RealTimeMetrics from '@/components/smart-onboarding/analytics/RealTimeMetrics';
import SystemAlerts from '@/components/smart-onboarding/analytics/SystemAlerts';

export default function SmartOnboardingAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'metrics' | 'alerts'>('dashboard');
  const [alertCount, setAlertCount] = useState(0);

  const handleAlert = (alert: any) => {
    // Handle new alerts (could show notifications, etc.)
    console.log('New alert:', alert);
  };

  const handleMetricAlert = (metric: any) => {
    // Handle metric alerts
    console.log('Metric alert:', metric);
  };

  const handleAlertAction = (alertId: string, action: string) => {
    // Handle alert actions
    console.log('Alert action:', alertId, action);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', count: null },
    { id: 'metrics', label: 'Real-Time Metrics', count: null },
    { id: 'alerts', label: 'System Alerts', count: alertCount > 0 ? alertCount : null }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Smart Onboarding Analytics
            </h1>
            <p className="mt-2 text-gray-600">
              Monitor user engagement, system performance, and ML model effectiveness
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 bg-white">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && (
            <OnboardingAnalyticsDashboard
              refreshInterval={30000}
              onAlert={handleAlert}
            />
          )}

          {activeTab === 'metrics' && (
            <RealTimeMetrics
              refreshInterval={10000}
              onMetricAlert={handleMetricAlert}
            />
          )}

          {activeTab === 'alerts' && (
            <SystemAlerts
              maxAlerts={100}
              autoRefresh={true}
              refreshInterval={15000}
              onAlertAction={handleAlertAction}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}