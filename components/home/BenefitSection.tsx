'use client';

import { LucideIcon } from 'lucide-react';

export interface BenefitSectionProps {
  id: string;
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  imagePosition?: 'left' | 'right';
  background?: 'default' | 'alternate';
}

export function BenefitSection({
  id,
  icon: Icon,
  label,
  title,
  description,
  imagePosition = 'left',
  background = 'default',
}: BenefitSectionProps) {
  const bgClass = background === 'alternate' ? 'bg-[#131316]' : 'bg-[#0F0F10]';
  const isIconLeft = imagePosition === 'left';

  return (
    <section
      id={id}
      className={`relative min-h-screen md:min-h-screen min-h-[60vh] flex items-center justify-center px-4 py-16 md:py-24 md:px-6 ${bgClass} overflow-hidden`}
    >
      <div className="relative z-10 mx-auto max-w-5xl w-full">
        <div className={`flex flex-col ${isIconLeft ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-16`}>
          {/* Icon Side */}
          <div className="flex-shrink-0">
            <div className="inline-flex h-20 w-20 md:h-32 md:w-32 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 transition-all duration-300 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:transform-none">
              <Icon className="h-10 w-10 md:h-16 md:w-16" strokeWidth={1.5} />
            </div>
          </div>

          {/* Content Side */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-3 text-sm font-medium uppercase tracking-wide text-purple-400">
              {label}
            </div>
            <h2 className="mb-4 text-3xl md:text-5xl font-bold text-white leading-tight">
              {title}
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-gray-400 max-w-2xl">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
