// nav.data.ts
export type Accent = 'teal' | 'blue' | 'purple' | 'green' | 'gray' | 'orange';

export type MenuItem = {
  title: string;
  href: string;
  description?: string;
};

export type MenuGroup = {
  header?: { title: string; icon: 'start'|'sell'|'market'|'manage'|'info'|'topics'|'tools'; accent: Accent };
  heading?: string;
  items: MenuItem[];
  footer?: { title: string; href: string };
  twoColumn?: boolean;
};

export const solutionsNav: MenuGroup[] = [
  {
    header: { title: 'For Creators', icon: 'start', accent: 'teal' },
    items: [
      { title: 'Instagram Creators', href: '/for-instagram-creators', description: 'Monetize your Instagram audience' },
      { title: 'TikTok Creators', href: '/for-tiktok-creators', description: 'Turn views into revenue' },
      { title: 'Creator Agencies', href: '/for-agencies', description: 'Scale your agency with AI' },
    ],
  },
  {
    header: { title: 'Automate', icon: 'tools', accent: 'blue' },
    items: [
      { title: 'AI Chat Assistant', href: '/features/ai-chat', description: 'Automate fan conversations' },
      { title: 'Content Scheduler', href: '/features/content-scheduler', description: 'Post at optimal times automatically' },
      { title: 'Mass Messaging', href: '/features/automation', description: 'Reach all fans with personalized DMs' },
    ],
  },
  {
    header: { title: 'Measure', icon: 'market', accent: 'purple' },
    items: [
      { title: 'Analytics & Insights', href: '/features/analytics', description: 'Track revenue and performance' },
      { title: 'Unified Dashboard', href: '/features/dashboard', description: 'Overview of business metrics' },
    ],
    footer: { title: 'See all features', href: '/features' },
  },
];

export const resourcesNav: MenuGroup[] = [
  {
    header: { title: 'Help and support', icon: 'info', accent: 'blue' },
    items: [
      { title: 'Help Center', href: '/support', description: 'FAQs and guides' },
      { title: 'System Status', href: '/status', description: 'Service availability' },
      { title: 'About', href: '/about', description: 'Our mission and team' },
    ],
  },
  {
    header: { title: 'Popular topics', icon: 'topics', accent: 'orange' },
    twoColumn: true,
    items: [
      { title: 'OnlyFans Automation', href: '/features/automation', description: 'Save time with AI' },
      { title: 'Content Strategy', href: '/blog', description: 'Grow your audience' },
      { title: 'Analytics 101', href: '/features/analytics', description: 'Understand performance' },
      { title: 'Cross‑platform Growth', href: '/grow-globally', description: 'Instagram, TikTok, OF' },
      { title: 'Safety & Compliance', href: '/privacy-policy', description: 'Protect your brand' },
    ],
  },
  {
    header: { title: 'Explore more', icon: 'tools', accent: 'gray' },
    items: [
      { title: 'Pricing', href: '/pricing', description: 'Plans and billing' },
      { title: 'Case Studies', href: '/case-studies', description: 'Creator success stories' },
      { title: 'Live Demo', href: '/demo', description: 'See the product' },
    ],
    footer: { title: 'See all guides', href: '/learn' },
  },
];
