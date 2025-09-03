'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  MessageSquare,
  Users,
  BarChart3,
  Menu
} from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', badge: '24' },
    { href: '/fans', icon: Users, label: 'Fans' },
    { href: '/analytics', icon: BarChart3, label: 'Stats' },
    { href: '/menu', icon: Menu, label: 'More' }
  ];

  // Don't show on auth pages or onboarding
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/onboarding')) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden */}
      <div className="h-16 lg:hidden" />
      
      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/90 supports-[backdrop-filter]:bg-white/80 border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href === '/dashboard' && pathname === '/') ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 touch-target ${
                  isActive ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] px-1 py-0.5 text-[10px] font-bold text-white bg-red-600 rounded-full flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-purple-600 rounded-full animate-fade-in" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
