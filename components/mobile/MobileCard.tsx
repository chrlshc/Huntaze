'use client';

import { useState, useRef } from 'react';
import { MoreVertical, Heart, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  swipeActions?: SwipeAction[];
  interactive?: boolean;
}

interface SwipeAction {
  icon: React.ElementType;
  label: string;
  color: string;
  action: () => void;
}

export function MobileCard({
  children,
  className,
  onPress,
  swipeActions,
  interactive = true
}: MobileCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div
      onClick={() => {
        if (onPress) {
          triggerHaptic();
          onPress();
        }
      }}
      onTouchStart={() => interactive && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={cn(
        "bg-white dark:bg-gray-900",
        "rounded-xl",
        "transition-all duration-200",
        interactive && "active:scale-[0.98]",
        isPressed && "shadow-sm",
        onPress && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// Instagram-style double tap component
interface DoubleTapProps {
  children: React.ReactNode;
  onDoubleTap: () => void;
  className?: string;
}

export function DoubleTap({ children, onDoubleTap, className }: DoubleTapProps) {
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);

  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;
    
    if (timeSinceLastTap < 300) {
      // Double tap detected
      onDoubleTap();
      setShowHeart(true);
      
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
      
      setTimeout(() => setShowHeart(false), 1000);
    }
    
    lastTap.current = now;
  };

  return (
    <div className={cn("relative", className)} onClick={handleTap}>
      {children}
      
      {/* Heart animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className={cn(
            "w-20 h-20 text-red-500 fill-current",
            "animate-in zoom-in-0 fade-in-0",
            "animate-out zoom-out-150 fade-out-0",
            "duration-700"
          )} />
        </div>
      )}
    </div>
  );
}

// Swipeable list item
interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
}

export function SwipeableItem({
  children,
  leftActions = [],
  rightActions = [],
  className
}: SwipeableItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX.current;
    
    // Limit swipe distance
    const maxSwipe = 100;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
    
    setSwipeX(limitedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // Snap back or trigger action
    if (Math.abs(swipeX) > 50) {
      // Trigger action
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
    
    setSwipeX(0);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div className="flex gap-2">
          {leftActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={action.action}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  action.color,
                  "transition-all duration-200",
                  swipeX > 50 ? "scale-100 opacity-100" : "scale-75 opacity-0"
                )}
              >
                <Icon className="w-6 h-6 text-white" />
              </button>
            );
          })}
        </div>
        
        <div className="flex gap-2">
          {rightActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={action.action}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  action.color,
                  "transition-all duration-200",
                  swipeX < -50 ? "scale-100 opacity-100" : "scale-75 opacity-0"
                )}
              >
                <Icon className="w-6 h-6 text-white" />
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Main content */}
      <div
        ref={itemRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
        }}
        className="relative bg-white dark:bg-gray-900"
      >
        {children}
      </div>
    </div>
  );
}

// Pull to refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  className
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY !== 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
      
      await onRefresh();
      
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn("relative", className)}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex justify-center",
          "transition-all duration-300",
          pullDistance > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{
          transform: `translateY(${pullDistance - 40}px)`,
        }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full bg-black dark:bg-white",
          "flex items-center justify-center",
          isRefreshing && "animate-spin"
        )}>
          <div className="w-6 h-6 border-2 border-white dark:border-black border-t-transparent rounded-full" />
        </div>
      </div>
      
      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Mobile list component
interface MobileListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export function MobileList({
  items,
  renderItem,
  onLoadMore,
  hasMore = false,
  className
}: MobileListProps) {
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, onLoadMore]);

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="animate-in slide-in-from-bottom-2 fade-in-0 duration-300"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {renderItem(item, index)}
        </div>
      ))}
      
      {hasMore && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}