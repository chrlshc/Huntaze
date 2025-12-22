import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  id: string;
  type: 'navigation' | 'stat' | 'content';
  title: string;
  subtitle?: string;
  href: string;
}

// Navigation items - cover all main app sections
const navigationItems: Array<Omit<SearchResult, 'type'>> = [
  // Core dashboard
  { id: 'nav-home', title: 'Home', subtitle: 'Dashboard overview', href: '/home' },
  { id: 'nav-overview', title: 'Overview', subtitle: 'Quick summary of performance', href: '/overview' },
  { id: 'nav-dashboard', title: 'Dashboard', subtitle: 'Main dashboard hub', href: '/dashboard' },

  // OnlyFans
  { id: 'nav-onlyfans', title: 'OnlyFans Dashboard', subtitle: 'Messages, fans, PPV, AI assistant', href: '/onlyfans' },
  { id: 'nav-onlyfans-messages', title: 'OnlyFans Messages', subtitle: 'Inbox, auto-replies, AI chat', href: '/onlyfans/messages' },
  { id: 'nav-onlyfans-messages-mass', title: 'Mass Messages', subtitle: 'Send broadcast messages', href: '/onlyfans/messages/mass' },
  { id: 'nav-onlyfans-fans', title: 'OnlyFans Fans', subtitle: 'Subscribers, segments, churn insights', href: '/onlyfans/fans' },
  { id: 'nav-onlyfans-ppv', title: 'OnlyFans PPV', subtitle: 'Pay-per-view offers & upsells', href: '/onlyfans/ppv' },
  { id: 'nav-onlyfans-ppv-create', title: 'Create PPV', subtitle: 'Create a new PPV offer', href: '/onlyfans/ppv/create' },
  { id: 'nav-onlyfans-settings', title: 'OnlyFans Settings', subtitle: 'Connection & automation rules', href: '/onlyfans/settings' },

  // Analytics
  { id: 'nav-analytics', title: 'Analytics Overview', subtitle: 'Revenue, ARPU, LTV, churn', href: '/analytics' },
  { id: 'nav-analytics-pricing', title: 'Pricing Analytics', subtitle: 'Optimize subscription & PPV pricing', href: '/analytics/pricing' },
  { id: 'nav-analytics-churn', title: 'Churn Analytics', subtitle: 'Detect at-risk fans and retain them', href: '/analytics/churn' },
  { id: 'nav-analytics-upsells', title: 'Upsell Automation', subtitle: 'Increase revenue per fan', href: '/analytics/upsells' },
  { id: 'nav-analytics-forecast', title: 'Revenue Forecast', subtitle: 'Predict future earnings', href: '/analytics/forecast' },
  { id: 'nav-analytics-payouts', title: 'Payouts', subtitle: 'Track cashouts and payouts', href: '/analytics/payouts' },

  // Marketing & Social
  { id: 'nav-marketing', title: 'Marketing & Social', subtitle: 'Campaigns, social posts, calendar', href: '/marketing' },
  { id: 'nav-marketing-campaigns', title: 'Campaigns', subtitle: 'Email, DM, SMS & push campaigns', href: '/marketing/campaigns' },
  { id: 'nav-marketing-new-campaign', title: 'Create Campaign', subtitle: 'Start a new campaign', href: '/marketing/campaigns/new' },
  { id: 'nav-marketing-calendar', title: 'Marketing Calendar', subtitle: 'Plan your content schedule', href: '/marketing/calendar' },
  { id: 'nav-marketing-content', title: 'Marketing Content', subtitle: 'Manage marketing content library', href: '/marketing/content' },

  // Content
  { id: 'nav-content', title: 'Content Creation', subtitle: 'Create, schedule and publish content', href: '/content' },
  { id: 'nav-content-studio', title: 'Content Studio', subtitle: 'Content Factory workspace', href: '/content/factory' },
  { id: 'nav-content-schedule', title: 'Content Schedule', subtitle: 'Plan and schedule content', href: '/content/schedule' },
  { id: 'nav-content-templates', title: 'Content Templates', subtitle: 'Reusable content templates', href: '/content/templates' },
  { id: 'nav-content-generator', title: 'Content Generator', subtitle: 'Generate content with AI', href: '/content/generator' },

  // Integrations & settings
  { id: 'nav-integrations', title: 'Integrations', subtitle: 'Connect OnlyFans, Instagram, TikTok, Reddit', href: '/integrations' },
  { id: 'nav-integrations-onlyfans', title: 'OnlyFans Integration', subtitle: 'Connect and configure OnlyFans', href: '/integrations/onlyfans' },
  { id: 'nav-integrations-instagram', title: 'Instagram Integration', subtitle: 'Connect and configure Instagram', href: '/integrations/instagram' },
  { id: 'nav-integrations-tiktok', title: 'TikTok Integration', subtitle: 'Connect and configure TikTok', href: '/integrations/tiktok' },
  { id: 'nav-integrations-google-drive', title: 'Google Drive Integration', subtitle: 'Connect and configure Google Drive', href: '/integrations/google-drive' },
  { id: 'nav-integrations-google-analytics', title: 'Google Analytics Integration', subtitle: 'Connect and configure Google Analytics', href: '/integrations/google-analytics' },
  { id: 'nav-settings', title: 'Account Settings', subtitle: 'Profile, billing & preferences', href: '/settings' },
  { id: 'nav-profile', title: 'Profile', subtitle: 'Manage your profile', href: '/profile' },
  { id: 'nav-billing', title: 'Billing', subtitle: 'Plans, invoices and payments', href: '/billing' },

  // Automations
  { id: 'nav-automations', title: 'Automations', subtitle: 'Flows, templates and analytics', href: '/automations' },
  { id: 'nav-automations-flows', title: 'Automation Flows', subtitle: 'Create and manage flows', href: '/automations/flows' },
  { id: 'nav-automations-templates', title: 'Automation Templates', subtitle: 'Browse automation templates', href: '/automations/templates' },
  { id: 'nav-automations-analytics', title: 'Automation Analytics', subtitle: 'Track automation performance', href: '/automations/analytics' },
  { id: 'nav-automations-new', title: 'New Automation', subtitle: 'Create a new automation', href: '/automations/new' },

  // Other key areas
  { id: 'nav-fans', title: 'Fans', subtitle: 'Manage fans and segments', href: '/fans' },
  { id: 'nav-messages', title: 'Messages', subtitle: 'All messages and inboxes', href: '/messages' },
  { id: 'nav-offers', title: 'Offers', subtitle: 'Manage offers and promotions', href: '/offers' },
  { id: 'nav-offers-new', title: 'New Offer', subtitle: 'Create a new offer', href: '/offers/new' },
  { id: 'nav-schedule', title: 'Schedule', subtitle: 'Plan and manage your schedule', href: '/schedule' },
  { id: 'nav-revenue', title: 'Revenue', subtitle: 'Revenue dashboards and insights', href: '/revenue' },
];

// Key stats / shortcuts
const statItems: Array<Omit<SearchResult, 'type'>> = [
  { id: 'stat-revenue', title: 'Monthly Revenue', subtitle: 'Overview of creator earnings', href: '/analytics?metric=revenue' },
  { id: 'stat-fans', title: 'Total Fans', subtitle: 'Active, new and churned fans', href: '/analytics?metric=fans' },
  { id: 'stat-engagement', title: 'Engagement Rate', subtitle: 'Messages, likes and replies', href: '/analytics?metric=engagement' },
  { id: 'stat-ai-usage', title: 'AI Usage', subtitle: 'AI messages and quota remaining', href: '/home#ai-usage' },
];

// High-value content/tools
const contentItems: Array<Omit<SearchResult, 'type'>> = [
  { id: 'content-create', title: 'Create New Content', subtitle: 'Open the content creation workspace', href: '/content' },
  { id: 'content-plan', title: 'Plan Social Posts', subtitle: 'Use the calendar to schedule posts', href: '/marketing/calendar' },
  { id: 'content-automation', title: 'Set Up Automations', subtitle: 'Configure smart flows and campaigns', href: '/automations' },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get('q') ?? '').trim().toLowerCase();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const seen = new Set<string>();
  const scored: Array<{ score: number; order: number; result: SearchResult }> = [];

  // Helper: test if any searchable text matches the query
  const matchesQuery = (item: { title: string; subtitle?: string; href: string }, q: string) => {
    const haystack = `${item.title} ${item.subtitle || ''} ${item.href}`.toLowerCase();
    return haystack.includes(q);
  };

  const scoreMatch = (item: { title: string; subtitle?: string; href: string }, q: string) => {
    const title = item.title.toLowerCase();
    const subtitle = (item.subtitle || '').toLowerCase();
    const href = item.href.toLowerCase();

    if (title.startsWith(q)) return 0;
    if (title.includes(q)) return 1;
    if (subtitle.includes(q)) return 2;
    if (href.includes(q)) return 3;
    return 10;
  };

  const addIfMatches = (item: Omit<SearchResult, 'type'>, type: SearchResult['type']) => {
    if (!matchesQuery(item, query)) return;
    if (seen.has(item.id)) return;
    seen.add(item.id);
    scored.push({
      score: scoreMatch(item, query),
      order: scored.length,
      result: { ...item, type },
    });
  };

  // Search navigation items (routes / sections)
  navigationItems.forEach((item) => addIfMatches(item, 'navigation'));

  // Search stats
  statItems.forEach((item) => addIfMatches(item, 'stat'));

  // Search content
  contentItems.forEach((item) => addIfMatches(item, 'content'));

  // Limit results for a clean dropdown UX
  const limitedResults = scored
    .sort((a, b) => (a.score - b.score) || (a.order - b.order))
    .map((entry) => entry.result)
    .slice(0, 15);

  return NextResponse.json({ results: limitedResults });
}
