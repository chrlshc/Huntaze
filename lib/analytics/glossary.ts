/**
 * Analytics Glossary - Creator-friendly definitions
 * 
 * Progressive disclosure content for tooltips and popovers.
 * Each term has 4 levels of explanation.
 */

export interface GlossaryEntry {
  id: string;
  label: string;
  labelFriendly?: string;
  tooltip: string;
  definition: string;
  whyImportant: string;
  example: string;
  howToImprove: string[];
  category: 'revenue' | 'retention' | 'acquisition' | 'engagement' | 'risk' | 'messaging';
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ============================================
  // REVENUE KPIs
  // ============================================
  netRevenue: {
    id: 'netRevenue',
    label: 'Net Revenue',
    tooltip: "All the money you actually earned, after platform fees.",
    definition: "Total revenue (subs + tips + PPV + customs) minus OnlyFans fees, refunds, and chargebacks.",
    whyImportant: "This is the number that really matters — what actually hits your bank account.",
    example: "If you make $1,000 gross and OF takes 20%, your net revenue = $800.",
    howToImprove: [
      "Raise your sub price if retention is good (>70%)",
      "Push more PPV to active fans",
      "Reduce chargebacks by vetting new fans"
    ],
    category: 'revenue'
  },

  arpu: {
    id: 'arpu',
    label: 'ARPU',
    labelFriendly: 'ARPU — Avg Revenue Per User',
    tooltip: "On average, how much each fan brings you this period.",
    definition: "Average Revenue Per User = Net Revenue ÷ Number of active fans.",
    whyImportant: "If your ARPU goes up, you're monetizing existing fans better (without needing more).",
    example: "Net revenue $5,000 ÷ 200 fans = ARPU of $25.",
    howToImprove: [
      "Send targeted PPV to engaged fans",
      "Create customs for whales",
      "Gradually increase your sub price"
    ],
    category: 'revenue'
  },

  arppu: {
    id: 'arppu',
    label: 'ARPPU',
    labelFriendly: 'ARPPU — Avg Revenue Per Paying User',
    tooltip: "How much a fan who made at least 1 purchase brings you on average.",
    definition: "Average Revenue Per Paying User = Revenue ÷ Fans who paid for something (sub, tip, PPV...).",
    whyImportant: "Tells you if your paying fans spend a lot or a little.",
    example: "If 50 fans paid and generated $2,000, ARPPU = $40.",
    howToImprove: [
      "Offer PPV bundles at discounted prices",
      "Create a customs menu with different price points",
      "Re-engage fans who already purchased"
    ],
    category: 'revenue'
  },

  ltv: {
    id: 'ltv',
    label: 'LTV',
    labelFriendly: 'LTV — Lifetime Value',
    tooltip: "How much a fan brings you on average over their entire subscription.",
    definition: "Lifetime Value = ARPU × Average subscription duration (in months).",
    whyImportant: "If your LTV > acquisition cost, you're profitable. Higher = more you can invest in promo.",
    example: "ARPU $30/month × 4 months tenure = LTV of $120.",
    howToImprove: [
      "Improve retention (regular content, DM engagement)",
      "Increase ARPU with upsells",
      "Create content series to keep fans hooked"
    ],
    category: 'revenue'
  },

  // ============================================
  // RETENTION KPIs
  // ============================================
  activeFans: {
    id: 'activeFans',
    label: 'Active Fans',
    tooltip: "The number of fans with an active paid subscription right now.",
    definition: "All fans who have an active sub (not expired, not cancelled) at period end.",
    whyImportant: "This is your base — more active fans = more recurring revenue.",
    example: "If you have 500 subs and 50 expired this month, you have 450 active fans.",
    howToImprove: [
      "Post regularly to keep fans engaged",
      "Send personalized DMs to silent fans",
      "Create exclusive content for long-term subs"
    ],
    category: 'retention'
  },

  rebillRate: {
    id: 'rebillRate',
    label: 'Rebill Rate',
    labelFriendly: 'Rebill Rate — Renewal Rate',
    tooltip: "The % of fans whose subscription expires and who renew.",
    definition: "Rebill Rate = Renewed subs ÷ Expired subs × 100.",
    whyImportant: "THE retention KPI. A rebill rate of 80%+ = very healthy business.",
    example: "100 subs expire, 75 renew = 75% rebill rate.",
    howToImprove: [
      "Send a personal message 2-3 days before expiry",
      "Offer an exclusive bonus for renewals",
      "Post content the day before expirations"
    ],
    category: 'retention'
  },

  netNewSubs: {
    id: 'netNewSubs',
    label: 'Net New Subs',
    tooltip: "New subscribers minus those who left = your real growth.",
    definition: "Net New Subs = New subs − Churned subs (expired/cancelled).",
    whyImportant: "If positive, you're growing. If negative, you're losing fans faster than gaining.",
    example: "+80 new subs − 30 churned = +50 net new subs.",
    howToImprove: [
      "Increase acquisition (more social promo)",
      "Reduce churn (better retention)",
      "Identify why fans leave (price? content?)"
    ],
    category: 'retention'
  },

  avgTenure: {
    id: 'avgTenure',
    label: 'Avg Tenure',
    labelFriendly: 'Avg Tenure — Avg Subscription Length',
    tooltip: "How many days on average a fan stays subscribed before leaving.",
    definition: "Average time between sub start and churn (cancellation or non-renewal).",
    whyImportant: "Longer tenure = higher LTV. It's a satisfaction indicator.",
    example: "If your fans stay 45 days on average, tenure = 45 days.",
    howToImprove: [
      "Create a regular content calendar",
      "Engage fans in the first 7 days (crucial)",
      "Offer perks for long-term subs"
    ],
    category: 'retention'
  },

  // ============================================
  // ACQUISITION KPIs
  // ============================================
  conversionRate: {
    id: 'conversionRate',
    label: 'Conversion Rate',
    tooltip: "The % of people who click your link and end up subscribing.",
    definition: "Conversion Rate = New subs ÷ Link taps × 100.",
    whyImportant: "If your rate is low, you're losing potential fans. Optimize your OF page!",
    example: "100 link taps, 5 new subs = 5% conversion rate.",
    howToImprove: [
      "Improve your bio and OF profile picture",
      "Offer a promo for new subs (e.g., -50% first month)",
      "Add attractive previews to your page"
    ],
    category: 'acquisition'
  },

  views: {
    id: 'views',
    label: 'Views',
    tooltip: "How many times your content was seen on social media.",
    definition: "Total views on TikTok, Instagram, Twitter... This is the top of your funnel.",
    whyImportant: "More views = more visibility = more chances to convert.",
    example: "Your TikTok video gets 50K views, that's 50K people exposed to your content.",
    howToImprove: [
      "Post at peak hours for your audience",
      "Use trending sounds and formats",
      "Post regularly (1-3x per day)"
    ],
    category: 'acquisition'
  },

  profileClicks: {
    id: 'profileClicks',
    label: 'Profile Clicks',
    tooltip: "How many people clicked to see your profile after viewing your content.",
    definition: "The number of clicks to your profile from your posts/videos.",
    whyImportant: "It's the step between 'I see' and 'I'm interested'. Good ratio = engaging content.",
    example: "10K views, 500 profile clicks = 5% curiosity rate.",
    howToImprove: [
      "Add a call-to-action in your videos",
      "Create content that makes people want more",
      "Use strong hooks in the first 3 seconds"
    ],
    category: 'acquisition'
  },

  linkTaps: {
    id: 'linkTaps',
    label: 'Link Taps',
    tooltip: "How many people clicked your OnlyFans link from your profile.",
    definition: "Clicks on your bio link (Linktree, Beacons, or direct OF link).",
    whyImportant: "This is the step right before subscribing. If low, your bio isn't convincing.",
    example: "500 profile clicks, 100 link taps = 20% click the link.",
    howToImprove: [
      "Make your OF link prominent in your bio",
      "Add a clear CTA ('Link in bio 🔥')",
      "Use a simple Linktree, not too many choices"
    ],
    category: 'acquisition'
  },

  newSubs: {
    id: 'newSubs',
    label: 'New Subs',
    tooltip: "The number of new subscribers this period.",
    definition: "All fans who subscribed for the first time (or re-subscribed after churn).",
    whyImportant: "This is your gross growth. But beware, if churn is high, it's not enough.",
    example: "This month you got 80 new subs.",
    howToImprove: [
      "Increase your visibility on social media",
      "Do collabs with other creators",
      "Launch limited-time promos"
    ],
    category: 'acquisition'
  },

  // ============================================
  // EXPANSION REVENUE
  // ============================================
  ppvAttachRate: {
    id: 'ppvAttachRate',
    label: 'PPV Attach Rate',
    tooltip: "The % of your active fans who bought at least 1 PPV.",
    definition: "PPV Attach Rate = Fans who bought PPV ÷ Active fans × 100.",
    whyImportant: "PPV is your #1 lever for additional revenue. Good rate = 15-25%.",
    example: "200 active fans, 40 bought a PPV = 20% attach rate.",
    howToImprove: [
      "Send targeted PPV (not blind mass messages)",
      "Create free teasers that build desire",
      "Test different prices ($5, $10, $15...)"
    ],
    category: 'revenue'
  },

  tipConversionRate: {
    id: 'tipConversionRate',
    label: 'Tip Conversion',
    tooltip: "The % of your fans who sent you at least 1 tip.",
    definition: "Tip Conversion = Fans who tipped ÷ Active fans × 100.",
    whyImportant: "Tips show emotional engagement. Good rate = 10-15%.",
    example: "200 fans, 25 tipped = 12.5% tip conversion.",
    howToImprove: [
      "Publicly thank tippers (motivates others)",
      "Create tip menus with rewards",
      "Engage in DM to build connection"
    ],
    category: 'engagement'
  },

  payersRatio: {
    id: 'payersRatio',
    label: 'Payers Ratio',
    tooltip: "The % of fans who made at least 1 purchase beyond their sub.",
    definition: "Payers Ratio = Fans with transaction (tip/PPV/custom) ÷ Active fans × 100.",
    whyImportant: "Tells you how many fans are 'active' vs 'passive'. Target: >30%.",
    example: "200 fans, 70 made a purchase = 35% payers ratio.",
    howToImprove: [
      "Send an affordable first PPV ($5) to new fans",
      "Create exclusive offers for 'sub-only' fans",
      "Identify passive fans and engage them in DM"
    ],
    category: 'revenue'
  },

  // ============================================
  // MESSAGING
  // ============================================
  broadcastOpenRate: {
    id: 'broadcastOpenRate',
    label: 'Open Rate',
    tooltip: "The % of fans who open your mass messages.",
    definition: "Open Rate = Messages opened ÷ Messages sent × 100.",
    whyImportant: "If nobody opens, nobody buys. Good rate = 40-50%.",
    example: "You send to 200 fans, 90 open = 45% open rate.",
    howToImprove: [
      "Write catchy first words (preview)",
      "Send at the right times (test!)",
      "Segment your sends (not the same message to everyone)"
    ],
    category: 'messaging'
  },

  unlockRate: {
    id: 'unlockRate',
    label: 'Unlock Rate',
    tooltip: "The % of fans who buy the PPV in your message.",
    definition: "Unlock Rate = PPV purchases ÷ Message recipients × 100.",
    whyImportant: "This is the 'conversion rate' of your PPV messages. Target: 5-10%.",
    example: "Message sent to 200 fans, 15 buy = 7.5% unlock rate.",
    howToImprove: [
      "Add an attractive teaser/preview",
      "Test different prices",
      "Personalize the message (name, context)"
    ],
    category: 'messaging'
  },

  revenuePerBroadcast: {
    id: 'revenuePerBroadcast',
    label: 'Rev / Broadcast',
    tooltip: "How much you earn on average per mass message sent.",
    definition: "Revenue Per Broadcast = Revenue generated ÷ Number of broadcasts.",
    whyImportant: "Tells you if your messages are profitable. Compare with time spent.",
    example: "5 broadcasts generated $500 = $100/broadcast.",
    howToImprove: [
      "Send less but better (quality > quantity)",
      "Target engaged fans for expensive PPV",
      "Create sequences (teaser → offer → reminder)"
    ],
    category: 'messaging'
  },

  medianResponseTime: {
    id: 'medianResponseTime',
    label: 'Response Time',
    tooltip: "Median time to respond to your fans' DMs.",
    definition: "The time between the fan's message and your response (or AI's).",
    whyImportant: "Fast response = more tips and sales. Fans want attention.",
    example: "Median time of 5 min = you respond fast!",
    howToImprove: [
      "Enable DM notifications",
      "Use AI for quick responses",
      "Set 'DM time' slots in your day"
    ],
    category: 'messaging'
  },

  // ============================================
  // RISK
  // ============================================
  chargebackRate: {
    id: 'chargebackRate',
    label: 'Chargeback Rate',
    tooltip: "The % of transactions disputed by buyers.",
    definition: "Chargeback Rate = Disputed transactions ÷ Total transactions × 100.",
    whyImportant: "Chargebacks cost you money AND can get your account blocked. Target: <1%.",
    example: "1000 transactions, 8 chargebacks = 0.8% (acceptable).",
    howToImprove: [
      "Vet suspicious new fans (new account, no photo)",
      "Avoid aggressive promos that attract fraudsters",
      "Document your exchanges in case of dispute"
    ],
    category: 'risk'
  },

  // ============================================
  // AI
  // ============================================
  aiRpm: {
    id: 'aiRpm',
    label: 'AI RPM',
    labelFriendly: 'AI RPM — Revenue Per AI Message',
    tooltip: "How much revenue each AI-sent message generates.",
    definition: "Revenue Per Message = Revenue attributed to AI ÷ AI messages sent.",
    whyImportant: "Tells you if your AI is profitable. Compare with AI cost.",
    example: "AI sent 500 messages and generated $200 = $0.40/message.",
    howToImprove: [
      "Improve AI prompts for more personalization",
      "Target high-potential fans with AI",
      "Analyze which message types convert best"
    ],
    category: 'engagement'
  },

  // ============================================
  // AUTOMATIONS
  // ============================================
  trigger: {
    id: 'trigger',
    label: 'Trigger',
    labelFriendly: 'Trigger — What starts the automation',
    tooltip: "The event that kicks off your automation workflow.",
    definition: "A trigger is the 'when' of your automation. It's the event that starts the workflow (new sub, message received, etc.).",
    whyImportant: "Choosing the right trigger ensures your automation runs at the perfect moment.",
    example: "Trigger: 'New Subscriber' → Action: Send welcome message.",
    howToImprove: [
      "Match triggers to fan journey moments",
      "Use specific triggers (not too broad)",
      "Test different trigger timings"
    ],
    category: 'engagement'
  },

  action: {
    id: 'action',
    label: 'Action',
    labelFriendly: 'Action — What the automation does',
    tooltip: "The task your automation performs when triggered.",
    definition: "An action is the 'what' of your automation. It's what happens after the trigger fires (send message, add tag, etc.).",
    whyImportant: "Actions are how you engage fans automatically, saving you time while staying personal.",
    example: "Action: Send a personalized welcome DM with a 10% discount.",
    howToImprove: [
      "Personalize messages with fan name",
      "Add delays to feel more human",
      "Chain multiple actions for sequences"
    ],
    category: 'engagement'
  },

  executionRate: {
    id: 'executionRate',
    label: 'Execution Rate',
    labelFriendly: 'Execution Rate — Success %',
    tooltip: "The % of times your automation ran successfully.",
    definition: "Execution Rate = Successful runs ÷ Total triggers × 100.",
    whyImportant: "A low rate means something's broken. Target: >95%.",
    example: "100 triggers, 98 successful = 98% execution rate.",
    howToImprove: [
      "Check for errors in your workflow",
      "Ensure connected platforms are working",
      "Simplify complex automations"
    ],
    category: 'engagement'
  },

  timeSaved: {
    id: 'timeSaved',
    label: 'Time Saved',
    labelFriendly: 'Time Saved — Hours automated',
    tooltip: "Estimated time your automations saved you.",
    definition: "Time Saved = Number of executions × Average time per manual task.",
    whyImportant: "This is why you automate — to focus on content, not repetitive tasks.",
    example: "1,000 welcome messages × 2 min each = 33 hours saved.",
    howToImprove: [
      "Automate your most repetitive tasks first",
      "Add more automations for common scenarios",
      "Let AI handle initial fan conversations"
    ],
    category: 'engagement'
  },

  ppv: {
    id: 'ppv',
    label: 'PPV',
    labelFriendly: 'PPV — Pay-Per-View',
    tooltip: "Locked content fans pay to unlock.",
    definition: "Pay-Per-View content is media (photos/videos) that fans must pay extra to see, beyond their subscription.",
    whyImportant: "PPV is often 30-50% of creator revenue. It's your main upsell tool.",
    example: "You send a locked video for $15. Fan pays to unlock = PPV sale.",
    howToImprove: [
      "Create exclusive content worth paying for",
      "Use teasers to build anticipation",
      "Price based on content length/quality"
    ],
    category: 'revenue'
  },

  crossPost: {
    id: 'crossPost',
    label: 'Cross-Post',
    labelFriendly: 'Cross-Post — Multi-platform posting',
    tooltip: "Automatically share content across multiple platforms.",
    definition: "Cross-posting means publishing the same content to multiple social platforms (Instagram, TikTok, Twitter) at once.",
    whyImportant: "Saves time and ensures consistent presence across all your platforms.",
    example: "Post once → automatically shared to IG, TikTok, and Twitter.",
    howToImprove: [
      "Adapt content format per platform",
      "Schedule posts for optimal times",
      "Use platform-specific captions"
    ],
    category: 'engagement'
  }
};

/**
 * Get glossary entry by ID
 */
export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return GLOSSARY[id];
}

/**
 * Get all entries by category
 */
export function getEntriesByCategory(category: GlossaryEntry['category']): GlossaryEntry[] {
  return Object.values(GLOSSARY).filter(entry => entry.category === category);
}

/**
 * Search glossary entries
 */
export function searchGlossary(query: string): GlossaryEntry[] {
  const q = query.toLowerCase();
  return Object.values(GLOSSARY).filter(entry => 
    entry.label.toLowerCase().includes(q) ||
    entry.tooltip.toLowerCase().includes(q) ||
    entry.definition.toLowerCase().includes(q) ||
    (entry.labelFriendly?.toLowerCase().includes(q))
  );
}
