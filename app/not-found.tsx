'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Search, ArrowLeft } from 'lucide-react'
import PremiumButton from '@/components/premium-button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Number */}
          <div className="text-9xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            404
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Oops! Page not found
          </h1>
          
          {/* Description */}
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist yet. It might have been moved or is still being built.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <PremiumButton size="lg" className="w-full sm:w-auto">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </PremiumButton>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Here are some helpful links:</p>
            <div className="flex flex-wrap gap-4 justify-center text-purple-600 dark:text-purple-400">
              <Link href="/pricing" className="hover:underline">Pricing</Link>
              <span className="text-gray-400">•</span>
              <Link href="/about" className="hover:underline">About</Link>
              <span className="text-gray-400">•</span>
              <Link href="/features/ai-chat" className="hover:underline">AI Chat</Link>
              <span className="text-gray-400">•</span>
              <Link href="/join" className="hover:underline">Get Started</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}