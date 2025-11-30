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

const variantClasses: Record<CoreVariant, string> = {
  primary: "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-hover)]",
  secondary:
    "border-[length:var(--border-width-thin)] border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)] hover:border-[var(--color-border-emphasis)] hover:bg-[var(--color-bg-hover)]",
  outline:
    "border-[length:var(--border-width-thin)] border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-emphasis)] hover:bg-[var(--color-bg-hover)]",
  ghost: "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]",
  tonal: "bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]",
  danger: "bg-[var(--color-error)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-error)]/90",
  gradient: "bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-active)] text-white shadow-[var(--shadow-sm)] hover:brightness-110",
  link: "bg-transparent text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] underline-offset-4 hover:underline",
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
