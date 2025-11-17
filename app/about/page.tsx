'use client';

import { HeroSectionSimple } from '@/components/about/HeroSectionSimple';
import { StorySectionSimple } from '@/components/about/StorySectionSimple';
import { ValuesSectionSimple } from '@/components/about/ValuesSectionSimple';
import { TeamSectionSimple } from '@/components/about/TeamSectionSimple';

export const dynamic = 'force-dynamic';

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