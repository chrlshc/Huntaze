import { Metadata } from 'next';
import { IntegrationsSection } from '@/components/integrations/IntegrationsSection';
import { IntegrationsHero } from '@/components/integrations/IntegrationsHero';

export const metadata: Metadata = {
  title: 'Integrations - Huntaze | Connect Your Favorite Tools',
  description: 'Connect Huntaze with 100+ tools you already use. From communication to analytics, streamline your workflow with powerful integrations.',
  openGraph: {
    title: 'Huntaze Integrations',
    description: 'Seamlessly connect your favorite tools with Huntaze',
    images: [{ url: '/og-integrations-huntaze.jpg', width: 1200, height: 630 }],
  },
};

export default function IntegrationsPage() {
  return (
    <main className="bg-white dark:bg-gray-950">
      <IntegrationsHero />
      <IntegrationsSection />
    </main>
  );
}