'use client';

/**
 * ShopifyBackdrop Component
 * 
 * Reusable backdrop with Shopify-style black background and radial glows.
 * Customizable accent colors for brand consistency.
 */

import * as React from 'react';

function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace('#', '');
  const bigint = parseInt(
    h.length === 3 ? h.split('').map((c) => c + c).join('') : h,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ShopifyBackdrop({
  accent1 = '#a78bfa', // violet-400
  accent2 = '#f472b6', // pink-400
  children,
}: React.PropsWithChildren<{ accent1?: string; accent2?: string }>) {
  const a1_30 = hexToRgba(accent1, 0.3);
  const a1_15 = hexToRgba(accent1, 0.15);
  const a2_20 = hexToRgba(accent2, 0.2);

  return (
    <div
      className="min-h-screen w-full text-white flex items-center justify-center p-6"
      style={{
        backgroundColor: '#000',
        backgroundImage: [
          // top center glow
          `radial-gradient(1200px 600px at 50% -10%, ${a1_30}, transparent 60%)`,
          // bottom-right glow
          `radial-gradient(900px 500px at 85% 105%, ${a2_20}, transparent 60%)`,
          // bottom-left glow
          `radial-gradient(800px 400px at 10% 90%, ${a1_15}, transparent 60%)`,
          // base vertical subtle gradient
          `linear-gradient(180deg, #000 0%, var(--bg-primary) 50%, #000 100%)`,
        ].join(', '),
      }}
    >
      {children}
    </div>
  );
}
