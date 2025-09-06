'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MD3FABProps extends HTMLMotionProps<"button"> {
  size?: 'small' | 'regular' | 'large';
  variant?: 'surface' | 'primary' | 'secondary' | 'tertiary';
  extended?: boolean;
  icon: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const MD3FAB = forwardRef<HTMLButtonElement, MD3FABProps>(
  ({ 
    className,
    size = 'regular',
    variant = 'primary',
    extended = false,
    icon,
    children,
    position = 'bottom-right',
    ...props 
  }, ref) => {
    const baseStyles = 'fixed z-50 inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shadow-lg hover:shadow-xl active:shadow-lg';
    
    const sizes = {
      small: extended ? 'h-10 px-4 rounded-2xl gap-2' : 'h-10 w-10 rounded-xl',
      regular: extended ? 'h-14 px-6 rounded-2xl gap-3' : 'h-14 w-14 rounded-2xl',
      large: extended ? 'h-24 px-8 rounded-[28px] gap-3' : 'h-24 w-24 rounded-[28px]',
    };

    const variants = {
      surface: 'bg-purple-100 text-purple-900 dark:bg-purple-800/30 dark:text-purple-100 hover:bg-purple-200 dark:hover:bg-purple-700/30 focus-visible:ring-purple-600',
      primary: 'bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-600',
      secondary: 'bg-purple-50 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-800/30 focus-visible:ring-purple-600',
      tertiary: 'bg-pink-100 text-pink-900 dark:bg-pink-900/30 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-pink-800/30 focus-visible:ring-pink-600',
    };

    const positions = {
      'bottom-right': 'bottom-4 right-4 md:bottom-6 md:right-6',
      'bottom-left': 'bottom-4 left-4 md:bottom-6 md:left-6',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          sizes[size],
          variants[variant],
          positions[position],
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
        {...props}
      >
        {/* Ripple effect */}
        <span className="absolute inset-0 overflow-hidden rounded-inherit">
          <motion.span
            className="absolute inset-0 bg-current opacity-0"
            initial={false}
            whileHover={{ opacity: 0.08 }}
            whileTap={{ opacity: 0.12 }}
          />
        </span>

        {/* FAB content */}
        <span className="relative flex items-center gap-inherit">
          {icon}
          {extended && (children as React.ReactNode)}
        </span>
      </motion.button>
    );
  }
);

MD3FAB.displayName = 'MD3FAB';

export default MD3FAB;
