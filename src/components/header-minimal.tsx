'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'

const navigation = {
  solutions: {
    title: 'Solutions',
    columns: [
      {
        items: [
          {
            name: 'Overview',
            description: 'Unified platform for creators',
            href: '/'
          },
          {
            name: 'AI Assistant',
            description: 'Automate fan conversations',
            href: '/features/ai-chat'
          },
          {
            name: 'Analytics',
            description: 'Track revenue and growth',
            href: '/features/analytics'
          },
          {
            name: 'Content Scheduler',
            description: 'Post at optimal times',
            href: '/features/content-scheduler'
          }
        ]
      },
      {
        items: [
          {
            name: 'Instagram Creators',
            description: 'Monetize your following',
            href: '/for-instagram-creators'
          },
          {
            name: 'TikTok Creators',
            description: 'Turn fame into income',
            href: '/for-tiktok-creators'
          },
          {
            name: 'Creator Agencies',
            description: 'Scale with AI tools',
            href: '/for-agencies'
          }
        ]
      }
    ]
  },
  resources: {
    title: 'Resources',
    columns: [
      {
        items: [
          {
            name: 'Help Center',
            description: 'Get support and answers',
            href: '/support'
          },
          {
            name: 'API Docs',
            description: 'Build integrations',
            href: '/developers'
          }
        ]
      }
    ]
  }
}

export default function HeaderMinimal() {
  const pathname = usePathname()
  const isApp = !!pathname && [
    '/dashboard','/messages','/fans','/analytics','/campaigns','/automations','/schedule','/platforms','/billing','/configure','/profile','/social'
  ].some(p => pathname.startsWith(p))
  if (isApp) return null
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-black backdrop-blur-md border-b border-gray-800' : 'bg-black/80 backdrop-blur-sm'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-semibold text-white">H</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Solutions Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center space-x-1 text-gray-300 hover:text-white text-sm focus:outline-none">
                <span>Solutions</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'solutions' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-[480px] mt-2 bg-gray-950 border border-gray-800 rounded-lg overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-8">
                        {navigation.solutions.columns.map((column, idx) => (
                          <div key={idx} className="space-y-4">
                            {column.items.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="block group"
                              >
                                <p className="font-medium text-white group-hover:text-purple-400 transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {item.description}
                                </p>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Resources Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('resources')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center space-x-1 text-gray-300 hover:text-white text-sm focus:outline-none">
                <span>Resources</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'resources' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-64 mt-2 bg-gray-950 border border-gray-800 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {navigation.resources.columns[0].items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block group"
                        >
                          <p className="font-medium text-white group-hover:text-purple-400 transition-colors">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/pricing" className="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-all">
              Pricing
            </Link>

            <Link href="/about" className="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-all">
              About
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link 
              href="/auth" 
              className="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-all"
            >
              Log in
            </Link>
            <Link 
              href="/auth" 
              className="bg-white hover:bg-gray-100 hover:-translate-y-0.5 text-black px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-[0_2px_10px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
            >
              Start for free
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-gray-950 border-t border-gray-800"
            >
              <div className="px-4 py-6 space-y-6">
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Solutions
                  </p>
                  {navigation.solutions.columns.map((column, idx) => (
                    <div key={idx} className="space-y-3">
                      {column.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <p className="text-white">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Resources
                  </p>
                  {navigation.resources.columns[0].items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <p className="text-white">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </Link>
                  ))}
                </div>

                <div className="space-y-3">
                  <Link
                    href="/pricing"
                    className="block text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/about"
                    className="block text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </div>

                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <Link
                    href="/auth"
                    className="block text-center text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth"
                    className="block bg-white text-black py-3 rounded-full text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Start for free
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