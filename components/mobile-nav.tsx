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

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', badge: '24' },
    { href: '/fans', icon: Users, label: 'Fans' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/menu', icon: Menu, label: 'More' }
  ];

  // Don't show on auth pages
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/onboarding')) {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
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
              className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}