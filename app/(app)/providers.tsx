'use client';

import { MobileSidebarProvider } from '@/components/layout/MobileSidebarContext';
import { AssistantProvider } from '@/contexts/AssistantContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MobileSidebarProvider>
      <AssistantProvider>
        {children}
      </AssistantProvider>
    </MobileSidebarProvider>
  );
}
