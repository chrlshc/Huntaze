'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface SimpleIntersectionObserverProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  onInView?: (isInView: boolean) => void;
}

export function SimpleIntersectionObserver({
  children,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  onInView,
}: SimpleIntersectionObserverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const inView = entry.isIntersecting;
          setIsInView(inView);
          
          if (inView && !hasAnimated) {
            setHasAnimated(true);
          }
          
          onInView?.(inView);
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasAnimated, onInView]);

  return (
    <div 
      ref={ref} 
      className={className}
      data-in-view={isInView}
      data-has-animated={hasAnimated}
    >
      {children}
    </div>
  );
}