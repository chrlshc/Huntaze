'use client'

import { motion } from 'framer-motion'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'avatar' | 'button'
  count?: number
}

export default function LoadingSkeleton({
  className = '',
  variant = 'text',
  count = 1
}: LoadingSkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    card: 'h-48 rounded-lg',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded-lg'
  }

  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <>
      {items.map((i) => (
        <motion.div
          key={i}
          className={`${variants[variant]} ${className} bg-gray-200 dark:bg-gray-700 relative overflow-hidden`}
          animate={{
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.1
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
          />
        </motion.div>
      ))}
    </>
  )
}

// Page skeleton component
export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <LoadingSkeleton variant="text" className="w-32 h-8" />
          <div className="flex gap-4">
            <LoadingSkeleton variant="button" />
            <LoadingSkeleton variant="button" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto p-8">
        <LoadingSkeleton variant="text" className="w-3/4 h-12 mb-4" />
        <LoadingSkeleton variant="text" className="w-1/2 h-6 mb-8" />
        
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </div>
    </div>
  )
}