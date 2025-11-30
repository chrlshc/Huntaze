'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <Button variant="primary" onClick={reset}>
  Try again
</Button>
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-gray-500">
            ▶ Error details
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
            {error.message}
            {error.stack}
          </pre>
        </details>
      </Card>
    </div>
  );
}