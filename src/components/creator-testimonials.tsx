'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star, DollarSign, TrendingUp } from 'lucide-react'
import Image from 'next/image'

const testimonials = [
  {
    id: 1,
    name: 'Jessica Martinez',
    role: 'Multi-platform Creator',
    avatar: '👩‍🦰',
    savings: '$15k/month',
    revenue: '$35k/month',
    growth: '+285%',
    quote: "I was paying my agency 50% commission. Now I keep 98% and my revenue has tripled!",
    highlight: 'No more 50% commission to agencies',
    platform: 'OnlyFans',
    verified: true
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'Content Creator',
    avatar: '👩',
    savings: '$8k/month',
    revenue: '$22k/month',
    growth: '+194%',
    quote: "The AI responds exactly like I would, but 24/7. My fans love the instant replies!",
    highlight: 'Increased fan engagement by 4x',
    platform: 'Fansly',
    verified: true
  },
  {
    id: 3,
    name: 'Luna Rodriguez',
    role: 'Top 0.5% Creator',
    avatar: '💃',
    savings: '$25k/month',
    revenue: '$78k/month',
    growth: '+412%',
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
    <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Real creators, real results
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            See how creators are transforming their business with Huntaze
          </p>
        </motion.div>

        <div className="relative">
          {/* Main Testimonial Card */}
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left side - Creator info */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-6xl">{current.avatar}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {current.name}
                      {current.verified && (
                        <span className="text-blue-500 text-sm">✓</span>
                      )}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{current.role}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{current.platform}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    Saves {current.savings}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">{current.highlight}</p>
                </div>

                <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{current.quote}"
                </blockquote>

                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Read full story →
                </button>
              </div>

              {/* Right side - Stats */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider">
                  Performance Metrics
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-gray-600 dark:text-gray-400">Monthly Revenue</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{current.revenue}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-600 dark:text-gray-400">Revenue Growth</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{current.growth}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-gray-600 dark:text-gray-400">Creator Rating</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dashboard preview */}
                <div className="mt-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-4 text-white">
                  <p className="text-sm font-medium mb-2">Live Dashboard Preview</p>
                  <div className="text-3xl font-bold animate-pulse">
                    ${Math.floor(Math.random() * 50000 + 30000).toLocaleString()}
                  </div>
                  <p className="text-sm opacity-90">This month\'s earnings</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-purple-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Trusted by creators on</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="text-2xl font-bold text-gray-400">OnlyFans</div>
            <div className="text-2xl font-bold text-gray-400">Fansly</div>
            <div className="text-2xl font-bold text-gray-400">Instagram</div>
            <div className="text-2xl font-bold text-gray-400">TikTok</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}