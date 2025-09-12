'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'
import { events } from '@/src/lib/analytics'

const navigation = [
  { name: 'Solutions', href: '/solutions', hasDropdown: true },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Resources', href: '/resources', hasDropdown: true }
]

export default function HeaderShopifyStyle() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Hide on app pages
  const isApp = !!pathname && [
    '/dashboard',
    '/messages',
    '/fans',
    '/analytics',
    '/onboarding'
  ].some(p => pathname.startsWith(p))
  
  if (isApp) return null

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] bg-black">
      <nav className="max-w-screen-xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo with proper spacing */}
          <div className="flex items-center flex-1">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-semibold text-white">Huntaze</span>
            </Link>
          </div>

          {/* Center: Navigation - Desktop */}
          <div className="hidden lg:flex items-center gap-8 justify-center flex-1">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.hasDropdown ? (
                  <>
                    <button
                      className="text-gray-300 hover:text-white text-[15px] font-medium flex items-center gap-1 py-2"
                      onMouseEnter={() => setActiveDropdown(item.name)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {item.name}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {/* Dropdown would go here */}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-300 hover:text-white text-[15px] font-medium py-2"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right: Auth Links */}
          <div className="hidden lg:flex items-center gap-4 justify-end flex-1">
            <Link
              href="/auth?mode=signin"
              className="text-gray-300 hover:text-white text-[15px] font-medium"
              onClick={() => events.ctaClick({ location: 'nav', label: 'Log in' })}
            >
              Log in
            </Link>
            <Link
              href="/auth"
              className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-md text-sm font-semibold transition-colors"
              onClick={() => events.ctaClick({ location: 'nav', label: 'Start for free' })}
            >
              Start for free
            </Link>
          </div>

          {/* Mobile: Logo and Menu button */}
          <div className="lg:hidden flex items-center justify-between w-full">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-lg font-semibold text-white">Huntaze</span>
            </Link>
            
            {/* Menu button */}
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
              <div className="py-4 space-y-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.hasDropdown ? '#' : item.href}
                    className="block text-gray-300 hover:text-white text-base font-medium px-4 py-2"
                    onClick={() => !item.hasDropdown && setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="border-t border-gray-800 pt-4 px-4 space-y-3">
                  <Link
                    href="/auth?mode=signin"
                    className="block text-gray-300 hover:text-white text-base"
                    onClick={() => { events.ctaClick({ location: 'nav_mobile', label: 'Log in' }); setMobileMenuOpen(false); }}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth"
                    className="block bg-white text-black px-6 py-3 rounded-md text-center font-semibold"
                    onClick={() => { events.ctaClick({ location: 'nav_mobile', label: 'Start for free' }); setMobileMenuOpen(false); }}
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