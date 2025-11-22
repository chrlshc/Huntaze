/**
 * Loading Transition Component
 * 
 * **Feature: beta-launch-ui-system, Phase 7: Loading States & Responsive Design**
 * 
 * Provides smooth transitions between loading and loaded states with:
 * - Fade transitions
 * - Staggered animations
 * - Error state handling
 * - Accessibility features
 */

'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingTransitionProps {
  isLoading: boolean;
  error?: Error | null;
  skeleton?: ReactNode;
  children: ReactNode;
  className?: string;
  transition?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number;
  stagger?: boolean;
  staggerDelay?: number;
  fallbackSkeleton?: 'default' | 'card' | 'text' | 'table';
  onTransitionComplete?: () => void;
  'aria-label'?: string;
}

const LoadingTransition: React.FC<LoadingTransitionProps> = ({
  isLoading,
  error,
  skeleton,
  children,
  className = '',
  transition = 'fade',
  duration = 300,
  stagger = false,
  staggerDelay = 100,
  onTransitionComplete,
  'aria-label': ariaLabel = 'Content loading'
}) => {
  const [showContent, setShowContent] = useState(!isLoading);

  useEffect(() => {
    if (!isLoading && !error) {
      const timer = setTimeout(() => {
        setShowContent(true);
        onTransitionComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading, error, duration, onTransitionComplete]);

  const transitionVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    },
    none: {
      initial: {},
      animate: {},
      exit: {}
    }
  };

  const variants = transitionVariants[transition];

  // Error state
  if (error) {
    return (
      <motion.div
        className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading content
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={className} role="region" aria-label={ariaLabel}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            {...variants}
            transition={{ duration: duration / 1000 }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            {...variants}
            transition={{ 
              duration: duration / 1000,
              delay: stagger ? staggerDelay / 1000 : 0
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Specialized component for list items with staggered loading
export const StaggeredListTransition: React.FC<{
  isLoading: boolean;
  items: ReactNode[];
  skeleton?: ReactNode;
  staggerDelay?: number;
  className?: string;
}> = ({ isLoading, items, skeleton, staggerDelay = 100, className = '' }) => {
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {skeleton}
          </motion.div>
        ) : (
          <motion.div key="content">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * (staggerDelay / 1000) }}
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoadingTransition;
