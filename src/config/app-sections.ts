import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BarChart3,
  Heart,
  Plug,
  Settings,
} from 'lucide-react';

export type AppSection = {
  label: string;
  href: string;
  icon: any;
  enabled?: boolean;
};

// Minimal, real features backed by auth/integrations
export const APP_SECTIONS: AppSection[] = [
  { label: 'Dashboard', href: '/app/app', icon: LayoutDashboard, enabled: true },
  { label: 'Messages', href: '/app/app/messages', icon: MessageSquare, enabled: true },
  { label: 'Fans', href: '/app/app/fans', icon: Users, enabled: true },
  { label: 'Analytics', href: '/app/app/analytics', icon: BarChart3, enabled: true },
  { label: 'OnlyFans', href: '/app/app/onlyfans/dashboard', icon: Heart, enabled: true },
  { label: 'Integrations', href: '/app/app/platforms/connect', icon: Plug, enabled: true },
  { label: 'Settings', href: '/app/app/settings/account', icon: Settings, enabled: true },
];

