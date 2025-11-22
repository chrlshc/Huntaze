'use client';

import type { ReactNode } from 'react';
import { MobileSidebarProvider } from './MobileSidebarContext';
import { MainSidebar } from './MainSidebar';
import { TopHeader } from './TopHeader';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <MobileSidebarProvider>
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="skip-to-main"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <MainSidebar />
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* TopHeader */}
          <TopHeader />
          
          {/* Page content */}
          <main id="main-content" className="flex-1 overflow-auto px-6 py-8" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>

      <style jsx>{`
        .skip-to-main {
          position: absolute;
          left: -9999px;
          z-index: 999;
          padding: 1rem 1.5rem;
          background: var(--brand-primary);
          color: white;
          text-decoration: none;
          font-weight: 600;
          border-radius: 0 0 var(--radius-md) 0;
          transition: left 0.2s;
        }

        .skip-to-main:focus {
          left: 0;
          outline: none;
          box-shadow: var(--brand-glow-strong);
        }
      `}</style>
    </MobileSidebarProvider>
  );
}
