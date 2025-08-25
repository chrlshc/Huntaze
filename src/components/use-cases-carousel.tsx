'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MessageSquare, TrendingUp, Clock, DollarSign } from 'lucide-react'

const useCases = [
  {
    id: 1,
    title: 'Sarah increased revenue by 15x',
    subtitle: 'OnlyFans Creator',
    metric: '$3k → $45k/month',
    description: 'AI handles all messages while she focuses on content creation',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500',
    image: '/mockups/dashboard-sarah.png'
  },
  {
    id: 2,
    title: 'Emma saves 6 hours daily',
    subtitle: 'Fansly Top Creator',
    metric: '8hrs → 30min/day',
    description: 'Automated responses that sound exactly like her',
    icon: Clock,
    color: 'from-blue-500 to-purple-500',
    image: '/mockups/chat-emma.png'
  },
  {
    id: 3,
    title: 'Jessica quit her agency',
    subtitle: 'Multi-platform Creator',
    metric: 'Saves $15k/month',
    description: 'No more 50% commission to agencies',
    icon: DollarSign,
    color: 'from-green-500 to-blue-500',
    image: '/mockups/analytics-jessica.png'
  },
  {
    id: 4,
    title: 'Mia doubled her fanbase',
    subtitle: 'Instagram Creator',
    metric: '1.2k → 2.8k fans',
    description: '24/7 engagement without burnout',
    icon: MessageSquare,
    color: 'from-pink-500 to-purple-500',
    image: '/mockups/growth-mia.png'
  }
]

export default function UseCasesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % useCases.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + useCases.length) % useCases.length)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % useCases.length)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Real creators, real results
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how creators are transforming their business with Huntaze
          </p>
        </div>

        <div className="relative">
          {/* Main Carousel Container */}
          <div className="relative h-[500px] md:h-[600px] rounded-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              {useCases.map((useCase, index) => (
                index === currentIndex && (
                  <motion.div
                    key={useCase.id}
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="absolute inset-0"
                  >
                    <div className={`h-full bg-gradient-to-br ${useCase.color} p-1 rounded-2xl`}>
                      <div className="h-full bg-white rounded-2xl p-8 md:p-12 flex flex-col lg:flex-row items-center gap-8">
                        {/* Content */}
                        <div className="flex-1 text-center lg:text-left">
                          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${useCase.color} text-white mb-4`}>
                            <useCase.icon className="w-8 h-8" />
                          </div>
                          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            {useCase.title}
                          </h3>
                          <p className="text-lg text-gray-600 mb-4">{useCase.subtitle}</p>
                          <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                            {useCase.metric}
                          </div>
                          <p className="text-lg text-gray-700 mb-6">
                            {useCase.description}
                          </p>
                          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                            Read full story →
                          </button>
                        </div>

                        {/* Mockup */}
                        <div className="flex-1 relative">
                          <div className="relative bg-gray-100 rounded-xl p-4 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                            <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500">Dashboard Mockup</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors"
            aria-label="Previous case study"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors"
            aria-label="Next case study"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {useCases.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-8 bg-purple-600' 
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}