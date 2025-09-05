import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    
    if (!code) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Get tracking data from request
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || '';
    
    // Get geo data if available
    const country = request.headers.get('x-vercel-ip-country') || 
                   request.headers.get('cf-ipcountry') || 
                   'unknown';

    // Record the click in backend
    try {
      await fetch(`${API_URL}/tracking/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortCode: code,
          timestamp: new Date().toISOString(),
          ip: ip.split(',')[0].trim(), // Get first IP if multiple
          userAgent,
          referer,
          country
        })
      });
    } catch (error) {
      // Don't block redirect if tracking fails
      console.error('Failed to record click:', error);
    }

    // Get the destination URL from backend
    const linkResponse = await fetch(`${API_URL}/tracking/links/${code}`);
    
    if (!linkResponse.ok) {
      // If link not found, redirect to homepage
      return NextResponse.redirect(new URL('/', request.url));
    }

    const { fullUrl } = await linkResponse.json();
    
    if (!fullUrl) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Validate URL
    try {
      new URL(fullUrl);
    } catch {
      // Invalid URL, redirect to homepage
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Redirect to the destination
    return NextResponse.redirect(fullUrl, {
      status: 301, // Permanent redirect for better SEO
      headers: {
        'Cache-Control': 'no-store, max-age=0', // Don't cache redirects
      }
    });

  } catch (error) {
    console.error('Redirect error:', error);
    // Always redirect somewhere to avoid broken links
    return NextResponse.redirect(new URL('/', request.url));
  }
}