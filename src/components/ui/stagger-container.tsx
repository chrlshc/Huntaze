'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
  animateOnce?: boolean;
}

// Premium easing curves following Linear's style
const easings = {
  smooth: [0.25, 1, 0.5, 1],
  exponential: [0.19, 1, 0.22, 1],
  spring: { type: 'spring', bounce: 0.3, duration: 0.6 }
} as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.8,
    filter: 'blur(10px)'
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: 'blur(0px)',
    transition: easings.spring
  }
};

export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 0.1,
  delayChildren = 0.2,
  animateOnce = true
}: StaggerContainerProps) {
  const customContainerVariants = {
    ...containerVariants,
    visible: {
      ...containerVariants.visible,
      transition: {
        delayChildren,
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      variants={customContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: animateOnce, margin: "-10%" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item component
export function StaggerItem({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// List stagger animation
export function StaggerList({ 
  items,
  className = '',
  itemClassName = '',
  renderItem
}: {
  items: any[];
  className?: string;
  itemClassName?: string;
  renderItem: (item: any, index: number) => ReactNode;
}) {
  return (
    <StaggerContainer className={className}>
      {items.map((item, index) => (
        <StaggerItem key={index} className={itemClassName}>
          {renderItem(item, index)}
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}