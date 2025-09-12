'use client'

import React, { useRef, useEffect, useState } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion'
import Link from 'next/link'

export default function LinearLikeHero() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()

  // Désactive le tilt sur écrans tactiles (évite les artefacts)
  const [isCoarse, setIsCoarse] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsCoarse(window.matchMedia('(pointer: coarse)').matches)
    }
  }, [])

  // Progression de scroll sur la section sticky
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // --- Tilt 3D piloté par le pointeur --------------------------------------
  const rxSpring = useSpring(0, { stiffness: 160, damping: 18 })
  const rySpring = useSpring(0, { stiffness: 160, damping: 18 })

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || isCoarse) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width // 0..1
    const py = (e.clientY - r.top) / r.height // 0..1
    const MAX = 10 // degrés
    rySpring.set((0.5 - px) * MAX)  // rotateY
    rxSpring.set((py - 0.5) * MAX)  // rotateX
  }
  function handlePointerLeave() {
    rxSpring.set(0)
    rySpring.set(0)
  }

  // --- Parallaxe au scroll + rotation douce --------------------------------
  const baseRotateZ = -8 // angle "skew" façon Linear
  const rxScroll = useTransform(scrollYProgress, [0, 1], [0, -4])
  const ryScroll = useTransform(scrollYProgress, [0, 1], [0, 4])
  const rx = useTransform(() => (reduce || isCoarse ? 0 : rxSpring.get() + rxScroll.get()))
  const ry = useTransform(() => (reduce || isCoarse ? 0 : rySpring.get() + ryScroll.get()))

  // Profondeur/parallaxe des couches
  const deviceY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const cardAY  = useTransform(scrollYProgress, [0, 1], [0, -200])
  const cardBY  = useTransform(scrollYProgress, [0, 1], [0, -120])

  useMotionValueEvent(scrollYProgress, 'change', () => {})

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[220vh] bg-[#0b0d10] text-[#e7e9ee]"
      aria-label="Hero section"
    >
      {/* Arrière-plan : halos radiaux + noise subtil */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.25),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-20rem] right-[-10rem] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,rgba(236,72,153,0.2),transparent_70%)] blur-3xl" />
        {/* texture "grain" générée en SVG (très légère) */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
          }}
        />
      </div>

      {/* Viewport sticky */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="mx-auto flex h-full max-w-[1200px] flex-col items-center justify-center px-4">
          {/* Titre / copy */}
          <div className="mb-8 text-center">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#9bffd1]" />
              New · AI-Powered Platform
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl"
            >
              The platform built for<br />
              premium creators
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-3 max-w-2xl text-white/60 md:text-lg"
            >
              Automate conversations, boost revenue, and scale your exclusive content business with AI.
            </motion.p>
            
            {/* CTA buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex gap-4 justify-center"
            >
              <Link 
                href="/auth" 
                className="inline-flex items-center rounded-full bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-black dark:text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                Start for free
              </Link>
              <Link 
                href="/pricing" 
                className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition-all hover:text-white hover:border-white/40"
              >
                View plans
                <span className="ml-2">→</span>
              </Link>
            </motion.div>
          </div>

          {/* Scène 3D - Huntaze Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="relative aspect-[16/9] w-full max-w-[1100px] select-none rounded-[28px] border border-white/10 bg-[#0f1217] shadow-[0_60px_160px_rgba(0,0,0,0.6)]"
            style={{
              transformStyle: 'preserve-3d',
              transformPerspective: 1400,
              y: deviceY,
              rotateX: rx,
              rotateY: ry,
              rotateZ: baseRotateZ,
              willChange: 'transform',
              maskImage: 'linear-gradient(to bottom, black 65%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent)',
            }}
          >
            {/* Browser Chrome */}
            <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <div className="h-3 w-3 rounded-full bg-[#27ca3f]" />
              </div>
              <div className="mx-auto rounded-full bg-white/5 px-4 py-1 text-xs text-white/50">
                🔒 huntaze.app/dashboard
              </div>
            </div>

            {/* App Content */}
            <div className="absolute inset-0 top-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6">
              {/* Dashboard Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Welcome back, Sarah</h2>
                  <p className="text-white/70">Here's what's happening today</p>
                </div>
                <button className="rounded-lg bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-[#764ba2] shadow-lg transition-all hover:scale-105">
                  Create Post
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-sm text-white/70">Total Revenue</p>
                  <p className="mt-1 text-3xl font-bold text-white">$147,298</p>
                  <p className="mt-2 text-sm text-green-300">+23.5%</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-sm text-white/70">Subscribers</p>
                  <p className="mt-1 text-3xl font-bold text-white">4,832</p>
                  <p className="mt-2 text-sm text-green-300">+18.2%</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-sm text-white/70">Messages</p>
                  <p className="mt-1 text-3xl font-bold text-white">342</p>
                  <p className="mt-2 text-sm text-white/70">AI: 89%</p>
                </div>
              </div>
            </div>

            {/* Anneau subtil façon "device frame" */}
            <div aria-hidden className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />

            {/* Cartes flottantes (parallaxe + profondeur) */}
            <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
              <motion.div
                className="absolute left-[6%] top-[14%] h-40 w-64 rounded-2xl border border-white/15 bg-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
                style={{ translateZ: 80, y: cardAY }}
              >
                <span className="absolute left-4 top-4 rounded-full border border-violet-200/30 bg-violet-200/10 px-2 py-1 text-[11px]">
                  AI-Powered
                </span>
                <span className="absolute bottom-4 left-4 font-semibold">Smart Conversations</span>
              </motion.div>

              <motion.div
                className="absolute bottom-[8%] right-[8%] h-40 w-64 rounded-2xl border border-white/15 bg-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
                style={{ translateZ: 140, y: cardBY }}
              >
                <span className="absolute left-4 top-4 rounded-full border border-pink-200/30 bg-pink-200/10 px-2 py-1 text-[11px]">
                  Revenue Boost
                </span>
                <span className="absolute bottom-4 left-4 font-semibold">+147% Average Growth</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}