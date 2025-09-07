'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface MD3ChipProps extends HTMLMotionProps<"div"> {
  variant?: 'assist' | 'filter' | 'input' | 'suggestion';
  selected?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onDelete?: () => void;
  onClick?: () => void;
}

const MD3Chip = forwardRef<HTMLDivElement, MD3ChipProps>(
  ({ 
    className,
    variant = 'assist',
    selected = false,
    leadingIcon,
    trailingIcon,
    onDelete,
    onClick,
    children,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer select-none';
    
    const variants = {
      assist: selected 
        ? 'bg-purple-100 text-purple-900 dark:bg-purple-800/30 dark:text-purple-100 border border-transparent'
        : 'bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
      filter: selected
        ? 'bg-purple-600 text-white border border-transparent'
        : 'bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
      input: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700',
      suggestion: 'bg-transparent text-purple-600 dark:text-purple-400 border border-purple-600 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10',
    };

    const handleClick = (e: React.MouseEvent) => {
      if (onClick && !onDelete) {
        onClick();
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete();
      }
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          className
        )}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{ 
          backgroundColor: selected ? undefined : undefined,
        }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {leadingIcon && (
          <span className="flex-shrink-0">
            {leadingIcon}
          </span>
        )}
        
        <span>{children as React.ReactNode}</span>
        
        {trailingIcon && !onDelete && (
          <span className="flex-shrink-0">
            {trailingIcon}
          </span>
        )}
        
        {onDelete && (
          <motion.button
            className="flex-shrink-0 -mr-1 ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            onClick={handleDelete}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-3 h-3" />
          </motion.button>
        )}
      </motion.div>
    );
  }
);

MD3Chip.displayName = 'MD3Chip';

export default MD3Chip;
