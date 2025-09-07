'use client';

import { motion } from 'framer-motion';
// Helper function for class names
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'button' | 'card' | 'avatar' | 'chart' | 'metric';
  lines?: number;
}

export function Skeleton({ className, variant = 'text', lines = 1 }: SkeletonProps) {
  const baseClass = 'skeleton relative overflow-hidden';
  
  const variants = {
    text: 'h-4 rounded-md mb-2 last:mb-0',
    button: 'h-12 rounded-xl w-32',
    card: 'h-48 rounded-2xl',
    avatar: 'w-12 h-12 rounded-full',
    chart: 'h-64 rounded-xl',
    metric: 'h-20 rounded-xl'
  };

  if (variant === 'text' && lines > 1) {
    return (
      <>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClass,
              variants.text,
              i === lines - 1 ? 'w-3/4' : 'w-full',
              className
            )}
          />
        ))}
      </>
    );
  }

  return (
    <div className={cn(baseClass, variants[variant], className)} />
  );
}

// Skeleton Card Component
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('glass-card p-6', className)}
    >
      <div className="flex items-center gap-4 mb-6">
        <Skeleton variant="avatar" />
        <div className="flex-1">
          <Skeleton variant="text" className="w-32 h-5 mb-2" />
          <Skeleton variant="text" className="w-24 h-3" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="button" className="w-20 h-8" />
        <Skeleton variant="button" className="w-20 h-8" />
      </div>
    </motion.div>
  );
}

// Skeleton Dashboard Component
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <Skeleton variant="text" className="w-32 h-3 mb-4" />
            <Skeleton variant="text" className="w-24 h-8 mb-2" />
            <Skeleton variant="text" className="w-16 h-3" />
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <Skeleton variant="text" className="w-48 h-6 mb-6" />
        <Skeleton variant="chart" />
      </motion.div>

      {/* Messages List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <Skeleton variant="text" className="w-48 h-6 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <Skeleton variant="avatar" />
              <div className="flex-1">
                <Skeleton variant="text" className="w-32 h-4 mb-2" />
                <Skeleton variant="text" className="w-full h-3" />
              </div>
              <Skeleton variant="text" className="w-16 h-3" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Loading state for messages
export function SkeletonMessage() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton variant="avatar" className="w-10 h-10" />
      <div className="flex-1">
        <Skeleton variant="text" className="w-32 h-4 mb-2" />
        <Skeleton variant="text" className="w-full max-w-md h-16 rounded-2xl" />
      </div>
    </div>
  );
}