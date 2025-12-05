'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  X, 
  Send, 
  DollarSign, 
  Calendar, 
  Bot,
  MessageSquare,
  Image,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
  description?: string;
}

export interface QuickActionsFABProps {
  actions?: QuickAction[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
  onActionTriggered?: (actionId: string) => void;
  showShortcutHints?: boolean;
  mobileBreakpoint?: number;
}

// Default quick actions
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { 
    id: 'new-message', 
    label: 'New Message', 
    icon: Send, 
    shortcut: 'Ctrl+M',
    description: 'Send a new message to a fan',
    action: () => console.log('New message')
  },
  { 
    id: 'create-ppv', 
    label: 'Create PPV', 
    icon: DollarSign, 
    shortcut: 'Ctrl+P',
    description: 'Create pay-per-view content',
    action: () => console.log('Create PPV')
  },
  { 
    id: 'schedule-post', 
    label: 'Schedule Post', 
    icon: Calendar, 
    shortcut: 'Ctrl+S',
    description: 'Schedule content for later',
    action: () => console.log('Schedule post')
  },
  { 
    id: 'ai-chat', 
    label: 'AI Chat', 
    icon: Bot, 
    shortcut: 'Ctrl+/',
    description: 'Open AI assistant',
    action: () => console.log('AI Chat')
  }
];

// Minimum touch target size (44px as per WCAG guidelines)
export const MIN_TOUCH_TARGET_SIZE = 44;

export function QuickActionsFAB({
  actions = DEFAULT_QUICK_ACTIONS,
  position = 'bottom-right',
  className,
  onActionTriggered,
  showShortcutHints = true,
  mobileBreakpoint = 768
}: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for Ctrl/Cmd key combinations
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      
      const actionMap: Record<string, string> = {
        'm': 'new-message',
        'p': 'create-ppv',
        's': 'schedule-post',
        '/': 'ai-chat'
      };

      const actionId = actionMap[key];
      if (actionId) {
        event.preventDefault();
        const action = actions.find(a => a.id === actionId);
        if (action) {
          action.action();
          onActionTriggered?.(actionId);
        }
      }
    }

    // Close on Escape
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [actions, isOpen, onActionTriggered]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle action click
  const handleActionClick = (action: QuickAction) => {
    action.action();
    onActionTriggered?.(action.id);
    setIsOpen(false);
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'right-4 bottom-4 md:right-6 md:bottom-6',
    'bottom-left': 'left-4 bottom-4 md:left-6 md:bottom-6',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-4 md:bottom-6'
  };

  return (
    <>
      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB Container */}
      <div 
        className={cn(
          'fixed z-50',
          positionClasses[position],
          className
        )}
        data-testid="quick-actions-fab"
        role="group"
        aria-label="Quick actions"
      >
        {/* Action buttons (shown when expanded) */}
        <div 
          className={cn(
            'flex flex-col-reverse gap-3 mb-3 transition-all duration-200',
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={cn(
                  'flex items-center gap-3 bg-white dark:bg-gray-800',
                  'rounded-full shadow-lg hover:shadow-xl',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'group'
                )}
                style={{
                  minWidth: MIN_TOUCH_TARGET_SIZE,
                  minHeight: MIN_TOUCH_TARGET_SIZE,
                  transitionDelay: `${index * 50}ms`
                }}
                aria-label={action.label}
                title={action.description}
                data-testid={`quick-action-${action.id}`}
              >
                {/* Label (hidden on mobile, shown on hover on desktop) */}
                <span 
                  className={cn(
                    'pl-4 pr-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-200',
                    'whitespace-nowrap',
                    isMobile ? 'block' : 'hidden group-hover:block'
                  )}
                >
                  {action.label}
                  {showShortcutHints && action.shortcut && !isMobile && (
                    <span className="ml-2 text-xs text-gray-400">
                      {action.shortcut}
                    </span>
                  )}
                </span>
                
                {/* Icon */}
                <span 
                  className={cn(
                    'flex items-center justify-center',
                    'w-11 h-11 rounded-full',
                    'bg-primary/10 text-primary',
                    'group-hover:bg-primary group-hover:text-white',
                    'transition-colors'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </span>
              </button>
            );
          })}
        </div>

        {/* Main FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center justify-center',
            'w-14 h-14 rounded-full',
            'bg-primary text-white',
            'shadow-lg hover:shadow-xl',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            isOpen && 'rotate-45'
          )}
          style={{
            minWidth: MIN_TOUCH_TARGET_SIZE,
            minHeight: MIN_TOUCH_TARGET_SIZE
          }}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
          data-testid="fab-toggle"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </button>
      </div>
    </>
  );
}

// Mobile Bottom Navigation variant
export interface MobileBottomNavProps {
  actions?: QuickAction[];
  className?: string;
  onActionTriggered?: (actionId: string) => void;
}

export function MobileBottomNav({
  actions = DEFAULT_QUICK_ACTIONS.slice(0, 4),
  className,
  onActionTriggered
}: MobileBottomNavProps) {
  const handleActionClick = (action: QuickAction) => {
    action.action();
    onActionTriggered?.(action.id);
  };

  return (
    <nav 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800',
        'safe-area-inset-bottom',
        'md:hidden', // Only show on mobile
        className
      )}
      data-testid="mobile-bottom-nav"
      role="navigation"
      aria-label="Quick actions navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex flex-col items-center justify-center',
                'py-2 px-3',
                'text-gray-600 dark:text-gray-400',
                'hover:text-primary dark:hover:text-primary',
                'transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset'
              )}
              style={{
                minWidth: MIN_TOUCH_TARGET_SIZE,
                minHeight: MIN_TOUCH_TARGET_SIZE
              }}
              aria-label={action.label}
              data-testid={`mobile-nav-${action.id}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        const handler = shortcuts[key];
        if (handler) {
          event.preventDefault();
          handler();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export default QuickActionsFAB;
