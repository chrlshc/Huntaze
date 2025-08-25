'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PremiumButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function PremiumButton({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary',
  size = 'md'
}: PremiumButtonProps) {
  const baseClasses = 'relative overflow-hidden font-medium transition-all duration-300 rounded-lg'
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800',
    secondary: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-purple-600 dark:hover:border-purple-400',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
  
  return (
    <motion.button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} group`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transform -skew-x-12" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* Glow effect for primary variant */}
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-glow pointer-events-none" />
      )}
    </motion.button>
  )
}