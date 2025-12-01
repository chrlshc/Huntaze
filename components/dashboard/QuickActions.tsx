'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Upload, MessageSquare, Settings } from 'lucide-react';

/**
 * QuickActions Component
 * 
 * Displays 3-4 action buttons with links and hover effects.
 * 
 * Requirements: 1.1
 */

interface ActionButton {
  label: string;
  href: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

interface QuickActionsProps {
  actions?: ActionButton[];
}

const defaultActions: ActionButton[] = [
  {
    label: 'Create Post',
    href: '/content/create',
    icon: <Plus className="w-5 h-5" />,
    variant: 'primary',
  },
  {
    label: 'Upload Media',
    href: '/content/media',
    icon: <Upload className="w-5 h-5" />,
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <div className="space-y-3">
      {actions.map((action, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link
            href={action.href}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg
              transition-colors duration-200
              ${
                action.variant === 'primary'
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm'
                  : 'bg-theme-surface border border-theme-border text-theme-text hover:border-indigo-500/50'
              }
            `}
          >
            <div
              className={`
                p-2 rounded-lg
                ${
                  action.variant === 'primary'
                    ? 'bg-white/20'
                    : 'bg-indigo-500/10 text-indigo-500'
                }
              `}
            >
              {action.icon}
            </div>
            <span className="font-medium">{action.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
