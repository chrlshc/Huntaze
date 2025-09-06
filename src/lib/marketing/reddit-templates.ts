// Reddit Templates - 12 modèles de titres par niche (EN only) + 12 premiers commentaires UTM-ready
// Compatible avec le reddit-automation.ts parser

export interface RedditTemplate {
  niche: string;
  titles: string[];
  firstComments: string[];
  tags: string[]; // Pour matcher avec le bon subreddit
}

// 12 NICHES PRINCIPALES ONLYFANS
export const REDDIT_TEMPLATES: RedditTemplate[] = [
  {
    niche: 'amateur',
    titles: [
      '[F] First time posting here 🥺',
      '[F] A bit shy but hope you like it',
      '[F] New content from today, what do you think?',
      '[F] Just started, be nice to me',
      '[F] My first post in this sub'
    ],
    firstComments: [
      'Hey guys! 💕 If you want to see more, I have an exclusive page → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | 50% off for Reddit fans!',
      'Thanks for the warm welcome! More content on my page → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Special Reddit discount!',
      'First time here! Full content available → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Free trial for Reddit!'
    ],
    tags: ['amateur', 'new', 'fresh', 'real']
  },
  {
    niche: 'milf',
    titles: [
      '[F35] Mom of 2, am I still desirable?',
      '[F40] MILFs do it better 😏',
      '[F38] After morning yoga',
      '[F42] Wine mom vibes tonight',
      '[F36] School drop-off outfit on/off'
    ],
    firstComments: [
      'Thanks for all the love! 😘 I have much more mature content on my page → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Special promo this weekend!',
      'MILF lovers unite! Full content here → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Mom bod appreciation discount',
      'Hey sweeties! More mommy content → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Daily posts guaranteed!'
    ],
    tags: ['milf', 'mature', 'mom', 'cougar']
  },
  {
    niche: 'petite',
    titles: [
      '[F] 5\'1" and 99lbs, small enough for you?',
      '[F] Petite but naughty 😈',
      '[F] Good things come in small packages',
      '[F] Fun-sized and ready to play',
      '[F] Tiny girl, big surprises'
    ],
    firstComments: [
      'Hi there! 🥰 For those who love petites, I have lots of surprises → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | New set available!',
      'Small but mighty! More petite content → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Pocket-sized discount!',
      'Hey! Full petite paradise here → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Daily tiny treats!'
    ],
    tags: ['petite', 'small', 'tiny', 'spinner']
  },
  {
    niche: 'curvy',
    titles: [
      '[F] Real women have curves',
      '[F] Too much curves for you?',
      '[F] Embrace the thiccness 🍑',
      '[F] Curvy and confident',
      '[F] All natural curves here'
    ],
    firstComments: [
      'Thanks for appreciating real curves! 💜 More curves to explore → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Daily content!',
      'Curve lovers welcome! Full content → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Thicc Thursday special!',
      'Hey babes! More curves than a racetrack → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | BBW friendly!'
    ],
    tags: ['curvy', 'thick', 'bbw', 'plus']
  },
  {
    niche: 'asian',
    titles: [
      '[F] Asian girl here to please',
      '[F] Kawaii but not innocent 😏',
      '[F] Japanese/American mix',
      '[F] Your anime waifu IRL',
      '[F] Submissive Asian cutie'
    ],
    firstComments: [
      'Konnichiwa! 🌸 More exclusive Asian content here → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Customs available!',
      'Asian paradise awaits! → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Waifu experience included!',
      'Hey senpai! Full content → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Asian persuasion discount!'
    ],
    tags: ['asian', 'japanese', 'korean', 'thai']
  },
  {
    niche: 'latina',
    titles: [
      '[F] Spicy Latina to spice up your day 🌶️',
      '[F] Straight from Brazil with love',
      '[F] Caliente and ready',
      '[F] Latina curves you\'ve been dreaming of',
      '[F] Salsa dancing into your heart'
    ],
    firstComments: [
      'Hola papi! 🔥 Come taste the Latin flavor → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Very hot content!',
      'Spicy content daily! → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Latina heat discount!',
      'Hey amor! Full fiesta here → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Caliente specials!'
    ],
    tags: ['latina', 'brazilian', 'colombian', 'mexican']
  },
  {
    niche: 'goth',
    titles: [
      '[F] Big tiddy goth GF at your service',
      '[F] Gothic but adorable 🖤',
      '[F] Emo girl with surprises',
      '[F] Your dark fantasy come true',
      '[F] Fishnets and feelings'
    ],
    firstComments: [
      'Hey darklings! 🦇 More darkness on my page → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Exclusive alt content!',
      'Join the dark side! → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Goth GF experience!',
      'Alternative content daily → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Black Friday every day!'
    ],
    tags: ['goth', 'emo', 'alt', 'punk']
  },
  {
    niche: 'fitness',
    titles: [
      '[F] Gym gains and more 💪',
      '[F] Yoga pants on/off',
      '[F] Abs and more if interested',
      '[F] Post-workout glow',
      '[F] Flexibility demonstration'
    ],
    firstComments: [
      'Hey fit fam! 💪 Private workouts and more → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Nutrition tips included!',
      'Full fitness content → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Workout partners discount!',
      'Gym motivation daily! → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Protein shake specials!'
    ],
    tags: ['fitness', 'gym', 'yoga', 'athletic']
  },
  {
    niche: 'redhead',
    titles: [
      '[F] Redheads do it better 🔥',
      '[F] Fire hair, fire everywhere',
      '[F] Natural redhead and proud',
      '[F] Ginger spice at your service',
      '[F] Rare redhead content'
    ],
    firstComments: [
      'Team ginger! 🧡 More fire on my page → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Rare real redhead content!',
      'Natural redhead here! → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Fiery content daily!',
      'Ginger paradise → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Red hot deals!'
    ],
    tags: ['redhead', 'ginger', 'fire', 'natural']
  },
  {
    niche: 'cosplay',
    titles: [
      '[F] D.Va reporting for duty!',
      '[F] Your favorite waifu IRL',
      '[F] Today\'s cosplay, guess who?',
      '[F] Lewd cosplay collection',
      '[F] From comic-con to your screen'
    ],
    firstComments: [
      'Senpai! 💕 More lewd cosplays → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Requests accepted!',
      'Full cosplay collection → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Custom characters available!',
      'Waifu paradise here → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Convention specials!'
    ],
    tags: ['cosplay', 'anime', 'gaming', 'nerd']
  },
  {
    niche: 'feet',
    titles: [
      '[F] Fresh pedicure for you',
      '[F] Size 7 feet for your viewing',
      '[F] New color, do you like?',
      '[F] Soles Sunday special',
      '[F] Toe wiggling video available'
    ],
    firstComments: [
      'Thanks foot lovers! 👣 Complete feet collection → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Customs with your requests!',
      'Daily feet content → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Sock removal videos!',
      'Foot paradise here → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Pedicure specials!'
    ],
    tags: ['feet', 'foot', 'soles', 'toes']
  },
  {
    niche: 'couple',
    titles: [
      '[MF] We love sharing our moments',
      '[FM] Real couple content',
      '[MF] Her and I for your pleasure',
      '[MF] Authentic amateur couple',
      '[FM] Date night got spicy'
    ],
    firstComments: [
      'Hey there! 👫 More of our intimate adventures → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Exclusive B/G content!',
      'Real couple content → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Full videos available!',
      'Join our bedroom → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Couples discount!'
    ],
    tags: ['couple', 'mf', 'amateur', 'real']
  }
];

// HELPER FUNCTIONS
export function getTemplateByNiche(niche: string): RedditTemplate | undefined {
  return REDDIT_TEMPLATES.find(t => t.niche === niche || t.tags.includes(niche));
}

export function getRandomTitle(niche: string): string {
  const template = getTemplateByNiche(niche);
  if (!template) return '';
  
  return template.titles[Math.floor(Math.random() * template.titles.length)];
}

export function formatFirstComment(
  niche: string, 
  link: string, 
  subreddit: string
): string {
  const template = getTemplateByNiche(niche);
  if (!template) return '';
  
  const comments = template.firstComments;
  const randomComment = comments[Math.floor(Math.random() * comments.length)];
  
  return randomComment
    .replace('{link}', link)
    .replace('{subreddit}', subreddit.toLowerCase());
}

// UTM TRACKING HELPERS
export function buildUTMLink(
  baseLink: string,
  source: string = 'reddit',
  medium: string = 'comment',
  campaign: string = 'general'
): string {
  const url = new URL(baseLink);
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
}

// TITLE VARIATIONS FOR A/B TESTING
export function generateTitleVariations(
  niche: string,
  count: number = 3
): { title: string; tags: string[] }[] {
  const template = getTemplateByNiche(niche);
  if (!template) return [];
  
  const variations = [];
  const shuffled = [...template.titles].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    variations.push({
      title: shuffled[i],
      tags: template.tags
    });
  }
  
  return variations;
}

// SAFETY CHECK FOR TITLES
export function isTitleSafe(title: string): {
  safe: boolean;
  issues: string[];
} {
  const issues = [];
  
  // Check for banned words
  const bannedWords = ['onlyfans', 'OF', 'subscribe', 'payment', 'cashapp', 'venmo'];
  const lowerTitle = title.toLowerCase();
  
  for (const banned of bannedWords) {
    if (lowerTitle.includes(banned.toLowerCase())) {
      issues.push(`Contains banned word: ${banned}`);
    }
  }
  
  // Check for links
  if (title.includes('http') || title.includes('www.')) {
    issues.push('Contains link in title');
  }
  
  // Check gender tag
  if (!title.match(/\[(F|M|MF|FM|FF|MM|NB)\]/)) {
    issues.push('Missing gender tag [F]/[M]/etc');
  }
  
  return {
    safe: issues.length === 0,
    issues
  };
}

// EXPORT ALL TEMPLATES AS SINGLE OBJECT
export const ALL_REDDIT_CONTENT = {
  templates: REDDIT_TEMPLATES,
  helpers: {
    getTemplateByNiche,
    getRandomTitle,
    formatFirstComment,
    buildUTMLink,
    generateTitleVariations,
    isTitleSafe
  }
};