'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MD3ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const MD3Button = forwardRef<HTMLButtonElement, MD3ButtonProps>(
  ({ 
    className,
    variant = 'filled',
    size = 'medium',
    icon,
    iconPosition = 'left',
    children,
    ...props 
  }, ref) => {
    const baseStyles = 'relative overflow-hidden inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      filled: 'bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-600 shadow-sm hover:shadow-md active:shadow-sm',
      outlined: 'border border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 focus-visible:ring-purple-600',
      text: 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 focus-visible:ring-purple-600',
      elevated: 'bg-purple-50 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200 shadow-sm hover:shadow-md active:shadow-sm focus-visible:ring-purple-600',
      tonal: 'bg-purple-100 text-purple-900 dark:bg-purple-800/30 dark:text-purple-100 hover:bg-purple-200 dark:hover:bg-purple-700/30 focus-visible:ring-purple-600',
    };

    const sizes = {
      small: 'h-8 px-3 text-sm rounded-lg gap-1.5',
      medium: 'h-10 px-6 text-base rounded-full gap-2',
      large: 'h-14 px-8 text-lg rounded-full gap-3',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {/* Ripple effect container */}
        <span className="absolute inset-0 overflow-hidden rounded-inherit">
          <motion.span
            className="absolute inset-0 bg-current opacity-0"
            initial={false}
            whileHover={{ opacity: 0.08 }}
            whileTap={{ opacity: 0.12 }}
          />
        </span>

        {/* Button content */}
        <span className="relative flex items-center gap-inherit">
          {icon && iconPosition === 'left' && icon}
          {children as React.ReactNode}
          {icon && iconPosition === 'right' && icon}
        </span>
      </motion.button>
    );
  }
);

MD3Button.displayName = 'MD3Button';

export default MD3Button;
