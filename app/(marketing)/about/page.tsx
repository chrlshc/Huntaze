'use client';

import { HeroSectionSimple } from '@/components/about/HeroSectionSimple';
import { StorySectionSimple } from '@/components/about/StorySectionSimple';
import { ValuesSectionSimple } from '@/components/about/ValuesSectionSimple';
import { TeamSectionSimple } from '@/components/about/TeamSectionSimple';

// Enable static generation with client-side hydration for optimal performance
export const dynamic = 'force-static';

export default function AboutPage() {
  return (
    <main className="bg-white dark:bg-gray-950">
      <HeroSectionSimple />
      <StorySectionSimple />
      <ValuesSectionSimple />
      <TeamSectionSimple />
    </main>
  );
}