'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  loader?: ReactNode;
  endMessage?: ReactNode;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.8,
  loader,
  endMessage,
}: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return (
    <div>
      {children}
      
      {hasMore && (
        <div ref={observerTarget} className="py-4">
          {isLoading && (
            loader || (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            )
          )}
        </div>
      )}

      {!hasMore && endMessage && (
        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          {endMessage}
        </div>
      )}
    </div>
  );
}

export default InfiniteScroll;
