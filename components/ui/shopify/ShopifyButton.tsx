"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShopifyButtonVariant = "primary" | "secondary" | "plain" | "destructive";
export type ShopifyButtonSize = "sm" | "md" | "lg";

export interface ShopifyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ShopifyButtonVariant;
  size?: ShopifyButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

/**
 * ShopifyButton - Shopify Polaris-inspired button component
 * 
 * Variants:
 * - primary: Solid dark (#1a1a1a) background with white text
 * - secondary: Outlined with dark border, transparent background
 * - plain: Text-only button with hover underline
 * - destructive: Red background for dangerous actions
 * 
 * All buttons use 8px border-radius and proper padding.
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
      ...props
    },
    ref
  ) {
    const baseClasses = cn(
      "inline-flex items-center justify-center gap-2",
      "font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "rounded-[8px]", // Shopify 8px border-radius
      fullWidth && "w-full"
    );

    const sizeClasses: Record<ShopifyButtonSize, string> = {
      sm: "h-8 px-3 text-[13px]",
      md: "h-10 px-4 text-[14px]",
      lg: "h-12 px-6 text-[15px]",
    };

    const variantClasses: Record<ShopifyButtonVariant, string> = {
      // Primary: solid dark background (#1a1a1a) with white text
      primary: cn(
        "bg-[var(--shopify-btn-primary-bg,#1a1a1a)]",
        "text-[var(--shopify-btn-primary-text,#ffffff)]",
        "border border-[var(--shopify-btn-primary-bg,#1a1a1a)]",
        "shadow-sm",
        "hover:bg-[var(--shopify-btn-primary-hover,#333333)]",
        "hover:border-[var(--shopify-btn-primary-hover,#333333)]",
        "focus-visible:ring-[var(--shopify-btn-primary-bg,#1a1a1a)]"
      ),
      // Secondary: outlined with dark border
      secondary: cn(
        "bg-[var(--shopify-btn-secondary-bg,transparent)]",
        "text-[var(--shopify-btn-secondary-text,#1a1a1a)]",
        "border border-[var(--shopify-btn-secondary-border,#1a1a1a)]",
        "hover:bg-[var(--shopify-btn-secondary-hover,#f6f6f7)]",
        "focus-visible:ring-[var(--shopify-btn-secondary-border,#1a1a1a)]"
      ),
      // Plain: text-only button
      plain: cn(
        "bg-transparent",
        "text-[var(--shopify-text-primary,#1a1a1a)]",
        "border-none",
        "hover:underline",
        "focus-visible:ring-[var(--shopify-accent-info,#2c6ecb)]",
        "px-1" // Override padding for plain variant
      ),
      // Destructive: red background
      destructive: cn(
        "bg-[var(--shopify-accent-error,#d72c0d)]",
        "text-white",
        "border border-[var(--shopify-accent-error,#d72c0d)]",
        "shadow-sm",
        "hover:brightness-110",
        "focus-visible:ring-[var(--shopify-accent-error,#d72c0d)]"
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          // Override padding for plain variant
          variant === "plain" && "px-1",
          className
        )}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {!loading && icon && iconPosition === "left" && icon}
        <span>{children}</span>
        {!loading && icon && iconPosition === "right" && icon}
      </button>
    );
  }
);

// Export variant and size types for testing
export const SHOPIFY_BUTTON_VARIANTS: ShopifyButtonVariant[] = ["primary", "secondary", "plain", "destructive"];
export const SHOPIFY_BUTTON_SIZES: ShopifyButtonSize[] = ["sm", "md", "lg"];
