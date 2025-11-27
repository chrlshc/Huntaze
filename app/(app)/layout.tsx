/**
 * App Layout
 * 
 * PERFORMANCE OPTIMIZATION (Task 3.2):
 * Removed force-dynamic from layout to enable selective dynamic rendering per page.
 * This allows static pages to be cached while dynamic pages can opt-in to dynamic rendering.
 * 
 * Pages that need dynamic rendering should add:
 * * 
 * Requirements: 2.3, 2.4
 */

import Header from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { PerformanceMonitorDashboard } from '@/components/dashboard/PerformanceMonitor';
import '@/styles/dashboard-shopify-tokens.css';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="huntaze-layout huntaze-dashboard-scope" data-dashboard="true">
      <Header />
      <Sidebar />
      <main className="huntaze-main">
        {children}
      </main>
      {/* Performance Monitor - Development Only */}
      <PerformanceMonitorDashboard />
    </div>
  );
}
