import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'About Us - Huntaze | Our Story and Mission',
  description: 'Learn about Huntaze\'s mission to empower creators with AI-powered automation tools. Discover our story, values, and the team building the future of creator business management.',
  keywords: ['about huntaze', 'creator tools company', 'AI automation', 'creator economy', 'team'],
  openGraph: {
    title: 'About Us - Huntaze | Our Story and Mission',
    description: 'Learn about Huntaze\'s mission to empower creators with AI-powered automation tools. Discover our story, values, and the team building the future of creator business management.',
    type: 'website',
    url: 'https://huntaze.com/about',
    siteName: 'Huntaze',
    images: [
      {
        url: '/og-image-about.png',
        width: 1200,
        height: 630,
        alt: 'About Huntaze - Empowering Creators',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us - Huntaze | Our Story and Mission',
    description: 'Learn about Huntaze\'s mission to empower creators with AI-powered automation tools. Discover our story, values, and the team building the future of creator business management.',
    images: ['/og-image-about.png'],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
