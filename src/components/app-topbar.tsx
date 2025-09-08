'use client'

import React from 'react'

type AppTopbarProps = {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  right?: React.ReactNode
}

export default function AppTopbar({ title, icon: Icon, right }: AppTopbarProps) {
  return (
    <header className={`sticky top-0 z-50 sticky-header-blur`}>
      <div className="px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            {Icon ? <Icon className="w-6 h-6 text-purple-600" /> : null}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {right}
          </div>
        </div>
      </div>
    </header>
  )
}

