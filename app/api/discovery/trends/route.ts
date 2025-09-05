import { NextRequest, NextResponse } from 'next/server';

// Stub trends discovery: returns sample trends per platform & niche to drive UI
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const platform = (url.searchParams.get('platform') || 'tiktok').toLowerCase();
  const niche = (url.searchParams.get('niche') || 'alt').toLowerCase();

  // Simple canned data
  const samples: Record<string, any[]> = {
    tiktok: [
      { id: 'tt1', title: 'Flash Transition 0.3s', tag: 'transition', estViews: 'high' },
      { id: 'tt2', title: 'GRWM close-up', tag: 'grwm', estViews: 'med' },
      { id: 'tt3', title: 'Before/After filter', tag: 'beforeafter', estViews: 'med' },
    ],
    instagram: [
      { id: 'ig1', title: 'Reels text-on-beat', tag: 'reelsbeat', estReach: 'high' },
      { id: 'ig2', title: 'Carousel hook first frame', tag: 'carousel', estReach: 'med' },
    ],
    reddit: [
      { id: 'rd1', title: `${niche} look`, subreddit: niche === 'alt' ? 'AltBeauty' : 'MakeupAddiction', estUpvotes: 'med' },
      { id: 'rd2', title: 'Which cosplay next?', subreddit: niche === 'cosplay' ? 'cosplaygirls' : 'cosplay', estUpvotes: 'med' },
    ],
  };

  const items = samples[platform] || samples.tiktok;
  return NextResponse.json({ platform, niche, items });
}

