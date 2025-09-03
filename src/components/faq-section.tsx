'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    id: 1,
    question: "Is my content safe and private?",
    answer: "Yes. We use bank-level encryption and never store your content. You maintain full ownership and control."
  },
  {
    id: 2,
    question: "How does the AI learn my style?",
    answer: "The AI analyzes your past conversations to understand your tone, personality, and communication patterns. You can always review and approve messages before sending."
  },
  {
    id: 3,
    question: "Can I cancel anytime?",
    answer: "Absolutely. No long-term contracts, no cancellation fees. Cancel or change your plan anytime from your dashboard."
  },
  {
    id: 4,
    question: "What's the difference between plans?",
    answer: "Plans differ in message limits, platform integrations, and commission rates. Higher plans have lower fees and more features. Start with any plan and upgrade as you grow."
  },
  {
    id: 5,
    question: "Do you take a cut of my earnings?",
    answer: "Yes, but it's much lower than agencies. Our fee ranges from 1.5% to 7% depending on your plan, compared to the 30-50% that agencies typically charge."
  },
  {
    id: 6,
    question: "Which platforms can I connect?",
    answer: "You can connect OnlyFans for monetization, plus Instagram, TikTok, Reddit, and Threads for traffic generation. More platforms coming soon."
  },
  {
    id: 7,
    question: "How quickly can I get started?",
    answer: "Setup takes less than 5 minutes. Connect your platforms, let the AI learn from your conversations, and you're ready to automate your fan interactions."
  },
  {
    id: 8,
    question: "What support do you offer?",
    answer: "We offer 24/7 email support for all plans, with priority support and dedicated account managers available on higher-tier plans."
  }
]

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (id: number) => {
    setOpenItems(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    )
  }

  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
        Frequently asked questions
      </h2>
      
      <div className="space-y-3">
        {faqs.map((faq) => (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => toggleItem(faq.id)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-4">
                {faq.question}
              </h3>
              <div className="flex-shrink-0">
                {openItems.includes(faq.id) ? (
                  <Minus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </button>
            
            <AnimatePresence>
              {openItems.includes(faq.id) && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 dark:text-[var(--text-secondary-dark)] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      
      <p className="mt-8 text-center text-gray-600 dark:text-[var(--text-tertiary-dark)]">
        Have more questions? <a href="/support" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">Contact our team</a>
      </p>
    </div>
  )
}