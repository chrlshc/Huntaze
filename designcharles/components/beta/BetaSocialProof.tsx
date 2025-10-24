// Snapshot of components/sections/beta/BetaSocialProof.tsx
"use client";
import { useEffect, useRef, useState } from 'react'

export default function BetaSocialProof() {
  const stats = [
    { k: 'Beta testers', v: '50+' },
    { k: 'Platforms', v: '3' },
    { k: 'Focus', v: 'Creators' },
  ]
  return (
    <section className="stats-section section">
      <h2>Join 50+ creators already testing Huntaze</h2>
      <p>We’re starting small and intentional. Creators across OnlyFans, Instagram, and TikTok are testing Huntaze to take control without agency overhead.</p>
      <div className="stats-grid">
        {stats.map((s) => (
          <AnimatedStat key={s.k} label={s.k} value={s.v} />
        ))}
      </div>
    </section>
  )
}

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [count, setCount] = useState(0)
  const isNumber = /^\d+/.test(value)
  const target = isNumber ? parseInt(value.replace(/\D/g, ''), 10) : 0
  const suffix = isNumber && /\+$/.test(value) ? '+' : ''

  useEffect(() => {
    if (!isNumber) return
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0
        const end = target
        const duration = 1200
        const step = Math.max(1, Math.floor(end / (duration / 16)))
        const timer = setInterval(() => {
          start += step
          if (start >= end) {
            setCount(end)
            clearInterval(timer)
          } else {
            setCount(start)
          }
        }, 16)
        obs.disconnect()
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [isNumber, target])

  return (
    <div ref={ref} className="stat-card card">
      <div className="stat-number">{isNumber ? `${count}${suffix}` : value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

