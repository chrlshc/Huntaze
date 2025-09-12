'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: "Is my content safe with AI?",
    answer: "Absolutely. Your content is encrypted end-to-end, stored in SOC 2 certified data centers, and never used to train AI models. We're GDPR compliant and you maintain full ownership of all your content."
  },
  {
    question: "How quickly can I get started?",
    answer: "Most creators are up and running in under 10 minutes. Connect your platforms, customize your AI voice, and start automating immediately. Our onboarding team helps top creators get optimized within 24 hours."
  },
  {
    question: "What platforms do you support?",
    answer: "We support OnlyFans, Fansly, Instagram, TikTok, Twitter/X, Reddit, and Telegram. New platforms are added monthly based on creator demand. All platforms sync to one unified dashboard."
  },
  {
    question: "How does the performance fee work?",
    answer: "You only pay a percentage of the revenue we help generate. No monthly fees, no setup costs. Starter accounts pay 0%, Pro pays 7%, and high-volume creators pay as low as 2%. We only make money when you do."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, there are no contracts or cancellation fees. Export all your data anytime. Most creators never leave because they can't imagine managing 10,000+ fans manually again."
  },
  {
    question: "Will fans know it's AI?",
    answer: "Your AI learns your exact voice and style. Fans get faster, more personalized responses than any human team could provide. You always maintain oversight and can jump in anytime."
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-24 bg-white dark:bg-gray-800">
      <div className="max-w-3xl mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Common questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Everything you need to know about scaling with AI
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-400">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Still have questions? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/docs"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              Read documentation
            </a>
            <span className="text-gray-400">or</span>
            <a
              href="/contact"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              Contact support
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}