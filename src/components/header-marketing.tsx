'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'
import { events } from '@/src/lib/analytics'

const navigation = [
  {
    name: 'Solutions',
    href: '#',
    hasDropdown: true,
    items: [
      { name: 'AI Chat Assistant', href: '/features/ai-chat', description: 'Automate fan conversations' },
      { name: 'Smart Pricing', href: '/features/pricing', description: 'Optimize your content pricing' },
      { name: 'Content Scheduler', href: '/features/scheduler', description: 'Post at optimal times' },
      { name: 'Analytics Dashboard', href: '/features/analytics', description: 'Track revenue and growth' }
    ]
  },
  { name: 'Pricing', href: '/pricing' },
  {
    name: 'Resources',
    href: '#',
    hasDropdown: true,
    items: [
      { name: 'Customer Stories', href: '/customers', description: 'Success stories from creators' },
      { name: 'Blog', href: '/blog', description: 'Tips and insights' },
      { name: 'Help Center', href: '/help', description: 'Get support' },
      { name: 'API Docs', href: '/api', description: 'Developer resources' }
    ]
  }
]

export default function HeaderMarketing() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Hide on app pages
  const isApp = !!pathname && [
    '/dashboard',
    '/messages',
    '/fans',
    '/analytics',
    '/campaigns',
    '/automations',
    '/schedule',
    '/platforms',
    '/billing',
    '/configure',
    '/profile',
    '/onboarding'
  ].some(p => pathname.startsWith(p))
  
  if (isApp) return null

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.nav-item')) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [activeDropdown])

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] bg-black border-b border-gray-800">
      <nav className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center mr-12">
              <span className="text-lg font-semibold text-white">Huntaze</span>
            </Link>
            
            {/* Nav Items */}
            <div className="flex items-center gap-8">
              {navigation.map((item) => (
                <div key={item.name} className="nav-item relative">
                  {item.hasDropdown ? (
                    <>
                      <button
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-1 py-2"
                        onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                      >
                        {item.name}
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          activeDropdown === item.name ? 'rotate-180' : ''
                        }`} />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === item.name && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-xl border border-gray-800 overflow-hidden"
                          >
                            {item.items?.map((subItem) => (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className="block px-4 py-3 hover:bg-gray-800 transition-colors"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <div className="text-white font-medium text-sm">{subItem.name}</div>
                                <div className="text-gray-400 text-xs mt-1">{subItem.description}</div>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-gray-400 hover:text-white text-sm py-2"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>

          </div>

          {/* Right side - Auth Links */}
          <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/auth?mode=signin"
                className="text-gray-400 hover:text-white text-sm"
                onClick={() => events.ctaClick({ location: 'nav', label: 'Sign in' })}
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="bg-white text-black hover:bg-gray-100 px-5 py-2 rounded text-sm font-medium transition-colors"
                onClick={() => events.ctaClick({ location: 'nav', label: 'Start free trial' })}
              >
                Start free trial
              </Link>
          </div>

          {/* Mobile: Logo and menu button */}
          <div className="lg:hidden flex items-center justify-between w-full">
            <Link href="/" className="flex items-center">
              <span className="text-lg font-semibold text-white">Huntaze</span>
            </Link>
            <button
              className="p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-800"
            >
              <div className="py-4 space-y-4">
                {navigation.map((item) => (
                  <div key={item.name}>
                    {item.hasDropdown ? (
                      <div>
                        <button
                          className="text-gray-300 text-base font-medium w-full text-left px-4 py-2"
                          onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                        >
                          {item.name}
                        </button>
                        {activeDropdown === item.name && (
                          <div className="ml-4 mt-2 space-y-2">
                            {item.items?.map((subItem) => (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className="block text-gray-400 hover:text-white text-sm px-4 py-2"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className="block text-gray-300 hover:text-white text-base font-medium px-4 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
                
                <div className="border-t border-gray-800 pt-4 px-4 space-y-3">
                  <Link
                    href="/auth?mode=signin"
                    className="block text-gray-300 hover:text-white text-base text-center"
                    onClick={() => { events.ctaClick({ location: 'nav_mobile', label: 'Sign in' }); setMobileMenuOpen(false); }}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth"
                    className="block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg text-center font-semibold"
                    onClick={() => { events.ctaClick({ location: 'nav_mobile', label: 'Start free trial' }); setMobileMenuOpen(false); }}
                  >
                    Start free trial
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}