'use client';

import Link from 'next/link';
import { MessageSquare, Megaphone, Upload, Sparkles, LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Send Message',
    description: 'Send a new message to subscribers',
    href: '/messages/new',
    icon: MessageSquare,
    color: 'bg-blue-500',
  },
  {
    label: 'Create Campaign',
    description: 'Launch a new marketing campaign',
    href: '/campaigns/new',
    icon: Megaphone,
    color: 'bg-purple-500',
  },
  {
    label: 'Upload Content',
    description: 'Add media to your library',
    href: '/content/upload',
    icon: Upload,
    color: 'bg-green-500',
  },
  {
    label: 'Generate Content',
    description: 'Use AI to create content',
    href: '/ai-content',
    icon: Sparkles,
    color: 'bg-yellow-500',
  },
];

export function QuickActions() {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        Quick Actions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-start space-x-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all group"
            >
              <div className={`p-2 rounded-lg ${action.color} text-white`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
