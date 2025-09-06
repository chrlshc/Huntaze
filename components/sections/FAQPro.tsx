"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { events } from "@/src/lib/analytics";

const faqs = [
  {
    question: "How does the AI learn my communication style?",
    answer: "Our AI analyzes your past conversations to understand your tone, vocabulary, and response patterns. It continuously improves while respecting your privacy. You always approve before sending."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. Bank‑level encryption (AES‑256), GDPR compliant, no data sold. You can export and delete your data anytime. Hosted on secure cloud infrastructure."
  },
  {
    question: "Can I use Huntaze on multiple platforms?",
    answer: "Yes — Instagram, TikTok, Reddit, OnlyFans. The number of connections depends on your plan. Manage everything from a single dashboard."
  },
  {
    question: "What if I cancel?",
    answer: "Cancel anytime from your account. No cancellation fees or minimum commitment. Access remains active until the end of the billing period."
  },
  {
    question: "Can the AI handle payments?",
    answer: "The AI guides conversations toward sales and suggests your offers, but transactions remain on the original platforms for security and compliance."
  },
  {
    question: "How long does setup take?",
    answer: "Around 15 minutes: connect accounts, let the AI analyze a few chats, customize preferences, and you’re set. Our team can help if needed."
  }
];

export function FAQPro() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900" aria-labelledby="faq-heading">
      <div className="container-width max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </div>
          <h2 id="faq-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to get the most out of Huntaze
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => {
                  const next = openIndex === index ? null : index;
                  setOpenIndex(next);
                  if (next !== null) events.faqOpen({ question: faq.question, index });
                }}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@huntaze.com"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Contact our support team
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
