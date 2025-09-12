export const DEMO_LUXURY = {
  niches: ["luxury"],
  goals: { revenueTarget: "$5k–$10k", timeSaved: 10, automationLevel: 80 },

  persona: {
    stageName: "Ava Luxe",
    shortBio: "High-gloss, champagne nights, private invites only.",
    toneSliders: { friendlyFlirty: 70, playfulRefined: 80, directSoft: 60 },
    emojiUsage: "Medium",
    punctuationStyle: "Expressive",
    complexity: "Rich",
    signaturePhrases: ["champagne darling", "private invite", "exclusive"],
    forbiddenPhrases: ["DM for free", "cheap", "broke"],
  },

  boundaries: {
    nsfwLevel: "explicit",
    restrictedTopics: ["meetups IRL", "underage roleplay", "illegal content"],
    safeWord: "red",
    platformRulesFlags: { OF: true, IG: true, TT: true },
  },

  monetization: {
    subPrice: 14.99,
    trialEnabled: false,
    trialDays: 7,
    ppvRange: { min: 8, typ: 22, max: 60 },
    bundles: [
      { months: 3, discount: 10 },
      { months: 6, discount: 20 },
      { months: 12, discount: 30 },
    ],
    discountCapPercent: 30,
    upsellMenu: [
      { item: "10-min private video call", price: 90, eta: "24h" },
      { item: "Custom lingerie set (HD)", price: 75, eta: "48h" },
      { item: "Exclusive weekend pack (10 clips)", price: 180, eta: "24h" },
    ],
    customContentEnabled: true,
  },

  ops: {
    timezone: "America/New_York",
    activeHours: [
      { start: "20:00", end: "23:00" },
      { start: "10:00", end: "13:00" },
    ],
    responseSLA: { normal: "1h", vip: "5m" },
    automationLevelPercent: 80,
    reviewThresholds: { ppvAmount: 150, customRequest: true },
    dailyCaps: { global: 30, vip: 60 },
    reengageWindows: { h48: true, h72: true, d7: true },
  },

  segmentation: {
    whaleThreshold: 500,
    cohorts: [
      { name: "BigSpender", min: 100, max: 499 },
      { name: "Regular", min: 1, max: 99 },
    ],
  },

  dataConsent: { trainingConsent: true, retentionDays: 90 },
  funnels: { linkHub: "https://beacons.ai/avaluxe", priorityGoals: ["ppv", "customs", "renewals"] },
};

