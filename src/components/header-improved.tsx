'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, X, ChevronDown, ArrowRight,
  MessageSquare, BarChart3, Calendar, Shield,
  DollarSign, Users, Zap, BookOpen, FileText,
  HeadphonesIcon, GraduationCap, Building,
  User, LogOut, Settings
} from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

const navigation = {
  solutions: {
    title: 'Solutions',
    items: [
      {
        name: 'AI Chat Assistant',
        description: 'Automate fan conversations 24/7',
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
        href: '/features/automation',
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
        name: 'Help Center',
        description: 'Get support and answers',
        href: '/about',
        icon: HeadphonesIcon
      },
      {
        name: 'Creator Academy',
        description: 'Learn growth strategies',
        href: '/learn',
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
        description: '99.9% uptime guaranteed',
        href: '/about',
        icon: Shield
      }
    ]
  }
}

export default function HeaderImproved() {
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
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-sm dark:shadow-gray-950/50 py-3' 
          : 'bg-white dark:bg-black py-4'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Huntaze</span>
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
              <button className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium">
                <span>Solutions</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'solutions' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-96 mt-2 bg-white dark:bg-gray-950 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                  >
                    <div className="p-6">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-4">
                        {navigation.solutions.title}
                      </h3>
                      <div className="space-y-3">
                        {navigation.solutions.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <item.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                            </div>
                          </Link>
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
              <button className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium">
                <span>Resources</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'resources' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-96 mt-2 bg-white dark:bg-gray-950 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                  >
                    <div className="p-6">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-4">
                        {navigation.resources.title}
                      </h3>
                      <div className="space-y-3">
                        {navigation.resources.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <item.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/pricing" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
              Pricing
            </Link>

            <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
              About
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center space-x-4">
            <ThemeToggle />
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                <AnimatePresence>
                  {activeDropdown === 'user' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-950 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                        <p className="font-medium text-gray-900 dark:text-white">{user.name || user.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/dashboard"
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">Dashboard</span>
                        </Link>
                        <Link
                          href="/configure"
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">Settings</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link 
                  href="/auth" 
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  Log in
                </Link>
                <Link 
                  href="/auth" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Start free trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
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
                  {navigation.solutions.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                    Resources
                  </p>
                  {navigation.resources.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <Link
                    href="/pricing"
                    className="block p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/about"
                    className="block p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Theme</span>
                    <ThemeToggle />
                  </div>
                  
                  {loading ? (
                    <div className="p-4 flex justify-center">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    </div>
                  ) : user ? (
                    <>
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          {user.picture ? (
                            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.name || user.email}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">Dashboard</span>
                      </Link>
                      
                      <Link
                        href="/configure"
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">Settings</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                      >
                        <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth"
                        className="block p-2 text-gray-700 hover:bg-gray-50 rounded-lg text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        href="/auth"
                        className="block bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg text-center font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Start free trial
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