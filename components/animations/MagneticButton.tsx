'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  magneticIntensity?: number;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  onClick,
  disabled = false,
  magneticIntensity = 0.3
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Spring animations for smooth movement
  const springConfig = { damping: 30, stiffness: 300 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);
  const scale = useSpring(1, springConfig);

  // Transform for 3D rotation effect
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered || !buttonRef.current || disabled) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      // Calculate magnetic effect based on distance
      const maxDistance = 100;
      const percentX = Math.min(Math.max(distanceX / maxDistance, -1), 1);
      const percentY = Math.min(Math.max(distanceY / maxDistance, -1), 1);

      x.set(percentX * 20 * magneticIntensity);
      y.set(percentY * 20 * magneticIntensity);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
      scale.set(1);
    };

    if (isHovered) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHovered, x, y, scale, magneticIntensity, disabled]);

  // Style variants
  const variants = {
    primary: `
      bg-gradient-to-r from-purple-500 to-pink-500 text-white
      shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40
      border-0
    `,
    secondary: `
      bg-white/10 text-white backdrop-blur-md
      border border-white/20 hover:border-white/40
      hover:bg-white/20
    `,
    ghost: `
      bg-transparent text-white
      border-2 border-transparent hover:border-white/20
      hover:bg-white/5
    `
  };

  // Size classes
  const sizes = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  // Ripple effect on click
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onClick?.();
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${className}
        relative overflow-hidden rounded-xl font-medium
        transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        transform-gpu perspective-1000
        ripple-button
      `}
      style={{
        x,
        y,
        rotateX,
        rotateY,
        scale
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        scale.set(1.05);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        scale.set(1);
        x.set(0);
        y.set(0);
      }}
      onMouseDown={() => {
        setIsPressed(true);
        scale.set(0.95);
      }}
      onMouseUp={() => {
        setIsPressed(false);
        scale.set(isHovered ? 1.05 : 1);
      }}
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
    >
      {/* Gradient overlay for hover effect */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-t from-white/20 to-transparent"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.7) 50%, transparent 60%)',
        }}
        animate={{
          opacity: [0, 1, 0],
          translateX: ['-100%', '100%'],
          translateY: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut'
        }}
      />

      <style jsx>{`
        .ripple-button {
          position: relative;
        }

        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: scale(0);
          animation: ripple-animation 0.6s ease-out;
          pointer-events: none;
        }

        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </motion.button>
  );
};

// Export specific button variants for convenience
export const PrimaryButton: React.FC<Omit<MagneticButtonProps, 'variant'>> = (props) => (
  <MagneticButton variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<MagneticButtonProps, 'variant'>> = (props) => (
  <MagneticButton variant="secondary" {...props} />
);

export const GhostButton: React.FC<Omit<MagneticButtonProps, 'variant'>> = (props) => (
  <MagneticButton variant="ghost" {...props} />
);

export default MagneticButton;