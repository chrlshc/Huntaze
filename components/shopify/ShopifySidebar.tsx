'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  MessageSquare, 
  DollarSign, 
  BarChart, 
  Settings,
  Package,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ShopifySidebar = () => {
  const pathname = usePathname();
  
  const menuItems = [
    { 
      icon: Home, 
      label: 'Accueil', 
      path: '/dashboard',
      badge: null 
    },
    { 
      icon: Users, 
      label: 'Fans', 
      path: '/fans',
      badge: '2.4k' 
    },
    { 
      icon: MessageSquare, 
      label: 'Messages', 
      path: '/messages',
      badge: '12',
      badgeColor: 'red'
    },
    { 
      icon: DollarSign, 
      label: 'Revenus', 
      path: '/revenue',
      badge: null 
    },
    { 
      icon: BarChart, 
      label: 'Analytics', 
      path: '/analytics',
      badge: null 
    },
    { 
      icon: Package, 
      label: 'Produits', 
      path: '/products',
      badge: 'NEW',
      badgeColor: 'green'
    },
    { 
      icon: Settings, 
      label: 'Paramètres', 
      path: '/settings',
      badge: null 
    }
  ];

  return (
    <aside className="w-60 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Huntaze</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg",
                "transition-all duration-150 group",
                isActive 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"
                )} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              
              {item.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  item.badgeColor === 'red' 
                    ? "bg-red-100 text-red-700"
                    : item.badgeColor === 'green'
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Plan Section */}
      <div className="p-3 border-t border-gray-200">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Plan Basic</span>
            <span className="text-xs text-green-600 font-medium">3 jours d'essai</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '70%' }}></div>
          </div>
          <button className="w-full text-xs font-medium text-green-600 hover:text-green-700">
            Mettre à niveau →
          </button>
        </div>
      </div>
      
      {/* User Section */}
      <div className="p-3 border-t border-gray-200">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" 
            alt="Avatar"
            className="w-8 h-8 rounded-full bg-gray-200"
          />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900">Mon magasin</p>
            <p className="text-xs text-gray-500">admin@huntaze.com</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </aside>
  );
};