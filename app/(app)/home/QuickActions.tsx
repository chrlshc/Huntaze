import Link from 'next/link';
import { MessageSquare, Users, BarChart3, Settings, Zap, Calendar } from 'lucide-react';
import './quick-actions.css';

/**
 * QuickActions Component
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * 
 * Displays a grid of action buttons for quick access to common tasks.
 * Each button includes an icon, label, and hover effects.
 */

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    href: '/messages',
    description: 'View and respond to messages'
  },
  {
    id: 'fans',
    label: 'Fans',
    icon: Users,
    href: '/fans',
    description: 'Manage your fan relationships'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    description: 'View performance insights'
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: Calendar,
    href: '/schedule',
    description: 'Plan your content calendar'
  },
  {
    id: 'automations',
    label: 'Automations',
    icon: Zap,
    href: '/automations',
    description: 'Set up automated workflows'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    description: 'Configure your account'
  }
];

export function QuickActions() {
  return (
    <section className="quick-actions-section">
      <h2 className="quick-actions-title">Quick Actions</h2>
      
      <div className="quick-actions-grid">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          
          return (
            <Link
              key={action.id}
              href={action.href}
              className="quick-action-button"
              aria-label={`${action.label}: ${action.description}`}
            >
              <div className="quick-action-icon">
                <Icon className="icon" />
              </div>
              <div className="quick-action-content">
                <span className="quick-action-label">{action.label}</span>
                <span className="quick-action-description">{action.description}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
