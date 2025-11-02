/**
 * Reusable Stagger Animation Variants
 * 
 * Provides consistent stagger animations across the application.
 * Requirements: 4.4
 */

import { Variants } from 'framer-motion';

/**
 * Standard stagger container with 100ms delay between children
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 100ms delay
      delayChildren: 0.05,
    },
  },
};

/**
 * Fast stagger for quick lists (60ms delay)
 */
export const fastStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06, // 60ms delay
    },
  },
};

/**
 * Slow stagger for dramatic effect (150ms delay)
 */
export const slowStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // 150ms delay
      delayChildren: 0.1,
    },
  },
};

/**
 * Standard fade-up item animation
 */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

/**
 * Subtle fade-up for compact lists
 */
export const subtleFadeUpItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Fade-in from left
 */
export const fadeInLeftItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

/**
 * Fade-in from right
 */
export const fadeInRightItem: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

/**
 * Scale and fade item
 */
export const scaleItem: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Grid stagger - for grid layouts
 */
export const gridStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};
