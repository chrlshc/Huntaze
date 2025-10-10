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
  "inline-flex items-center justify-center gap-2 font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary disabled:cursor-not-allowed disabled:opacity-60";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-md px-3 text-xs",
  md: "h-10 rounded-lg px-4 text-sm",
  lg: "h-12 rounded-xl px-6 text-base",
  xl: "h-14 rounded-2xl px-7 text-base",
  pill: "h-11 rounded-full px-6 text-sm",
};

const variantClasses: Record<CoreVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
  secondary:
    "border border-border-default bg-surface-raised text-content-secondary shadow-sm hover:border-border-strong hover:bg-surface-muted",
  outline:
    "border border-border-default bg-transparent text-content-secondary hover:border-border-strong hover:bg-surface-muted/70",
  ghost: "bg-transparent text-content-secondary hover:bg-surface-muted/70",
  tonal: "bg-surface-muted text-content-secondary hover:bg-surface-raised",
  danger: "bg-danger text-white shadow-sm hover:bg-danger/90",
  gradient: "bg-gradient-primary text-white shadow-soft hover:brightness-110",
  link: "bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline",
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
