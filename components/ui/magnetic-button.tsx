'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ReactNode, MouseEvent } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function MagneticButton({ 
  children, 
  className = '', 
  onClick,
  variant = 'primary',
  size = 'md'
}: MagneticButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Spring physics configuration matching Linear
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Magnetic pull factor
    x.set((e.pageX - centerX) * 0.3);
    y.set((e.pageY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'glass-button bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700',
    secondary: 'glass-button bg-white/10 text-gray-900 dark:text-white hover:bg-white/20',
    ghost: 'text-gray-900 dark:text-white hover:bg-white/10'
  };

  return (
    <motion.button
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        relative overflow-hidden rounded-xl font-medium
        transition-all duration-300 ease-out
        transform-gpu
        ${className}
      `}
      whileTap={{ scale: 0.95 }}
    >
      {/* Hover gradient effect */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-r from-white/20 to-white/0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}