import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Case Studies - Huntaze | Creator Success Stories',
  description: 'Discover how creators are transforming their businesses with Huntaze. Learn about the challenges we solve and the powerful automation tools that drive success.',
  keywords: ['creator success stories', 'automation case studies', 'creator tools', 'AI automation', 'business growth'],
  openGraph: {
    title: 'Case Studies - Huntaze | Creator Success Stories',
    description: 'Discover how creators are transforming their businesses with Huntaze. Learn about the challenges we solve and the powerful automation tools that drive success.',
    type: 'website',
    url: 'https://huntaze.com/case-studies',
    siteName: 'Huntaze',
    images: [
      {
        url: '/og-image-case-studies.png',
        width: 1200,
        height: 630,
        alt: 'Huntaze Case Studies - Creator Success Stories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Case Studies - Huntaze | Creator Success Stories',
    description: 'Discover how creators are transforming their businesses with Huntaze. Learn about the challenges we solve and the powerful automation tools that drive success.',
    images: ['/og-image-case-studies.png'],
  },
};

export default function DynamicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

