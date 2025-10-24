// Snapshot of components/BetaBanner.tsx
"use client"

import { useEffect, useState } from 'react'

export default function BetaBanner() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    try { const d = localStorage.getItem('beta_banner_dismissed')==='1'; if(!d) setVisible(true) } catch { setVisible(true) }
  }, [])
  if (!visible) return null
  return (
    <div className="w-full bg-purple-600 text-white text-sm py-2 px-3 flex items-center justify-center gap-3">
      <span className="inline-flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-white/15 font-semibold">Beta</span>
        We’re improving visuals. Some pages may change.
      </span>
      <button className="ml-4 underline/50 hover:underline" onClick={() => { try { localStorage.setItem('beta_banner_dismissed','1') } catch {}; setVisible(false) }}>Dismiss</button>
    </div>
  )
}

