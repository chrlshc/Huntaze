import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { generateABTestLinks } from '@/src/utils/tracking-links';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const { baseUrl, platform, variants, campaignId } = await request.json();

    if (!baseUrl || !platform || !variants || !Array.isArray(variants)) {
      const r = NextResponse.json({ error: 'Missing required fields: baseUrl, platform, variants', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Generate unique campaign ID if not provided
    const campaign = campaignId || `${platform}-${Date.now().toString(36)}`;
    
    // Generate tracking links for each variant
    const variantNames = variants.map(v => v.name || v.id);
    const trackingLinks = generateABTestLinks(baseUrl, platform, variantNames, campaign);
    
    // Store tracking links in backend
    const linkData = Array.from(trackingLinks.entries()).map(([variantName, link]) => ({
      shortCode: link.shortCode,
      fullUrl: link.fullUrl,
      platform: link.platform,
      variant: link.variant,
      campaignId: campaign,
      createdAt: link.createdAt
    }));

    // Send to backend API
    const response = await fetch(`${API_URL}/tracking/links/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ links: linkData })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create tracking links');
    }

    // Return mapping of variant IDs to short codes
    const links: Record<string, string> = {};
    variants.forEach((variant, index) => {
      const variantName = variant.name || variant.id;
      const link = trackingLinks.get(variantName);
      if (link) {
        links[variant.id] = link.shortCode;
      }
    });

    const r = NextResponse.json({ links, campaignId: campaign, message: 'Tracking links created successfully', requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;

  } catch (error: any) {
    log.error('tracking_create_links_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: error.message || 'Failed to create tracking links', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
