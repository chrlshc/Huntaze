'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X,
  MessageSquare, BarChart3, Calendar, Shield,
  DollarSign, Users, Zap, BookOpen, FileText,
  HeadphonesIcon, GraduationCap, Building,
  User, LogOut, Settings, Globe
} from 'lucide-react'
// import { ThemeToggle } from './theme-toggle'
// import { CommandPalette } from './command-palette'

import { events } from '@/src/lib/analytics'
import MegaMenu from '@/src/components/MegaMenu'
import { solutionsNav, resourcesNav } from '@/src/components/nav.data'

const navigation = {
  creators: {
    title: 'For Creators',
    items: [
      {
        name: 'Instagram Creators',
        description: 'Monetize your Instagram following',
        href: '/for-instagram-creators',
        icon: MessageSquare
      },
      {
        name: 'TikTok Creators',
        description: 'Turn TikTok fame into income',
        href: '/for-tiktok-creators',
        icon: Zap
      },
      {
        name: 'Creator Agencies',
        description: 'Scale your agency with AI',
        href: '/for-agencies',
        icon: Building
      }
    ]
  },
  solutions: {
    title: 'Features',
    items: [
      {
        name: 'AI Chat Assistant',
        description: 'Automate fan conversations',
        href: '/features/ai-chat',
        icon: MessageSquare
      },
      {
        name: 'Analytics & Insights',
        description: 'Track revenue and performance',
        href: '/features/analytics',
        icon: BarChart3
      },
      {
        name: 'Content Scheduler',
        description: 'Post at optimal times automatically',
        href: '/features/content-scheduler',
        icon: Calendar
      },
      {
        name: 'Mass Messaging',
        description: 'Reach all fans with personalized DMs',
        href: '/features/automation',
        icon: Users
      }
    ]
  },
  resources: {
    title: 'Resources',
    items: [
      {
        name: 'Overview',
        description: 'Jump to hero',
        href: '/#top',
        icon: Zap
      },
      {
        name: 'Platform',
        description: 'Unified platform',
        href: '/#platform',
        icon: BarChart3
      },
      {
        name: 'Sell',
        description: 'Sell everywhere',
        href: '/#sell',
        icon: DollarSign
      },
      {
        name: 'Customers',
        description: 'Find your audience',
        href: '/#customers',
        icon: Users
      },
      {
        name: 'Global',
        description: 'Grow around the world',
        href: '/#global',
        icon: Globe
      },
      {
        name: 'Manage',
        description: 'Run your business',
        href: '/#manage',
        icon: Settings
      },
      {
        name: 'Performance',
        description: 'Performance & innovation',
        href: '/#performance',
        icon: Shield
      },
      {
        name: 'Support',
        description: 'Support & financing',
        href: '/#support',
        icon: HeadphonesIcon
      },
      {
        name: 'Get Started',
        description: 'Quick start',
        href: '/#quickstart',
        icon: Zap
      },
      {
        name: 'How It Works',
        description: 'Step-by-step process',
        href: '/how-it-works',
        icon: Zap
      },
      {
        name: 'Case Studies',
        description: 'Real creator success stories',
        href: '/case-studies',
        icon: Users
      },
      {
        name: 'About Us',
        description: 'Our mission and values',
        href: '/about',
        icon: Building
      },
      {
        name: 'Help Center',
        description: 'Get support and answers',
        href: '/about',
        icon: HeadphonesIcon
      },
      {
        name: 'Roadmap & Voting',
        description: 'Vote weekly for new features',
        href: '/roadmap',
        icon: GraduationCap
      },
      {
        name: 'API Documentation',
        description: 'Build custom integrations',
        href: '/about',
        icon: FileText
      },
      {
        name: 'System Status',
        description: 'Service availability updates',
        href: '/status',
        icon: Shield
      }
    ]
  }
}

export default function HeaderImproved() {
  const pathname = usePathname()
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
    '/social',
    // Hide marketing header on onboarding flows
    '/onboarding'
  ].some(p => pathname.startsWith(p))
  if (isApp) return null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.relative')) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [activeDropdown])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="header fixed inset-x-0 top-0 z-[1000]" data-header="linear-0927">
      <nav className="header-container">
        <div className="flex items-center gap-10">
          {/* Logo (temporarily hidden) */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center" aria-label="Huntaze home">
              <span className="sr-only">Huntaze</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="header-right ml-auto">
          <div className="nav-menu hidden lg:flex items-center gap-8">
            <MegaMenu label="Solutions" groups={solutionsNav} columns={3} align="left" panelAlign="viewport-left" panelGutter={320} footerLinks={[{ title: 'See all solutions', href: '/solutions' }, { title: 'Compare plans', href: '/pricing' }]} />

            {/* Pricing */}
            <Link href="/pricing" className="text-text-secondary hover:text-text-primary text-[14px] font-normal">
              Pricing
            </Link>

            <MegaMenu label="Resources" groups={resourcesNav} columns={4} align="left" panelAlign="viewport-left" panelGutter={96} footerLinks={[{ title: 'See all resources', href: '/resources' }]} />
          </div>

          

          {/* Right actions */}
          <div className="header-actions hidden lg:flex">
            {loading ? null : user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-text-primary/90 hover:text-text-primary text-sm font-medium px-3 py-2"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-text-secondary hover:text-text-primary text-sm font-medium px-3 py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth" 
                  className="text-text-primary/90 hover:text-text-primary text-sm font-medium px-4 py-2"
                  onClick={() => events.ctaClick({ location: 'nav', label: 'Log in' })}
                >
                  Log in
                </Link>
                  <Link 
                    href="/auth" 
                    className="btn-outline rounded-full px-5 py-2"
                    onClick={() => events.ctaClick({ location: 'nav', label: 'Start for free' })}
                  >
                    Start for free
                  </Link>
              </>
            )}
          </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-text-primary/80" />
            ) : (
              <Menu className="w-6 h-6 text-text-primary/80" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 pb-4"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                    Solutions
                  </p>
                  {[...navigation.creators.items, ...navigation.solutions.items].map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                      <span className="text-text-primary">{item.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                    Resources
                  </p>
                  {navigation.resources.items.filter((i) => i.name !== 'Agency Comparison').map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                      <span className="text-text-primary">{item.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                    Pages
                  </p>
                  <Link
                    href="/pricing"
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="w-5 h-5" />
                    <span className="text-text-primary">Pricing</span>
                  </Link>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 dark:text-[var(--text-secondary-dark)]">Theme</span>
                    {/* <ThemeToggle /> */}
                  </div>
                  
                  {loading ? (
                    <div className="p-4 flex justify-center">
                      <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse-soft" />
                    </div>
                  ) : user ? (
                    <>
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          {/* Temporarily disabled avatar for beta */}
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{user.name || user.email}</p>
                            <p className="text-sm text-text-secondary">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <BarChart3 className="w-5 h-5 text-text-secondary" />
                        <span className="text-text-primary">Dashboard</span>
                      </Link>
                      
                      <Link
                        href="/configure"
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5 text-text-secondary" />
                        <span className="text-text-primary">Settings</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                      >
                        <LogOut className="w-5 h-5 text-text-secondary" />
                        <span className="text-text-primary">Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth"
                        className="block p-2 text-text-primary hover:bg-primary/10 rounded-lg text-center"
                        onClick={() => { events.ctaClick({ location: 'nav_mobile', label: 'Log in' }); setMobileMenuOpen(false); }}
                      >
                        Log in
                      </Link>
                      <Link
                        href="/auth"
                        className="block btn-primary px-10 py-4 rounded-full text-center font-semibold text-base"
                        onClick={() => { events.ctaClick({ location: 'nav_mobile', label: 'Start for free' }); setMobileMenuOpen(false); }}
                      >
                        Start for free
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
