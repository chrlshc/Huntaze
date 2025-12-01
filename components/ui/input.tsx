"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  variant?: 'dense' | 'standard';
};

// Task 41: Enhanced visual distinction for input fields (Req 9.4)
// All inputs now have:
// - Clear, visible borders (minimum 0.12 opacity)
// - Distinct focus rings for keyboard navigation
// - Hover states for better interactivity feedback
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, variant = 'standard', ...props },
  ref,
) {
  return (
    <div>
      <input
        ref={ref}
        className={cn(
          // Base styles using design tokens
          "w-full",
          "rounded-[var(--input-radius)]",
          // Task 41: Clear borders for visual distinction
          "border-[length:var(--input-border-width)]",
          "border-[var(--border-default)]", // Updated from --border-subtle for better visibility
          // Colors from design tokens
          "bg-[var(--bg-input)]",
          "text-[var(--text-primary)]",
          "placeholder:text-[var(--text-tertiary)]",
          // Height based on variant (32px dense, 40px standard)
          variant === 'dense' ? "h-[var(--input-height-sm)]" : "h-[var(--input-height-md)]",
          // Padding using 4px grid system
          "px-[var(--space-3)]",
          "py-[var(--space-2)]",
          // Task 41: Enhanced focus states for clear visual affordance
          "focus-visible:outline-none",
          "focus-visible:ring-[length:var(--focus-ring-width)]",
          "focus-visible:ring-[var(--focus-ring-color)]",
          "focus-visible:ring-offset-[length:var(--focus-ring-offset)]",
          "focus-visible:border-[var(--border-emphasis)]",
          // Task 41: Hover state for better interactivity
          "hover:border-[var(--border-emphasis)]",
          // Disabled state
          "disabled:cursor-not-allowed",
          "disabled:opacity-70",
          "disabled:hover:border-[var(--border-default)]", // Don't show hover on disabled
          // Transitions
          "transition-[border-color,box-shadow]",
          "duration-[var(--transition-base)]",
          // Error state with high contrast
          error ? "border-[var(--accent-error-border)] focus-visible:ring-[var(--accent-error)]" : "",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="mt-[var(--space-1)] text-[var(--text-sm)] text-[var(--accent-error)]" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
});
