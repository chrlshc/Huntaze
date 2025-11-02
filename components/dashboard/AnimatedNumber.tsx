'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

/**
 * AnimatedNumber Component
 * 
 * Animates a number from a starting value to an ending value.
 * Uses Framer Motion's animate() function for smooth transitions.
 * 
 * Requirements: 1.3
 */

interface AnimatedNumberProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function AnimatedNumber({
  from = 0,
  to,
  duration = 1.2,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedNumberProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration,
      onUpdate(value) {
        node.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      },
    });

    return () => controls.stop();
  }, [from, to, duration, prefix, suffix, decimals]);

  return <span ref={nodeRef} className={className} />;
}
