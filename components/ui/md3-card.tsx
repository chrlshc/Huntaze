'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MD3CardProps extends HTMLMotionProps<"div"> {
  variant?: 'elevated' | 'filled' | 'outlined';
  interactive?: boolean;
}

const MD3Card = forwardRef<HTMLDivElement, MD3CardProps>(
  ({ className, variant = 'elevated', interactive = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl transition-all';
    
    const variants = {
      elevated: 'bg-white dark:bg-gray-900 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-800',
      filled: 'bg-purple-50 dark:bg-purple-900/20',
      outlined: 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700',
    };

    const interactiveStyles = interactive ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : '';

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          interactiveStyles,
          className
        )}
        whileHover={interactive ? { y: -2 } : {}}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MD3Card.displayName = 'MD3Card';

export default MD3Card;