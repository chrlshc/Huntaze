'use client';

import { ReactNode } from 'react';
import { SimpleIntersectionObserver } from './SimpleIntersectionObserver';

interface SimpleLazyAnimationProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade' | 'slide' | 'scale';
  delay?: number;
  duration?: number;
}

export function SimpleLazyAnimation({
  children,
  className = '',
  animation = 'fade',
  delay = 0,
  duration = 0.5,
}: SimpleLazyAnimationProps) {
  const animationClass = `animate-${animation}`;
  const delayStyle = delay > 0 ? { animationDelay: `${delay}s` } : {};
  const durationStyle = { animationDuration: `${duration}s` };
  
  return (
    <SimpleIntersectionObserver 
      className={`${className} opacity-0`}
      rootMargin="50px"
    >
      <div 
        className={`${animationClass} gpu-accelerate`}
        style={{
          ...delayStyle,
          ...durationStyle,
          animationFillMode: 'forwards',
        }}
      >
        {children}
      </div>
    </SimpleIntersectionObserver>
  );
}