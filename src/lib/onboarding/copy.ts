// Onboarding copy (en-US), Shopify-style flow

export const ONBOARDING_COPY = {
  common: {
    back: 'Back',
    skip: 'Skip for now',
    continue: 'Continue',
    finish: 'Finish',
    saveExit: 'Save & exit',
    stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
    timezoneDetected: (tz: string) => `Time zone detected: ${tz}`,
    timezoneEdit: 'Change',
  },

  // 1) Welcome & Setup intent
  welcome: {
    title: 'Let’s set you up 🚀',
    subtitle: 'A quick, guided setup to personalize your AI and maximize earnings.',
    qBusinessState: {
      title: 'Is this for a new creator or an existing page?',
      help: 'We’ll tailor the setup and recommendations accordingly.',
      options: [
        { key: 'new', label: 'New creator or new concept' },
        { key: 'existing', label: 'Existing OnlyFans page' },
      ],
      error: 'Please choose one option.',
    },
    qChannels: {
      title: 'Where will you sell and engage?',
      subtitle: 'Pick all that apply. You can change this later.',
      options: [
        { key: 'onlyfans', label: 'OnlyFans (required)', caption: 'Smart auto‑DMs, PPV, insights' },
        { key: 'instagram', label: 'Instagram', caption: 'Safe teasers, bio‑link routing' },
        { key: 'tiktok', label: 'TikTok', caption: 'Soft‑sell previews, link-in-bio' },
        { key: 'reddit', label: 'Reddit', caption: 'Adult‑friendly promotion' },
        { key: 'unknown', label: 'I’m not sure yet' },
      ],
      error: 'OnlyFans is required to continue.',
    },
  },

  // 2) What you plan to sell
  sellPlan: {
    title: 'What do you plan to sell?',
    subtitle: 'We’ll enable the right features and playbooks.',
    options: [
      { key: 'subs', label: 'Subscriptions', caption: 'Monthly access to your feed' },
      { key: 'ppv', label: 'PPV Clips', caption: 'Paid messages with photos/videos' },
      { key: 'customs', label: 'Custom Content', caption: 'Personalized videos or sets' },
      { key: 'sexting', label: 'Sexting / DM', caption: 'Flirty chat with upsells' },
      { key: 'calls', label: 'Live Calls', caption: 'Paid voice/video sessions' },
      { key: 'merch', label: 'Merch / Shop', caption: 'Sell physical items (optional)' },
      { key: 'later', label: 'I’ll decide later' },
    ],
    primaryCta: 'Use recommended setup',
    recommendedTip: 'Recommended: Subscriptions + PPV',
    error: 'Select at least one option.',
  },

  // 3) Niches & Goals
  nichesGoals: {
    title: 'Choose your niche(s) & goals',
    subtitle: 'This helps us tune tone, pricing and playbooks.',
    nichesTitle: 'Your niche',
    goalsTitle: 'Your goals',
    goals: {
      revenue: { label: 'Monthly revenue target (USD)', placeholder: '$1k–$5k' },
      timeSaved: { label: 'Hours you want to save per week', placeholder: 'e.g., 10' },
      automation: { label: 'Automation level', caption: 'What % of DMs should AI handle?' },
    },
    error: 'Pick at least one niche.',
  },

  // 4) Persona & Boundaries
  persona: {
    title: 'Define your persona & boundaries',
    subtitle: 'Your AI will speak exactly like you.',
    voice: {
      title: 'Voice & style',
      toneSliders: [
        { key: 'friendlyFlirty', left: 'Friendly', right: 'Flirty' },
        { key: 'playfulRefined', left: 'Playful', right: 'Refined' },
        { key: 'directSoft', left: 'Direct', right: 'Soft' },
      ],
      emojiUsage: { label: 'Emoji usage', options: ['Low', 'Medium', 'High'] },
      punctuation: { label: 'Punctuation style', options: ['Calm', 'Expressive'] },
      complexity: { label: 'Language complexity', options: ['Simple', 'Rich'] },
      signature: { label: 'Signature phrases (optional)', placeholder: 'e.g., ‘babe’, ‘cutie’, ‘xo’' },
      forbidden: { label: 'Words to avoid', placeholder: 'Comma‑separated' },
    },
    boundaries: {
      title: 'Boundaries & compliance',
      nsfw: { label: 'Content level', options: ['Soft', 'Explicit'] },
      risky: { label: 'Restricted topics', placeholder: 'Add topics to avoid…' },
      safeWord: { label: 'Safe‑word (optional)', placeholder: 'e.g., ‘red’' },
      platforms: { label: 'Apply platform rules', flags: ['OnlyFans', 'Instagram', 'TikTok'] },
    },
    identity: {
      title: 'Identity',
      stageName: { label: 'Stage name', placeholder: 'e.g., Ayla Hart' },
      shortBio: { label: 'Short bio', placeholder: 'One line that describes your brand' },
    },
  },

  // 5) Monetization Basics
  monetization: {
    title: 'Monetization basics',
    subtitle: 'You can change these anytime.',
    subPrice: { label: 'Subscription price', placeholder: '$9.99' },
    trial: { label: 'Free trial', options: ['Off', '7 days'] },
    ppvRange: {
      title: 'PPV price range',
      min: { label: 'Min', placeholder: '$5' },
      typ: { label: 'Typical', placeholder: '$15' },
      max: { label: 'Max', placeholder: '$40' },
    },
    bundles: {
      title: 'Subscription bundles',
      hint: 'Longer commitments, better discounts.',
      presets: ['3 mo −10%', '6 mo −20%', '12 mo −30%'],
    },
    discountCap: { label: 'Max promo discount (content)', placeholder: '30%' },
    menu: { title: 'Upsell menu', add: 'Add item', placeholder: 'e.g., 10‑min call – $50 – ETA 24h' },
    customs: { label: 'Accept custom content?', options: ['Yes', 'No'] },
    applyMultipliers: 'Apply niche multipliers',
  },

  // 6) Connect Accounts
  connect: {
    title: 'Connect your platforms',
    subtitle: 'Quick setup. Cleaner inbox. Better growth.',
    onlyfans: {
      title: 'OnlyFans (required)',
      bullet1: 'Smart auto‑DMs',
      bullet2: 'Scheduled posts',
      bullet3: 'Insights & alerts',
      cta: 'Connect OnlyFans',
      connected: 'OnlyFans connected ✅',
    },
    socials: {
      title: 'Socials (optional)',
      caption: 'Promote your OF across socials',
      items: [
        { key: 'instagram', label: 'Instagram' },
        { key: 'tiktok', label: 'TikTok' },
        { key: 'reddit', label: 'Reddit' },
      ],
    },
    privacyNote: 'We never store your passwords. You can disconnect anytime.',
    afterConnect: 'We’ll import basic stats to calibrate your AI (takes a moment).',
    explainers: [
      'Send‑time heatmap — We optimize send times to your fans’ activity peaks.',
      'Volume up/down — Low volume → more follow‑ups & free previews. High volume → stricter caps & stronger premium upsells.',
      'LTV clusters — Early VIP routing and exclusive offers for high‑spend clusters.',
      'IG/TT risk — Shadowban risk? Switch to soft‑sell teasers and route to bio link; prioritize Reddit.',
    ],
  },

  // 7) Automation, Preview & Launch
  launch: {
    title: 'Automation, preview & launch',
    automation: {
      label: 'Automation level',
      caption: 'What % of DMs should AI handle? (80% recommended)',
    },
    review: {
      label: 'Review thresholds',
      ppvAmount: { label: 'Manual review for PPV over', placeholder: '$150' },
      customReq: { label: 'Manual review for custom requests' },
    },
    ops: {
      caps: { label: 'Daily message caps (global/VIP)', placeholder: '30 / 60' },
      reengage: { label: 'Re‑engage windows', value: '48h / 72h / 7d' },
    },
    preview: {
      title: 'DM & PPV preview',
      subtitle: 'How your AI would talk based on your settings.',
      sampleDm: (price: string) => `Hey love 💕 I just posted something a little too spicy for IG. Want a peek? It’s yours for ${price} 😘`,
      sampleCta: 'Send preview to myself',
    },
    confirm: {
      title: 'Ready to launch?',
      bullets: [
        'Playbooks activated: welcome, re‑engage, VIP',
        'Niche pricing multipliers applied',
        'Compliance guardrails on',
      ],
      cta: 'Confirm & launch',
    },
  },

  // Errors & toasts
  errors: {
    generic: 'Please check the fields above.',
    required: 'This field is required.',
    invalidPrice: 'Enter a valid price.',
  },
  toasts: {
    saved: 'Saved',
    connected: 'Connected successfully',
    launched: 'Your AI is live 🎉',
  },
};

// Niche label chips (US-market)
export const NICHE_LABELS: Record<string, { label: string; hint: string }> = {
  gfe: { label: 'GFE / Amateur', hint: 'Intimate, girlfriend vibe' },
  cosplay: { label: 'Cosplay & Roleplay', hint: 'Characters, scenarios' },
  dominatrix: { label: 'Dominatrix & BDSM', hint: 'Strict boundaries enforced' },
  fetish: { label: 'Fetish (Feet/Legs…)', hint: 'Fetish‑focused content' },
  milf: { label: 'MILF / Mature', hint: 'Confident & sensual' },
  alt: { label: 'Alt / Goth', hint: 'Tattoos, alt aesthetics' },
  bbw: { label: 'BBW / Curvy', hint: 'Curves front and center' },
  gamer: { label: 'Gamer', hint: 'Geeky & playful' },
  fitness: { label: 'Fitness / Coaching', hint: 'Active lifestyle' },
  fashion: { label: 'Fashion / Beauty', hint: 'Glam, outfits, makeup' },
  couple: { label: 'Couple / Girl‑Girl', hint: 'Authentic duo content' },
  college: { label: 'College / Coed (18+)', hint: 'Young adult, flirty' },
  ethnic: { label: 'Ethnic focus', hint: 'Latina, Ebony…' },
  luxury: { label: 'Luxury / High‑roller', hint: 'Exclusive, premium' },
};

