import { Metadata } from 'next';
import { HeroSection } from '@/components/about/HeroSection';
import { StorySection } from '@/components/about/StorySection';
import { ValuesSection } from '@/components/about/ValuesSection';
import { TeamSection } from '@/components/about/TeamSection';

export const metadata: Metadata = {
  title: 'About - Huntaze | Reinventing Creator Business Management',
  description: 'Discover how Huntaze is revolutionizing the way creators manage their business with magical tools that teams love to use.',
  openGraph: {
    title: 'About Huntaze',
    description: 'Our mission: making creator business management more human and efficient',
    images: [{ url: '/og-about-huntaze.jpg', width: 1200, height: 630 }],
  },
};

export default function AboutPage() {
  return (
    <main className="bg-white dark:bg-gray-950">
      <HeroSection />
      <StorySection />
      <ValuesSection />
      <TeamSection />
    </main>
  );
}