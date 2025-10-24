import React from 'react'
import clsx from 'clsx'

export default function Section({ children, className = '', ...rest }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={clsx(
      'container mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20',
      'rounded-3xl border border-white/10',
      'bg-[#0f141a]',
      className
    )} {...rest}>
      {children}
    </section>
  )
}
