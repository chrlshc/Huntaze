import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  id: string;
  type: 'navigation' | 'stat' | 'content';
  title: string;
  subtitle?: string;
  href: string;
}

// Mock data for navigation items
const navigationItems = [
  { id: 'nav-home', title: 'Home', subtitle: 'Dashboard overview', href: '/home' },
  { id: 'nav-analytics', title: 'Analytics', subtitle: 'View your stats', href: '/analytics' },
  { id: 'nav-content', title: 'Content', subtitle: 'Manage your posts', href: '/content' },
  { id: 'nav-messages', title: 'Messages', subtitle: 'Chat with your audience', href: '/messages' },
  { id: 'nav-integrations', title: 'Integrations', subtitle: 'Connect platforms', href: '/integrations' },
  { id: 'nav-settings', title: 'Settings', subtitle: 'Account preferences', href: '/settings' },
];

// Mock data for stats
const statItems = [
  { id: 'stat-tiktok', title: 'TikTok Stats', subtitle: '1.2M followers', href: '/analytics?platform=tiktok' },
  { id: 'stat-instagram', title: 'Instagram Stats', subtitle: '850K followers', href: '/analytics?platform=instagram' },
  { id: 'stat-youtube', title: 'YouTube Stats', subtitle: '500K subscribers', href: '/analytics?platform=youtube' },
  { id: 'stat-engagement', title: 'Engagement Rate', subtitle: '8.5% average', href: '/analytics?metric=engagement' },
  { id: 'stat-revenue', title: 'Revenue', subtitle: '$12,450 this month', href: '/analytics?metric=revenue' },
];

// Mock data for content
const contentItems = [
  { id: 'content-1', title: 'Latest Video Post', subtitle: 'Published 2 days ago', href: '/content/1' },
  { id: 'content-2', title: 'Collaboration Campaign', subtitle: 'Draft', href: '/content/2' },
  { id: 'content-3', title: 'Product Launch Announcement', subtitle: 'Scheduled', href: '/content/3' },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResult[] = [];

  // Search navigation items
  navigationItems.forEach((item) => {
    if (
      item.title.toLowerCase().includes(query) ||
      item.subtitle?.toLowerCase().includes(query)
    ) {
      results.push({
        ...item,
        type: 'navigation',
      });
    }
  });

  // Search stats
  statItems.forEach((item) => {
    if (
      item.title.toLowerCase().includes(query) ||
      item.subtitle?.toLowerCase().includes(query)
    ) {
      results.push({
        ...item,
        type: 'stat',
      });
    }
  });

  // Search content
  contentItems.forEach((item) => {
    if (
      item.title.toLowerCase().includes(query) ||
      item.subtitle?.toLowerCase().includes(query)
    ) {
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
