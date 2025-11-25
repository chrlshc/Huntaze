'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

interface PricingFAQProps {
  faqs?: FAQItem[];
}

const defaultFAQs: FAQItem[] = [
  {
    question: 'Can I change plans anytime?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated based on your current billing cycle.',
  },
  {
    question: 'What happens during the beta phase?',
    answer: 'During beta, all features are completely free. You can explore the full platform without any cost. When we launch, you can choose the plan that best fits your needs.',
  },
  {
    question: 'Is there a free trial after beta?',
    answer: 'Yes, all paid plans will include a 14-day free trial after the beta phase ends. No credit card required to start.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and offer annual billing with a discount.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. You can cancel your subscription at any time. Your access will remain active until the end of your current billing period.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes, annual billing saves you 20% compared to monthly billing. The discount is automatically applied when you choose annual billing.',
  },
];

export function PricingFAQ({ faqs = defaultFAQs }: PricingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Everything you need to know about our pricing
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="font-medium text-gray-900 dark:text-white pr-8">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Still have questions?{' '}
          <a
            href="/contact"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Contact our team
          </a>
        </p>
      </div>
    </div>
  );
}
