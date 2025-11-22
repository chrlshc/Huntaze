/**
 * Resource Hints Component
 * 
 * Adds preconnect and dns-prefetch hints for external domains
 * to improve loading performance for external resources.
 * 
 * Requirements: 21.4
 */

import React from 'react';

interface ResourceHintsProps {
  domains?: string[];
}

const DEFAULT_DOMAINS = [
  'https://api.dicebear.com',
  'https://ui-avatars.com',
  'https://cdn.huntaze.com',
  'https://static.onlyfansassets.com',
];

export function ResourceHints({ domains = DEFAULT_DOMAINS }: ResourceHintsProps) {
  return (
    <>
      {domains.map((domain) => (
        <React.Fragment key={domain}>
          {/* Preconnect for faster connection establishment */}
          <link rel="preconnect" href={domain} />
          {/* DNS prefetch as fallback for older browsers */}
          <link rel="dns-prefetch" href={domain} />
        </React.Fragment>
      ))}
    </>
  );
}
