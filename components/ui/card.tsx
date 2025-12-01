import type { HTMLAttributes } from "react";

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
};

export function Card({ className, variant = 'default', nested = false, nestingLevel, ...props }: CardProps) {
  // Determine nesting level: explicit prop > nested boolean > default
  const effectiveNestingLevel = nestingLevel ?? (nested ? 2 : 1);
  
  return (
    <div
      className={cn(
        // Base styles using design tokens
        "rounded-[var(--card-radius)] p-[var(--card-padding)]",
        // Variant styles with progressive lightening for nested cards
        variant === 'glass' 
          ? "glass-card" // Uses glass effect from design-tokens.css
          : variant === 'elevated'
          ? "card-elevated" // Uses elevated card utility from design-tokens.css
          : `nesting-level-${effectiveNestingLevel}`, // Use nesting utility classes
        // Hover state with subtle border/shadow adjustments only
        "transition-shadow duration-[var(--transition-base)]",
        effectiveNestingLevel >= 2
          ? "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)]"
          : "hover:border-[var(--border-emphasis)] hover:shadow-[var(--shadow-soft)]",
        className,
      )}
      data-nesting-level={effectiveNestingLevel}
      {...props}
    />
  );
}
