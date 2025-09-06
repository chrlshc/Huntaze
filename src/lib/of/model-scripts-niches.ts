// Model Scripts & Niches - Pre-written content that CONVERTS
// Based on what actually works in different niches

export interface ModelNiche {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  averagePrice: { min: number; max: number };
  topContent: string[];
  personality: string;
}

export interface ConversionScript {
  id: string;
  niche: string;
  type: 'welcome' | 'ppv_tease' | 'upsell' | 'win_back' | 'tip_request';
  name: string;
  script: string;
  variants: string[];
  conversionRate?: number; // Track what works
  bestTime?: string; // When to send
}

// POPULAR NICHES WITH PROVEN STRATEGIES
export const MODEL_NICHES: Record<string, ModelNiche> = {
  milf: {
    id: 'milf',
    name: 'MILF/Mommy',
    description: 'Experienced, nurturing, dominant',
    keywords: ['mommy', 'experienced', 'teach you', 'good boy'],
    averagePrice: { min: 15, max: 50 },
    topContent: ['JOI', 'roleplay', 'lingerie', 'dom content'],
    personality: 'nurturing_dominant'
  },
  
  girl_next_door: {
    id: 'girl_next_door',
    name: 'Girl Next Door',
    description: 'Sweet, approachable, flirty',
    keywords: ['cutie', 'sweetie', 'crush', 'secret'],
    averagePrice: { min: 10, max: 30 },
    topContent: ['selfies', 'daily life', 'GFE', 'custom videos'],
    personality: 'sweet_flirty'
  },
  
  dom_findom: {
    id: 'dom_findom',
    name: 'Domme/FinDom',
    description: 'Dominant, demanding, powerful',
    keywords: ['slave', 'tribute', 'worship', 'pathetic'],
    averagePrice: { min: 25, max: 200 },
    topContent: ['tasks', 'humiliation', 'worship', 'tributes'],
    personality: 'strict_dominant'
  },
  
  fitness: {
    id: 'fitness',
    name: 'Fitness Model',
    description: 'Athletic, motivating, sexy workouts',
    keywords: ['workout', 'gains', 'sweat', 'flexible'],
    averagePrice: { min: 12, max: 40 },
    topContent: ['workout videos', 'shower content', 'yoga', 'progress pics'],
    personality: 'motivating_sexy'
  },
  
  gamer_girl: {
    id: 'gamer_girl',
    name: 'Gamer Girl',
    description: 'Playful, nerdy, cosplay',
    keywords: ['player 2', 'game', 'cosplay', 'nerdy'],
    averagePrice: { min: 10, max: 35 },
    topContent: ['cosplay', 'streaming', 'controller pics', 'gamer GFE'],
    personality: 'playful_nerdy'
  },
  
  fetish_kink: {
    id: 'fetish_kink',
    name: 'Fetish/Kink Specialist',
    description: 'Open-minded, experienced in specific kinks',
    keywords: ['fetish', 'kink', 'explore', 'taboo'],
    averagePrice: { min: 20, max: 100 },
    topContent: ['custom fetish', 'roleplay', 'specific kink content'],
    personality: 'open_experienced'
  },
  
  latina: {
    id: 'latina',
    name: 'Spicy Latina',
    description: 'Passionate, fiery, sensual',
    keywords: ['papi', 'caliente', 'spicy', 'passion'],
    averagePrice: { min: 12, max: 45 },
    topContent: ['dancing', 'oil shows', 'dirty talk Spanish', 'cultural'],
    personality: 'passionate_fiery'
  },
  
  bbw: {
    id: 'bbw',
    name: 'BBW/Curvy',
    description: 'Confident, sensual, body positive',
    keywords: ['curves', 'thick', 'goddess', 'worship my body'],
    averagePrice: { min: 10, max: 40 },
    topContent: ['body worship', 'curves showcase', 'confidence content'],
    personality: 'confident_sensual'
  }
};

// PROVEN CONVERSION SCRIPTS BY NICHE
export const CONVERSION_SCRIPTS: ConversionScript[] = [
  // MILF Scripts
  {
    id: 'milf_welcome',
    niche: 'milf',
    type: 'welcome',
    name: 'Mommy Welcome',
    script: "Hey sweetie 😘 Mommy's so glad you found me... I've been waiting for a good boy like you. Want me to show you what you've been missing? 💋",
    variants: [
      "Welcome baby boy... Mommy has something special just for you 😏",
      "Mmm a new toy to play with... Let mommy take care of you 💕"
    ],
    conversionRate: 0.42
  },
  {
    id: 'milf_ppv',
    niche: 'milf',
    type: 'ppv_tease',
    name: 'Mommy PPV Tease',
    script: "Just finished making something VERY naughty... 🔥 Mommy was thinking about you the whole time. Want to see what happens when I can't control myself? $25 and it's all yours baby...",
    variants: [
      "You've been such a good boy... Mommy has a special reward for you 😈 $30",
      "I need you so bad right now... Made this just for you. Can you handle mommy at her naughtiest? 💦 $25"
    ],
    conversionRate: 0.38,
    bestTime: 'evening'
  },
  
  // Girl Next Door Scripts
  {
    id: 'gnd_welcome',
    niche: 'girl_next_door',
    type: 'welcome',
    name: 'Sweet Welcome',
    script: "Hiii! 🥰 I'm so excited you're here! I've been hoping someone like you would find me... Want to get to know each other better? I promise I don't bite... unless you want me to 😉",
    variants: [
      "OMG hi!! 💕 You seem super sweet... wanna be friends? Maybe more? 😊",
      "Hey cutie! Welcome to my little secret world... ready for some fun? 🙈"
    ],
    conversionRate: 0.35
  },
  {
    id: 'gnd_ppv',
    niche: 'girl_next_door',
    type: 'ppv_tease',
    name: 'Innocent Tease',
    script: "I did something really naughty today... 🙈 I can't believe I filmed it! Want to see your innocent girl being not so innocent? $20 and I'll show you everything...",
    variants: [
      "You make me want to do bad things... Made this thinking of you 💋 $15",
      "I've never shown anyone this before... but I trust you 🥺 Want to see? $20"
    ],
    conversionRate: 0.33
  },
  
  // Domme Scripts
  {
    id: 'dom_welcome',
    niche: 'dom_findom',
    type: 'welcome',
    name: 'Domme Introduction',
    script: "Another pathetic sub crawling to my profile... You WILL address me as Goddess. If you're worthy of my attention, prove it. Otherwise, don't waste my time.",
    variants: [
      "On your knees. That's where you belong when you enter my domain.",
      "Fresh meat... Let's see if you can handle serving a real Goddess."
    ],
    conversionRate: 0.28
  },
  {
    id: 'dom_tip_request',
    niche: 'dom_findom',
    type: 'tip_request',
    name: 'Tribute Demand',
    script: "You've been lurking without tributing. Pathetic. Send $50 NOW and maybe I'll acknowledge your existence. Clock's ticking...",
    variants: [
      "Time to prove your devotion. $100 tribute. No excuses.",
      "Your Goddess demands tribute. Don't keep me waiting. $75."
    ],
    conversionRate: 0.22,
    bestTime: 'payday'
  },
  
  // Fitness Scripts
  {
    id: 'fitness_welcome',
    niche: 'fitness',
    type: 'welcome',
    name: 'Fitness Flirt',
    script: "Hey there! 💪 Ready to work up a sweat with me? I promise my content is as hot as my workouts... Want to see what happens after my gym sessions? 😏",
    variants: [
      "New gym buddy? 😉 Let's get those endorphins flowing together...",
      "Hey hottie! Like fit girls? Wait till you see how flexible I am... 🧘‍♀️"
    ],
    conversionRate: 0.31
  },
  
  // Universal Win-Back Scripts
  {
    id: 'universal_winback',
    niche: 'all',
    type: 'win_back',
    name: 'Miss You Win-Back',
    script: "Hey stranger... 🥺 I've missed you! I know you've been busy but I made something extra special hoping you'd come back... 40% off just for you, today only 💕",
    variants: [
      "Where have you been hiding? 😢 Come back and I'll make it worth your while...",
      "I can't stop thinking about you... Made something new, want a discount? Miss you!"
    ],
    conversionRate: 0.25
  }
];

// Script Performance Tracking
export class ScriptAnalytics {
  // Track which scripts convert best
  async trackScriptPerformance(
    scriptId: string,
    sent: number,
    converted: number
  ): Promise<void> {
    const script = CONVERSION_SCRIPTS.find(s => s.id === scriptId);
    if (script) {
      script.conversionRate = converted / sent;
    }
  }
  
  // Get best performing scripts for a niche
  getBestScripts(niche: string, type?: string): ConversionScript[] {
    return CONVERSION_SCRIPTS
      .filter(s => s.niche === niche || s.niche === 'all')
      .filter(s => !type || s.type === type)
      .sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0))
      .slice(0, 5);
  }
  
  // A/B test scripts
  getTestVariant(scriptId: string): string {
    const script = CONVERSION_SCRIPTS.find(s => s.id === scriptId);
    if (!script) return '';
    
    // 50% chance of variant
    if (Math.random() > 0.5 && script.variants.length > 0) {
      return script.variants[Math.floor(Math.random() * script.variants.length)];
    }
    
    return script.script;
  }
}

// Helper to customize scripts
export function personalizeScript(
  script: string,
  params: {
    fanName?: string;
    price?: number;
    discount?: number;
    customWords?: Record<string, string>;
  }
): string {
  let personalized = script;
  
  if (params.fanName) {
    personalized = personalized.replace(/\b(babe|baby|sweetie|honey)\b/i, params.fanName);
  }
  
  if (params.price) {
    personalized = personalized.replace(/\$\d+/, `$${params.price}`);
  }
  
  if (params.discount) {
    personalized = personalized.replace(/\d+%/, `${params.discount}%`);
  }
  
  if (params.customWords) {
    Object.entries(params.customWords).forEach(([key, value]) => {
      personalized = personalized.replace(new RegExp(key, 'gi'), value);
    });
  }
  
  return personalized;
}

export const scriptAnalytics = new ScriptAnalytics();