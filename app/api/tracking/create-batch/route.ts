import { NextRequest, NextResponse } from 'next/server';
import { generateABTestLinks } from '@/src/utils/tracking-links';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { baseUrl, platform, variants, campaignId } = await request.json();

    if (!baseUrl || !platform || !variants || !Array.isArray(variants)) {
      return NextResponse.json({ 
        error: 'Missing required fields: baseUrl, platform, variants' 
      }, { status: 400 });
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

    return NextResponse.json({ 
      links,
      campaignId: campaign,
      message: 'Tracking links created successfully'
    });

  } catch (error: any) {
    console.error('Create tracking links error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create tracking links' 
    }, { status: 500 });
  }
}
