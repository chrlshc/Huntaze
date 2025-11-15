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
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <MainSidebar />
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* TopHeader */}
          <TopHeader />
          
          {/* Page content */}
          <main className="flex-1 overflow-auto px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
}
