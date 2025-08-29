'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, ArrowRight, Sparkles, Zap, Users, Globe } from 'lucide-react';

interface GatedContentProps {
  type: 'no-platform' | 'no-ai-training' | 'no-contacts' | 'premium-feature';
  children?: React.ReactNode;
  userProfile?: any;
  aiConfig?: any;
}

export function GatedContent({ type, children, userProfile, aiConfig }: GatedContentProps) {
  const gates = {
    'no-platform': {
      condition: !aiConfig?.platforms?.length,
      title: 'Connect a Platform to Unlock Analytics',
      description: 'Connect your OnlyFans, Fansly, or other platforms to see detailed analytics and insights.',
      icon: Globe,
      cta: 'Connect Platform',
      href: '/platforms/connect',
      gradient: 'from-purple-600 to-pink-600'
    },
    'no-ai-training': {
      condition: !aiConfig?.personality || aiConfig?.customResponses?.length === 0,
      title: 'Train Your AI to Unlock Automation',
      description: 'Set up your AI personality and custom responses to start automating fan conversations.',
      icon: Sparkles,
      cta: 'Train AI Now',
      href: '/ai/training',
      gradient: 'from-blue-600 to-indigo-600'
    },
    'no-contacts': {
      condition: !userProfile?.hasImportedContacts,
      title: 'Import Your Fan Contacts',
      description: 'Import your existing fan base to start managing relationships and tracking revenue.',
      icon: Users,
      cta: 'Import Contacts',
      href: '/fans/import',
      gradient: 'from-green-600 to-teal-600'
    },
    'premium-feature': {
      condition: !userProfile?.isPremium,
      title: 'Upgrade to Premium',
      description: 'Unlock advanced analytics, unlimited AI responses, and priority support.',
      icon: Shield,
      cta: 'Upgrade Now',
      href: '/billing/upgrade',
      gradient: 'from-yellow-600 to-orange-600'
    }
  };

  const gate = gates[type];
  
  // If condition is not met, show children
  if (!gate.condition) {
    return <>{children}</>;
  }

  // Otherwise show gated content
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Blurred background with children */}
      {children && (
        <div className="relative opacity-30 blur-sm pointer-events-none">
          {children}
        </div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gate.gradient} mb-6`}>
            <gate.icon className="w-8 h-8 text-white" />
          </div>
          
          {/* Content */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{gate.title}</h3>
          <p className="text-gray-600 mb-6">{gate.description}</p>
          
          {/* CTA Button */}
          <Link 
            href={gate.href}
            className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${gate.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all`}
          >
            <Zap className="w-5 h-5" />
            {gate.cta}
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          {/* Lock indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            <span>This feature requires {type.replace(/-/g, ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini CTA Banner for smaller gated sections
export function GatedBanner({ type, userProfile, aiConfig }: Omit<GatedContentProps, 'children'>) {
  const gates = {
    'no-platform': {
      condition: !aiConfig?.platforms?.length,
      message: 'Connect a platform to see real analytics',
      icon: Globe,
      cta: 'Connect Now',
      href: '/platforms/connect'
    },
    'no-ai-training': {
      condition: !aiConfig?.personality,
      message: 'Train your AI to start automating',
      icon: Sparkles,
      cta: 'Train AI',
      href: '/ai/training'
    },
    'no-contacts': {
      condition: !userProfile?.hasImportedContacts,
      message: 'Import fans to track revenue',
      icon: Users,
      cta: 'Import',
      href: '/fans/import'
    },
    'premium-feature': {
      condition: !userProfile?.isPremium,
      message: 'Upgrade to unlock this feature',
      icon: Shield,
      cta: 'Upgrade',
      href: '/billing/upgrade'
    }
  };

  const gate = gates[type];
  if (!gate || !gate.condition) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <gate.icon className="w-5 h-5 text-purple-600" />
        <p className="text-sm text-purple-900">{gate.message}</p>
      </div>
      <Link 
        href={gate.href}
        className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
      >
        {gate.cta}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
