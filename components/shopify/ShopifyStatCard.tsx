'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, LucideIcon } from 'lucide-react';

interface ShopifyStatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: 'green' | 'blue' | 'purple' | 'orange';
  description?: string;
}

export const ShopifyStatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  color, 
  description 
}: ShopifyStatCardProps) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-2 rounded-lg border",
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          )}>
            {changeType === 'positive' ? (
              <ArrowUp className="w-3 h-3" />
            ) : changeType === 'negative' ? (
              <ArrowDown className="w-3 h-3" />
            ) : null}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-sm font-medium text-gray-600">{title}</p>
        {description && (
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
};