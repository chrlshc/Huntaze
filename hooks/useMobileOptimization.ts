/**
 * Mobile Optimization Hook
 * 
 * Provides utilities for mobile-specific optimizations:
 * - Input field scrolling on focus
 * - Touch target validation
 * - Double-submission prevention
 * - Mobile keyboard handling
 * 
 * Requirements: 10.1, 10.2, 10.5
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MobileOptimizationOptions {
  /**
   * Enable automatic scroll-into-view on input focus
   */
  enableScrollOnFocus?: boolean;
  /**
   * Offset from top when scrolling (to account for fixed headers)
   */
  scrollOffset?: number;
  /**
   * Enable double-submission prevention
   */
  preventDoubleSubmit?: boolean;
}

interface MobileOptimizationReturn {
  /**
   * Whether the device is mobile
   */
  isMobile: boolean;
  /**
   * Whether a form is currently submitting
   */
  isSubmitting: boolean;
  /**
   * Start submission (prevents double-submit)
   */
  startSubmit: () => void;
  /**
   * End submission (re-enables submit)
   */
  endSubmit: () => void;
  /**
   * Ref to attach to form container
   */
  formRef: React.RefObject<HTMLFormElement>;
}

/**
 * Hook for mobile-specific optimizations
 * 
 * @example
 * ```tsx
 * const { isMobile, isSubmitting, startSubmit, endSubmit, formRef } = useMobileOptimization({
 *   enableScrollOnFocus: true,
 *   preventDoubleSubmit: true,
 * });
 * 
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   if (isSubmitting) return;
 *   
 *   startSubmit();
 *   try {
 *     await submitForm();
 *   } finally {
 *     endSubmit();
 *   }
 * };
 * 
 * return <form ref={formRef} onSubmit={handleSubmit}>...</form>;
 * ```
 */
export function useMobileOptimization(
  options: MobileOptimizationOptions = {}
): MobileOptimizationReturn {
  const {
    enableScrollOnFocus = true,
    scrollOffset = 100,
    preventDoubleSubmit = true,
  } = options;

  const formRef = useRef<HTMLFormElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle input focus scrolling on mobile
  useEffect(() => {
    if (!enableScrollOnFocus || !isMobile || !formRef.current) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Only handle input elements
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        // Wait for mobile keyboard to appear
        setTimeout(() => {
          const rect = target.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetTop = rect.top + scrollTop - scrollOffset;

          // Smooth scroll to position
          window.scrollTo({
            top: targetTop,
            behavior: 'smooth',
          });
        }, 300); // Delay to account for keyboard animation
      }
    };

    const form = formRef.current;
    form.addEventListener('focusin', handleFocus);

    return () => {
      form.removeEventListener('focusin', handleFocus);
    };
  }, [enableScrollOnFocus, isMobile, scrollOffset]);

  // Double-submission prevention
  const startSubmit = useCallback(() => {
    if (preventDoubleSubmit) {
      setIsSubmitting(true);
    }
  }, [preventDoubleSubmit]);

  const endSubmit = useCallback(() => {
    if (preventDoubleSubmit) {
      setIsSubmitting(false);
    }
  }, [preventDoubleSubmit]);

  return {
    isMobile,
    isSubmitting,
    startSubmit,
    endSubmit,
    formRef,
  };
}

/**
 * Validates that an element meets minimum touch target size
 * 
 * @param element - The element to validate
 * @returns Whether the element meets the 44px × 44px minimum
 */
export function validateTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const MIN_SIZE = 44;
  
  return rect.width >= MIN_SIZE && rect.height >= MIN_SIZE;
}

/**
 * Gets the appropriate input type and inputmode for mobile keyboards
 * 
 * @param fieldType - The type of field (email, tel, number, etc.)
 * @returns Object with type and inputMode attributes
 */
export function getMobileInputAttributes(fieldType: 'email' | 'tel' | 'number' | 'text' | 'url') {
  const attributes: {
    type: string;
    inputMode?: 'email' | 'tel' | 'numeric' | 'url' | 'text';
  } = {
    type: fieldType,
  };

  // Set appropriate inputMode for better mobile keyboard
  switch (fieldType) {
    case 'email':
      attributes.inputMode = 'email';
      break;
    case 'tel':
      attributes.inputMode = 'tel';
      break;
    case 'number':
      attributes.inputMode = 'numeric';
      break;
    case 'url':
      attributes.inputMode = 'url';
      break;
    default:
      attributes.inputMode = 'text';
  }

  return attributes;
}
