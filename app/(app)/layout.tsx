import React from 'react';
import AppSidebar from '@/src/components/app-sidebar-unified';

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* App shell sidebar (fixed on desktop, drawer on mobile) */}
      <AppSidebar />
      {children}
    </>
  );
}

