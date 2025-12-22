export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * App Layout (Server Component)
 * 
 * Pattern: Layout = Server Component, Providers = Client Component
 * This allows viewport/metadata exports to work correctly.
 * 
 * Requirements: 2.3, 2.4
 */

import type { Viewport } from 'next';
import Header from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DashboardScrollLock } from '@/components/layout/DashboardScrollLock';
import { MainScrollReset } from '@/components/layout/MainScrollReset';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Providers from './providers';
import '@shopify/polaris/build/esm/styles.css';
import '@/styles/dashboard-shopify-tokens.css';
import AssistantDrawer from '@/components/assistant/AssistantDrawer';

// Mobile viewport configuration (Requirement 1)
// viewport-fit=cover enables safe-area-inset-* CSS env variables
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Note: Don't use userScalable: false or maximumScale: 1 for accessibility
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <ProtectedRoute requireOnboarding={false} redirectTo="/auth/login">
        <DashboardScrollLock />
        <div className="huntaze-layout huntaze-dashboard-scope" data-dashboard="true">
          <Header />
          <Sidebar />
          <main className="huntaze-main min-w-0" role="main" id="main-content" tabIndex={-1}>
            <MainScrollReset />
            {children}
          </main>
          <AssistantDrawer />
        </div>
      </ProtectedRoute>
    </Providers>
  );
}
