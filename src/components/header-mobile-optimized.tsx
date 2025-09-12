'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import MegaMenu from '@/src/components/MegaMenu'
import { solutionsNav, resourcesNav } from '@/src/components/nav.data'
import { events } from '@/src/lib/analytics'

export default function HeaderMobileOptimized() {
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
    '/onboarding'
  ].some(p => pathname.startsWith(p))
  
  if (isApp) return null

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Check auth
  useEffect(() => {
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

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <>
      {/* Header with mobile-first design */}
      <header className={`
        fixed top-0 left-0 right-0 z-[1000]
        h-[var(--mobile-header-height)]
        pt-[var(--safe-area-top)]
        bg-white/95 backdrop-blur-md
        border-b transition-all duration-300
        ${scrolled ? 'border-gray-200 shadow-sm' : 'border-transparent'}
      `}>
        <div className="
          h-full
          px-[max(var(--safe-area-left),var(--content-padding))]
          pr-[max(var(--safe-area-right),var(--content-padding))]
          flex items-center justify-between
        ">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center h-full touch-manipulation"
            aria-label="Huntaze home"
          >
            <span className="text-xl font-bold text-gray-900">Huntaze</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 h-full">
            <MegaMenu 
              label="Solutions" 
              groups={solutionsNav} 
              columns={3} 
              align="left" 
              panelAlign="viewport-left" 
              panelGutter={320} 
              footerLinks={[
                { title: 'See all solutions', href: '/solutions' }, 
                { title: 'Compare plans', href: '/pricing' }
              ]} 
            />

            <Link 
              href="/pricing" 
              className="text-gray-600 hover:text-gray-900 text-sm font-medium touch-target-min"
            >
              Pricing
            </Link>

            <MegaMenu 
              label="Resources" 
              groups={resourcesNav} 
              columns={4} 
              align="left" 
              panelAlign="viewport-left" 
              panelGutter={96} 
              footerLinks={[
                { title: 'See all resources', href: '/resources' }
              ]} 
            />
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {loading ? null : user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium px-3 py-2 touch-target-min"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 touch-target-min"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth" 
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium px-4 py-2 touch-target-min"
                  onClick={() => events.ctaClick({ location: 'nav', label: 'Log in' })}
                >
                  Log in
                </Link>
                <Link 
                  href="/auth" 
                  className="
                    inline-flex items-center justify-center
                    min-h-[var(--touch-target-min)]
                    px-6 py-2 
                    bg-gradient-to-r from-purple-600 to-pink-600 
                    text-white font-medium text-sm
                    rounded-full hover:shadow-lg
                    transition-all duration-200
                    touch-manipulation
                  "
                  onClick={() => events.ctaClick({ location: 'nav', label: 'Start for free' })}
                >
                  Start for free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="
              lg:hidden
              flex items-center justify-center
              w-[var(--touch-target-min)]
              h-[var(--touch-target-min)]
              -mr-2
              touch-manipulation
            "
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="
                fixed inset-0 bg-black/20 backdrop-blur-sm
                z-[999] lg:hidden
              "
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="
                fixed right-0 
                top-[calc(var(--mobile-header-height)+var(--safe-area-top))]
                bottom-0
                w-full max-w-sm
                bg-white
                z-[1001] lg:hidden
                overflow-y-auto
                overscroll-behavior-y-contain
                -webkit-overflow-scrolling-touch
              "
            >
              <nav className="
                px-[var(--content-padding)]
                py-[var(--spacing-lg)]
                pb-[max(var(--spacing-lg),var(--safe-area-bottom))]
              ">
                {/* Mobile Navigation Groups */}
                <div className="space-y-8">
                  {/* Solutions */}
                  <div>
                    <h3 className="
                      text-xs font-semibold text-gray-500 uppercase tracking-wider
                      mb-4 px-2
                    ">
                      Solutions
                    </h3>
                    <div className="space-y-1">
                      {solutionsNav.flatMap(group => group.items).map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="
                            flex items-center gap-3
                            min-h-[var(--touch-target-comfortable)]
                            px-3 py-2
                            rounded-lg
                            text-gray-700 hover:text-gray-900
                            hover:bg-gray-50
                            transition-colors
                            touch-manipulation
                          "
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <Link
                      href="/pricing"
                      className="
                        flex items-center
                        min-h-[var(--touch-target-comfortable)]
                        px-3 py-2
                        rounded-lg
                        text-gray-700 hover:text-gray-900
                        hover:bg-gray-50
                        font-medium
                        transition-colors
                        touch-manipulation
                      "
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                  </div>

                  {/* Resources */}
                  <div>
                    <h3 className="
                      text-xs font-semibold text-gray-500 uppercase tracking-wider
                      mb-4 px-2
                    ">
                      Resources
                    </h3>
                    <div className="space-y-1">
                      {resourcesNav.flatMap(group => group.items).slice(0, 5).map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="
                            flex items-center gap-3
                            min-h-[var(--touch-target-comfortable)]
                            px-3 py-2
                            rounded-lg
                            text-gray-700 hover:text-gray-900
                            hover:bg-gray-50
                            transition-colors
                            touch-manipulation
                          "
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Auth Section */}
                  <div className="
                    pt-8 
                    border-t border-gray-200
                    space-y-3
                  ">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 bg-purple-100 rounded-full animate-pulse" />
                      </div>
                    ) : user ? (
                      <>
                        <Link
                          href="/dashboard"
                          className="
                            block w-full
                            min-h-[var(--touch-target-primary)]
                            px-6 py-3
                            bg-purple-600 text-white
                            rounded-lg font-medium
                            text-center
                            hover:bg-purple-700
                            transition-colors
                            touch-manipulation
                          "
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Go to Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout()
                            setMobileMenuOpen(false)
                          }}
                          className="
                            block w-full
                            min-h-[var(--touch-target-comfortable)]
                            px-6 py-3
                            text-gray-600
                            rounded-lg font-medium
                            text-center
                            hover:bg-gray-50
                            transition-colors
                            touch-manipulation
                          "
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth"
                          className="
                            block w-full
                            min-h-[var(--touch-target-comfortable)]
                            px-6 py-3
                            text-gray-700
                            rounded-lg font-medium
                            text-center
                            hover:bg-gray-50
                            transition-colors
                            touch-manipulation
                          "
                          onClick={() => {
                            events.ctaClick({ location: 'nav_mobile', label: 'Log in' })
                            setMobileMenuOpen(false)
                          }}
                        >
                          Log in
                        </Link>
                        <Link
                          href="/auth"
                          className="
                            block w-full
                            min-h-[var(--touch-target-primary)]
                            px-6 py-4
                            bg-gradient-to-r from-purple-600 to-pink-600
                            text-white
                            rounded-lg font-semibold
                            text-center
                            hover:shadow-lg
                            transition-all
                            touch-manipulation
                          "
                          onClick={() => {
                            events.ctaClick({ location: 'nav_mobile', label: 'Start for free' })
                            setMobileMenuOpen(false)
                          }}
                        >
                          Start for free
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to compensate for fixed header */}
      <div 
        className="h-[var(--mobile-header-height)] pt-[var(--safe-area-top)]" 
        aria-hidden="true" 
      />
    </>
  )
}