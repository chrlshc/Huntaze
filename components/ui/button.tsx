/**
 * Button Component with Dashboard Polish Enhancements
 * 
 * Enhanced with micro-interactions for professional, tactile feedback:
 * - Hover state: box-shadow for depth perception (Req 3.4)
 * - Focus state: visible focus ring for keyboard navigation (Req 3.2, 4.5)
 * - Click state: scale(0.99) for tactile feedback (Req 3.5)
 * - Typography: white text with font-weight 500-600 on colored backgrounds (Req 4.3)
 * 
 * Uses dashboard polish tokens for consistent micro-interactions across all dashboard views.
 * 
 * Requirements: 3.2, 3.4, 3.5, 4.3, 4.5
 */

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

/**
 * Base button classes with dashboard polish micro-interactions
 * Requirements: 3.2, 3.4, 3.5, 4.3, 4.5
 * 
 * Micro-interactions:
 * - Hover: box-shadow for depth (Req 3.4)
 * - Focus: visible focus ring for keyboard navigation (Req 3.2, 4.5)
 * - Click: scale(0.99) for tactile feedback (Req 3.5)
 * - White text with font-weight 500-600 on colored backgrounds (Req 4.3)
 */
const baseClasses =
  "inline-flex items-center justify-center gap-[var(--spacing-2)] font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:outline-[length:2px] focus-visible:outline-offset-2 focus-visible:outline-[rgba(44,110,203,0.8)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]";

/**
 * Size classes with WCAG touch target compliance (Property 22)
 * All interactive buttons have minimum 44px touch target
 * sm uses min-h to ensure touch target while allowing compact visual
 */
const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 min-h-[var(--button-min-touch-target)] rounded-[var(--button-border-radius)] px-[var(--space-3)] text-[var(--text-xs)]",
  md: "h-[var(--button-min-touch-target)] min-h-[var(--button-min-touch-target)] rounded-[var(--button-border-radius)] px-[var(--space-4)] text-[var(--text-sm)]",
  lg: "h-12 min-h-[var(--button-min-touch-target)] rounded-xl px-[var(--space-6)] text-[var(--text-base)]",
  xl: "h-14 min-h-[var(--button-min-touch-target)] rounded-2xl px-[var(--space-7)] text-[var(--text-base)]",
  pill: "h-11 min-h-[var(--button-min-touch-target)] rounded-full px-[var(--space-6)] text-[var(--text-sm)]",
};

/**
 * Button variant classes with dashboard polish enhancements
 * Requirements: 3.2, 3.4, 3.5, 4.3, 4.5
 * 
 * All variants include:
 * - Hover state with box-shadow (Req 3.4)
 * - Focus state with visible focus ring (Req 3.2, 4.5)
 * - Click state with scale(0.99) via baseClasses (Req 3.5)
 * - White text with font-weight 500-600 on colored backgrounds (Req 4.3)
 * 
 * Uses polish tokens for consistent micro-interactions across dashboard
 */
const variantClasses: Record<CoreVariant, string> = {
  // Primary: Solid background + white text (font-weight 500) + hover shadow
  primary: "bg-[var(--accent-primary)] text-white font-medium border-[length:var(--input-border-width)] border-[var(--accent-primary)] shadow-sm hover:bg-[var(--accent-primary-hover)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
  
  // Secondary: Visible border + subtle background + hover shadow
  secondary:
    "border-[length:var(--input-border-width)] border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium shadow-sm hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-secondary)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
  
  // Outline: Clear border + transparent background + hover shadow
  outline:
    "border-[length:var(--input-border-width)] border-[var(--border-default)] bg-transparent text-[var(--text-primary)] font-medium hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-glass-hover)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
  
  // Ghost: Minimal with clear hover state + subtle shadow
  ghost: "bg-transparent text-[var(--text-secondary)] font-medium border-[length:var(--input-border-width)] border-transparent hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:shadow-sm",
  
  // Tonal: Subtle background + border + hover shadow
  tonal: "bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium border-[length:var(--input-border-width)] border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-default)] hover:shadow-sm",
  
  // Danger: High contrast error color + white text (font-weight 500) + hover shadow
  danger: "bg-[var(--accent-error)] text-white font-medium border-[length:var(--input-border-width)] border-[var(--accent-error)] shadow-sm hover:brightness-110 hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
  
  // Gradient: Eye-catching + white text (font-weight 500) + hover shadow
  gradient: "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-active)] text-white font-semibold border-[length:var(--input-border-width)] border-[var(--accent-primary)] shadow-md hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]",
  
  // Link: Color + underline for clear affordance + no shadow
  link: "bg-transparent text-[var(--accent-primary)] font-medium hover:text-[var(--accent-primary-hover)] underline-offset-4 hover:underline border-none",
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

Button.displayName = "Button";
