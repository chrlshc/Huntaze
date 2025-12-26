'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

export interface AlertProps {
  /**
   * Visual variant of the alert
   */
  variant?: 'success' | 'warning' | 'error' | 'info';
  
  /**
   * Alert title (optional)
   */
  title?: string;
  
  /**
   * Alert message content
   */
  children: React.ReactNode;
  
  /**
   * Whether the alert can be dismissed
   */
  dismissible?: boolean;
  
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Auto-dismiss after duration (ms). 0 = no auto-dismiss
   */
  autoDismiss?: number;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Icon to display (optional, overrides default variant icon)
   */
  icon?: React.ReactNode;
}

/**
 * Alert Component
 * 
 * A flexible alert/notification component with design token integration.
 * Supports multiple variants (success, warning, error, info) with consistent styling.
 * 
 * Features:
 * - 4 semantic variants with appropriate accent colors
 * - Optional title and dismissible functionality
 * - Auto-dismiss capability
 * - Fade-in animation using design tokens
 * - Full accessibility support
 * 
 * Design Tokens Used:
 * - --bg-glass: Glass morphism background
 * - --border-subtle: Subtle border
 * - --radius-xl: Border radius
 * - --space-*: Consistent spacing
 * - --text-*: Typography hierarchy
 * - --accent-*: Variant colors
 * - --transition-base: Animation timing
 * - --shadow-sm: Subtle elevation
 * 
 * @example
 * ```tsx
 * <Alert variant="success" title="Success!">
 *   Your changes have been saved.
 * </Alert>
 * ```
 */
export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  autoDismiss = 0,
  className = '',
  icon,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 200); // Match --transition-base
  }, [onDismiss]);

  useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismiss);
      
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, handleDismiss]);

  if (!isVisible) {
    return null;
  }

  const variantStyles = {
    success: {
      borderColor: 'var(--accent-success)',
      iconColor: 'var(--accent-success)',
      bgColor: 'rgba(16, 185, 129, 0.08)', // emerald with opacity
    },
    warning: {
      borderColor: 'var(--accent-warning)',
      iconColor: 'var(--accent-warning)',
      bgColor: 'rgba(245, 158, 11, 0.08)', // amber with opacity
    },
    error: {
      borderColor: 'var(--accent-error)',
      iconColor: 'var(--accent-error)',
      bgColor: 'rgba(239, 68, 68, 0.08)', // red with opacity
    },
    info: {
      borderColor: 'var(--accent-info)',
      iconColor: 'var(--accent-info)',
      bgColor: 'rgba(59, 130, 246, 0.08)', // blue with opacity
    },
  };

  const currentVariant = variantStyles[variant];

  const defaultIcons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="currentColor"/>
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z" fill="currentColor"/>
      </svg>
    ),
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`alert ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        background: `linear-gradient(to bottom, ${currentVariant.bgColor}, var(--bg-glass))`,
        backdropFilter: 'blur(var(--blur-xl))',
        border: `1px solid ${currentVariant.borderColor}`,
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        transition: `all var(--transition-base)`,
        opacity: isAnimatingOut ? 0 : 1,
        transform: isAnimatingOut ? 'translateY(-8px)' : 'translateY(0)',
        animation: 'alertFadeIn var(--transition-base) ease-out',
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          color: currentVariant.iconColor,
          marginTop: 'var(--space-1)',
        }}
      >
        {icon || defaultIcons[variant]}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: title && children ? 'var(--space-1)' : 0,
            }}
          >
            {title}
          </div>
        )}
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          {children}
        </div>
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <Button 
          variant="primary" 
          onClick={handleDismiss} 
          type="button" 
          aria-label="Dismiss alert"
          style={{
            flexShrink: 0,
            padding: 'var(--space-1)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = 'var(--bg-glass-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Button>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes alertFadeIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
}

Alert.displayName = 'Alert';
