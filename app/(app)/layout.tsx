import React from 'react';
import AppShell from '@/src/components/hznew/app-shell';

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
