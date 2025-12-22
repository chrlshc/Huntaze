import { NextRequest, NextResponse } from 'next/server';

type Platform = 'tt' | 'ig' | 'rd';

type Mission = {
  id: string;
  title: string;
  platform: Platform;
  trend?: { type: string; label: string; source?: string };
  script?: { hook?: string; beats?: string[]; cta?: string };
  shotList?: string[];
  lengthSec?: number;
};

type DailyResponse = {
  niche: string;
  date: string;
  missions: Mission[];
};

function fallbackMissions(niche = 'lifestyle'): Mission[] {
  const packs: Record<string, Mission[]> = {
    lifestyle: [
      {
        id: 'm_l_1',
        title: 'Morning routine “3 shots”',
        platform: 'ig',
        trend: { type: 'format', label: 'Day in the life', source: 'curated' },
        script: {
          hook: '3 shots that make your morning feel expensive',
          beats: ['Coffee close-up (1s)', 'Outfit mirror shot (2s)', 'Leaving home (2s)'],
          cta: 'Comment “AM” for part 2',
        },
        shotList: ['Plan 1: close-up', 'Plan 2: mirror', 'Plan 3: walking'],
        lengthSec: 12,
      },
      {
        id: 'm_l_2',
        title: 'Q&A ultra court (1 question)',
        platform: 'tt',
        trend: { type: 'format', label: 'FAQ quick', source: 'curated' },
        script: {
          hook: 'You asked this ALL the time…',
          beats: ['Read question (2s)', 'Answer punchy (6s)', 'Smile + teaser (2s)'],
          cta: 'Drop your next question 👇',
        },
        shotList: ['Face cam', 'Text overlay question', 'End screen'],
        lengthSec: 14,
      },
      {
        id: 'm_l_3',
        title: 'Outfit reveal (safe tease)',
        platform: 'tt',
        trend: { type: 'format', label: 'Reveal / transition', source: 'curated' },
        script: {
          hook: 'Rate this look from 1 to 10',
          beats: ['Before (1s)', 'Transition (1s)', 'After (3s)', 'Pose (2s)'],
          cta: 'Vote in comments',
        },
        shotList: ['Before', 'Transition', 'After'],
        lengthSec: 10,
      },
    ],
    cosplay: [
      {
        id: 'm_c_1',
        title: 'Transition costume sur beat drop',
        platform: 'tt',
        trend: { type: 'format', label: 'Beat drop transition', source: 'curated' },
        script: {
          hook: 'Wait for the drop…',
          beats: ['Casual outfit (1s)', 'Hand cover lens (1s)', 'Reveal cosplay (3s)'],
          cta: 'Comment the next character',
        },
        shotList: ['Before', 'Cover lens', 'Reveal'],
        lengthSec: 8,
      },
      {
        id: 'm_c_2',
        title: 'POV mini scène (acting)',
        platform: 'ig',
        trend: { type: 'format', label: 'POV skit', source: 'curated' },
        script: {
          hook: 'POV: you meet me in public',
          beats: ['Look up (1s)', 'Character line (3s)', 'Reaction (2s)'],
          cta: 'Save for later',
        },
        shotList: ['POV title', 'Line', 'Reaction'],
        lengthSec: 9,
      },
      {
        id: 'm_c_3',
        title: 'Making-of 15s (process)',
        platform: 'tt',
        trend: { type: 'format', label: 'Behind the scenes', source: 'curated' },
        script: {
          hook: 'Behind the scenes in 15 seconds',
          beats: ['Makeup (3s)', 'Wig (3s)', 'Costume (3s)', 'Final (2s)'],
          cta: 'Follow for the full set',
        },
        shotList: ['Makeup', 'Wig', 'Costume', 'Final'],
        lengthSec: 15,
      },
    ],
  };

  return packs[niche] || packs.lifestyle;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const niche = (url.searchParams.get('niche') || 'lifestyle').toLowerCase();
  const date = new Date().toISOString().slice(0, 10);

  const response: DailyResponse = {
    niche,
    date,
    missions: fallbackMissions(niche),
  };

  return NextResponse.json(response);
}
