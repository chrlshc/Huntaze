'use client';

import { useState, useRef, useEffect, type ComponentProps } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount] = useState(3); // Placeholder - will be dynamic later
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Placeholder notifications
  const notifications = [
    { id: 1, title: 'New message from fan', time: '5 min ago', unread: true },
    { id: 2, title: 'Revenue milestone reached', time: '1 hour ago', unread: true },
    { id: 3, title: 'New subscriber', time: '2 hours ago', unread: true },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        onClick={() => setIsOpen(!isOpen)} 
        type="button" 
        aria-label="Notifications" 
        aria-expanded={isOpen}
        className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
</Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <Button variant="primary" type="button" className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400">
                Mark all read
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start gap-3">
                    {notification.unread && (
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-purple-600" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{notification.title}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <Button variant="primary" type="button" className="w-full text-center text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400">
              View all notifications
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function BellIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}
