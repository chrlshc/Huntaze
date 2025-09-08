'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BarChart3,
  Target,
  Bot,
  Calendar,
  Plug,
  CreditCard,
  Settings,
} from 'lucide-react'
import { useSSE } from '@/hooks/useSSE'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const APP_PREFIXES = [
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
]

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'Home', items: [ { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard } ] },
  { title: 'Communication', items: [
      { label: 'Messages', href: '/messages', icon: MessageSquare },
      { label: 'Campaigns', href: '/campaigns', icon: Target },
      { label: 'Automations', href: '/automations', icon: Bot },
      { label: 'Schedule', href: '/schedule', icon: Calendar },
    ]
  },
  { title: 'Customers', items: [ { label: 'Fans', href: '/fans', icon: Users } ] },
  { title: 'Insights', items: [ { label: 'Analytics', href: '/analytics', icon: BarChart3 } ] },
  { title: 'Integrations', items: [ { label: 'Platforms', href: '/platforms/connect', icon: Plug } ] },
  { title: 'Settings', items: [ { label: 'Billing', href: '/billing', icon: CreditCard }, { label: 'Settings', href: '/configure', icon: Settings } ] },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const isApp = useMemo(() => APP_PREFIXES.some((p) => pathname?.startsWith(p)), [pathname])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [badges, setBadges] = useState<{ messages?: number; analytics?: number }>({})

  // Enable SSE (we're in app only) to update unread counts
  useSSE(true)

  useEffect(() => {
    const refreshBadges = async () => {
      try {
        const [mRes, aRes] = await Promise.all([
          fetch('/api/messages/unread-count', { cache: 'no-store' }),
          fetch('/api/analytics/alerts-count', { cache: 'no-store' }),
        ])
        const m = mRes.ok ? await mRes.json() : { count: 0 }
        const a = aRes.ok ? await aRes.json() : { alerts: 0 }
        setBadges({ messages: m.count || 0, analytics: a.alerts || 0 })
      } catch {}
    }
    refreshBadges()
    const onNew = () => refreshBadges()
    const onUnread = (e: Event) => {
      const det = (e as CustomEvent).detail as any
      if (det?.count !== undefined) setBadges((b) => ({ ...b, messages: det.count }))
    }
    window.addEventListener('new-message', onNew)
    window.addEventListener('unread-count', onUnread as EventListener)
    return () => {
      window.removeEventListener('new-message', onNew)
      window.removeEventListener('unread-count', onUnread as EventListener)
    }
  }, [])

  // Flag body so global CSS can indent main on desktop
  useEffect(() => {
    if (!isApp) return
    document.body.dataset.appShell = 'true'
    return () => { delete document.body.dataset.appShell }
  }, [isApp])

  if (!isApp) return null

  const NavList = (
    <nav className="mt-3">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="mb-3">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{section.title}</div>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon
              const badge = item.label === 'Messages' ? badges.messages : item.label === 'Analytics' ? badges.analytics : 0
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-purple-700' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="font-medium truncate flex-1">{item.label}</span>
                    {badge && badge > 0 ? (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] text-white bg-red-500 rounded-full text-center">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 z-40 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="h-16 px-4 flex items-center border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="Huntaze dashboard">
            <Image src="/huntaze-logo.png" alt="Huntaze" width={120} height={32} className="h-8 w-auto" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {NavList}
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <Link href="/campaigns/new" className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors">New Campaign</Link>
        </div>
      </aside>

      {/* Mobile drawer trigger (optional) */}
      <button
        aria-label="Open menu"
        className="lg:hidden fixed top-3 left-3 z-40 rounded-lg bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 backdrop-blur px-3 py-2 shadow"
        onClick={() => setDrawerOpen(true)}
      >
        <span className="sr-only">Open menu</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4">
            <div className="h-10 flex items-center justify-between">
              <Image src="/huntaze-logo.png" alt="Huntaze" width={110} height={30} className="h-8 w-auto" />
              <button aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="mt-4">
              {NavList}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
