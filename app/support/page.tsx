'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, FileText, Shield } from 'lucide-react'
import PremiumButton from '@/components/premium-button'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Support Center
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            We're here to help you succeed. Get answers and assistance by email, typically within 24 hours.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6"
            >
              <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Email Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Get help from our expert team within 24 hours.
              </p>
              <a href="mailto:support@huntaze.com" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                support@huntaze.com
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6"
            >
              <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Live Chat (coming soon)
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We're rolling out chat support. In the meantime, email is the fastest way to reach us.
              </p>
              <PremiumButton size="sm">
                Start Chat
              </PremiumButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6"
            >
              <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Documentation
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Detailed guides and tutorials for all features.
              </p>
              <Link href="/docs" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                View Docs
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6"
            >
              <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Priority Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                PRO members get priority email routing.
              </p>
              <Link href="/pricing" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                Upgrade to PRO
              </Link>
            </motion.div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Need immediate assistance?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Our team responds quickly during business hours, with typical replies within 24 hours.
            </p>
            <PremiumButton size="lg">
              Contact Support Team
            </PremiumButton>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
