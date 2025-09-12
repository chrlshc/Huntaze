'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'
import ContactSalesModal from '@/components/ContactSalesModal'
// import ThemeToggle from '@/components/ThemeToggle'
import analytics from '@/lib/analytics/enterprise-events'

// Navigation items based on the new IA
const solutionItems = [
  {
    title: 'For Solo Creators',
    description: 'Run your business without a team',
    href: '/solutions/solo-creators',
    icon: '🎯'
  },
  {
    title: 'For Agencies',
    description: 'Manage multiple creator accounts',
    href: '/solutions/agencies',
    icon: '🏢'
  },
  {
    title: 'By Platform',
    description: 'OnlyFans, Fansly, Instagram',
    href: '/solutions/platforms',
    icon: '📱'
  }
]

const platformFeatures = [
  {
    title: 'AI Sales Agent',
    description: 'Conversations that convert',
    href: '/platform/ai-agent',
    icon: '🤖'
  },
  {
    title: 'PPV Revenue Engine',
    description: 'Maximize every fan',
    href: '/platform/ppv-engine',
    icon: '💰'
  },
  {
    title: 'Unified CRM',
    description: 'All platforms, one dashboard',
    href: '/platform/crm',
    icon: '📊'
  },
  {
    title: 'Analytics',
    description: 'Real-time revenue insights',
    href: '/platform/analytics',
    icon: '📈'
  },
  {
    title: 'Automation',
    description: 'Set it and forget it',
    href: '/platform/automation',
    icon: '⚡'
  },
  {
    title: 'Integrations',
    description: 'Connect your tools',
    href: '/platform/integrations',
    icon: '🔗'
  }
]

const resourceItems = [
  {
    title: 'Documentation',
    description: 'API docs and guides',
    href: '/docs',
    icon: '📚'
  },
  {
    title: 'Creator Stories',
    description: '$100K+ success stories',
    href: '/case-studies',
    icon: '⭐'
  },
  {
    title: 'Blog',
    description: 'Growth tips and updates',
    href: '/blog',
    icon: '✍️'
  },
  {
    title: 'System Status',
    description: '99.99% uptime',
    href: '/status',
    icon: '🟢'
  }
]

export default function EnterpriseNav() {
  const [solutionsOpen, setSolutionsOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <div className="w-full pl-80 pr-8">
        <div className="flex items-center h-16">
          {/* Logo - Invisible mais garde l'espace */}
          <div className="invisible">
            <span className="text-2xl font-bold">Huntaze</span>
          </div>

          {/* Spacer pour pousser le reste à droite */}
          <div className="flex-1"></div>

          {/* Navigation Items */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Solutions Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                onMouseEnter={() => setSolutionsOpen(true)}
                onMouseLeave={() => setSolutionsOpen(false)}
              >
                Solutions
                <ChevronDown className={`w-4 h-4 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {solutionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-[320px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
                    onMouseEnter={() => setSolutionsOpen(true)}
                    onMouseLeave={() => setSolutionsOpen(false)}
                  >
                    <div className="p-2">
                      {solutionItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl mt-0.5">{item.icon}</span>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                {item.title}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pricing Link */}
            <Link 
              href="/pricing" 
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Pricing
            </Link>

            {/* Resources Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                onMouseEnter={() => setResourcesOpen(true)}
                onMouseLeave={() => setResourcesOpen(false)}
              >
                Resources
                <ChevronDown className={`w-4 h-4 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {resourcesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-[320px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
                    onMouseEnter={() => setResourcesOpen(true)}
                    onMouseLeave={() => setResourcesOpen(false)}
                  >
                    <div className="p-2">
                      {resourceItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl mt-0.5">{item.icon}</span>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                {item.title}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Sign in - Indépendant */}
          <Link
            href="/auth"
            className="ml-20 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            Sign in
          </Link>

          {/* Start for free - Indépendant */}
          <Link
            href="/get-started"
            className="ml-6 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Start for free
          </Link>
        </div>
      </div>
      
      {/* Contact Sales Modal */}
      <ContactSalesModal 
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </nav>
  )
}
