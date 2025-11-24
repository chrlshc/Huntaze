'use client';

import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Safe Area Components
 * 
 * These components provide iOS-safe padding for notches, rounded corners,
 * and system UI elements. They use CSS environment variables (env()) to
 * automatically adapt to device-specific safe areas.
 * 
 * Design Reference: mobile-ux-marketing-refactor/design.md
 * Validates: Requirements 1.4
 */

interface SafeAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SafeAreaTop
 * 
 * Adds padding-top for device notches and status bars.
 * Use for fixed headers and top-positioned elements.
 * 
 * @example
 * <SafeAreaTop>
 *   <header>...</header>
 * </SafeAreaTop>
 */
export function SafeAreaTop({ children, className, ...props }: SafeAreaProps) {
  return (
    <div className={cn('pt-[var(--sat)]', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * SafeAreaBottom
 * 
 * Adds padding-bottom for home indicators and bottom system UI.
 * Use for fixed footers, tab bars, and bottom-positioned elements.
 * 
 * @example
 * <SafeAreaBottom>
 *   <footer>...</footer>
 * </SafeAreaBottom>
 */
export function SafeAreaBottom({ children, className, ...props }: SafeAreaProps) {
  return (
    <div className={cn('pb-[var(--sab)]', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * SafeAreaLeft
 * 
 * Adds padding-left for device edges in landscape orientation.
 * Use for fixed sidebars and left-positioned elements.
 * 
 * @example
 * <SafeAreaLeft>
 *   <aside>...</aside>
 * </SafeAreaLeft>
 */
export function SafeAreaLeft({ children, className, ...props }: SafeAreaProps) {
  return (
    <div className={cn('pl-[var(--sal)]', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * SafeAreaRight
 * 
 * Adds padding-right for device edges in landscape orientation.
 * Use for fixed elements positioned on the right edge.
 * 
 * @example
 * <SafeAreaRight>
 *   <aside>...</aside>
 * </SafeAreaRight>
 */
export function SafeAreaRight({ children, className, ...props }: SafeAreaProps) {
  return (
    <div className={cn('pr-[var(--sar)]', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * SafeAreaInset
 * 
 * Adds padding on all sides for complete safe area coverage.
 * Use for full-screen modals and overlays.
 * 
 * @example
 * <SafeAreaInset>
 *   <div className="fixed inset-0">...</div>
 * </SafeAreaInset>
 */
export function SafeAreaInset({ children, className, ...props }: SafeAreaProps) {
  return (
    <div
      className={cn(
        'pt-[var(--sat)] pb-[var(--sab)] pl-[var(--sal)] pr-[var(--sar)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * SafeAreaHeader
 * 
 * Pre-configured header component with safe area top padding
 * and common header styles (sticky, backdrop blur, border).
 * 
 * @example
 * <SafeAreaHeader>
 *   <nav>...</nav>
 * </SafeAreaHeader>
 */
export function SafeAreaHeader({ children, className, ...props }: SafeAreaProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 pt-[var(--sat)]',
        'border-b border-border',
        'bg-background/80 backdrop-blur-md',
        'supports-[backdrop-filter]:bg-background/60',
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
}

/**
 * SafeAreaFooter
 * 
 * Pre-configured footer component with safe area bottom padding
 * and common footer styles (border, background).
 * 
 * @example
 * <SafeAreaFooter>
 *   <nav>...</nav>
 * </SafeAreaFooter>
 */
export function SafeAreaFooter({ children, className, ...props }: SafeAreaProps) {
  return (
    <footer
      className={cn(
        'pb-[var(--sab)]',
        'border-t border-border',
        'bg-surface',
        className
      )}
      {...props}
    >
      {children}
    </footer>
  );
}
