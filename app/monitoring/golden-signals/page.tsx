/**
 * Golden Signals Monitoring Page
 * Real-time dashboard for the 4 Golden Signals
 */

import { GoldenSignalsDashboard } from '@/components/monitoring/GoldenSignalsDashboard';

export default function GoldenSignalsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GoldenSignalsDashboard />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Golden Signals Monitoring - Huntaze',
  description: 'Real-time monitoring dashboard for system health and performance metrics',
};