"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  variant?: 'dense' | 'standard';
};

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
          "border-[length:var(--border-width-thin)]",
          "rounded-[var(--input-border-radius)]",
          // Colors from design tokens
          "bg-[var(--color-bg-input)]",
          "border-[var(--color-border-subtle)]",
          "text-[var(--color-text-primary)]",
          "placeholder:text-[var(--color-text-muted)]",
          // Height based on variant (32px dense, 40px standard)
          variant === 'dense' ? "h-[var(--input-height-dense)]" : "h-[var(--input-height-standard)]",
          // Padding using 4px grid system
          "px-[var(--spacing-3)]",
          "py-[var(--spacing-2)]",
          // Focus states
          "focus-visible:outline-none",
          "focus-visible:ring-[length:var(--focus-ring-width)]",
          "focus-visible:ring-[var(--focus-ring-color)]",
          "focus-visible:ring-offset-[length:var(--focus-ring-offset)]",
          "focus-visible:border-[var(--color-border-focus)]",
          // Disabled state
          "disabled:cursor-not-allowed",
          "disabled:opacity-70",
          // Transitions
          "transition-[border-color,box-shadow]",
          "duration-[var(--transition-fast)]",
          // Error state
          error ? "border-[var(--color-error)]" : "",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="mt-[var(--spacing-1)] text-[var(--font-size-sm)] text-[var(--color-error)]" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
});
