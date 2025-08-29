'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: 'Can I change plans anytime?',
    answer: 'Yes, you can upgrade or downgrade anytime. Changes take effect immediately and are prorated.'
  },
  {
    question: 'Are there setup fees?',
    answer: 'No setup fees. You can start right after signing up.'
  },
  {
    question: 'What is the cancellation policy?',
    answer: 'Cancel anytime. Your access stays active until the end of the current billing period.'
  },
  {
    question: 'Do prices include VAT?',
    answer: 'Prices are exclusive of VAT. Applicable VAT is added at checkout based on your country.'
  },
  {
    question: 'Do you offer discounts for non‑profits?',
    answer: 'Yes, we offer a 20% discount for non‑profits. Contact our team for details.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, all plans include a 3‑month free trial. No credit card required to start.'
  }
]

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
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
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
