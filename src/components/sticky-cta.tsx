"use client";

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function StickyCTA() {
  const pathname = usePathname()
  const isApp = !!pathname && [
    '/dashboard','/messages','/fans','/analytics','/campaigns','/automations','/schedule','/platforms','/billing','/configure','/profile','/social'
  ].some(p => pathname.startsWith(p))
  if (isApp) return null

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/80 backdrop-blur-sm border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-300">
          <div className="font-medium">Start for free</div>
          <div className="text-[11px] text-gray-400">No credit card required</div>
        </div>
        <Link
          href="/get-started"
          className="px-4 py-2 bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          Get started
        </Link>
      </div>
    </div>
  )
}

