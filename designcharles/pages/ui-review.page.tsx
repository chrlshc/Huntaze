// Snapshot of app/ui/review/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import type { MenuGroup } from '@/src/components/nav.data'
import { solutionsNav, resourcesNav } from '@/src/components/nav.data'

export const dynamic = 'force-static'

type TargetRoute = { name: string; path: string }

function collectRoutes(): TargetRoute[] {
  const base: TargetRoute[] = [
    { name: 'Home', path: '/' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Features', path: '/features' },
    { name: 'For Agencies', path: '/for-agencies' },
    { name: 'Learn', path: '/learn' },
    { name: 'Support', path: '/support' },
    { name: 'Privacy', path: '/privacy-policy' },
    { name: 'Terms', path: '/terms-of-service' },
  ]
  function fromGroups(groups: MenuGroup[]): TargetRoute[] {
    const items: TargetRoute[] = []
    for (const g of groups) {
      for (const it of g.items || []) items.push({ name: it.title, path: it.href })
      if (g.footer) items.push({ name: g.footer.title, path: g.footer.href })
    }
    return items
  }
  const extra = [...fromGroups(solutionsNav), ...fromGroups(resourcesNav)]
  const dedup = new Map<string, TargetRoute>()
  for (const r of [...base, ...extra]) if (!dedup.has(r.path)) dedup.set(r.path, r)
  return Array.from(dedup.values()).slice(0, 32)
}

function joinUrl(base: string, path: string) {
  try { if (!base) return path; if (base.startsWith('http')) return new URL(path, base).toString(); return base.endsWith('/') ? base.slice(0, -1) + path : base + path } catch { return path }
}

type A11ySummary = { h1s: number; hasMain: boolean; imgNoAlt: number; aNoName: number; btnNoName: number }
function badgeColor(n: number) { if (n === 0) return 'bg-green-100 text-green-700'; if (n <= 2) return 'bg-yellow-100 text-yellow-800'; return 'bg-red-100 text-red-700' }

export default function UIReviewPage() {
  const defaults = useMemo(() => collectRoutes(), [])
  const [baseUrl, setBaseUrl] = useState('')
  const [dark, setDark] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [cols, setCols] = useState(3)
  const framesRef = useRef<Map<string, HTMLIFrameElement>>(new Map())
  const [a11y, setA11y] = useState<Record<string, A11ySummary>>({})
  const routes = defaults
  const gridCols = useMemo(() => `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.max(2, Math.min(5, cols))} gap-4`, [cols])

  useEffect(() => {
    const interval = setInterval(() => {
      for (const [key, el] of framesRef.current.entries()) {
        try {
          const win = el.contentWindow, doc = win?.document; if (!doc) continue
          const html = doc.documentElement; if (dark) html.classList.add('dark-mode', 'theme-dark'); else html.classList.remove('dark-mode', 'theme-dark')
          const imgNoAlt = doc.querySelectorAll('img:not([alt])').length
          const aNoName = Array.from(doc.querySelectorAll('a')).filter((a:any)=>{const t=(a.textContent||'').trim();const labelled=a.getAttribute('aria-label')||a.getAttribute('aria-labelledby');return !(t.length>0||(labelled&&labelled.length>0))}).length
          const btnNoName = Array.from(doc.querySelectorAll('button')).filter((b:any)=>{const t=(b.textContent||'').trim();const labelled=b.getAttribute('aria-label')||b.getAttribute('aria-labelledby');return !(t.length>0||(labelled&&labelled.length>0))}).length
          const h1s = doc.querySelectorAll('h1').length
          const hasMain = !!doc.querySelector('main')
          setA11y((prev)=>({ ...prev, [key]: { h1s, hasMain, imgNoAlt, aNoName, btnNoName } }))
        } catch {}
      }
    }, 800)
    return () => clearInterval(interval)
  }, [dark])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-2">UI Review Hub</h1>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm">Base URL</label>
          <input className="border rounded px-2 py-1 text-sm min-w-[240px]" placeholder="(optional) e.g. https://prod.app" value={baseUrl} onChange={(e)=>setBaseUrl(e.target.value)} />
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={dark} onChange={(e)=>setDark(e.target.checked)} />Dark</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={mobile} onChange={(e)=>setMobile(e.target.checked)} />Mobile (375px)</label>
          <label className="text-sm">Columns</label>
          <input type="range" min={2} max={5} value={cols} onChange={(e)=>setCols(parseInt(e.target.value))} />
          <button className="border rounded px-3 py-1 text-sm hover:bg-gray-50" onClick={()=>{framesRef.current.forEach((f)=>f?.contentWindow?.location.reload())}}>Reload All</button>
        </div>
        <div className={gridCols}>
          {routes.map((r)=>{const url=joinUrl(baseUrl,r.path);const k=r.path;const s=a11y[k];return (
            <div key={k} className="border rounded-lg overflow-hidden bg-white">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                <div className="flex items-center gap-2 text-sm"><span className="font-medium">{r.name}</span><span className="text-gray-500">{r.path}</span></div>
                <div className="flex items-center gap-2 text-[11px]">
                  {s ? (<>
                    <span className={`px-2 py-0.5 rounded ${s.h1s===1?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-800'}`}>h1:{s.h1s}</span>
                    <span className={`px-2 py-0.5 rounded ${s.hasMain?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-800'}`}>main:{s.hasMain?'yes':'no'}</span>
                    <span className={`px-2 py-0.5 rounded ${badgeColor(s.imgNoAlt)}`}>img¬alt:{s.imgNoAlt}</span>
                    <span className={`px-2 py-0.5 rounded ${badgeColor(s.aNoName)}`}>a¬name:{s.aNoName}</span>
                    <span className={`px-2 py-0.5 rounded ${badgeColor(s.btnNoName)}`}>btn¬name:{s.btnNoName}</span>
                  </>) : (<span className="text-gray-400">loading…</span>)}
                  <a className="underline text-blue-600" href={url} target="_blank" rel="noreferrer">Open</a>
                </div>
              </div>
              <div className="bg-gray-100">
                <iframe ref={(el)=>{if(el) framesRef.current.set(k,el); else framesRef.current.delete(k)}} title={r.name} src={url} style={{ width: mobile?375:'100%', height: mobile?640:420, border: '0' }} />
              </div>
            </div>)})}
        </div>
      </div>
    </div>
  )
}

