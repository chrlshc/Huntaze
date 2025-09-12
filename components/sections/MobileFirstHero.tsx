'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  motion, 
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
} from 'framer-motion'
import Link from 'next/link'
import ProductScreenshot from '@/components/ui/ProductScreenshot'

export default function MobileFirstHero() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()

  // Disable "fine pointer" interactions (tilt) on touch screens
  const [isCoarse, setIsCoarse] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsCoarse(window.matchMedia('(pointer: coarse)').matches)
    }
  }, [])

  // Hero scroll progression
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // Parallax effect: translate3d instead of translateY alone
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  // Tilt 3D interactif (seulement sur desktop)
  const rxSpring = useSpring(0, { stiffness: 100, damping: 30 })
  const rySpring = useSpring(0, { stiffness: 100, damping: 30 })
  const MAX = 10

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (isCoarse || reduce) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rySpring.set((px - 0.5) * MAX) // rotateY
    rxSpring.set((py - 0.5) * MAX) // rotateX
  }
  function onPointerLeave() {
    rxSpring.set(0)
    rySpring.set(0)
  }

  // Force recalculation in StrictMode/Next
  useMotionValueEvent(scrollYProgress, 'change', () => {})

  return (
    <section
      ref={sectionRef}
      className="relative bg-black text-white overflow-hidden"
      aria-label="Hero section"
    >
      {/* Background: discrete halos + safe zone for notches */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.15),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-16rem] right-[-8rem] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(236,72,153,0.1),transparent_70%)] blur-3xl" />
      </div>

      {/* Mobile-first container (no sticky on mobile) */}
      <div
        className="
          mx-auto flex max-w-[1200px] flex-col items-center justify-center
          px-4 pt-24 pb-16
          min-h-[100vh] md:min-h-[120vh]
        "
        style={{
          // Subtle parallax (mobile/desktop)
          transform: reduce ? undefined : `translate3d(0, ${y}, 0)`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            Turn your content into
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              predictable revenue
            </span>
          </h1>

          {/* Subtitle - Specific with audience */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            For OnlyFans, Instagram & TikTok creators: AI that replies to fans, optimizes pricing and schedules content. 
            <span className="font-semibold text-white">Save 20+ hours/week without hiring.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="cta-primary"
            >
              Start free trial
            </Link>
            <Link
              href="/demo"
              className="cta-secondary"
            >
              Watch demo
            </Link>
          </div>

          {/* Product Screenshot */}
          <div className="mt-16 max-w-5xl mx-auto">
            <ProductScreenshot
              src="/images/dashboard-screenshot.png"
              alt="Huntaze Dashboard showing AI chat, pricing rules and content calendar"
              priority
              className="w-full"
            />
          </div>

          {/* Stats with methodology footnote */}
          <div className="mt-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">5,000+</p>
                <p className="text-gray-400">Active creators</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">+32%</p>
                <p className="text-gray-400">Revenue in 30 days</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">20+ hrs</p>
                <p className="text-gray-400">Saved weekly</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">95%</p>
                <p className="text-gray-400">Retention rate</p>
              </div>
            </div>
            
            {/* Methodology footnote */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
              * Average revenue increase of +32% in 30 days based on 428 active creators, Feb-Apr 2025. 
              <a href="/methodology" className="text-purple-400 hover:text-purple-300 ml-1">
                See full methodology
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}