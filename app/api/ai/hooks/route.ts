import { NextRequest, NextResponse } from 'next/server';

// Lightweight hook generator (no external LLM) to unblock flows
// Input: { platform: 'tiktok'|'instagram'|'reddit', niche: string, persona?: { name?: string; tone?: string; emojiPalette?: string[] }, trend?: { title?: string; tag?: string } }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const platform = (body.platform || 'tiktok').toLowerCase();
    const niche = String(body.niche || 'alt');
    const persona = body.persona || {};
    const trend = body.trend || {};

    const emojis = (persona.emojiPalette && persona.emojiPalette.length ? persona.emojiPalette.slice(0, 3) : ['✨','💫','🔥']).join('');
    const tag = trend.tag ? `#${trend.tag}` : `#${niche}`;

    const platformCTA = platform === 'reddit' ? 'Link in comments' : 'Link in bio';
    const base = (h: string, c: string) => ({ hook: h, caption: `${c} ${tag} ${emojis}`, cta: platformCTA });

    const title = trend.title || 'New look drop';
    const variants = [
      base(`0.3s TRANSITION → ${title}`, `New drop just landed. Are you ready?`),
      base(`POV: you see my ${niche} side`, `Which one do you pick? A or B?`),
    ];

    return NextResponse.json({ variants, platform, niche, persona: persona?.name || persona?.tone || 'default' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to generate hooks' }, { status: 400 });
  }
}

