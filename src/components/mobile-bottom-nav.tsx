'use client'

import { useState, useEffect } from 'react'
import { useSSE } from '@/hooks/useSSE'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Users, BarChart3, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type NavItem = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  badge?: number
}

const navItemsInitial: NavItem[] = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: Users, label: 'Fans', href: '/fans' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: User, label: 'Profile', href: '/profile' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [items, setItems] = useState<NavItem[]>(navItemsInitial)

  // Start SSE connection (handles new-message events, haptics, toast)
  useSSE()

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

  // Fetch badges data (Messages/Fans/Analytics)
  useEffect(() => {
    let timer: any;
    const refreshBadges = async () => {
      try {
        const [mRes, fRes, aRes] = await Promise.all([
          fetch('/api/messages/unread-count', { cache: 'no-store' }),
          fetch('/api/fans/new-count', { cache: 'no-store' }),
          fetch('/api/analytics/alerts-count', { cache: 'no-store' }),
        ])
        const m = mRes.ok ? await mRes.json() : { count: 0 }
        const f = fRes.ok ? await fRes.json() : { new: 0, pending: 0 }
        const a = aRes.ok ? await aRes.json() : { alerts: 0 }
        setItems((prev) => prev.map((it) => {
          if (it.label === 'Messages') return { ...it, badge: m.count }
          if (it.label === 'Fans') return { ...it, badge: f.new + f.pending }
          if (it.label === 'Analytics') return { ...it, badge: a.alerts }
          return it
        }))
      } catch {}
    }
    refreshBadges()
    // Listen to SSE new-message to refresh badges without polling
    const handleNewMessage = () => { refreshBadges() }
    window.addEventListener('new-message', handleNewMessage)
    return () => window.removeEventListener('new-message', handleNewMessage)
  }, [])

  // Listen to cross-app unread-count updates (e.g., from Messages UI)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { count?: number, fans?: number, analytics?: number } | undefined
      if (!detail) return
      setItems((prev) => prev.map((it) => {
        if (it.label === 'Messages' && typeof detail.count === 'number') return { ...it, badge: detail.count }
        if (it.label === 'Fans' && typeof detail.fans === 'number') return { ...it, badge: detail.fans }
        if (it.label === 'Analytics' && typeof detail.analytics === 'number') return { ...it, badge: detail.analytics }
        return it
      }))
    }
    window.addEventListener('unread-count', handler as EventListener)
    return () => window.removeEventListener('unread-count', handler as EventListener)
  }, [])

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
              {items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex flex-col items-center py-3 px-3"
                  >
                    <div className="relative">
                      <div className={`p-2 rounded-xl transition-colors ${
                        isActive ? 'text-purple-700' : 'text-gray-500'
                      }`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] text-white bg-red-500 rounded-full text-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="mobile-nav-indicator"
                          className="absolute -inset-1 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl -z-10"
                        />
                      )}
                    </div>
                    <span className={`text-[11px] mt-1 ${
                      isActive ? 'text-purple-700 font-semibold' : 'text-gray-500'
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for mobile to prevent content overlap */}
      <div className="h-16 lg:hidden" />
    </>
  )
}
