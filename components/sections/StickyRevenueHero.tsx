'use client'

import React, { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from 'recharts'

/**
 * StickyRevenueHero — Linear-like sticky section with glossy chart + KPIs
 *
 * Install:  npm i framer-motion recharts
 * Usage:    <StickyRevenueHero data={...optional...} />
 * Styling:  TailwindCSS (dark theme). Replace colors/gradients to make it yours.
 */

const sample = [
  { day: 'Mon', value: 2847 },
  { day: 'Tue', value: 3256 },
  { day: 'Wed', value: 4187 },
  { day: 'Thu', value: 3892 },
  { day: 'Fri', value: 5234 },
  { day: 'Sat', value: 6812 },
  { day: 'Sun', value: 8934 },
]

export default function StickyRevenueHero({
  data = sample,
  title = 'Revenue Growth',
  subtitle = 'Your earnings are on fire this week 🔥',
}: {
  data?: { day: string; value: number }[]
  title?: string
  subtitle?: string
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })

  // Scroll-linked transforms
  const deviceY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const deviceScale = useTransform(scrollYProgress, [0, 1], [1, 0.96])
  const headerY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const headerOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  return (
    <section ref={sectionRef} className="relative min-h-[200vh] bg-[#0b0d10] text-[#e7e9ee]">
      {/* sticky viewport */}
      <div className="sticky top-0 h-[100svh]">
        <div className="mx-auto grid h-full max-w-[1200px] grid-rows-[auto_1fr_auto] gap-6 px-6 py-16">
          {/* Header */}
          <motion.header
            style={{ y: reduce ? 0 : headerY, opacity: reduce ? 1 : headerOpacity }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm">Live dashboard</span>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{title}</h2>
            <p className="mt-3 text-white/70 md:text-lg">{subtitle}</p>
          </motion.header>

          {/* Chart card */}
          <motion.div
            style={{ y: reduce ? 0 : deviceY, scale: reduce ? 1 : deviceScale }}
            className="relative rounded-3xl border border-white/10 bg-[#0f1217] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
          >
            {/* Live dot */}
            <div className="pointer-events-none absolute right-6 top-6 flex items-center gap-2 text-sm text-white/80">
              <span className="relative inline-block h-2.5 w-2.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/80"></span>
                <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              </span>
              Live data
            </div>

            <div className="h-[360px] w-full md:h-[440px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: 24, right: 24, top: 24, bottom: 12 }}>
                  <defs>
                    {/* Stroke gradient for the line */}
                    <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    {/* Subtle area glow under the line */}
                    <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.66)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.66)', fontSize: 12 }}
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'dataMax + 1000']}
                  />
                  <Tooltip
                    contentStyle={{ background: '#11151b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    labelClassName="text-white/70"
                    formatter={(value: number) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  />

                  <Area type="monotone" dataKey="value" stroke="none" fill="url(#fillGradient)" />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="url(#strokeGradient)"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#ffffff', stroke: '#0b0d10', strokeWidth: 3 }}
                    activeDot={{ r: 8, strokeWidth: 2, stroke: '#ffffff', fill: '#ec4899' }}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* KPI strip */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Metric label="Daily Average" value="$5,217" helper="↑ 23% growth" />
            <Metric label="Best Day" value="$8,934" helper="Sunday peak" />
            <Metric label="Conversions" value="342" helper="89% AI‑driven" />
            <Metric label="Projection" value="$147k" helper="Monthly target" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="text-sm text-white/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-white/50">{helper}</div>
    </div>
  )
}