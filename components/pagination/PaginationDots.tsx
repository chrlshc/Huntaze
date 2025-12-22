'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/pagination-dots.module.css';

interface PaginationDotsProps {
  count: number;
  activeIndex: number;
  onChange?: (index: number) => void;
  className?: string;
}

export function PaginationDots({
  count,
  activeIndex,
  onChange,
  className = '',
}: PaginationDotsProps) {
  const [currentIndex, setCurrentIndex] = useState(activeIndex);

  useEffect(() => {
    setCurrentIndex(activeIndex);
  }, [activeIndex]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    if (onChange) {
      onChange(index);
    }
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          className={`relative w-8 h-8 rounded-full flex items-center justify-center ${
            index === currentIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-[#0e1a33] dark:bg-gray-800'
          }`}
          onClick={() => handleDotClick(index)}
          aria-label={`Go to slide ${index + 1}`}
        >
          <span 
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white`}
          />
        </button>
      ))}
    </div>
  );
}
