'use client';

/**
 * ShopifyBackdrop Component
 * 
 * Reusable dark backdrop with customizable radial gradient glows.
 * Inspired by Shopify's aesthetic but adapted to brand colors (violet/pink).
 */

import * as React from 'react';

export interface ShopifyBackdropProps {
  children: React.ReactNode;
  accent1?: string;  // Top-center glow color (default: violet)
  accent2?: string;  // Bottom-right glow color (default: pink)
  className?: string;
}

export function ShopifyBackdrop({
  children,
  accent1 = '#a78bfa',  // violet-400
  accent2 = '#f472b6',  // pink-400
  className = ''
}: ShopifyBackdropProps) {
  return (
    <div 
      className={`relative min-h-screen bg-black ${className}`}
      style={{
        background: `
          radial-gradient(circle at 50% 10%, ${accent1}15 0%, transparent 50%),
          radial-gradient(circle at 90% 90%, ${accent2}15 0%, transparent 50%),
          #000000
        `
      }}
    >
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
