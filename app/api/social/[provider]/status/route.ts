import { NextRequest, NextResponse } from 'next/server';

type Provider = 'instagram' | 'tiktok' | 'reddit' | 'threads';

function readCookie(req: NextRequest, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = req.cookies.get(k)?.value;
    if (v) return v;
  }
  return undefined;
}

export async function GET(request: NextRequest, context: { params: { provider: string } }) {
  const provider = (context.params.provider || '').toLowerCase() as Provider;
  try {
    let connected = false;
    let hint: string | undefined;

    switch (provider) {
      case 'tiktok': {
        const token = readCookie(request, ['tiktok_access_token']);
        connected = !!token;
        hint = token ? 'token' : undefined;
        break;
      }
      case 'instagram': {
        const token = readCookie(request, ['instagram_access_token', 'ig_access_token']);
        connected = !!token;
        hint = token ? 'token' : undefined;
        break;
      }
      case 'reddit': {
        const token = readCookie(request, ['reddit_access_token']);
        connected = !!token;
        hint = token ? 'token' : undefined;
        break;
      }
      case 'threads': {
        const token = readCookie(request, ['threads_access_token', 'instagram_access_token']);
        connected = !!token;
        hint = token ? 'token' : undefined;
        break;
      }
      default: {
        return NextResponse.json({ error: 'unknown provider' }, { status: 400 });
      }
    }

    return NextResponse.json({ provider, connected, hint });
  } catch (e) {
    return NextResponse.json({ provider, connected: false }, { status: 200 });
  }
}

