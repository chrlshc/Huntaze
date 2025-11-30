import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'glass';
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Base styles using design tokens
        "rounded-[var(--card-radius)] p-[var(--card-padding)]",
        // Variant styles
        variant === 'glass' 
          ? "glass-card" // Uses glass effect from design-tokens.css
          : "bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] shadow-[var(--shadow-inner-glow)]",
        // Hover state
        "transition-all duration-[var(--transition-base)]",
        "hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    />
  );
}
