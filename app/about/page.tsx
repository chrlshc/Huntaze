import type { Metadata } from 'next';
import { HeroSectionSimple } from '@/components/about/HeroSectionSimple';
import { StorySectionSimple } from '@/components/about/StorySectionSimple';
import { ValuesSectionSimple } from '@/components/about/ValuesSectionSimple';
import { TeamSectionSimple } from '@/components/about/TeamSectionSimple';

export const metadata: Metadata = {
  title: 'About Huntaze - Revolutionizing Creator Business Management',
  description: 'Learn about Huntaze\'s mission to transform how creators manage their business through AI-powered tools and authentic human connections.',
  openGraph: {
    title: 'About Huntaze - The Future of Creator Business',
    description: 'Discover how we\'re building the next generation of creator tools.',
    images: ['/images/about-hero.jpg'],
  },
};

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