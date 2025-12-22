'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TouchTargetProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  asChild?: boolean;
}

export function TouchTarget({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  asChild = false,
  ...props
}: TouchTargetProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'min-h-[44px] min-w-[44px] px-3 py-2 text-sm',
    md: 'min-h-[44px] min-w-[44px] px-4 py-2.5 text-base',
    lg: 'min-h-[48px] min-w-[48px] px-6 py-3 text-lg',
  };
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-[#2c6ecb]/30 dark:bg-indigo-500 dark:hover:bg-indigo-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`;
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      className: combinedClasses,
    } as any);
  }
  
  const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...buttonProps } = props;
  
  return (
    <motion.button
      className={combinedClasses}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...buttonProps}
    >
      {children}
    </motion.button>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
  children,
  label,
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'min-h-[44px] min-w-[44px] p-2',
    md: 'min-h-[44px] min-w-[44px] p-2.5',
    lg: 'min-h-[48px] min-w-[48px] p-3',
  };
  
  const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...buttonProps } = props;
  
  return (
    <motion.button
      className={`inline-flex items-center justify-center rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c6ecb]/30 ${sizeClasses[size]} ${className}`}
      aria-label={label}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...buttonProps}
    >
      {children}
    </motion.button>
  );
}
