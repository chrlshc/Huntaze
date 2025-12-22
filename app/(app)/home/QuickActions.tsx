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
    id: 'connect-platforms',
    label: 'Connect your platforms',
    icon: Zap,
    href: '/integrations',
    description: 'Link OnlyFans, Instagram, TikTok and more.'
  },
  {
    id: 'enable-assistant',
    label: 'Turn on AI assistant',
    icon: MessageSquare,
    href: '/onlyfans-assisted',
    description: 'Let Huntaze handle repetitive messages for you.'
  },
  {
    id: 'import-fans',
    label: 'Import your fans',
    icon: Users,
    href: '/fans',
    description: 'Centralize fan data and see who your VIPs are.'
  },
  {
    id: 'plan-content',
    label: 'Plan your content',
    icon: Calendar,
    href: '/marketing/calendar',
    description: 'Map out launches and promos across platforms.'
  },
  {
    id: 'review-analytics',
    label: 'Review your analytics',
    icon: BarChart3,
    href: '/analytics',
    description: 'Understand revenue, growth, and retention trends.'
  },
  {
    id: 'configure-account',
    label: 'Finish account setup',
    icon: Settings,
    href: '/settings',
    description: 'Update profile, team access, and notifications.'
  }
];

export function QuickActions() {
  return (
    <section className="quick-actions-section">
      <h2 className="quick-actions-title">Get set up</h2>
      
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
