import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface HuntazeLayoutProps {
  children: React.ReactNode;
  title: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
}

// Navigation Huntaze avec les vraies sections
const navigation = [
  { name: 'Accueil', href: '/home', icon: '🏠' },
  { name: 'OnlyFans', href: '/onlyfans', icon: '🔥' },
  { name: 'Marketing', href: '/marketing', icon: '🎯' },
  { name: 'Analytics', href: '/analytics', icon: '📊' },
  { name: 'Création', href: '/content-creation', icon: '🎨' },
  { name: 'Assistant IA', href: '/ai-assistant', icon: '🤖' },
  { name: 'Paramètres', href: '/settings', icon: '⚙️' },
];

export function HuntazeLayout({ 
  children, 
  title, 
  primaryAction, 
  secondaryActions = [] 
}: HuntazeLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-slate-200">
            <Link href="/home" className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-slate-900">
                Huntaze
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href || 
                              (item.href !== '/home' && router.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-slate-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-slate-700">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  Créateur Pro
                </p>
                <p className="text-xs text-slate-500 truncate">
                  creator@huntaze.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar - Pattern Polaris : titre + action primaire */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Ouvrir le menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Page title - Pattern Polaris */}
              <h1 className="text-2xl font-bold text-slate-900">
                {title}
              </h1>
            </div>

            {/* Actions - Pattern Polaris : actions secondaires + 1 primaire */}
            <div className="flex items-center space-x-3">
              {secondaryActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.onClick}
                  asChild={!!action.href}
                >
                  {action.href ? (
                    <Link href={action.href}>{action.label}</Link>
                  ) : (
                    action.label
                  )}
                </Button>
              ))}
              
              {primaryAction && (
                <Button
                  onClick={primaryAction.onClick}
                  asChild={!!primaryAction.href}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {primaryAction.href ? (
                    <Link href={primaryAction.href}>{primaryAction.label}</Link>
                  ) : (
                    primaryAction.label
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Page content - Pattern Polaris : contenu en cards */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}