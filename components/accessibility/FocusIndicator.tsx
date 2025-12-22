/**
 * Focus Indicator Component
 * 
 * Provides visible focus indicators for interactive elements
 * Meets WCAG 2.2 Focus Visible requirement (2.4.7)
 */

import React from 'react';

interface FocusIndicatorProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Wrapper component that adds accessible focus indicators
 */
export function FocusIndicator({ 
  children, 
  className = '', 
  as: Component = 'div' 
}: FocusIndicatorProps) {
  return (
    <Component
      className={`
        focus-visible:outline-2 
        focus-visible:outline-[#2c6ecb] 
        focus-visible:outline-offset-2 
        focus-visible:outline 
        rounded-sm
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

/**
 * Skip to main content link for keyboard navigation
 */
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="
        absolute left-[-9999px] z-[999]
        px-6 py-3
        bg-[#2c6ecb] text-white
        font-semibold
        rounded-b-lg
        focus:left-1/2 focus:-translate-x-1/2 focus:top-0
        transition-all
      "
    >
      Skip to main content
    </a>
  );
}

/**
 * Focus trap for modals and dialogs
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    }

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, [ref]);
}
