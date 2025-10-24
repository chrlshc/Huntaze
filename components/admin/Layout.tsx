'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode[];
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Inbox', href: '/inbox', icon: '📬' },
  { name: 'OnlyFans', href: '/onlyfans', icon: '🔥' },
  { name: 'Marketing', href: '/marketing', icon: '🎯' },
  { name: 'Analytics', href: '/analytics', icon: '📊' },
  { name: 'Création', href: '/content-creation', icon: '🎨' },
  { name: 'Assistant IA', href: '/ai-assistant', icon: '🤖' },
];

function Layout({ 
  children, 
  title, 
  primaryAction, 
  secondaryActions = [] 
}: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 bg-slate-900">
          <h1 className="text-xl font-bold text-white">Huntaze</h1>
        </div>
        
        <nav className="mt-8">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-slate-100 text-slate-900 border-r-2 border-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {title && (
                <h1 className="ml-4 text-2xl font-semibold text-slate-900 lg:ml-0">
                  {title}
                </h1>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {secondaryActions.map((action, index) => (
                <div key={index}>{action}</div>
              ))}
              {primaryAction}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
// Export both default and named export for compatibility
export default Layout;
export { Layout as AdminLayout };