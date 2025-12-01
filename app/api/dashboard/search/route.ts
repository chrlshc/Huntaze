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

  // OnlyFans
  { id: 'nav-onlyfans', title: 'OnlyFans Dashboard', subtitle: 'Messages, fans, PPV, AI assistant', href: '/onlyfans' },
  { id: 'nav-onlyfans-messages', title: 'OnlyFans Messages', subtitle: 'Inbox, auto-replies, AI chat', href: '/onlyfans/messages' },
  { id: 'nav-onlyfans-fans', title: 'OnlyFans Fans', subtitle: 'Subscribers, segments, churn insights', href: '/onlyfans/fans' },
  { id: 'nav-onlyfans-ppv', title: 'OnlyFans PPV', subtitle: 'Pay-per-view offers & upsells', href: '/onlyfans/ppv' },
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
  { id: 'nav-marketing-social', title: 'Social Planner', subtitle: 'Instagram, TikTok, Reddit posts', href: '/marketing/social' },
  { id: 'nav-marketing-calendar', title: 'Marketing Calendar', subtitle: 'Plan your content schedule', href: '/marketing/calendar' },

  // Content
  { id: 'nav-content', title: 'Content Creation', subtitle: 'Create, schedule and publish content', href: '/content' },

  // Integrations & settings
  { id: 'nav-integrations', title: 'Integrations', subtitle: 'Connect OnlyFans, Instagram, TikTok, Reddit', href: '/integrations' },
  { id: 'nav-settings', title: 'Account Settings', subtitle: 'Profile, billing & preferences', href: '/settings' },
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
  { id: 'content-plan', title: 'Plan Social Posts', subtitle: 'Use the social planner and calendar', href: '/marketing/social' },
  { id: 'content-automation', title: 'Set Up Automations', subtitle: 'Configure smart flows and campaigns', href: '/automations' },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResult[] = [];

  // Helper: test if any searchable text matches the query
  const matchesQuery = (item: { title: string; subtitle?: string }, q: string) => {
    const haystack = `${item.title} ${item.subtitle || ''}`.toLowerCase();
    return haystack.includes(q);
  };

  // Search navigation items (routes / sections)
  navigationItems.forEach((item) => {
    if (matchesQuery(item, query)) {
      results.push({
        ...item,
        type: 'navigation',
      });
    }
  });

  // Search stats
  statItems.forEach((item) => {
    if (matchesQuery(item, query)) {
      results.push({
        ...item,
        type: 'stat',
      });
    }
  });

  // Search content
  contentItems.forEach((item) => {
    if (matchesQuery(item, query)) {
      results.push({
        ...item,
        type: 'content',
      });
    }
  });

  // Limit results to 10
  const limitedResults = results.slice(0, 10);

  return NextResponse.json({ results: limitedResults });
}
