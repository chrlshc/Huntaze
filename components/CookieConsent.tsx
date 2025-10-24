"use client";
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    try {
      const v = localStorage.getItem('cookie_consent_v1')
      if (v !== '1') setOpen(true)
    } catch {}
  }, [])
  if (!open) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000]">
      <div className="mx-auto max-w-4xl m-4 rounded-lg bg-white text-slate-900 shadow-lg border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm">
          We use essential cookies to ensure the site works properly. For more details, see our{' '}
          <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
        </p>
        <div className="flex items-center gap-2">
          <button
            className="h-10 px-4 rounded-md border border-slate-300 text-slate-900 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
            <button
              className="h-10 px-4 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => { try { localStorage.setItem('cookie_consent_v1', '1') } catch {}; setOpen(false) }}
            >
              Accept
            </button>
        </div>
      </div>
    </div>
  )
}

