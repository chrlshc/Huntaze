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
  const bgClass = background === 'alternate'
    ? 'bg-[var(--bg-secondary)] shadow-[var(--shadow-sm)]'
    : 'bg-[var(--bg-primary)] shadow-[var(--shadow-sm)]';
  const surfaceFrame = 'border border-[var(--border-default)] shadow-[var(--shadow-sm)]';
  const isIconLeft = imagePosition === 'left';

  return (
    <section
      id={id}
      className={`relative min-h-screen md:min-h-screen min-h-[60vh] flex items-center justify-center px-4 py-16 md:py-24 md:px-6 ${bgClass} ${surfaceFrame} overflow-hidden`}
    >
      <div className="relative z-10 mx-auto max-w-6xl w-full">
        <div className={`flex flex-col ${isIconLeft ? 'md:flex-row' : 'md:flex-row-reverse'} items-center justify-center gap-12 md:gap-20`}>
          {/* Icon Side */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="inline-flex h-24 w-24 md:h-36 md:w-36 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Icon className="h-12 w-12 md:h-18 md:w-18" strokeWidth={1.5} />
            </div>
          </div>

          {/* Content Side */}
          <div className="flex-1 text-center md:text-left max-w-xl">
            <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-purple-400">
              {label}
            </div>
            <h2 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {title}
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-400">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
