// Smart Audiences & Templates - Win-back, Upgrade, Anniversary
// English only for Instagram (SFW) and OnlyFans

export interface SmartAudience {
  id: string;
  name: string;
  description: string;
  criteria: {
    lastSeen?: { operator: 'gt' | 'lt' | 'between'; days: number | [number, number] };
    totalSpent?: { operator: 'gt' | 'lt' | 'between'; amount: number | [number, number] };
    subscriptionStatus?: 'active' | 'expired' | 'never';
    fanSegment?: string[];
    customEvents?: string[];
  };
  priority: 'high' | 'medium' | 'low';
  estimatedSize?: string;
}

export interface MessageTemplate {
  id: string;
  audienceId: string;
  platform: 'instagram' | 'onlyfans';
  language: 'en';
  subject?: string; // Pour OF mass DM
  message: string;
  mediaHint?: string;
  timing: {
    preferredHour: number[];
    preferredDays?: number[]; // 0=dimanche, 6=samedi
  };
  variables?: string[]; // Variables à remplacer
}

// 3 AUDIENCES PRÊTES À L'EMPLOI
export const SMART_AUDIENCES: SmartAudience[] = [
  {
    id: 'win_back_30_days',
    name: 'Win-Back 30 Jours',
    description: 'Fans qui étaient actifs mais n\'ont pas interagi depuis 30+ jours',
    criteria: {
      lastSeen: { operator: 'gt', days: 30 },
      totalSpent: { operator: 'gt', amount: 20 },
      fanSegment: ['REGULAR', 'BIG_SPENDER', 'VIP_WHALE', 'IMPULSE_BUYER']
    },
    priority: 'high',
    estimatedSize: '~15-20% of base'
  },
  {
    id: 'upgrade_nudge_vip',
    name: 'Upgrade Nudge VIP',
    description: 'Fans réguliers proches du statut VIP, actifs récemment',
    criteria: {
      lastSeen: { operator: 'lt', days: 7 },
      totalSpent: { operator: 'between', amount: [50, 99] },
      subscriptionStatus: 'active',
      fanSegment: ['REGULAR', 'IMPULSE_BUYER']
    },
    priority: 'medium',
    estimatedSize: '~5-8% of base'
  },
  {
    id: 'anniversary_celebration',
    name: 'Anniversaire 1 an',
    description: 'Fans fidèles depuis 12 mois (±7 jours)',
    criteria: {
      customEvents: ['subscription_anniversary_365'],
      subscriptionStatus: 'active',
      fanSegment: ['LOYAL', 'VIP_WHALE', 'BIG_SPENDER']
    },
    priority: 'high',
    estimatedSize: '~2-3% monthly'
  }
];

// 6 TEMPLATES (3 audiences × 2 platforms)
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // WIN-BACK - INSTAGRAM (SFW)
  {
    id: 'win_back_ig_en',
    audienceId: 'win_back_30_days',
    platform: 'instagram',
    language: 'en',
    message: `Hey {username}! 💕 It's been a while since we talked...
    
I've been creating AMAZING content this month and I'd love your feedback!
    
Come check out my exclusive page (link in bio) - I have a special surprise for you 🎁`,
    timing: { preferredHour: [19, 20, 21] },
    variables: ['username']
  },

  // WIN-BACK - ONLYFANS
  {
    id: 'win_back_of_en',
    audienceId: 'win_back_30_days',
    platform: 'onlyfans',
    language: 'en',
    subject: '🥺 I miss you...',
    message: `Hi {username} baby! 💔

I just realized it's been {days_absent} days since we last talked... I really miss you!

I have so many new things to show you:
• My {recent_theme} photoshoot 🔥
• A special video just for my VIPs
• And a surprise just for you...

To thank you for coming back, I have a gift: 50% OFF EVERYTHING for 48h!

Code: MISSYOU50 💕

Can't wait to reconnect...

Kisses everywhere,
{creator_name} 😘`,
    timing: { preferredHour: [21, 22, 23] },
    variables: ['username', 'days_absent', 'recent_theme', 'creator_name']
  },

  // UPGRADE NUDGE - INSTAGRAM
  {
    id: 'upgrade_nudge_ig_en',
    audienceId: 'upgrade_nudge_vip',
    platform: 'instagram',
    language: 'en',
    message: `{username}! You're one of my most active fans and I love it 😍

I have something special for my VIPs this month...

DM me "VIP" and I'll show you the exclusive perks waiting for you 💎`,
    timing: { preferredHour: [18, 19, 20] },
    variables: ['username']
  },

  // UPGRADE NUDGE - ONLYFANS
  {
    id: 'upgrade_nudge_of_en',
    audienceId: 'upgrade_nudge_vip',
    platform: 'onlyfans',
    language: 'en',
    subject: '💎 You\'re SO close to VIP status!',
    message: `{username} my favorite!

I just checked and you're very close to VIP GOLD status! 😱

My VIP GOLD members get:
✨ 40% OFF ALL PPVs (forever!)
✨ Exclusive content every week
✨ Personal voice messages
✨ Priority on customs
✨ Monthly private lives

This weekend only, I'm offering a BOOST:
Every $ spent counts DOUBLE towards your status!

That means you can become VIP with just a bit more! 🤯

What are you waiting for? Show me you're my favorite VIP 💋

{creator_name} xoxo`,
    mediaHint: 'Attach teasing VIP preview content',
    timing: { preferredHour: [20, 21, 22], preferredDays: [5, 6] }, // Friday-Saturday
    variables: ['username', 'total_spent', 'creator_name']
  },

  // ANNIVERSARY - INSTAGRAM
  {
    id: 'anniversary_ig_en',
    audienceId: 'anniversary_celebration',
    platform: 'instagram',
    language: 'en',
    message: `OMG {username}! 🎉🎂

You know what? It's been 1 YEAR since we connected!

I've prepared something very special to celebrate...
Check your DMs on my exclusive page 😏💕`,
    timing: { preferredHour: [12, 18, 20] },
    variables: ['username']
  },

  // ANNIVERSARY - ONLYFANS
  {
    id: 'anniversary_of_en',
    audienceId: 'anniversary_celebration',
    platform: 'onlyfans',
    language: 'en',
    subject: '🎂 HAPPY ANNIVERSARY TO US! 🥳',
    message: `{username} MY LOVE! 💕

EXACTLY 1 YEAR AGO TODAY, you became my fan and changed my life! 🥺

You've been there for me from the start and I can't tell you how much that means...

To celebrate our anniversary, I created:
🎁 A VERY special video (10min+) just for you
🎁 An exclusive "{anniversary_theme}" photo set
🎁 A personal voice message where I tell you EVERYTHING...

AND SURPRISE! You get 75% OFF EVERYTHING today! 🎉

My anniversary gift to YOU! Use code: ONEYEAR75

I love you so much {username}... Thank you for being the best fan a girl could dream of 😘

Happy anniversary to us!
{creator_name} ❤️

PS: I can't wait for you to see what I prepared... It's VERY naughty 🙈`,
    mediaHint: 'Attach anniversary teaser + cake photo',
    timing: { preferredHour: [9, 12, 20] }, // Morning or evening
    variables: ['username', 'anniversary_theme', 'creator_name']
  }
];

// HELPER: Get templates for audience
export function getTemplatesForAudience(
  audienceId: string, 
  platform?: 'instagram' | 'onlyfans',
  language?: 'en'
): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter(t => 
    t.audienceId === audienceId &&
    (!platform || t.platform === platform) &&
    (!language || t.language === language)
  );
}

// HELPER: Replace variables in template
export function personalizeTemplate(
  template: MessageTemplate,
  data: Record<string, string | number>
): string {
  let message = template.message;
  
  // Replace all variables
  (template.variables || []).forEach(variable => {
    const value = data[variable] || `{${variable}}`;
    message = message.replace(new RegExp(`{${variable}}`, 'g'), String(value));
  });
  
  return message;
}

// HELPER: Get optimal send time
export function getOptimalSendTime(template: MessageTemplate): Date {
  const now = new Date();
  const preferredHour = template.timing.preferredHour[0];
  const sendTime = new Date(now);
  
  sendTime.setHours(preferredHour, 0, 0, 0);
  
  // If time passed today, schedule for tomorrow
  if (sendTime < now) {
    sendTime.setDate(sendTime.getDate() + 1);
  }
  
  // Check preferred days
  if (template.timing.preferredDays) {
    while (!template.timing.preferredDays.includes(sendTime.getDay())) {
      sendTime.setDate(sendTime.getDate() + 1);
    }
  }
  
  return sendTime;
}
