'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface FeatureCardProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  category: 'automation' | 'analytics' | 'growth';
  gradient: string;
  metric?: string;
  onClick?: (id: string) => void;
}

/**
 * Individual feature card component
 * Displays a single feature with icon, title, description, and optional metric
 */
export function FeatureCard({
  id,
  icon: Icon,
  title,
  description,
  category,
  gradient,
  metric,
  onClick,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      onClick={() => onClick?.(id)}
      className={`group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl ${
        onClick ? 'cursor-pointer' : ''
      }`}
      data-testid={`feature-card-${id}`}
      data-category={category}
    >
      {/* Gradient border on hover */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`}
      />

      {/* Icon */}
      <div
        className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
        data-testid={`feature-icon-${id}`}
      >
        <Icon className="w-8 h-8" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>

      {/* Metric */}
      {metric && (
        <div className="text-sm font-medium text-purple-600">{metric}</div>
      )}

      {/* Click indicator */}
      {onClick && (
        <div className="mt-4 text-sm text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to learn more →
        </div>
      )}
    </motion.div>
  );
}
