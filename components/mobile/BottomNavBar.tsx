'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  TrendingUp, 
  MessageSquare, 
  PlusCircle,
  User,
  BarChart3,
  Bell,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: PlusCircle, label: 'Create', href: '/create' },
  { icon: MessageSquare, label: 'Messages', href: '/messages', badge: 3 },
  { icon: User, label: 'Profile', href: '/profile' }
];

export function BottomNavBar() {
  const pathname = usePathname();
  const [showLabels, setShowLabels] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide labels when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY) {
        setShowLabels(false);
      } else {
        setShowLabels(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Haptic feedback function (works on supported devices)
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg",
      "border-t border-gray-200 dark:border-gray-800",
      "transition-all duration-300 ease-out",
      "pb-safe" // For iOS safe area
    )}>
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={triggerHaptic}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "min-w-[64px] py-2 px-3",
                "transition-all duration-200",
                "group"
              )}
            >
              {/* Icon container with active state */}
              <div className={cn(
                "relative p-1 rounded-full",
                "transition-all duration-200",
                active && "bg-black dark:bg-white"
              )}>
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-all duration-200",
                    active 
                      ? "text-white dark:text-black" 
                      : "text-gray-600 dark:text-gray-400 group-active:scale-95"
                  )}
                />
                
                {/* Badge */}
                {item.badge && (
                  <span className={cn(
                    "absolute -top-1 -right-1",
                    "bg-red-500 text-white",
                    "text-xs font-bold",
                    "w-5 h-5 rounded-full",
                    "flex items-center justify-center",
                    "animate-pulse"
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
              
              {/* Label with slide animation */}
              <span className={cn(
                "text-xs font-medium mt-1",
                "transition-all duration-300",
                active 
                  ? "text-black dark:text-white" 
                  : "text-gray-600 dark:text-gray-400",
                showLabels 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 -translate-y-2"
              )}>
                {item.label}
              </span>
              
              {/* Active indicator dot */}
              {active && (
                <div className={cn(
                  "absolute -bottom-0.5 left-1/2 -translate-x-1/2",
                  "w-1 h-1 bg-black dark:bg-white rounded-full",
                  "animate-in fade-in-0 zoom-in-50 duration-200"
                )} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Quick Action FAB variant
export function QuickActionFAB() {
  const [isOpen, setIsOpen] = useState(false);
  
  const actions = [
    { icon: MessageSquare, label: 'New Message', color: 'bg-blue-500' },
    { icon: TrendingUp, label: 'Boost Post', color: 'bg-green-500' },
    { icon: Bell, label: 'Schedule', color: 'bg-purple-500' },
  ];

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10]);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Action buttons */}
      <div className={cn(
        "absolute bottom-16 right-0",
        "flex flex-col gap-3",
        "transition-all duration-300",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => {
                triggerHaptic();
                setIsOpen(false);
              }}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                "bg-white dark:bg-gray-800 rounded-full shadow-lg",
                "transform transition-all duration-300",
                "hover:scale-105 active:scale-95",
                isOpen ? "translate-x-0" : "translate-x-full"
              )}
            >
              <span className="text-sm font-medium whitespace-nowrap">
                {action.label}
              </span>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                action.color
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          triggerHaptic();
        }}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg",
          "bg-black dark:bg-white",
          "flex items-center justify-center",
          "transform transition-all duration-300",
          "hover:scale-110 active:scale-95",
          isOpen && "rotate-45"
        )}
      >
        <PlusCircle className={cn(
          "w-7 h-7",
          "text-white dark:text-black",
          "transition-transform duration-300"
        )} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}