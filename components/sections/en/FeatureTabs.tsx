'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, BarChart3, CreditCard, Bot, Shield, Users } from 'lucide-react';
// Removed SafeMockup import - using simple divs instead

type FeatureKey = 'inbox' | 'analytics' | 'payments' | 'ai' | 'security' | 'collab';

const FEATURES: Record<FeatureKey, { title: string; desc: string; bullets: string[]; icon: any; color: string }[]> = {
  inbox: [{
    title: 'Unified Inbox',
    desc: 'Instagram, TikTok and OnlyFans in one place. Reply 2× faster and never miss a sale.',
    bullets: [
      'Auto‑prioritization of high‑value conversations',
      'One‑click AI snippets and templates',
      'Team assignments and internal notes'
    ],
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-500'
  }],
  analytics: [{
    title: 'Revenue Analytics',
    desc: 'Know what actually grows revenue and where to invest your time.',
    bullets: [
      'LTV, retention, ARPU by segment',
      'Cohorts by campaign and platform',
      'Smart alerts when a metric dips'
    ],
    icon: BarChart3,
    color: 'from-green-500 to-emerald-500'
  }],
  payments: [{
    title: 'Payments & Offers',
    desc: 'Launch targeted offers and track conversion in real time.',
    bullets: [
      'Dynamic bundles and PPV',
      'Promo codes and campaigns',
      'Cross‑platform revenue dashboard'
    ],
    icon: CreditCard,
    color: 'from-blue-500 to-cyan-500'
  }],
  ai: [{
    title: 'AI Assistant',
    desc: 'Natural responses, contextual upsell and 24/7 messaging — in your own tone.',
    bullets: [
      'Fine‑tuned from your history',
      'Safety: optional review before sending',
      'Intent detection and opportunity tracking'
    ],
    icon: Bot,
    color: 'from-amber-500 to-orange-500'
  }],
  security: [{
    title: 'Security & Compliance',
    desc: 'Encryption, roles & permissions, access audit. Your business stays safe.',
    bullets: [
      'Encryption at rest and in transit',
      'Agency SSO and 2FA',
      'Compliant audit trail'
    ],
    icon: Shield,
    color: 'from-indigo-500 to-sky-500'
  }],
  collab: [{
    title: 'Collaboration',
    desc: 'Work together without friction — clear roles, shared content, maximum productivity.',
    bullets: [
      'Granular roles (Creator, Manager, Assistant)',
      'Content library and approvals',
      'Comments and tasks on conversations'
    ],
    icon: Users,
    color: 'from-fuchsia-500 to-rose-500'
  }],
};

const ORDER: FeatureKey[] = ['inbox', 'analytics', 'payments', 'ai', 'security', 'collab'];

function MockupContent({ type }: { type: FeatureKey }) {
  switch (type) {
    case 'inbox':
      return (
        <>
          <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900">Sarah Johnson</div>
                <div className="text-xs text-gray-500">Instagram • 2m ago</div>
              </div>
              <div className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">VIP</div>
            </div>
            <div className="text-sm text-gray-700">Hey! I'm interested in your exclusive content...</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-pink-100" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900">Mike Chen</div>
                <div className="text-xs text-gray-500">TikTok • 5m ago</div>
              </div>
            </div>
            <div className="text-sm text-gray-700">Just subscribed! Can't wait to see more...</div>
          </div>
        </>
      );
    case 'analytics':
      return (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Dashboard</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Monthly Revenue</div>
                <div className="text-2xl font-bold text-gray-900">$24,847</div>
                <div className="text-xs text-green-600 mt-1">↑ 23.5%</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Active Subscribers</div>
                <div className="text-2xl font-bold text-gray-900">2,341</div>
                <div className="text-xs text-green-600 mt-1">↑ 12.8%</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Avg. LTV</div>
                <div className="text-2xl font-bold text-gray-900">$142</div>
                <div className="text-xs text-green-600 mt-1">↑ 8.3%</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="h-32 bg-gradient-to-r from-purple-100 to-pink-100 rounded flex items-center justify-center">
                <span className="text-gray-500">Revenue Chart</span>
              </div>
            </div>
          </div>
        </>
      );
    case 'payments':
      return (
        <>
          <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-900">Special Offer</h4>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
              <div className="text-lg font-bold mb-1">Summer Bundle</div>
              <div className="text-sm opacity-90">50% OFF - Limited Time</div>
              <div className="mt-3 text-2xl font-bold">$49.99</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-white rounded-lg p-3 shadow-sm text-sm font-medium text-gray-700">
              Create Offer
            </button>
            <button className="bg-white rounded-lg p-3 shadow-sm text-sm font-medium text-gray-700">
              View Analytics
            </button>
          </div>
        </>
      );
    case 'ai':
      return (
        <>
          <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
            <div className="text-sm font-semibold text-gray-900 mb-2">AI Assistant Active</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">Auto-responding to new messages</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-600">Opportunity detection enabled</span>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-700">
            <div className="font-medium mb-1">AI Suggestion</div>
            <div className="text-xs">Sarah J. shows high engagement. Consider sending a personalized offer.</div>
          </div>
        </>
      );
    case 'security':
      return (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Security Overview</h3>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Encryption Status</span>
                  <span className="text-green-600 text-sm font-medium">Active</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="font-medium text-gray-900 mb-3">Recent Activity</div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• Team member login from New York</div>
                  <div>• 2FA enabled for account</div>
                  <div>• Password updated successfully</div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    case 'collab':
      return (
        <>
          <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
            <div className="font-semibold text-gray-900 mb-3">Team Activity</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Alex approved 3 posts</div>
                  <div className="text-xs text-gray-500">2 minutes ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-100" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Maria replied to 12 messages</div>
                  <div className="text-xs text-gray-500">15 minutes ago</div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
  }
}

export default function FeatureTabsEN() {
  const [active, setActive] = useState<FeatureKey>('inbox');
  const data = FEATURES[active][0];
  const Icon = data.icon;

  return (
    <section className="py-24 bg-gradient-to-b from-black via-black to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="section-header">
          <span className="overline">Complete Solution</span>
          <h2 className="display-2">One platform to run everything</h2>
          <p className="lead">Everything you need to manage and grow your business, unified in one powerful platform</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {ORDER.map(key => {
            const label = FEATURES[key][0].title;
            const isActive = key === active;
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  isActive ? 'bg-white text-black border-white' : 'border-white/20 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Panel */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active + '-copy'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="inline-flex items-center gap-3 mb-4">
                <span className={`p-2 rounded-lg bg-gradient-to-r ${data.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </span>
                <h3 className="feature-title">{data.title}</h3>
              </div>
              <p className="text-gray-300 mb-6">{data.desc}</p>
              <ul className="space-y-2 text-gray-200">
                {data.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white/70" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={active + '-mock'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Simple preview box instead of mockups */}
              <div className="relative max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1 rounded-2xl">
                  <div className="bg-white rounded-xl p-8">
                    <MockupContent type={active} />
                  </div>
                </div>
                {/* Glow effect */}
                <div className="absolute -inset-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-3xl opacity-20 -z-10" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
