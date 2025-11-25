import { HomePageContent } from '@/components/home/HomePageContent';
import { Metadata } from 'next';

// Force dynamic rendering to avoid SSG issues with client components
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Huntaze - Run Your Creator Business on Autopilot',
  description: 'Focus on creating content. We handle the analytics, marketing, and growth. AI-powered automation for modern creators.',
  keywords: ['creator tools', 'content automation', 'AI assistant', 'creator analytics', 'social media management'],
  openGraph: {
    title: 'Huntaze - Run Your Creator Business on Autopilot',
    description: 'Focus on creating content. We handle the analytics, marketing, and growth. AI-powered automation for modern creators.',
    type: 'website',
    url: 'https://huntaze.com',
    siteName: 'Huntaze',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Huntaze - Creator Business Automation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Huntaze - Run Your Creator Business on Autopilot',
    description: 'Focus on creating content. We handle the analytics, marketing, and growth. AI-powered automation for modern creators.',
    images: ['/og-image.png'],
  },
};

export default function HomePage() {
  return <HomePageContent />;
}
