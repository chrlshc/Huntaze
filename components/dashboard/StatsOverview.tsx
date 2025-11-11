'use client';

import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import { Users, FileText, DollarSign, TrendingUp } from 'lucide-react';

/**
 * StatsOverview Component
 * 
 * Displays 4 stat cards with animated numbers in a responsive grid.
 * Each card animates on mount with spring physics.
 * 
 * Requirements: 1.2, 1.3
 */

interface StatItem {
  label: string;
  value: number;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
  trend?: number;
}

interface StatsOverviewProps {
  stats?: StatItem[];
}

const defaultStats: StatItem[] = [
  {
    label: 'Total Fans',
    value: 1247,
    icon: <Users className="w-5 h-5" />,
    trend: 12,
  },
  {
    label: 'Posts',
    value: 89,
    icon: <FileText className="w-5 h-5" />,
    trend: 5,
  },
  {
    label: 'Revenue',
    value: 12450,
    icon: <DollarSign className="w-5 h-5" />,
    prefix: '$',
    trend: 18,
  },
  {
    label: 'Growth',
    value: 23,
    icon: <TrendingUp className="w-5 h-5" />,
    suffix: '%',
    trend: 8,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

export default function StatsOverview({ stats = defaultStats }: StatsOverviewProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className="bg-theme-surface rounded-xl p-6 border border-theme-border hover:border-indigo-500/50 transition-colors"
        >
          {/* Icon and Trend */}
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              {stat.icon}
            </div>
            {stat.trend !== undefined && (
              <div
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trend > 0
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {stat.trend > 0 ? '+' : ''}
                {stat.trend}%
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-1">
            <AnimatedNumber
              to={stat.value}
              duration={1.2}
              prefix={stat.prefix}
              suffix={stat.suffix}
              className="text-3xl font-bold text-theme-text"
            />
          </div>

          {/* Label */}
          <p className="text-sm text-theme-muted">{stat.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
