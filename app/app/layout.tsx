import React from 'react';
import AppShell from '@/src/components/hznew/app-shell';

export default function NestedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}

