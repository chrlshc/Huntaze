'use client';

import { useEffect } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Intentionally minimal: avoid noisy console logs in production.
    // Error reporting is handled by global error boundaries / monitoring.
    void error;
  }, [error]);

  return (
    <EmptyState
      variant="error"
      title="Something went wrong"
      description="Please try again. If the problem persists, contact support."
      action={{ label: 'Retry', onClick: reset, icon: RefreshCw }}
    />
  );
}

