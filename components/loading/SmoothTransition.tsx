/**
 * Smooth Transition Component
 * 
 * **Feature: performance-optimization-aws, Task 7**
 * Provides smooth transitions without layout shifts
 */

import React, { useEffect, useState, useRef } from 'react';

interface SmoothTransitionProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  minHeight?: string | number;
  className?: string;
}

export const SmoothTransition: React.FC<SmoothTransitionProps> = ({
  isLoading,
  skeleton,
  children,
  minHeight,
  className = ''
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>();

  // Measure content height to prevent layout shift
  useEffect(() => {
    if (contentRef.current && !isLoading) {
      setContentHeight(contentRef.current.offsetHeight);
    }
  }, [children, isLoading]);

  const style: React.CSSProperties = {
    minHeight: minHeight || (contentHeight ? `${contentHeight}px` : undefined),
    transition: 'opacity 200ms ease-in-out'
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {isLoading ? (
        <div className="animate-fadeIn">{skeleton}</div>
      ) : (
        <div 
          ref={contentRef}
          className="animate-fadeIn"
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default SmoothTransition;
