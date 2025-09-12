'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  MessageSquare,
  Users,
  BarChart3,
  Plus
} from 'lucide-react';
import { useSSECounter } from '@/src/hooks/useSSECounter';
import './nav-styles.css';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/messages', icon: MessageSquare, label: 'Messages', badge: true },
  { href: '/campaigns/new', icon: Plus, label: 'Create', isAction: true },
  { href: '/fans', icon: Users, label: 'Fans' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' }
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  
  // Check if we're in the app
  const isApp = pathname?.startsWith('/dashboard') || 
                pathname?.startsWith('/messages') || 
                pathname?.startsWith('/fans') || 
                pathname?.startsWith('/analytics') ||
                pathname?.startsWith('/campaigns');

  const unreadCount = useSSECounter({
    url: '/api/messages/unread-count?sse=1',
    eventName: 'unread'
  });

  if (!isApp) return null;

  return (
    <nav className="bottom-nav lg:hidden" aria-label="Mobile navigation">
      <div className="bottom-nav-content">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
                          (item.href !== '/campaigns/new' && pathname?.startsWith(item.href));
          
          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bottom-nav-item"
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className="bottom-nav-item-icon" aria-hidden="true" />
                {item.badge && unreadCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] text-white bg-danger rounded-full text-center"
                    suppressHydrationWarning
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="bottom-nav-item-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}