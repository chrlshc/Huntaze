'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User,
  CreditCard,
  Zap,
  Target,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Bell,
  Shield,
  Palette,
  Globe,
  FileText,
  Star
} from 'lucide-react';

export default function MenuPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', href: '/profile', badge: null },
        { icon: CreditCard, label: 'Billing & Credits', href: '/billing', badge: '2,450' },
        { icon: Shield, label: 'Privacy & Security', href: '/settings/privacy', badge: null }
      ]
    },
    {
      title: 'Features',
      items: [
        { icon: Zap, label: 'AI Automations', href: '/automations', badge: 'Active' },
        { icon: Target, label: 'Campaigns', href: '/campaigns', badge: null },
        { icon: BarChart3, label: 'Analytics', href: '/analytics', badge: null }
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Palette, label: 'Appearance', href: '/settings/appearance', badge: null },
        { icon: Globe, label: 'Language', href: '/settings/language', badge: 'English' },
        { icon: Bell, label: 'Notifications', href: '/settings/notifications', badge: notifications ? 'On' : 'Off' }
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', href: '/support', badge: null },
        { icon: FileText, label: 'Documentation', href: '/docs', badge: null },
        { icon: Star, label: 'Rate Us', href: '/rate', badge: null }
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">More</h1>
        </div>
      </header>

      {/* User Info */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src="https://ui-avatars.com/api/?name=User&background=gradient"
              alt="User"
              className="w-16 h-16 rounded-full"
            />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">Sarah Creator</h2>
              <p className="text-sm text-gray-600">@sarahcreator</p>
            </div>
            <Link href="/profile" className="p-2">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">$12.4k</p>
              <p className="text-xs text-gray-600">This Month</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-xs text-gray-600">Fans</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">89%</p>
              <p className="text-xs text-gray-600">AI Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="mt-4 space-y-4">
        {menuSections.map((section, index) => (
          <div key={index} className="bg-white">
            <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="divide-y divide-gray-100">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={itemIndex}
                    href={item.href}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-xl">
                        <Icon className="w-5 h-5 text-gray-700" />
                      </div>
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.badge === 'Active' ? 'bg-green-100 text-green-700' :
                          item.badge === 'On' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Dark Mode Toggle */}
      <div className="mt-4 bg-white">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl">
                {darkMode ? <Moon className="w-5 h-5 text-gray-700" /> : <Sun className="w-5 h-5 text-gray-700" />}
              </div>
              <span className="font-medium text-gray-900">Dark Mode</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-4 bg-white">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
        >
          <div className="p-2 bg-red-50 rounded-xl">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-medium">Log Out</span>
        </button>
      </div>

      {/* App Version */}
      <div className="mt-8 px-4 py-4 text-center">
        <p className="text-xs text-gray-500">Huntaze v2.0.0</p>
        <p className="text-xs text-gray-400 mt-1">© 2024 Huntaze. All rights reserved.</p>
      </div>
    </div>
  );
}