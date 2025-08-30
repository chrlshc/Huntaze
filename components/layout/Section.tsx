'use client'

import React, { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  width?: 'sm' | 'md' | 'lg'
}

export default function Section({ children, className = '', width = 'lg' }: Props) {
  const max = width === 'sm' ? 'max-w-2xl' : width === 'md' ? 'max-w-4xl' : 'max-w-7xl'
  return (
    <section className={`px-6 md:px-8 py-12 md:py-16 ${className}`}>
      <div className={`${max} mx-auto`}>{children}</div>
    </section>
  )
}

