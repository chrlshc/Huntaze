'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star, DollarSign, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import PlatformLogos from './platform-logos'
import Avatar from './avatar'

const testimonials = [
  {
    id: 1,
    name: 'Jessica Martinez',
    role: 'Multi-platform Creator',
    avatar: 'JM',
    savings: '$15k/month',
    revenue: '$35k/month',
    growth: '2–3x',
    quote: "I was paying my agency 50% commission. Now I keep 98% and my revenue has tripled!",
    highlight: 'No more 50% commission to agencies',
    platform: 'OnlyFans',
    verified: true
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'Content Creator',
    avatar: 'SC',
    savings: '$8k/month',
    revenue: '$22k/month',
    growth: '2–3x',
    quote: "The AI responds exactly like I would, even off-hours. My fans love the instant replies!",
    highlight: 'Increased fan engagement by 4x',
    platform: 'Instagram',
    verified: true
  },
  {
    id: 3,
    name: 'Luna Rodriguez',
    role: 'Top 0.5% Creator',
    avatar: 'LR',
    savings: '$25k/month',
    revenue: '$78k/month',
    growth: '2–3x',
    quote: "Best investment I\'ve made. The analytics show me exactly what content sells.",
    highlight: 'Grew from $15k to $78k/month',
    platform: 'Multiple',
    verified: true
  }
]

export default function CreatorTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const current = testimonials[currentIndex]

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-16 md:py-20 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Real creators, real results
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-[var(--text-secondary-dark)]">
            See how creators are transforming their business with Huntaze
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial Card */}
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-2xl shadow-xl p-8 md:p-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
              {/* Left side - Creator info */}
              <div className="order-2 lg:order-1">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar name={current.name} size="lg" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {current.name}
                      {current.verified && (
                        <span className="text-blue-500 text-sm">✓</span>
                      )}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{current.role}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{current.platform}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    Saves {current.savings}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">{current.highlight}</p>
                </div>

                <blockquote className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{current.quote}"
                </blockquote>

                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Read full story →
                </button>
              </div>

              {/* Right side - Stats */}
              <div className="bg-gray-50 dark:bg-gray-950 border dark:border-gray-800 rounded-xl p-4 md:p-6 order-1 lg:order-2">
                <h4 className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4 uppercase tracking-wider">
                  Performance Metrics
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Monthly Revenue</span>
                    </div>
                    <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{current.revenue}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-600 dark:text-gray-300">Revenue Growth</span>
                    </div>
                    <span className="text-xl md:text-2xl font-semibold text-green-600 dark:text-green-500">{current.growth}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-gray-600 dark:text-gray-300">Creator Rating</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Remove animated dashboard preview */}
              </div>
            </div>
          </motion.div>

          {/* Navigation - Hidden on mobile, visible on desktop */}
          <button
            onClick={prev}
            className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 lg:-translate-x-full p-2 md:p-3 rounded-full bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg hover:shadow-xl transition-all z-10"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
          </button>

          <button
            onClick={next}
            className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 lg:translate-x-full p-2 md:p-3 rounded-full bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg hover:shadow-xl transition-all z-10"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
          </button>

          {/* Mobile navigation - Swipe hint */}
          <div className="flex md:hidden justify-center gap-4 mt-4">
            <button
              onClick={prev}
              className="p-2 rounded-full bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg"
            >
              <ChevronLeft className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            </button>
            <button
              onClick={next}
              className="p-2 rounded-full bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg"
            >
              <ChevronRight className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-purple-600'
                    : 'w-2 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <PlatformLogos />
      </div>
    </section>
  )
}
