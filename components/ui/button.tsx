"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type CoreVariant = "primary" | "secondary" | "outline" | "ghost" | "tonal" | "danger" | "gradient" | "link";
type ButtonVariant = CoreVariant | "default" | "filled" | "subtle" | "muted";
type ButtonSize = "sm" | "md" | "lg" | "xl" | "pill";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center gap-[var(--spacing-2)] font-[var(--font-weight-medium)] transition-[background-color,border-color,color,box-shadow] duration-[var(--transition-base)] focus-visible:outline-none focus-visible:ring-[length:var(--focus-ring-width)] focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-[length:var(--focus-ring-offset)] disabled:cursor-not-allowed disabled:opacity-60";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-[var(--button-height-dense)] rounded-[var(--button-border-radius)] px-[var(--spacing-3)] text-[var(--text-xs)]",
  md: "h-[var(--button-height-standard)] rounded-[var(--button-border-radius)] px-[var(--spacing-4)] text-[var(--text-sm)]",
  lg: "h-12 rounded-xl px-[var(--spacing-6)] text-[var(--text-base)]",
  xl: "h-14 rounded-2xl px-[var(--spacing-7)] text-[var(--text-base)]",
  pill: "h-11 rounded-full px-[var(--spacing-6)] text-[var(--text-sm)]",
};

// Task 41: Enhanced visual distinction for all interactive elements (Req 9.4)
// All button variants now include clear visual affordance through:
// - Distinct colors for primary actions
// - Visible borders for secondary/outline variants
// - Shadows for depth and interactivity
// - Clear hover states with increased brightness
const variantClasses: Record<CoreVariant, string> = {
  // Primary: Solid background + shadow + distinct color
  primary: "bg-[var(--accent-primary)] text-white border-[length:var(--input-border-width)] border-[var(--accent-primary)] shadow-[var(--shadow-sm)] hover:bg-[var(--accent-primary-hover)] hover:shadow-[var(--shadow-md)]",
  
  // Secondary: Visible border + subtle background + shadow
  secondary:
    "border-[length:var(--input-border-width)] border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-secondary)] hover:shadow-[var(--shadow-md)]",
  
  // Outline: Clear border + transparent background + hover effect
  outline:
    "border-[length:var(--input-border-width)] border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-glass-hover)] hover:shadow-[var(--shadow-sm)]",
  
  // Ghost: Minimal but with clear hover state
  ghost: "bg-transparent text-[var(--text-secondary)] border-[length:var(--input-border-width)] border-transparent hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]",
  
  // Tonal: Subtle background + border for distinction
  tonal: "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[length:var(--input-border-width)] border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-default)]",
  
  // Danger: High contrast error color + border + shadow
  danger: "bg-[var(--accent-error)] text-white border-[length:var(--input-border-width)] border-[var(--accent-error)] shadow-[var(--shadow-sm)] hover:brightness-110 hover:shadow-[var(--shadow-md)]",
  
  // Gradient: Eye-catching with border + shadow
  gradient: "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-active)] text-white border-[length:var(--input-border-width)] border-[var(--accent-primary)] shadow-[var(--shadow-md)] hover:brightness-110 hover:shadow-[var(--shadow-lg)]",
  
  // Link: Color + underline for clear affordance
  link: "bg-transparent text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] underline-offset-4 hover:underline border-none",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, children, variant = "primary", size = "md", loading = false, disabled, ...props },
  ref,
) {
  const resolvedVariant: CoreVariant = (() => {
    if (variant === "default" || variant === "filled") {
      return "primary";
    }
    if (variant === "subtle" || variant === "muted") {
      return "tonal";
    }
    return (variant as CoreVariant) ?? "primary";
  })();

  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        sizeClasses[size] ?? sizeClasses.md,
        variantClasses[resolvedVariant] ?? variantClasses.primary,
        className,
      )}
      aria-busy={loading || undefined}
      aria-disabled={disabled || loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
});
