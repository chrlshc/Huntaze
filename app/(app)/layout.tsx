/**
 * App Layout
 * Forces dynamic rendering for all authenticated app pages
 * This prevents build-time errors when database/Redis connections are not available
 */

import Header from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="huntaze-layout">
      <Header />
      <Sidebar />
      <main className="huntaze-main">
        {children}
      </main>
    </div>
  );
}
