'use client';

/**
 * ScrollReveal Component
 * 
 * Animates elements when they enter the viewport using whileInView.
 * Requirements: 4.7
 */

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  /**
   * Animation direction
   */
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  /**
   * Animation delay in seconds
   */
  delay?: number;
  /**
   * Animation duration in seconds
   */
  duration?: number;
  /**
   * Amount of element that must be visible (0-1)
   */
  amount?: number;
  /**
   * Only animate once
   */
  once?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const directionVariants: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  amount = 0.3,
  once = true,
  className = '',
}: ScrollRevealProps) {
  const variants = directionVariants[direction];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ScrollRevealListProps {
  children: ReactNode[];
  /**
   * Animation direction
   */
  direction?: 'up' | 'down' | 'left' | 'right';
  /**
   * Stagger delay between items in seconds
   */
  staggerDelay?: number;
  /**
   * Animation duration in seconds
   */
  duration?: number;
  /**
   * Amount of element that must be visible (0-1)
   */
  amount?: number;
  /**
   * Only animate once
   */
  once?: boolean;
  /**
   * Additional CSS classes for container
   */
  className?: string;
  /**
   * Additional CSS classes for items
   */
  itemClassName?: string;
}

/**
 * ScrollReveal for lists with stagger effect
 */
export function ScrollRevealList({
  children,
  direction = 'up',
  staggerDelay = 0.1,
  duration = 0.6,
  amount = 0.2,
  once = true,
  className = '',
  itemClassName = '',
}: ScrollRevealListProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {}
  };

  const itemVariants = directionVariants[direction];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={containerVariants}
      className={className}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          transition={{
            duration,
            ease: 'easeOut',
          }}
          className={itemClassName}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

interface ScrollRevealScaleProps {
  children: ReactNode;
  /**
   * Animation delay in seconds
   */
  delay?: number;
  /**
   * Animation duration in seconds
   */
  duration?: number;
  /**
   * Amount of element that must be visible (0-1)
   */
  amount?: number;
  /**
   * Only animate once
   */
  once?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ScrollReveal with scale effect
 */
export function ScrollRevealScale({
  children,
  delay = 0,
  duration = 0.6,
  amount = 0.3,
  once = true,
  className = '',
}: ScrollRevealScaleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
