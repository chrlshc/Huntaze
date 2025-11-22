/**
 * Screen Reader Only Component
 * WCAG 2.1 AA - 4.1.2 Name, Role, Value (Level A)
 * 
 * Renders content that is visually hidden but accessible to screen readers.
 * Useful for providing additional context to assistive technology users.
 */

import React from 'react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function ScreenReaderOnly({ 
  children, 
  as: Component = 'span' 
}: ScreenReaderOnlyProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

// Example usage:
// <ScreenReaderOnly>This text is only for screen readers</ScreenReaderOnly>
// <ScreenReaderOnly as="p">Additional context for assistive tech</ScreenReaderOnly>
