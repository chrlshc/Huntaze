'use client'

import React, { useRef, useEffect, useState } from 'react'
import {
  motion,
  useSpring,
  useTransform,
  useScroll,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion'

export default function LinearHero() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // 3D tilt - only on desktop
  const rx = useSpring(0, { stiffness: 150, damping: 20 })
  const ry = useSpring(0, { stiffness: 150, damping: 20 })

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || isMobile) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const max = 8
    ry.set((0.5 - px) * max)
    rx.set((py - 0.5) * max)
  }
  function handlePointerLeave() {
    rx.set(0)
    ry.set(0)
  }

  // Scroll parallax - only on desktop
  const deviceY = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [0, -80])
  const cardAY = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [0, -160])
  const cardBY = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [0, -80])

  const rxScroll = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [0, -6])
  const ryScroll = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [0, 6])
  const rxTotal = useTransform(() => (reduce || isMobile ? 0 : rx.get() + rxScroll.get()))
  const ryTotal = useTransform(() => (reduce || isMobile ? 0 : ry.get() + ryScroll.get()))

  useMotionValueEvent(scrollYProgress, 'change', () => {})

  return (
    <section
      ref={sectionRef}
      className={`relative ${isMobile ? 'min-h-screen' : 'min-h-[180vh]'} bg-[#0b0d10] text-[#e7e9ee]`}
      aria-label="Hero section"
    >
      <div className="sticky top-0 h-[100svh] grid place-items-center px-4">
        <div className="w-full max-w-[1100px] pt-20 md:pt-0">
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              The platform built for<br />premium creators
            </h1>
            <p className="mt-3 text-white/60 md:text-lg">
              Automate conversations, boost revenue, and scale your exclusive content business with AI.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/auth'}
                className="inline-flex items-center justify-center rounded-full bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-black dark:text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/20"
              >
                Start for free
              </button>
              <button 
                onClick={() => window.location.href = '/pricing'}
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/90 transition-all hover:text-white hover:border-white/60 hover:bg-white/10"
              >
                View plans
                <span className="ml-2">→</span>
              </button>
            </div>
          </div>

          {/* 3D Mockup */}
          <motion.div
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="relative mx-auto aspect-[16/9] w-full select-none rounded-3xl border border-white/10 bg-[#0f1217] shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
            style={{
              transformStyle: 'preserve-3d',
              transformPerspective: 1200,
              y: deviceY,
              rotateX: rxTotal,
              rotateY: ryTotal,
            }}
          >
            {/* App Dashboard */}
            <div className="absolute inset-0 rounded-[inherit] bg-gray-900 overflow-hidden">
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Revenue Analytics</h2>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live
                  </span>
                </div>

                {/* Revenue Chart */}
                <div className="rounded-2xl bg-gray-800/50 backdrop-blur-sm p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Weekly Revenue</h3>
                    <span className="text-pink-400 text-sm font-medium bg-pink-400/20 px-3 py-1 rounded-full">
                      +147% Growth
                    </span>
                  </div>
                  
                  <svg viewBox="0 0 350 200" className="w-full h-64">
                    <defs>
                      <linearGradient id="heroLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                      <linearGradient id="heroAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid */}
                    <g stroke="rgba(255,255,255,0.1)">
                      <line x1="0" y1="50" x2="350" y2="50" />
                      <line x1="0" y1="100" x2="350" y2="100" />
                      <line x1="0" y1="150" x2="350" y2="150" />
                    </g>
                    
                    {/* Area */}
                    <path 
                      d="M 30,150 C 55,145 55,145 80,135 C 105,130 105,130 130,115 C 155,120 155,120 180,125 C 205,105 205,105 230,85 C 255,65 255,65 280,50 C 305,30 305,30 330,20 L 330,180 L 30,180 Z"
                      fill="url(#heroAreaGradient)"
                    />
                    
                    {/* Line */}
                    <path 
                      d="M 30,150 C 55,145 55,145 80,135 C 105,130 105,130 130,115 C 155,120 155,120 180,125 C 205,105 205,105 230,85 C 255,65 255,65 280,50 C 305,30 305,30 330,20"
                      fill="none"
                      stroke="url(#heroLineGradient)"
                      strokeWidth="3"
                    />
                    
                    {/* Points */}
                    <circle cx="30" cy="150" r="4" fill="#ffffff" stroke="#0b0d10" strokeWidth="2" />
                    <circle cx="80" cy="135" r="4" fill="#ffffff" stroke="#0b0d10" strokeWidth="2" />
                    <circle cx="130" cy="115" r="4" fill="#ffffff" stroke="#0b0d10" strokeWidth="2" />
                    <circle cx="180" cy="125" r="4" fill="#ffffff" stroke="#0b0d10" strokeWidth="2" />
                    <circle cx="230" cy="85" r="4" fill="#ffffff" stroke="#0b0d10" strokeWidth="2" />
                    <circle cx="280" cy="50" r="4" fill="#ffffff" stroke="#0b0d10" strokeWidth="2" />
                    <circle cx="330" cy="20" r="5" fill="#ec4899" stroke="#ffffff" strokeWidth="2" className="animate-pulse" />
                    
                    {/* Labels */}
                    <text x="30" y="195" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Mon</text>
                    <text x="80" y="195" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Tue</text>
                    <text x="130" y="195" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Wed</text>
                    <text x="180" y="195" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Thu</text>
                    <text x="230" y="195" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Fri</text>
                    <text x="280" y="195" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Sat</text>
                    <text x="330" y="195" fill="white" fontSize="12" textAnchor="middle" fontWeight="bold">Sun</text>
                  </svg>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-white">$36,518</p>
                      <p className="text-white/60 text-sm">This week's total</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-400">Best: Sunday</p>
                      <p className="text-sm text-white/60">$8,934</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards - hidden on mobile */}
            {!isMobile && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <motion.div
                  className="absolute left-[6%] top-[12%] h-40 w-64 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                  style={{ translateZ: 60, y: cardAY }}
                >
                  <span className="absolute left-4 top-4 rounded-full border border-purple-200/30 bg-purple-200/10 px-2 py-1 text-xs">
                    AI-Powered
                  </span>
                  <span className="absolute bottom-4 left-4 font-semibold">Smart Conversations</span>
                </motion.div>
                <motion.div
                  className="absolute bottom-[10%] right-[8%] h-40 w-64 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                  style={{ translateZ: 120, y: cardBY }}
                >
                  <span className="absolute left-4 top-4 rounded-full border border-pink-200/30 bg-pink-200/10 px-2 py-1 text-xs">
                    Revenue Boost
                  </span>
                  <span className="absolute bottom-4 left-4 font-semibold">+147% Average Growth</span>
                </motion.div>
              </motion.div>
            )}

          </motion.div>
        </div>
      </div>
    </section>
  )
}