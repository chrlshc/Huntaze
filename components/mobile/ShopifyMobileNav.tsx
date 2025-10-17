'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ShopifyMobileNav = () => {
  const pathname = usePathname();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: ShoppingBag, label: 'Orders', path: '/orders', badge: 3 },
    { icon: Heart, label: 'Saved', path: '/saved' },
    { icon: User, label: 'Account', path: '/account' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              <div className="relative">
                <Icon 
                  className={cn(
                    "w-6 h-6 mb-1",
                    isActive ? "text-green-600" : "text-gray-500"
                  )} 
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-green-600 text-white text-xs font-medium rounded-full flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs",
                isActive ? "text-green-600 font-medium" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};