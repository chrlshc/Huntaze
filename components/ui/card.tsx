import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'glass' | 'elevated';
  nested?: boolean;
  /**
   * Nesting level for progressive background lightening
   * - 1: Main cards (--bg-card-elevated)
   * - 2: Nested cards (--bg-secondary)
   * - 3: Inner elements (--bg-glass-hover)
   * @default 1
   */
  nestingLevel?: 1 | 2 | 3;
  /**
   * Padding size using design tokens
   * @default 'base'
   */
  padding?: 'none' | 'sm' | 'base' | 'lg';
  /**
   * Shadow variant
   * @default 'card'
   */
  shadow?: 'none' | 'card' | 'elevated';
  /**
   * Footer slot for actions - renders with subdued background
   */
  footer?: ReactNode;
};

const paddingClasses = {
  none: 'p-0',
  sm: 'p-[var(--space-2)]',
  base: 'p-[var(--space-4)]',
  lg: 'p-[var(--space-6)]',
};

const shadowClasses = {
  none: 'shadow-none',
  card: 'shadow-[var(--shadow-card)]',
  elevated: 'shadow-[var(--shadow-elevated)]',
};

export function Card({ 
  className, 
  variant = 'default', 
  nested = false, 
  nestingLevel,
  padding = 'base',
  shadow = 'card',
  footer,
  children,
  ...props 
}: CardProps) {
  // Determine nesting level: explicit prop > nested boolean > default
  const effectiveNestingLevel = nestingLevel ?? (nested ? 2 : 1);
  
  return (
    <div
      className={cn(
        // Base styles using design tokens
        "rounded-[var(--radius-base)] border border-[var(--border-default)]",
        // Background based on variant
        variant === 'glass' 
          ? "glass-card"
          : variant === 'elevated'
          ? "card-elevated bg-[var(--color-surface-card)]"
          : `nesting-level-${effectiveNestingLevel} bg-[var(--color-surface-card)]`,
        // Shadow
        shadowClasses[shadow],
        // Hover state
        "transition-shadow duration-[var(--transition-base)]",
        effectiveNestingLevel >= 2
          ? "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)]"
          : "hover:border-[var(--border-emphasis)] hover:shadow-[var(--shadow-soft)]",
        // No padding on wrapper if footer exists
        footer ? '' : paddingClasses[padding],
        className,
      )}
      data-nesting-level={effectiveNestingLevel}
      data-testid="card"
      {...props}
    >
      {footer ? (
        <>
          <div className={cn(paddingClasses[padding])} data-testid="card-content">
            {children}
          </div>
          <div 
            className={cn(
              "border-t border-[var(--border-subdued)]",
              "bg-[var(--color-surface-subdued)]",
              "rounded-b-[var(--radius-base)]",
              paddingClasses[padding === 'none' ? 'sm' : padding]
            )}
            data-testid="card-footer"
          >
            {footer}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  );
}
