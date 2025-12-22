/**
 * Dashboard Acquisition API Endpoint
 * 
 * GET /api/dashboard/acquisition
 * Returns funnel data, platform metrics, and top content for the acquisition page.
 * 
 * Query params:
 * - from: ISO date (YYYY-MM-DD)
 * - to: ISO date (YYYY-MM-DD)
 * 
 * Requirements: 16.3, 16.4
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AcquisitionResponse, Platform } from '@/lib/dashboard/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // TODO: Replace with real data fetching in future versions
    // For v0.1, return mock data
    const mockResponse: AcquisitionResponse = {
      funnel: {
        views: 125000,
        profileClicks: 8500,
        linkTaps: 3200,
        newSubs: 102
      },
      platformMetrics: generateMockPlatformMetrics(),
      topContent: generateMockTopContent(),
      insight: 'TikTok: many views, few clicks'
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error fetching acquisition data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch acquisition data' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock platform metrics
 */
function generateMockPlatformMetrics() {
  const platforms: Platform[] = ['TikTok', 'Instagram', 'Twitter'];
  
  return platforms.map(platform => {
    const views = Math.floor(Math.random() * 50000) + 10000;
    const profileClicks = Math.floor(views * (Math.random() * 0.1 + 0.05));
    const linkTaps = Math.floor(profileClicks * (Math.random() * 0.5 + 0.2));
    const newSubs = Math.floor(linkTaps * (Math.random() * 0.05 + 0.02));
    
    return {
      platform,
      views,
      profileClicks,
      linkTaps,
      newSubs
    };
  });
}

/**
 * Generate mock top content
 */
function generateMockTopContent() {
  const platforms: Platform[] = ['TikTok', 'Instagram', 'Twitter'];
  const titles = [
    'Behind the scenes of my latest shoot 📸',
    'Q&A: Your questions answered! 💬',
    'Exclusive preview of upcoming content 🔥',
    'Day in the life vlog ✨',
    'Special announcement coming soon! 🎉',
    'Throwback to my favorite moment 💕'
  ];
  
  const content = [];
  
  for (let i = 0; i < 3; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const daysAgo = Math.floor(Math.random() * 7);
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - daysAgo);
    
    const views = Math.floor(Math.random() * 20000) + 5000;
    const linkTaps = Math.floor(views * (Math.random() * 0.1 + 0.05));
    const newSubs = Math.floor(linkTaps * (Math.random() * 0.08 + 0.03));
    
    content.push({
      contentId: `content_${i}_${Date.now()}`,
      platform,
      title: titles[Math.floor(Math.random() * titles.length)],
      thumbnailUrl: `https://picsum.photos/seed/${i}/400/300`,
      publishedAt: publishedAt.toISOString(),
      views,
      linkTaps,
      newSubs
    });
  }
  
  // Sort by newSubs descending
  return content.sort((a, b) => b.newSubs - a.newSubs);
}
