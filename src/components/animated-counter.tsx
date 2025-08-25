'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'

interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}

export default function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  decimals = 0,
  suffix = '',
  prefix = '',
  className = ''
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(from)
  const rounded = useTransform(motionValue, (latest) => {
    return decimals > 0 
      ? latest.toFixed(decimals)
      : Math.round(latest).toLocaleString()
  })
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (isInView) {
      const animation = animate(motionValue, to, {
        duration,
        ease: [0.25, 0.1, 0.25, 1], // Custom easing for smooth animation
        onUpdate: (latest) => {
          if (ref.current) {
            ref.current.textContent = `${prefix}${
              decimals > 0 
                ? latest.toFixed(decimals)
                : Math.round(latest).toLocaleString()
            }${suffix}`
          }
        }
      })

      return animation.stop
    }
  }, [isInView, motionValue, to, duration, decimals, prefix, suffix])

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
    >
      {prefix}{from}{suffix}
    </motion.span>
  )
}

// Compound component for more complex counters
export function AnimatedStat({
  value,
  label,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon,
  trend,
  className = ''
}: {
  value: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
  icon?: React.ReactNode
  trend?: { value: number; positive: boolean }
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`text-center ${className}`}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4"
        >
          {icon}
        </motion.div>
      )}
      
      <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
        <AnimatedCounter
          from={0}
          to={value}
          duration={2.5}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
        />
      </div>
      
      <div className="text-gray-600">{label}</div>
      
      {trend && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className={`inline-flex items-center gap-1 mt-2 text-sm font-medium ${
            trend.positive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <span>{trend.positive ? '↑' : '↓'}</span>
          <span>{trend.value}%</span>
        </motion.div>
      )}
    </motion.div>
  )
}