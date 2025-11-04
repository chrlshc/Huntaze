'use client';

import { ReactNode } from 'react';

interface SimpleScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  duration?: number;
  amount?: number;
  once?: boolean;
  className?: string;
}

/**
 * Simple ScrollReveal without animations to prevent hydration issues
 * This is a temporary replacement for the framer-motion version
 */
export function SimpleScrollReveal({
  children,
  className = '',
}: SimpleScrollRevealProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Export as ScrollReveal for drop-in replacement
export const ScrollReveal = SimpleScrollReveal;

interface SimpleScrollRevealListProps {
  children: ReactNode[];
  direction?: 'up' | 'down' | 'left' | 'right';
  staggerDelay?: number;
  duration?: number;
  amount?: number;
  once?: boolean;
  className?: string;
  itemClassName?: string;
}

export function SimpleScrollRevealList({
  children,
  className = '',
  itemClassName = '',
}: SimpleScrollRevealListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div key={index} className={itemClassName}>
          {child}
        </div>
      ))}
    </div>
  );
}

export const ScrollRevealList = SimpleScrollRevealList;

interface SimpleScrollRevealScaleProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  amount?: number;
  once?: boolean;
  className?: string;
}

export function SimpleScrollRevealScale({
  children,
  className = '',
}: SimpleScrollRevealScaleProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export const ScrollRevealScale = SimpleScrollRevealScale;