import Link from 'next/link';
import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Landing • Page 2',
  description: 'More links and sections across the platform.',
};

const moreLinks = [
  { href: '/marketing', title: 'Marketing Suite', desc: 'Acquisition → conversion → monetization.' },
  { href: '/sell-everywhere', title: 'Sell Everywhere', desc: 'Go multichannel with confidence.' },
  { href: '/global', title: 'Go Global', desc: 'Operate across regions & currencies.' },
  { href: '/how-it-works', title: 'How It Works', desc: 'A quick walkthrough of the flow.' },
  { href: '/ai-technology', title: 'AI Technology', desc: 'How we design human‑in‑the‑loop.' },
  { href: '/integrations', title: 'Integrations', desc: 'Apps and services that plug in.' },
  { href: '/case-studies', title: 'Case Studies', desc: 'Outcomes from real teams.' },
  { href: '/customers', title: 'Customers', desc: 'Testimonials and results.' },
  { href: '/pricing-v2', title: 'Pricing v2', desc: 'Alternative pricing view.' },
  { href: '/about', title: 'About', desc: 'Mission and team.' },
  { href: '/blog', title: 'Blog', desc: 'Updates, guides, and stories.' },
  { href: '/careers', title: 'Careers', desc: 'Join the team.' },
  { href: '/status', title: 'Status', desc: 'Uptime and incidents.' },
  { href: '/roadmap', title: 'Roadmap', desc: 'What’s shipping next.' },
  { href: '/privacy-policy', title: 'Privacy Policy', desc: 'Data protection and privacy.' },
  { href: '/terms-of-service', title: 'Terms of Service', desc: 'Legal terms and conditions.' },
  { href: '/data-deletion', title: 'Data Deletion', desc: 'Your data, your control.' },
  { href: '/support', title: 'Support', desc: 'Get help quickly.' },
  { href: '/join', title: 'Get Invite', desc: 'Start your trial.' },
];

export default function LandingPage2() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-purple-600 font-medium">Explore</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">More pages</h1>
          <p className="text-gray-600 mt-1">Additional resources and sections across your site.</p>
        </div>
        <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">← Back to landing</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {moreLinks.map((it) => (
          <Link key={it.href} href={it.href} className="group">
            <Card className="h-full border-gray-200 hover:border-gray-300 bg-white transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{it.title}</h3>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{it.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

