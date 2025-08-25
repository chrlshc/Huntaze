'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, DollarSign, MessageSquare, User, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: DollarSign, label: 'Pricing', href: '/pricing' },
  { icon: MessageSquare, label: 'Support', href: '/help' },
  { icon: User, label: 'Account', href: '/account' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      {/* Mobile only - hidden on desktop */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 pb-safe"
          >
            <div className="grid grid-cols-5 items-center">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex flex-col items-center py-2 px-3"
                  >
                    <div className={`p-1 rounded-lg transition-colors ${
                      isActive ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                      <item.icon className="w-6 h-6" />
                      {isActive && (
                        <motion.div
                          layoutId="mobile-nav-indicator"
                          className="absolute inset-0 bg-purple-50 rounded-lg -z-10"
                        />
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${
                      isActive ? 'text-purple-600 font-medium' : 'text-gray-500'
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                )
              })}
              
              {/* Central CTA Button */}
              <div className="flex justify-center">
                <Link
                  href="/join"
                  className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors transform hover:scale-110"
                >
                  <Plus className="w-6 h-6" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for mobile to prevent content overlap */}
      <div className="h-16 lg:hidden" />
    </>
  )
}