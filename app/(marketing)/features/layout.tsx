import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Features - Huntaze | Powerful Tools for Creator Success',
  description: 'Discover how Huntaze transforms your workflow with intelligent automation, real-time analytics, and AI-powered growth tools designed for modern creators.',
  keywords: ['creator features', 'automation tools', 'analytics dashboard', 'AI assistant', 'workflow automation', 'content scheduling'],
  openGraph: {
    title: 'Features - Huntaze | Powerful Tools for Creator Success',
    description: 'Discover how Huntaze transforms your workflow with intelligent automation, real-time analytics, and AI-powered growth tools designed for modern creators.',
    type: 'website',
    url: 'https://huntaze.com/features',
    siteName: 'Huntaze',
    images: [
      {
        url: '/og-image-features.png',
        width: 1200,
        height: 630,
        alt: 'Huntaze Features - Automation, Analytics, and Growth Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features - Huntaze | Powerful Tools for Creator Success',
    description: 'Discover how Huntaze transforms your workflow with intelligent automation, real-time analytics, and AI-powered growth tools designed for modern creators.',
    images: ['/og-image-features.png'],
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
