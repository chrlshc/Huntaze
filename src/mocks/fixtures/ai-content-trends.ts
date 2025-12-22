export interface MockTrendItem {
  id: string;
  title: string;
  platform: 'tiktok' | 'instagram' | 'reddit';
  viralScore: number;
  engagement: number;
  velocity: number;
  category: string;
  hashtags: string[];
  thumbnail: string;
  author: string;
  description: string;
  tips: string[];
  majordomeAdvice: string;
  videoUrl: string;
}

export const mockTrends: MockTrendItem[] = [
  {
    id: 'trend_1',
    title: 'Get Ready With Me - Morning Edition',
    platform: 'tiktok',
    viralScore: 92,
    engagement: 1_250_000,
    velocity: 45,
    category: 'Lifestyle',
    hashtags: ['grwm', 'morningroutine', 'fyp'],
    thumbnail: '🌅',
    author: '@lifestyle_queen',
    description: 'Complete morning routine with skincare, natural makeup and outfit of the day.',
    tips: ['Use trending music', 'Show products in close-up', 'End with the final look'],
    majordomeAdvice:
      'Your morning lingerie content performs +40% better. Combine this GRWM format with your usual routine for max engagement.',
    videoUrl: 'https://www.tiktok.com/@lifestyle_queen/video/7312345678901234567',
  },
  {
    id: 'trend_2',
    title: 'Day in My Life as a Creator',
    platform: 'instagram',
    viralScore: 85,
    engagement: 890_000,
    velocity: 32,
    category: 'Lifestyle',
    hashtags: ['dayinmylife', 'contentcreator', 'reels'],
    thumbnail: '📸',
    author: '@creator_vibes',
    description: 'Vlog style typical day: wake up, content creation, shooting, editing.',
    tips: ['Show behind the scenes', 'Be authentic', 'Add subtitles'],
    majordomeAdvice:
      'Your fans love seeing behind the scenes. Show your photo setup and tease upcoming shoots to build anticipation.',
    videoUrl: 'https://www.instagram.com/reel/CxYz123456789/',
  },
  {
    id: 'trend_3',
    title: 'Quick Workout Challenge',
    platform: 'reddit',
    viralScore: 78,
    engagement: 2_100_000,
    velocity: 28,
    category: 'Fitness',
    hashtags: ['workout', 'fitness', 'challenge'],
    thumbnail: '💪',
    author: '@fitlife',
    description: '30-second fitness challenge with before/after transition.',
    tips: ['Keep it short (15-30s)', 'Show the transformation', 'Invite participation'],
    majordomeAdvice:
      'Your fitness posts in sportswear generate 2x more subs. Perfect for teasing exclusive content on OF.',
    videoUrl: 'https://www.reddit.com/r/fitness/comments/abc123/',
  },
];

export const mockRecommendations = [
  {
    id: 'rec_1',
    type: 'timing',
    title: 'Best time to post',
    description: 'Your followers are most active between 6pm and 9pm.',
    confidence: 87,
    platform: 'tiktok',
    actionable: true,
  },
  {
    id: 'rec_2',
    type: 'hashtag',
    title: 'Trending hashtags',
    description: '#grwm and #fyp have +45% velocity this week.',
    confidence: 82,
    platform: 'tiktok',
    actionable: true,
  },
];

export const mockContentIdeas = [
  {
    id: 'idea_1',
    title: 'Behind the Scenes Shoot',
    description: 'Show your photo/video setup and tease the final results.',
    platform: 'instagram',
    successRate: 74,
    estimatedViralScore: 74,
    basedOn: 'Behind the scenes trend',
    hashtags: ['bts', 'creator', 'reels'],
    suggestedHashtags: ['bts', 'creator', 'reels'],
    bestTime: 'Wednesday 8pm',
    bestPostingTime: 'Wednesday 8pm',
    contentType: 'reel',
    reasoning: 'BTS content builds trust and increases saves/shares.',
  },
  {
    id: 'idea_2',
    title: 'GRWM + Teaser',
    description: 'Combine GRWM format with a subtle teaser for your next drop.',
    platform: 'tiktok',
    successRate: 81,
    estimatedViralScore: 81,
    basedOn: 'GRWM trend',
    hashtags: ['grwm', 'fyp', 'teaser'],
    suggestedHashtags: ['grwm', 'fyp', 'teaser'],
    bestTime: 'Thursday 9pm',
    bestPostingTime: 'Thursday 9pm',
    contentType: 'short_video',
    reasoning: 'High velocity format + native tease converts to clicks.',
  },
];
