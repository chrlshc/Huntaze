'use client';

import { lazy, Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Loading skeletons for different component types
function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded" />
    </div>
  );
}

function ImageSkeleton() {
  return (
    <div className="bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse aspect-square" />
  );
}

// Progressive Image Loading Component
export function ProgressiveImage({
  src,
  alt,
  placeholder,
  className = ''
}: {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}) {
  const [imgSrc, setImgSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInViewLocal({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px'
  });

  useEffect(() => {
    if (inView && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImgSrc(src);
        setIsLoaded(true);
      };
    }
  }, [inView, src]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {imgSrc ? (
        <motion.img
          src={imgSrc}
          alt={alt}
          className={`w-full h-full object-cover ${!isLoaded ? 'blur-sm' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0.7 }}
          transition={{ duration: 0.3 }}
        />
      ) : (
        <ImageSkeleton />
      )}
    </div>
  );
}

// Lazy Load Wrapper with Intersection Observer
export function LazyLoad({
  children,
  skeleton,
  offset = '100px',
  once = true
}: {
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  offset?: string;
  once?: boolean;
}) {
  const { ref, inView } = useInViewLocal({
    triggerOnce: once,
    threshold: 0,
    rootMargin: offset
  });

  return (
    <div ref={ref}>
      {inView ? children : (skeleton || <CardSkeleton />)}
    </div>
  );
}

// Dynamic imports with loading states
export const LazyAnalyticsChart = (props: any) => <ChartSkeleton />;

export const LazyMessageList = (props: any) => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const LazyFanGrid = (props: any) => (
  <div className="grid grid-cols-2 gap-4">
    {[...Array(6)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// Virtualized List for Large Datasets
export function VirtualizedList({
  items,
  renderItem,
  itemHeight,
  overscan = 3
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      className="relative overflow-auto"
      style={{ height: '100%' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      ref={(el) => {
        if (el) setContainerHeight(el.clientHeight);
      }}
    >
      <div style={{ height: totalHeight }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Prefetch Component on Hover/Focus
export function PrefetchLink({
  href,
  children,
  prefetchOn = 'hover'
}: {
  href: string;
  children: React.ReactNode;
  prefetchOn?: 'hover' | 'focus' | 'visible';
}) {
  const [isPrefetched, setIsPrefetched] = useState(false);
  const { ref, inView } = useInViewLocal({
    triggerOnce: true,
    rootMargin: '50px'
  });

  const prefetch = () => {
    if (!isPrefetched && href) {
      // Prefetch the route
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
      setIsPrefetched(true);
    }
  };

  useEffect(() => {
    if (prefetchOn === 'visible' && inView) {
      prefetch();
    }
  }, [inView, prefetchOn]);

  return (
    <a
      ref={ref}
      href={href}
      onMouseEnter={prefetchOn === 'hover' ? prefetch : undefined}
      onFocus={prefetchOn === 'focus' ? prefetch : undefined}
      className="cursor-pointer"
    >
      {children}
    </a>
  );
}

// Optimized Data Fetcher with SWR pattern
export function useOptimizedFetch(url: string, options?: RequestInit) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // Check cache first
        const cached = sessionStorage.getItem(url);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          // Use cache if less than 5 minutes old
          if (age < 5 * 60 * 1000) {
            setData(data);
            setIsLoading(false);
            
            // Still fetch in background to update cache
            fetch(url, options).then(res => res.json()).then(freshData => {
              if (!cancelled) {
                sessionStorage.setItem(url, JSON.stringify({
                  data: freshData,
                  timestamp: Date.now()
                }));
                setData(freshData);
              }
            });
            
            return;
          }
        }

        // Fetch fresh data
        const response = await fetch(url, options);
        const freshData = await response.json();
        
        if (!cancelled) {
          setData(freshData);
          sessionStorage.setItem(url, JSON.stringify({
            data: freshData,
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as any);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, error, isLoading };
}

// Bundle Splitting by Route
export const routeComponents = {
  '/dashboard': dynamic(() => import('@/app/dashboard/page'), {
    loading: () => <div className="p-4">Loading dashboard...</div>,
  }),
  '/messages': dynamic(() => import('@/app/messages/page'), {
    loading: () => <div className="p-4">Loading messages...</div>,
  }),
  '/analytics': dynamic(() => import('@/app/analytics/page'), {
    loading: () => <div className="p-4">Loading analytics...</div>,
  }),
  '/fans': dynamic(() => import('@/app/fans/page'), {
    loading: () => <div className="p-4">Loading fans...</div>,
  }),
};

// Optimized Mobile Navigation with Prefetch
export function OptimizedMobileNav() {
  const routes = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/messages', label: 'Messages', icon: '💬' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/fans', label: 'Fans', icon: '👥' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-bottom">
      <div className="grid grid-cols-4 gap-1">
        {routes.map((route) => (
          <PrefetchLink
            key={route.path}
            href={route.path}
            prefetchOn="visible"
          >
            <div className="flex flex-col items-center justify-center py-2 min-h-[56px]">
              <span className="text-2xl mb-1">{route.icon}</span>
              <span className="text-xs">{route.label}</span>
            </div>
          </PrefetchLink>
        ))}
      </div>
    </nav>
  );
}
// Lightweight in-view observer (no external dependency)
function useInViewLocal(options: { triggerOnce?: boolean; threshold?: number; rootMargin?: string } = {}) {
  const [inView, setInView] = useState(false);
  const ref = (node: Element | null) => {
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setInView(true);
        if (options.triggerOnce) observer.disconnect();
      } else if (!options.triggerOnce) {
        setInView(false);
      }
    }, {
      threshold: options.threshold ?? 0,
      rootMargin: options.rootMargin,
    });
    observer.observe(node);
  };
  return { ref, inView } as { ref: (node: Element | null) => void; inView: boolean };
}
