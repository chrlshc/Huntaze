// Simplified version to debug 500 error
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';

// Temporarily removed all dynamic imports to isolate the issue

export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Huntaze</h1>
      <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
        The all-in-one platform for content creators
      </p>
      
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/auth/register"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6366f1',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            marginRight: '1rem'
          }}
        >
          Get Started
        </Link>
        <Link 
          href="/auth/login"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            border: '1px solid #6366f1',
            color: '#6366f1',
            textDecoration: 'none',
            borderRadius: '0.5rem'
          }}
        >
          Login
        </Link>
      </div>
      
      <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
        <p><strong>Debug Info:</strong></p>
        <p>Timestamp: {new Date().toISOString()}</p>
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>This is a simplified version to debug the 500 error.</p>
      </div>
    </div>
  );
}
