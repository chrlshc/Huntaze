'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { ReactNode } from 'react'

interface PremiumCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
  fancy?: boolean
}

export default function PremiumCard({ 
  children, 
  className = '',
  glowColor = 'purple',
  fancy = false,
}: PremiumCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useTransform(y, [-100, 100], [10, -10])
  const rotateY = useTransform(x, [-100, 100], [-10, 10])
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    x.set(event.clientX - centerX)
    y.set(event.clientY - centerY)
  }
  
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }
  
  const glowColors = {
    purple: 'rgba(139, 92, 246, 0.5)',
    pink: 'rgba(236, 72, 153, 0.5)',
    blue: 'rgba(59, 130, 246, 0.5)',
  }
  
  return (
    <motion.div
      className={`relative group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={fancy ? {
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      } : undefined}
    >
      <motion.div
        className="relative bg-white dark:bg-gray-950 rounded-xl shadow-md transition-all duration-200 group-hover:shadow-lg border border-gray-200 dark:border-gray-800"
        style={fancy ? {
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        } : undefined}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Gradient border effect (fancy only) */}
        {fancy && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-lg" />
        )}
        
        {/* Card content */}
        <div className="relative z-10 bg-white dark:bg-gray-950 rounded-xl p-1">
          <div className="bg-white dark:bg-gray-950 rounded-lg">
            {children}
          </div>
        </div>
        
        {/* Glow effect (fancy only) */}
        {fancy && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${x.get() + 50}% ${y.get() + 50}%, ${glowColors[glowColor as keyof typeof glowColors]}, transparent 70%)`,
            }}
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
