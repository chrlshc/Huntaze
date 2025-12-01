'use client';

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: 'var(--font-sans)'
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1rem' }}>
              Application Error
            </h1>
            <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              A critical error occurred. Please refresh the page.
            </p>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()} 
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: 'var(--text-base)'
              }}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
