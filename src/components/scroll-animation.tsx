'use client'

import { motion, useInView, useAnimation } from 'framer-motion'
import { useEffect, useRef, ReactNode } from 'react'

interface ScrollAnimationProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  y?: number
}

export default function ScrollAnimation({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  y = 50
}: ScrollAnimationProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [isInView, controls])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration,
            delay,
            ease: [0.22, 1, 0.36, 1]
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}