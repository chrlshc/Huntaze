import { NextRequest, NextResponse } from 'next/server';

interface IdeasRequest {
  niche: string;
  goal: string;
  prompt?: string | null;
  count?: number;
}

interface Idea {
  id: string;
  title: string;
  angle: string;
  hook: string;
  why: string;
}

function generateId(): string {
  return `idea_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

const IDEA_TEMPLATES: Record<string, Record<string, Idea[]>> = {
  fitness: {
    sell: [
      { id: '', title: 'Before/After Transformation', angle: 'Social proof with real results', hook: 'I lost 20lbs in 8 weeks doing this ONE thing...', why: 'Transformation content has highest save rate' },
      { id: '', title: 'Equipment Unboxing', angle: 'First impressions + demo', hook: 'This $30 gadget replaced my $2000 gym membership', why: 'Unboxing creates anticipation and trust' },
      { id: '', title: 'Myth Buster', angle: 'Controversial take on common advice', hook: 'Your trainer is LYING to you about protein...', why: 'Controversy drives engagement' },
    ],
    grow: [
      { id: '', title: 'Day in the Life', angle: 'Relatable routine content', hook: '5AM workout routine that changed my life', why: 'Lifestyle content builds connection' },
      { id: '', title: 'Beginner Mistakes', angle: 'Educational + relatable', hook: 'I wasted 2 years at the gym because of this...', why: 'Mistakes content feels authentic' },
      { id: '', title: 'Quick Tips Compilation', angle: 'High-value density', hook: '5 gym hacks in 60 seconds 💪', why: 'Quick tips get saved and shared' },
    ],
  },
  fashion: {
    sell: [
      { id: '', title: 'Outfit Reveal', angle: 'Dramatic transformation', hook: 'Watch me turn $50 into a $500 outfit...', why: 'Reveals create dopamine hits' },
      { id: '', title: 'Styling Challenge', angle: 'Creative constraint content', hook: 'I styled ONE piece 7 different ways', why: 'Challenges show versatility' },
      { id: '', title: 'Haul Review', angle: 'Honest first impressions', hook: 'I tried the viral $20 jacket everyone is talking about...', why: 'Reviews build trust before purchase' },
    ],
    grow: [
      { id: '', title: 'Style Evolution', angle: 'Personal growth narrative', hook: 'How my style changed from 18 to 25...', why: 'Evolution content is shareable' },
      { id: '', title: 'Trend Prediction', angle: 'Authority positioning', hook: '3 trends that will be EVERYWHERE in 2025', why: 'Predictions position you as expert' },
      { id: '', title: 'Wardrobe Essentials', angle: 'Evergreen value content', hook: 'The 10 pieces every wardrobe needs (and why)', why: 'Essentials content gets saved' },
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: IdeasRequest = await request.json();
    const { niche, goal, count = 10 } = body;

    // Get template ideas or generate generic ones
    const templateIdeas = IDEA_TEMPLATES[niche]?.[goal] || IDEA_TEMPLATES.fitness?.sell || [];
    
    // Generate ideas based on templates and expand to requested count
    const ideas: Idea[] = [];
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const template = templateIdeas[i % templateIdeas.length];
      ideas.push({
        id: generateId(),
        title: i < templateIdeas.length ? template.title : `${template.title} (v${Math.floor(i / templateIdeas.length) + 1})`,
        angle: template.angle,
        hook: template.hook,
        why: template.why,
      });
    }

    // Add some variety if we need more ideas
    const extraIdeas: Idea[] = [
      { id: generateId(), title: 'Behind the Scenes', angle: 'Authentic peek into your process', hook: 'What I ACTUALLY do every morning...', why: 'BTS content builds parasocial connection' },
      { id: generateId(), title: 'React & Respond', angle: 'Engage with trending content', hook: 'Reacting to the WORST advice I\'ve ever seen...', why: 'Reactions ride existing trends' },
      { id: generateId(), title: 'Story Time', angle: 'Personal narrative hook', hook: 'The story of how I almost quit everything...', why: 'Stories create emotional investment' },
      { id: generateId(), title: 'Tutorial Breakdown', angle: 'Step-by-step value', hook: 'Do THIS, not THAT (with examples)', why: 'Tutorials get saved for later' },
      { id: generateId(), title: 'Q&A Response', angle: 'Community engagement', hook: 'You asked, I answered (part 1)', why: 'Q&A builds community feeling' },
      { id: generateId(), title: 'Comparison Test', angle: 'Decision helper content', hook: 'I tested BOTH so you don\'t have to...', why: 'Comparisons are decision shortcuts' },
      { id: generateId(), title: 'Unpopular Opinion', angle: 'Controversial stance', hook: 'Unpopular opinion: this trend needs to die...', why: 'Controversy drives comments' },
    ];

    while (ideas.length < count && extraIdeas.length > 0) {
      ideas.push(extraIdeas.shift()!);
    }

    return NextResponse.json({ ideas: ideas.slice(0, count) });
  } catch (error) {
    console.error('Ideas generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}
