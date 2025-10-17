'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, MoreVertical, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showMenu?: boolean;
  transparent?: boolean;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title = 'Huntaze',
  showBack = false,
  showSearch = true,
  showMenu = true,
  transparent = false,
  onSearch,
  actions,
  className
}: MobileHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-40",
        "transition-all duration-300",
        "pt-safe", // iOS safe area
        transparent && !scrolled
          ? "bg-transparent"
          : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800",
        scrolled && "shadow-sm",
        className
      )}>
        <div className="flex flex-col gap-2 py-2">
          {/* Top row with title and actions */}
          <div className="flex items-center justify-between px-4">
            {/* Left side */}
            <div className="flex items-center gap-2">
              {showBack && (
                <button
                  onClick={() => {
                    triggerHaptic();
                    router.back();
                  }}
                  className={cn(
                    "p-2 -ml-2 rounded-full",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "active:scale-95 transition-all"
                  )}
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              
              <h1 className={cn(
                "text-lg font-semibold truncate",
                "transition-all duration-300",
                scrolled ? "text-base" : "text-lg"
              )}>
                {title}
              </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1">
              {actions}
              
              {showMenu && (
                <button
                  onClick={triggerHaptic}
                  className={cn(
                    "p-2 rounded-full",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "active:scale-95 transition-all"
                  )}
                  aria-label="Menu"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Permanent search bar */}
          {showSearch && (
            <div className="px-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={cn(
                    "w-full h-10 pl-10 pr-4",
                    "bg-gray-100 dark:bg-gray-800",
                    "rounded-full",
                    "text-sm",
                    "outline-none",
                    "placeholder:text-gray-500",
                    "focus:ring-2 focus:ring-primary/20"
                  )}
                />
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Spacer */}
      {!transparent && <div className={cn(showSearch ? "h-24" : "h-14", "pt-safe")} />}
    </>
  );
}

// Collapsible header variant
interface CollapsibleHeaderProps extends MobileHeaderProps {
  expandedContent?: React.ReactNode;
  collapsedHeight?: number;
  expandedHeight?: number;
}

export function CollapsibleHeader({
  expandedContent,
  collapsedHeight = 96,
  expandedHeight = 240,
  ...props
}: CollapsibleHeaderProps) {
  const [expanded, setExpanded] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > expandedHeight) {
        setExpanded(false);
      } else if (currentScrollY < lastScrollY) {
        setExpanded(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, expandedHeight]);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40",
      "bg-white dark:bg-gray-900",
      "transition-all duration-500 ease-out",
      "overflow-hidden",
      "pt-safe"
    )}
    style={{
      height: expanded ? `${expandedHeight}px` : `${collapsedHeight}px`
    }}>
      <MobileHeader {...props} transparent />
      
      {expandedContent && (
        <div className={cn(
          "px-4 pb-4",
          "transition-all duration-500",
          expanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        )}>
          {expandedContent}
        </div>
      )}
    </header>
  );
}