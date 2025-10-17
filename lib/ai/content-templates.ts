/**
 * High-converting content templates based on data analysis
 */

export const WINNING_TEMPLATES = {
  // Photo Sets
  photoSet: {
    luxury: {
      title: "Exclusive {theme} Collection 💎",
      description: "Only {number} sets available! Each buyer gets personalized bonus content 🎁",
      tags: ["exclusive", "limited", "vip", "luxury"],
      pricing: { min: 50, max: 200 }
    },
    teaser: {
      title: "Sneak Peek: {theme} 👀",
      description: "Want to see more? Check your DMs for a special surprise 💋",
      tags: ["preview", "teaser", "more-in-dm"],
      pricing: { min: 5, max: 15 }
    },
    bundle: {
      title: "{number} Photo Mega Bundle 📸",
      description: "Save ${discount}! Everything from this week + exclusive unreleased content",
      tags: ["bundle", "discount", "value", "exclusive"],
      pricing: { min: 30, max: 100 }
    }
  },

  // Videos
  video: {
    custom: {
      title: "Your Personal {theme} Video 🎥",
      description: "Made just for you! Tell me exactly what you want to see...",
      tags: ["custom", "personalized", "request"],
      pricing: { min: 100, max: 500 }
    },
    ppv: {
      title: "{duration} min {theme} Special 🔥",
      description: "My hottest video yet! Limited availability - {spots} left",
      tags: ["ppv", "exclusive", "hot", "limited"],
      pricing: { min: 20, max: 80 }
    },
    series: {
      title: "{theme} Series Part {number} 📺",
      description: "The story continues... Bundle all {total} parts for ${discount} off!",
      tags: ["series", "story", "bundle"],
      pricing: { min: 15, max: 40 }
    }
  },

  // Live Streams
  liveStream: {
    scheduled: {
      title: "LIVE Tonight {time}: {theme} 🔴",
      description: "Join me for an intimate session! Tippers get special attention 💕",
      tags: ["live", "tonight", "interactive"],
      pricing: { min: 10, max: 30 }
    },
    surprise: {
      title: "🚨 GOING LIVE NOW! {theme}",
      description: "Spontaneous fun time! First {number} viewers get exclusive content",
      tags: ["live-now", "surprise", "exclusive"],
      pricing: { min: 5, max: 20 }
    }
  },

  // Messages
  messages: {
    morning: {
      text: "Good morning baby! 🌞 Started my day thinking about you... want to see what I'm wearing? 😘",
      followUp: "Check your DMs for something special! 💋"
    },
    reEngagement: {
      text: "Hey stranger! Miss you 🥺 Come back and I'll make it worth your while... 50% off anything you want!",
      followUp: "This offer expires in 24h! ⏰"
    },
    vip: {
      text: "You've been such an amazing supporter! 💎 I made something JUST for my VIPs...",
      followUp: "Only sharing this with my top 5 fans! 🤫"
    }
  }
};

/**
 * Proven call-to-actions by goal
 */
export const CALL_TO_ACTIONS = {
  tips: [
    "Tip $10+ for instant surprise in DMs! 💝",
    "Big tippers get my personal snapchat! 👻",
    "Spoil me and I'll spoil you back 😈"
  ],
  engagement: [
    "Double tap if you want more! ❤️",
    "Comment your favorite emoji! 👇",
    "Share to unlock bonus content! 🔓"
  ],
  sales: [
    "Limited time: 30% off with code NAUGHTY 🏷️",
    "Next 10 buyers get exclusive video! 🎁",
    "Bundle deal ends at midnight! ⏰"
  ],
  subscription: [
    "Subscribe now for daily exclusive content! 📅",
    "Rebill ON = free custom each month! 🔄",
    "VIP subscription includes weekly video calls! 📱"
  ]
};

/**
 * Optimal posting schedule by timezone
 */
export const POSTING_SCHEDULE = {
  americas: {
    morning: "9:00 AM EST", // Coffee time
    lunch: "12:30 PM EST",  // Lunch break  
    evening: "8:00 PM EST", // Prime time
    late: "11:00 PM EST"    // Before bed
  },
  europe: {
    morning: "9:00 AM CET",
    lunch: "1:00 PM CET",
    evening: "9:00 PM CET",
    late: "11:30 PM CET"
  },
  asia: {
    morning: "9:00 AM JST",
    lunch: "12:00 PM JST",
    evening: "8:00 PM JST",
    late: "11:00 PM JST"
  },
  global: {
    slot1: "6:00 AM EST",  // Catches Asia evening
    slot2: "2:00 PM EST",  // EU evening + US afternoon
    slot3: "9:00 PM EST"   // US prime time
  }
};

/**
 * Content mix recommendations
 */
export const CONTENT_MIX = {
  optimal: {
    free: 20,        // 20% free teasers
    paid: 50,        // 50% paid content
    ppv: 20,         // 20% pay-per-view
    custom: 10       // 10% custom requests
  },
  aggressive: {
    free: 10,
    paid: 40,
    ppv: 35,
    custom: 15
  },
  conservative: {
    free: 30,
    paid: 50,
    ppv: 15,
    custom: 5
  }
};

/**
 * Emoji usage that converts
 */
export const HIGH_CONVERTING_EMOJIS = {
  titles: ['🔥', '💦', '🥵', '💎', '👀', '🎁', '⏰', '🚨', '💋', '🍑'],
  descriptions: ['😈', '💕', '😘', '🥺', '💝', '✨', '🔓', '👇', '💌', '🤫'],
  urgency: ['⏰', '🚨', '⚡', '🔥', '⏳'],
  exclusive: ['💎', '👑', '🔒', '🎁', '✨'],
  interactive: ['👇', '❤️', '💬', '👀', '🔄']
};

/**
 * Price anchoring strategies
 */
export const PRICING_STRATEGIES = {
  anchoring: {
    display: "$̶9̶9̶ NOW $49",
    description: "50% off for next 24h!"
  },
  bundling: {
    display: "3 for $60 (save $30!)",
    description: "Best value - normally $30 each"
  },
  scarcity: {
    display: "$75 - Only 5 left!",
    description: "Once they're gone, they're gone!"
  },
  tiered: {
    basic: { price: 20, perks: ["HD photos"] },
    vip: { price: 50, perks: ["HD photos", "Behind scenes", "Personal message"] },
    ultimate: { price: 100, perks: ["Everything", "Custom video", "1-on-1 chat"] }
  }
};