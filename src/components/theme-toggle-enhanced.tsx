'use client'

import { useTheme } from './theme-provider'
import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export function ThemeToggleEnhanced() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themes = [
    { 
      value: 'light', 
      icon: Sun, 
      label: 'Light',
      description: 'Bright and energetic'
    },
    { 
      value: 'dark', 
      icon: Moon, 
      label: 'Dark',
      description: 'Easy on the eyes'
    },
    { 
      value: 'system', 
      icon: Monitor, 
      label: 'System',
      description: 'Follows your device'
    }
  ] as const

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group"
        aria-label="Toggle theme menu"
      >
        <div className="relative w-5 h-5">
          <AnimatePresence mode="wait">
            {resolvedTheme === 'dark' ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Hover effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ 
                duration: 0.2, 
                ease: [0.16, 1, 0.3, 1]
              }}
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50"
            >
              <div className="p-2">
                {themes.map((t, index) => {
                  const Icon = t.icon
                  const isActive = theme === t.value
                  return (
                    <motion.button
                      key={t.value}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setTheme(t.value as any)
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="relative">
                        <Icon className={`w-5 h-5 ${
                          isActive ? 'text-purple-600 dark:text-purple-400' : ''
                        }`} />
                        {isActive && (
                          <motion.div
                            layoutId="active-theme"
                            className="absolute -inset-1.5 rounded-md bg-purple-500/20 dark:bg-purple-400/20 -z-10"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-sm">{t.label}</div>
                        <div className="text-xs opacity-60">{t.description}</div>
                      </div>
                      
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-800 p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Theme preference is saved locally
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Minimal toggle for mobile or compact spaces
export function ThemeToggleCompact() {
  const { resolvedTheme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }
  
  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-colors duration-200"
      aria-label="Toggle theme"
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-sm flex items-center justify-center"
        animate={{
          x: resolvedTheme === 'dark' ? 32 : 0
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 30 
        }}
      >
        <AnimatePresence mode="wait">
          {resolvedTheme === 'dark' ? (
            <motion.div
              key="moon-compact"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="w-3.5 h-3.5 text-purple-600" />
            </motion.div>
          ) : (
            <motion.div
              key="sun-compact"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="w-3.5 h-3.5 text-amber-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Background gradient effect */}
      <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
        resolvedTheme === 'dark' 
          ? 'bg-gradient-to-r from-purple-600/20 to-purple-400/20 opacity-100' 
          : 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 opacity-100'
      }`} />
    </motion.button>
  )
}