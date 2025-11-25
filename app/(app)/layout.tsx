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
    <div 
      className="flex min-h-screen"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)'
      }}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
