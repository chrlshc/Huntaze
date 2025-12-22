'use client';

import { LucideIcon, Users, Sparkles, BarChart3 } from 'lucide-react';

export interface Benefit {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Users,
  Sparkles,
  BarChart3,
};

interface ValuePropositionProps {
  benefits: Benefit[];
}

export function ValueProposition({ benefits }: ValuePropositionProps) {
  // Ensure we only display exactly 3 benefits
  const displayBenefits = benefits.slice(0, 3);

  return (
    <section className="px-4 py-16 md:py-20 lg:py-24 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayBenefits.map((benefit, i) => {
            const IconComponent = iconMap[benefit.icon];
            return (
              <div 
                key={i} 
                className="group p-8 bg-[#18181B] border border-[#27272A] rounded-2xl"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-[var(--border-default)] text-purple-400">
                  {IconComponent && <IconComponent className="h-6 w-6" />}
                </div>
                <div className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-500">
                  {benefit.title}
                </div>
                <h3 className="mb-3 text-xl font-medium text-white">
                  {benefit.subtitle}
                </h3>
                <p className="text-base md:text-lg leading-relaxed text-gray-400">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
