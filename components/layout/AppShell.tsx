'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MobileSidebarProvider } from './MobileSidebarContext';
import { MainSidebar } from './MainSidebar';
import { TopHeader } from './TopHeader';
import { GlobalThemeProvider } from './GlobalThemeProvider';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <GlobalThemeProvider>
    <MobileSidebarProvider>
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="skip-to-main"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      <div 
        className="flex min-h-screen"
        style={{ backgroundColor: 'var(--color-bg-app)' }}
      >
        {/* Sidebar */}
        <MainSidebar />
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* TopHeader */}
          <TopHeader />
          
          {/* Page content */}
          <main 
            id="main-content" 
            className="flex-1 overflow-auto" 
            style={{
              padding: 'var(--spacing-8) var(--spacing-6)'
            }}
            tabIndex={-1}
            ref={mainRef}
          >
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
    </GlobalThemeProvider>
  );
}
