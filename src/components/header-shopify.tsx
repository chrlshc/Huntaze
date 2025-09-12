'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, MessageCircle, Camera, Play, Users2 } from 'lucide-react'
import { events } from '@/src/lib/analytics'

export default function HeaderShopify() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Hide on app pages
  const isApp = !!pathname && [
    '/dashboard',
    '/onboarding'
  ].some(p => pathname.startsWith(p))
  
  // Detect scroll for sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  if (isApp) return null

  return (
    <header className={`fixed inset-x-0 top-0 z-[1000] transition-all duration-300 ${
      isScrolled ? 'bg-[#1a1a1a]/95 backdrop-blur-md' : 'bg-[#1a1a1a]'
    }`}>
      <nav className="max-w-[1400px] mx-auto px-8">
        <div className="flex items-center justify-between h-[64px]">
          {/* Left side: Logo + Nav (grouped like Shopify) */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-[22px] font-bold text-white">Huntaze</span>
            </Link>
            
            {/* Navigation - right next to logo */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Solutions Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1 text-white hover:text-gray-300 text-[16px] font-medium py-2"
                  onMouseEnter={() => setActiveDropdown('solutions')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  Solutions
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {activeDropdown === 'solutions' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-80 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl"
                      onMouseEnter={() => setActiveDropdown('solutions')}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <div className="p-2">
                        {/* OnlyFans */}
                        <Link
                          href="/solutions/onlyfans"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                              OnlyFans
                            </h4>
                            <p className="text-sm text-gray-400 mt-0.5">
                              AI that doubles your subscribers and revenue
                            </p>
                          </div>
                        </Link>

                        {/* Instagram */}
                        <Link
                          href="/solutions/instagram"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                              Instagram
                            </h4>
                            <p className="text-sm text-gray-400 mt-0.5">
                              DM automation and smart pricing
                            </p>
                          </div>
                        </Link>

                        {/* TikTok */}
                        <Link
                          href="/solutions/tiktok"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center flex-shrink-0">
                            <Play className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                              TikTok
                            </h4>
                            <p className="text-sm text-gray-400 mt-0.5">
                              Multi-content scheduling and analytics
                            </p>
                          </div>
                        </Link>

                        {/* Reddit */}
                        <Link
                          href="/solutions/reddit"
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                            <Users2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                              Reddit
                            </h4>
                            <p className="text-sm text-gray-400 mt-0.5">
                              VIP community management
                            </p>
                          </div>
                        </Link>

                        {/* Divider */}
                        <div className="h-px bg-gray-800 my-2" />

                        {/* View all */}
                        <Link
                          href="/solutions"
                          className="flex items-center justify-center gap-2 p-3 text-purple-400 hover:text-purple-300 font-medium text-sm transition-colors"
                        >
                          View all solutions
                          <ChevronDown className="w-4 h-4 -rotate-90" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/pricing"
                className="text-white hover:text-gray-300 text-[16px] font-medium py-2"
              >
                Pricing
              </Link>

              <Link
                href="/learn"
                className="text-white hover:text-gray-300 text-[16px] font-medium py-2"
              >
                Resources
              </Link>

              <Link
                href="/for-agencies"
                className="text-white hover:text-gray-300 text-[16px] font-medium py-2"
              >
                Enterprise
              </Link>
            </div>
          </div>

          {/* Right side: Auth Links */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              href="/auth?mode=signin"
              className="text-white hover:text-gray-300 text-[16px] font-medium"
              onClick={() => events.ctaClick({ location: 'nav', label: 'Log in' })}
            >
              Log in
            </Link>
            <Link
              href="/auth"
              className="cta-primary text-[16px] px-6"
              onClick={() => events.ctaClick({ location: 'nav', label: 'Start for free' })}
            >
              Start free trial
            </Link>
          </div>

          {/* Mobile: Menu button */}
          <div className="lg:hidden">
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
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-[#1a1a1a]"
          >
            <div className="px-6 py-4 space-y-4">
              <Link
                href="/features"
                className="block text-white hover:text-gray-300 text-[18px] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Solutions
              </Link>
              <Link
                href="/pricing"
                className="block text-white hover:text-gray-300 text-[18px] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/learn"
                className="block text-white hover:text-gray-300 text-[18px] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <Link
                href="/for-agencies"
                className="block text-white hover:text-gray-300 text-[18px] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Enterprise
              </Link>
              
              <div className="pt-4 space-y-4">
                <Link
                  href="/auth?mode=signin"
                  className="block text-white hover:text-gray-300 text-[18px] font-medium py-2"
                  onClick={() => { events.ctaClick({ location: 'nav_mobile', label: 'Log in' }); setMobileMenuOpen(false); }}
                >
                  Log in
                </Link>
                <Link
                  href="/auth"
                  className="block bg-white text-black px-6 py-3 rounded-full text-center text-[18px] font-semibold"
                  onClick={() => { events.ctaClick({ location: 'nav_mobile', label: 'Start for free' }); setMobileMenuOpen(false); }}
                >
                  Start free trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
