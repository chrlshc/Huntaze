'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, BarChart3, CreditCard, Bot, Shield, Users } from 'lucide-react';
import DeviceMockup from './DeviceMockup';

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

export default function FeatureTabsEN() {
  const [active, setActive] = useState<FeatureKey>('inbox');
  const data = FEATURES[active][0];
  const Icon = data.icon;

  return (
    <section className="py-24 bg-gradient-to-b from-black via-black to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-12">
          One platform to run everything
        </h2>

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
                <h3 className="text-2xl font-bold">{data.title}</h3>
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
            >
              <DeviceMockup type={active === 'analytics' ? 'desktop' : 'phone'} src={MOCKS[active]} alt={data.title} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

const MOCKS: Record<FeatureKey, string> = {
  inbox: '/mockups/inbox.svg',
  analytics: '/mockups/dashboard.svg',
  payments: '/mockups/offers.svg',
  ai: '/mockups/inbox.svg',
  security: '/mockups/dashboard.svg',
  collab: '/mockups/offers.svg',
};
