'use client';

/**
 * ShopifyStyleOnboardingModal Component
 * 
 * Modal wrapper with Shopify-inspired dark backdrop and layered card effect.
 * Combines ShopifyBackdrop with modal-specific styling.
 */

import * as React from 'react';
import { ShopifyBackdrop } from './ShopifyBackdrop';
import { Button } from "@/components/ui/button";

export interface ShopifyStyleOnboardingModalProps {
  children: React.ReactNode;
  accent1?: string;  // Violet glow
  accent2?: string;  // Pink glow
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function ShopifyStyleOnboardingModal({
  children,
  accent1 = '#a78bfa',
  accent2 = '#f472b6',
  onClose,
  showCloseButton = false
}: ShopifyStyleOnboardingModalProps) {
  // Handle ESC key
  React.useEffect(() => {
    if (!onClose) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  return (
    <ShopifyBackdrop accent1={accent1} accent2={accent2}>
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-3xl">
          {/* Layered cards behind for depth effect */}
          <div 
            aria-hidden 
            className="absolute inset-x-6 -top-6 h-[86%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_40px_rgba(0, 0, 0, 0.5)] -z-10" 
          />
          <div 
            aria-hidden 
            className="absolute inset-x-10 -top-3 h-[90%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_40px_rgba(0, 0, 0, 0.3)] -z-10" 
          />
          
          {/* Main modal card */}
          <div 
            role="dialog"
            aria-modal="true"
            className="relative rounded-2xl bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5 p-5 sm:p-6 md:p-8"
          >
            {/* Close button */}
            {showCloseButton && onClose && (
              <Button variant="primary" onClick={onClose} aria-label="Close modal">
  <svg 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  className="h-5 w-5 text-neutral-500"
                  aria-hidden
                >
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
</Button>
            )}
            
            {/* Modal content */}
            {children}
          </div>
        </div>
      </div>
    </ShopifyBackdrop>
  );
}
