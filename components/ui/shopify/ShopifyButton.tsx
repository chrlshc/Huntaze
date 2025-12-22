"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShopifyButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "plain" | "destructive";
export type ShopifyButtonSize = "sm" | "md" | "lg";

export interface ShopifyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ShopifyButtonVariant;
  size?: ShopifyButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  asChild?: boolean;
}

/**
 * ShopifyButton - Shopify Polaris-inspired button component
 * 
 * Variants:
 * - primary: Filled, single preferred action per zone
 * - secondary: Soft outline, neutral emphasis
 * - ghost/plain: Text button, lowest emphasis
 * - destructive: Red background for dangerous actions
 * 
 * Buttons use consistent sizing, radius, and focus rings.
 */
export const ShopifyButton = forwardRef<HTMLButtonElement, ShopifyButtonProps>(
  function ShopifyButton(
    {
      className,
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      fullWidth = false,
      icon,
      iconPosition = "left",
      asChild = false,
      ...props
    },
    ref
  ) {
    const baseClasses = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap",
      "font-medium leading-none transition-all duration-200",
      "select-none",
      "min-h-0",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "rounded-[var(--button-border-radius)]",
      // Lucide icons (svg)
      "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
      fullWidth && "w-full"
    );

    const sizeClasses: Record<ShopifyButtonSize, string> = {
      sm: "h-9 px-3 text-[13px]",
      md: "h-10 px-4 text-[14px]",
      lg: "h-11 px-5 text-[15px]",
    };

    const variantClasses: Record<ShopifyButtonVariant, string> = {
      // Primary = noir premium (pas violet plein)
      primary: cn(
        "bg-slate-900 text-white",
        "shadow-sm shadow-black/10",
        "hover:bg-slate-800 active:bg-slate-900",
        "focus-visible:ring-[var(--shopify-border-focus)]",
        "disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
      ),
      // Secondary = outline doux (pas de noir)
      secondary: cn(
        "bg-white text-slate-900",
        "border border-slate-200/70 shadow-sm shadow-black/5",
        "hover:bg-slate-50 hover:border-slate-300/60 hover:shadow-black/10",
        "active:bg-slate-100",
        "focus-visible:ring-[var(--shopify-border-focus)]"
      ),
      // Accent = violet SOFT (tint) pour AI only
      accent: cn(
        "bg-violet-50 text-violet-700",
        "shadow-sm shadow-black/5",
        "hover:bg-violet-100 hover:shadow-black/10 active:bg-violet-50",
        "focus-visible:ring-[var(--shopify-border-focus)]",
        "disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
      ),
      // Ghost: text button
      ghost: cn(
        "bg-transparent text-slate-700",
        "hover:bg-slate-100 active:bg-slate-200/70",
        "focus-visible:ring-[var(--shopify-border-focus)]",
        "disabled:text-slate-400"
      ),
      // Plain = texte propre (pas de chip)
      plain: cn(
        "bg-transparent text-slate-600",
        "hover:text-slate-900 hover:underline underline-offset-4",
        "focus-visible:ring-[var(--shopify-border-focus)]",
        "disabled:text-slate-400"
      ),
      // Destructive: red background
      destructive: cn(
        "bg-rose-600 text-white",
        "shadow-sm shadow-rose-600/20",
        "hover:bg-rose-500 active:bg-rose-600",
        "focus-visible:ring-rose-600/20",
        "disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
      ),
    };

    const Comp = asChild ? "a" : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        disabled={disabled || loading}
        {...(asChild && { role: "button" })}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {!loading && icon && iconPosition === "left" && icon}
        {children != null ? <span>{children}</span> : null}
        {!loading && icon && iconPosition === "right" && icon}
      </Comp>
    );
  }
);

// Export variant and size types for testing
export const SHOPIFY_BUTTON_VARIANTS: ShopifyButtonVariant[] = [
  "primary",
  "secondary",
  "accent",
  "ghost",
  "plain",
  "destructive",
];
export const SHOPIFY_BUTTON_SIZES: ShopifyButtonSize[] = ["sm", "md", "lg"];
