import { NextRequest, NextResponse } from 'next/server';

type Platform = 'tt' | 'ig' | 'rd';

type Mission = {
  id: string;
  title: string;
  platform: Platform;
  script?: { hook?: string; beats?: string[]; cta?: string };
};

function fallbackMissions(): Mission[] {
  return [
    {
      id: 'm_l_1',
      title: 'Morning routine “3 shots”',
      platform: 'ig',
      script: {
        hook: '3 shots that make your morning feel expensive',
        beats: ['Coffee close-up (1s)', 'Outfit mirror shot (2s)', 'Leaving home (2s)'],
        cta: 'Comment “AM” for part 2',
      },
    },
    {
      id: 'm_l_2',
      title: 'Q&A ultra court (1 question)',
      platform: 'tt',
      script: {
        hook: 'You asked this ALL the time…',
        beats: ['Read question (2s)', 'Answer punchy (6s)', 'Smile + teaser (2s)'],
        cta: 'Drop your next question 👇',
      },
    },
    {
      id: 'm_l_3',
      title: 'Outfit reveal (safe tease)',
      platform: 'tt',
      script: {
        hook: 'Rate this look from 1 to 10',
        beats: ['Before (1s)', 'Transition (1s)', 'After (3s)', 'Pose (2s)'],
        cta: 'Vote in comments',
      },
    },
    {
      id: 'm_c_1',
      title: 'Transition costume sur beat drop',
      platform: 'tt',
      script: {
        hook: 'Wait for the drop…',
        beats: ['Casual outfit (1s)', 'Hand cover lens (1s)', 'Reveal cosplay (3s)'],
        cta: 'Comment the next character',
      },
    },
    {
      id: 'm_c_2',
      title: 'POV mini scène (acting)',
      platform: 'ig',
      script: {
        hook: 'POV: you meet me in public',
        beats: ['Look up (1s)', 'Character line (3s)', 'Reaction (2s)'],
        cta: 'Save for later',
      },
    },
    {
      id: 'm_c_3',
      title: 'Making-of 15s (process)',
      platform: 'tt',
      script: {
        hook: 'Behind the scenes in 15 seconds',
        beats: ['Makeup (3s)', 'Wig (3s)', 'Costume (3s)', 'Final (2s)'],
        cta: 'Follow for the full set',
      },
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const missionId = typeof body?.missionId === 'string' ? body.missionId : null;

    if (!missionId) {
      return NextResponse.json({ error: 'missionId is required' }, { status: 400 });
    }

    const mission = fallbackMissions().find((m) => m.id === missionId);

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    return NextResponse.json({
      missionId: mission.id,
      prefill: {
        idea: mission.title,
        hook: mission.script?.hook || '',
        cta: mission.script?.cta || '',
        targets: mission.platform,
        captionPreset: 'karaoke_pop',
      },
      createdContentIds: [],
    });
  } catch {
    return NextResponse.json({ error: 'Accept failed' }, { status: 500 });
  }
}
