import type { Metadata } from 'next';
import { IntegrationsHeroSimple } from '@/components/integrations/IntegrationsHeroSimple';
import { IntegrationsSectionSimple } from '@/components/integrations/IntegrationsSectionSimple';

export const metadata: Metadata = {
  title: 'Integrations - Connect Your Favorite Tools | Huntaze',
  description: 'Seamlessly integrate Huntaze with Instagram, TikTok, OnlyFans, Stripe, and 20+ other platforms to streamline your creator business.',
  keywords: 'integrations, Instagram, TikTok, OnlyFans, Stripe, PayPal, Google Analytics, Mailchimp',
  openGraph: {
    title: 'Huntaze Integrations - Connect All Your Tools',
    description: 'One platform to rule them all. Connect your favorite creator tools.',
    images: ['/images/integrations-hero.jpg'],
  },
};

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen bg-white">
      <IntegrationsHeroSimple />
      <IntegrationsSectionSimple />
    </main>
  );
}